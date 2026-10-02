import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KHOA_TL, laySucKhoeTroLy } from '@/dieu-hanh/lib/api-tro-ly'

/**
 * Phát âm thanh MÁY CHỦ gửi kèm dòng SSE, và nghe câu hỏi bằng giọng nói.
 * Port `hooks/giong.ts` của FOXAINATIVE.
 *
 * Không dùng `speechSynthesis`: danh sách giọng là của máy người dùng, Chrome/Linux
 * không có giọng tiếng Việt. Máy chủ chỉ có một bộ giọng, và nó là bộ ta chọn.
 */

export interface Giong {
  ma: string
  nhan: string
  ngonNgu: string
}

/** Rỗng ⇒ máy chủ chưa có giọng — giao diện ẩn nút loa thay vì hiện ô chọn rỗng. */
export function useDanhSachGiong(): Giong[] {
  const { data } = useQuery({
    queryKey: KHOA_TL.sucKhoe,
    queryFn: laySucKhoeTroLy,
    // Không báo lỗi cho một tính năng phụ người dùng chưa hỏi tới.
    retry: false,
    staleTime: 5 * 60_000,
  })
  return (data?.giong ?? []).map((g) => ({ ma: g.ma, nhan: g.nhan, ngonNgu: g.ngon_ngu }))
}

/* ── Hàng đợi phát ───────────────────────────────────────────────────────── */

/** Máy chủ đã để sẵn ~40 ms nghỉ cuối mỗi mẩu; chèn thêm nhiều nghe ra "giật cục". */
const NGHI_GIUA_MAU = 0.02
/** Đệm trước mẩu đầu — đặt lịch đúng `currentTime` thì bị cắt phần đầu. */
const DEM_DAU = 0.08
/** Mồi theo GIÂY TIẾNG trong tay, không theo số mẩu: mẩu PCM chỉ ~0,4 giây. */
const NGUONG_GIAY_CHO = 1.2
/** Đường truyền xấu thì không chờ vô hạn — thà nghe sớm còn hơn im mãi. */
const TRAN_CHO_MS = 3_000
/** Số mẫu VÀO giữ lại làm cánh trái cho nhân Lanczos của mẩu kế tiếp. */
const DUOI_LICH = 8
const LANCZOS_A = 3

function nhanLanczos(x: number, cut: number): number {
  const y = x * cut
  if (y === 0) return cut
  if (Math.abs(y) >= LANCZOS_A) return 0
  const p = Math.PI * y
  return cut * ((Math.sin(p) / p) * (Math.sin(p / LANCZOS_A) / (p / LANCZOS_A)))
}

function duoiMau(f: Float32Array, lich: Float32Array): Float32Array {
  const moi = new Float32Array(DUOI_LICH)
  for (let i = 0; i < DUOI_LICH; i++) {
    const k = f.length - DUOI_LICH + i
    moi[i] = k >= 0 ? (f[k] ?? 0) : (lich[DUOI_LICH + k] ?? 0)
  }
  return moi
}

/**
 * PCM16 thô → `AudioBuffer` ở đúng tần số của `AudioContext`. Tự lấy mẫu lại
 * bằng Lanczos-3 và mang pha + lịch sử qua chỗ nối: để trình duyệt lấy mẫu lại
 * từng buffer độc lập thì mỗi ranh giới là một chỗ đứt ("tút tút"), còn nội suy
 * tuyến tính làm đục dải 4–8 kHz của phụ âm xát.
 */
function tuPcm16(
  c: AudioContext,
  byte: Uint8Array,
  tanSo: number,
  lich: Float32Array,
  viTri = 0,
): { buf: AudioBuffer | null; lich: Float32Array; viTri: number } {
  const mau = new Int16Array(byte.buffer, byte.byteOffset, byte.byteLength >> 1)
  if (!mau.length) return { buf: null, lich, viTri }
  const f = new Float32Array(mau.length)
  for (let i = 0; i < mau.length; i++) f[i] = (mau[i] ?? 0) / 32768

  const ti = c.sampleRate / tanSo
  if (Math.abs(ti - 1) < 1e-6) {
    const buf = c.createBuffer(1, f.length, c.sampleRate)
    buf.getChannelData(0).set(f)
    return { buf, lich: duoiMau(f, lich), viTri: 0 }
  }

  const buoc = tanSo / c.sampleRate
  const cut = Math.min(1, c.sampleRate / tanSo)
  const L = f.length
  const lay = (k: number): number => (k < 0 ? (lich[DUOI_LICH + k] ?? 0) : (f[k] ?? 0))

  const pos0 = viTri
  let n = 0
  for (let p = pos0; Math.floor(p) + LANCZOS_A <= L - 1; p += buoc) n++
  if (n < 1) return { buf: null, lich: duoiMau(f, lich), viTri: pos0 - L }

  const buf = c.createBuffer(1, n, c.sampleRate)
  const ra = buf.getChannelData(0)
  let pos = pos0
  for (let i = 0; i < n; i++) {
    const base = Math.floor(pos)
    let s = 0
    for (let k = base - LANCZOS_A + 1; k <= base + LANCZOS_A; k++) s += lay(k) * nhanLanczos(pos - k, cut)
    ra[i] = s
    pos += buoc
  }
  return { buf, lich: duoiMau(f, lich), viTri: pos - L }
}

function giaiB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
  return u
}

/**
 * Nhận mẩu tiếng theo dòng SSE, phát NỐI LIỀN bằng Web Audio: đặt lịch trên đồng
 * hồ card âm thanh, không phụ thuộc vòng lặp sự kiện đang bận vẽ lại React.
 */
export function useDocTo() {
  const [dangDoc, setDangDoc] = useState(false)
  // Tạm dừng là trạng thái riêng: bài chưa xong, chỉ đồng hồ đứng lại.
  const [dangTam, setDangTam] = useState(false)
  const tamRef = useRef(false)
  const ctx = useRef<AudioContext | null>(null)
  const moc = useRef(0)
  const dangPhat = useRef<AudioBufferSourceNode[]>([])
  const cho = useRef<{ buf: AudioBuffer; cau: number }[]>([])
  const cauTruoc = useRef<number | null>(null)
  const lichMau = useRef<Float32Array>(new Float32Array(DUOI_LICH))
  const viTri = useRef(0)
  const daChay = useRef(false)
  const hen = useRef<number | null>(null)
  // Phải NHỚ: `done` thường tới trước khi mẩu cuối giải mã xong.
  const hetGui = useRef(false)
  // Số thứ tự mẩu cao nhất đã nhận — chặn StrictMode đẩy dòng sự kiện vào hai lần.
  const daNhan = useRef(0)
  // Giải mã WAV tuần tự để không đọc câu ba trước câu hai.
  const xep = useRef<Promise<void>>(Promise.resolve())

  const may = useCallback(() => {
    if (!ctx.current) {
      const C =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx.current = new C()
    }
    // Không gỡ băng khi chính người dùng vừa bấm tạm dừng.
    if (!tamRef.current) void ctx.current.resume().catch(() => {})
    return ctx.current
  }, [])

  const datLich = useCallback((c: AudioContext, buf: AudioBuffer, cau: number) => {
    const nut = c.createBufferSource()
    nut.buffer = buf
    nut.connect(c.destination)
    const batDau = Math.max(c.currentTime + DEM_DAU, moc.current)
    nut.start(batDau)
    // Nghỉ chỉ ở ranh giới CÂU — chèn giữa hai mẩu của một câu là cắt ngang một từ.
    const noiCau = cauTruoc.current !== null && cauTruoc.current !== cau
    cauTruoc.current = cau
    moc.current = batDau + buf.duration + (noiCau ? NGHI_GIUA_MAU : 0)
    dangPhat.current.push(nut)
    setDangDoc(true)
    nut.onended = () => {
      dangPhat.current = dangPhat.current.filter((x) => x !== nut)
      if (!dangPhat.current.length) setDangDoc(false)
    }
  }, [])

  const xa = useCallback(
    (c: AudioContext) => {
      if (hen.current !== null) {
        clearTimeout(hen.current)
        hen.current = null
      }
      daChay.current = true
      for (const m of cho.current) datLich(c, m.buf, m.cau)
      cho.current = []
    },
    [datLich],
  )

  /** Máy chủ báo hết gửi — phát ngay những gì đang có. */
  const xong = useCallback(() => {
    hetGui.current = true
    const c = ctx.current
    if (!c || daChay.current || !cho.current.length) return
    xa(c)
  }, [xa])

  /** `suspend()` đóng băng đúng đồng hồ các mẩu đã đặt lịch — `resume()` chạy tiếp đúng chỗ. */
  const bamTam = useCallback(() => {
    const c = ctx.current
    if (!c) return
    if (c.state === 'running') {
      tamRef.current = true
      void c.suspend().catch(() => {})
      setDangTam(true)
      return
    }
    tamRef.current = false
    void c.resume().catch(() => {})
    setDangTam(false)
  }, [])

  const dung = useCallback(() => {
    // Gỡ băng trước khi lượt sau đặt lịch — không thì lượt mới im tuyệt đối.
    tamRef.current = false
    void ctx.current?.resume().catch(() => {})
    setDangTam(false)
    for (const n of dangPhat.current) {
      try {
        n.stop()
      } catch {
        // Đã dứt trước đó — đúng trạng thái mong muốn.
      }
    }
    dangPhat.current = []
    moc.current = 0
    daNhan.current = 0
    cauTruoc.current = null
    lichMau.current = new Float32Array(DUOI_LICH)
    viTri.current = 0
    xep.current = Promise.resolve()
    cho.current = []
    daChay.current = false
    hetGui.current = false
    if (hen.current !== null) {
      clearTimeout(hen.current)
      hen.current = null
    }
    setDangDoc(false)
  }, [])

  const them = useCallback(
    (stt: number, goi: { wav?: string; pcm?: string; tanSo?: number; cau?: number }) => {
      if (stt <= daNhan.current) return
      daNhan.current = stt
      const c = may()
      if (!c) return
      const cau = goi.cau ?? 0

      const nhan = (buf: AudioBuffer) => {
        if (daChay.current) {
          datLich(c, buf, cau)
          return
        }
        cho.current.push({ buf, cau })
        const giay = cho.current.reduce((a, m) => a + m.buf.duration, 0)
        if (hetGui.current || giay >= NGUONG_GIAY_CHO) {
          xa(c)
          return
        }
        // Trần chờ tính từ lúc có tiếng để phát, không đặt lại ở mẩu sau.
        if (hen.current === null) hen.current = window.setTimeout(() => xa(c), TRAN_CHO_MS)
      }

      if (goi.pcm) {
        try {
          const kq = tuPcm16(c, giaiB64(goi.pcm), goi.tanSo ?? 24000, lichMau.current, viTri.current)
          lichMau.current = kq.lich
          viTri.current = kq.viTri
          if (kq.buf) nhan(kq.buf)
        } catch {
          // Một mẩu hỏng thì bỏ mẩu ấy, không treo cả hàng đợi.
        }
        return
      }
      if (!goi.wav) return
      const u = giaiB64(goi.wav)
      xep.current = xep.current
        .then(() => c.decodeAudioData(u.buffer as ArrayBuffer))
        .then(nhan)
        .catch(() => {
          // Bỏ mẩu hỏng, không đụng `moc` để mẩu sau vào đúng nhịp.
        })
    },
    [may, datLich, xa],
  )

  // Rời màn thì im — `AudioContext` thuộc cửa sổ, không thuộc thành phần nào.
  useEffect(
    () => () => {
      if (hen.current !== null) clearTimeout(hen.current)
      for (const n of dangPhat.current) {
        try {
          n.stop()
        } catch {
          /* đã dứt */
        }
      }
      void ctx.current?.close().catch(() => {})
      ctx.current = null
    },
    [],
  )

  return { them, dung, xong, dangDoc, dangTam, bamTam }
}

/* ── Nghe câu hỏi ────────────────────────────────────────────────────────── */

interface BoNhan {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** `SpeechRecognition` không có ở Firefox, Safari. */
function boNhan(): (new () => BoNhan) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => BoNhan) | null
}

export const coNhanGiong = () => boNhan() !== null

export function useNghe(onXong: (van: string) => void) {
  const [dangNghe, setDangNghe] = useState(false)
  const may = useRef<BoNhan | null>(null)
  // Bộ nhận sống lâu hơn một lần dựng — đọc `onXong` mới nhất qua ref.
  const goi = useRef(onXong)
  useEffect(() => {
    goi.current = onXong
  }, [onXong])

  const batDau = useCallback(() => {
    const May = boNhan()
    if (!May) return
    if (may.current) {
      may.current.abort()
      may.current = null
      setDangNghe(false)
      return
    }
    const m = new May()
    // `vi-VN` rõ ràng: mặc định theo ngôn ngữ trình duyệt thì máy tiếng Anh chép sai hết.
    m.lang = 'vi-VN'
    m.interimResults = true
    m.continuous = false
    m.onresult = (e) => {
      let van = ''
      for (let i = 0; i < e.results.length; i++) {
        const dau = e.results[i]?.[0]
        if (dau) van += dau.transcript
      }
      goi.current(van)
    }
    const het = () => {
      may.current = null
      setDangNghe(false)
    }
    m.onend = het
    m.onerror = het
    may.current = m
    setDangNghe(true)
    m.start()
  }, [])

  useEffect(() => () => may.current?.abort(), [])

  return { batDau, dangNghe }
}
