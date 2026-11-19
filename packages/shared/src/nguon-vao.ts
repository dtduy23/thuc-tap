/**
 * NGUỒN DỮ LIỆU VÀO — số liệu chỉ tiêu điều hành nạp từ NGOÀI hệ thống, qua hai KÊNH ngang
 * hàng: API của khách (cấu hình ánh xạ) và tệp Excel theo mẫu (khi khách không có API).
 * Cả hai đổ vào MỘT kho (đơn vị, chỉ tiêu, kỳ → giá trị). Điều hành chỉ đọc kho đó.
 *
 * Đây là KÊNH NẠP của Tầng 2 › Kết nối, không phải màn nhập liệu nghiệp vụ: không có biểu
 * mẫu nhập từng số ở Tầng 1.
 */
import { timChiTieu } from './chi-tieu.js'

export type KenhNap = 'api' | 'excel'
export const KENH_NAP: Record<KenhNap, string> = { api: 'API', excel: 'Excel' }

const KY = /^(\d{4})-(0[1-9]|1[0-2])$/

/** Kỳ tháng hiện tại theo giờ Việt Nam, dạng 'YYYY-MM'. */
export function kyHienTai(luc: Date = new Date()): string {
  return new Date(luc.getTime() + 7 * 3600_000).toISOString().slice(0, 7)
}

/**
 * Chuẩn hóa kỳ về 'YYYY-MM'. Nhận: 'YYYY-MM', 'YYYY-MM-DD…' (ISO), 'MM/YYYY', 'T9/2026',
 * 'DD/MM/YYYY', đối tượng Date (ô ngày của Excel). null: không đọc được.
 */
export function chuanKy(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 7)
  if (typeof v !== 'string') return null
  const s = v.trim()
  const iso = /^(\d{4})-(\d{1,2})(?:-\d{1,2}.*)?$/.exec(s)
  const vn = /^(?:T|Tháng\s*)?(\d{1,2})[/-](\d{4})$/i.exec(s) ?? /^\d{1,2}[/-](\d{1,2})[/-](\d{4})$/.exec(s)
  const [nam, thang] = iso ? [iso[1]!, iso[2]!] : vn ? [vn[2]!, vn[1]!] : [null, null]
  if (!nam || !thang) return null
  const ky = `${nam}-${thang.padStart(2, '0')}`
  return KY.test(ky) ? ky : null
}

/** 'YYYY-MM' → 'T9/2026'. */
export function kyHien(ky: string): string {
  const m = KY.exec(ky)
  return m ? `T${Number(m[2])}/${m[1]}` : ky
}

/** Đọc số: số thật, hoặc chữ kiểu Việt ('1.234,5'), kiểu máy ('1234.5'), có '%' ở cuối. */
export function docSoNap(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string') return null
  let s = v.trim().replace(/\s|%$/g, '')
  if (!s) return null
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Một dòng số liệu hợp lệ, sẵn sàng ghi vào kho. */
export interface DongSoLieu {
  maChiTieu: string
  ky: string
  giaTri: number
}

/** Một dòng sau khi kiểm — hiện ở bước xem trước. */
export interface DongKiem {
  /** Hàng trong tệp Excel, hoặc thứ tự phần tử trong JSON (từ 1). */
  hang: number
  maChiTieu: string
  tenChiTieu: string
  ky: string
  giaTri: number | null
  loi: string[]
}

export interface KetQuaKiemNap {
  soHopLe: number
  soLoi: number
  /** Tối đa SO_DONG_XEM_TRUOC dòng (dòng lỗi xếp trước). */
  dong: DongKiem[]
}

export const SO_DONG_NAP_TOI_DA = 5000
export const SO_DONG_XEM_TRUOC = 300

/**
 * Kiểm MỘT dòng thô (từ Excel hay API). `kyMacDinh`: dùng khi nguồn không cho kỳ.
 * KPI không nạp được — KPI tự tính từ chỉ tiêu lĩnh vực.
 */
export function kiemDongNap(
  hang: number,
  tho: { ma: unknown; ky: unknown; giaTri: unknown },
  kyMacDinh?: string,
): { kiem: DongKiem; hopLe: DongSoLieu | null } {
  const loi: string[] = []
  const ma = (typeof tho.ma === 'string' ? tho.ma : typeof tho.ma === 'number' ? String(tho.ma) : '')
    .trim()
    .toUpperCase()
  const d = ma ? timChiTieu(ma) : undefined
  if (!ma) loi.push('Thiếu mã chỉ tiêu')
  else if (!d) loi.push(`Không có chỉ tiêu "${ma.slice(0, 40)}" trong bộ chỉ tiêu`)
  else if (d.linhVuc === 'kpi') loi.push('KPI tự tính từ chỉ tiêu lĩnh vực — nạp chỉ tiêu gốc')

  const kyTrong = tho.ky === undefined || tho.ky === null || tho.ky === ''
  const ky = kyTrong ? (kyMacDinh ?? null) : chuanKy(tho.ky)
  if (!ky) loi.push(kyTrong ? 'Thiếu kỳ' : 'Kỳ không đọc được (dùng MM/YYYY, vd 09/2026)')

  const giaTri = docSoNap(tho.giaTri)
  if (giaTri === null)
    loi.push(
      tho.giaTri === undefined || tho.giaTri === null || tho.giaTri === ''
        ? 'Thiếu giá trị'
        : 'Giá trị không phải số',
    )
  else if (d?.donVi === '%' && (giaTri < 0 || giaTri > 100))
    loi.push('Chỉ tiêu tính bằng % phải từ 0 đến 100')
  else if (d?.linhVuc === 'benh-vien' && (giaTri < 0 || !Number.isSafeInteger(giaTri)))
    loi.push('Chỉ tiêu bệnh viện phải là số nguyên không âm')

  const kiem: DongKiem = {
    hang,
    maChiTieu: ma.slice(0, 40),
    tenChiTieu: d?.ten ?? '',
    ky: ky ?? (typeof tho.ky === 'string' ? tho.ky.slice(0, 20) : ''),
    giaTri,
    loi,
  }
  return { kiem, hopLe: loi.length === 0 ? { maChiTieu: ma, ky: ky!, giaTri: giaTri! } : null }
}

/** Kiểm cả lô; cùng (chỉ tiêu, kỳ) xuất hiện hai lần là lỗi ở dòng sau. */
export function kiemLoNap(
  tho: readonly { hang?: number; ma: unknown; ky: unknown; giaTri: unknown }[],
  kyMacDinh?: string,
): { ketQua: KetQuaKiemNap; hopLe: DongSoLieu[] } {
  const daCo = new Set<string>()
  const hopLe: DongSoLieu[] = []
  const dong: DongKiem[] = []
  tho.forEach((t, i) => {
    const r = kiemDongNap(t.hang ?? i + 1, t, kyMacDinh)
    if (r.hopLe) {
      const khoa = `${r.hopLe.maChiTieu}|${r.hopLe.ky}`
      if (daCo.has(khoa)) r.kiem.loi.push('Trùng chỉ tiêu và kỳ với một dòng phía trên')
      else {
        daCo.add(khoa)
        hopLe.push(r.hopLe)
      }
    }
    dong.push(r.kiem)
  })
  const soLoi = dong.filter((d) => d.loi.length > 0).length
  return {
    hopLe,
    ketQua: {
      soHopLe: dong.length - soLoi,
      soLoi,
      dong: [...dong.filter((d) => d.loi.length > 0), ...dong.filter((d) => d.loi.length === 0)].slice(
        0,
        SO_DONG_XEM_TRUOC,
      ),
    },
  }
}

// ── Nguồn API ───────────────────────────────────────────────────────────────

export type XacThucNguon = 'khong' | 'bearer' | 'header'
export const XAC_THUC_NGUON: Record<XacThucNguon, string> = {
  khong: 'Không cần',
  bearer: 'Bearer token',
  header: 'Khóa trong header',
}

/**
 * Cách đọc JSON trả về thành các dòng (chỉ tiêu, kỳ, giá trị).
 *   dong   — JSON có MỘT MẢNG, mỗi phần tử là một dòng: khai tên trường mã / kỳ / giá trị.
 *   truong — JSON là MỘT ĐỐI TƯỢNG, mỗi trường là một chỉ tiêu: khai cặp trường → mã chỉ tiêu.
 * Đường dẫn dạng chấm, vd `data.items` hoặc `ketQua.0.tongHoSo`. Không có kỳ → kỳ tháng hiện tại.
 */
export interface AnhXaNguon {
  kieu: 'dong' | 'truong'
  /** Đường tới mảng (dong) / đối tượng (truong) trong JSON; rỗng = ngay gốc. */
  duongDan: string
  truongMa: string
  truongGiaTri: string
  /** Đường tới kỳ: trong từng phần tử (dong) hoặc trong đối tượng (truong). Rỗng = kỳ hiện tại. */
  truongKy: string
  cap: { truong: string; maChiTieu: string }[]
}

export const ANH_XA_TRONG: AnhXaNguon = {
  kieu: 'dong',
  duongDan: '',
  truongMa: 'maChiTieu',
  truongGiaTri: 'giaTri',
  truongKy: 'ky',
  cap: [],
}

export interface NguonApiGhi {
  ten: string
  diaChi: string
  xacThuc: XacThucNguon
  tenHeader: string | null
  /** Vắng: giữ bí mật đang lưu. Chuỗi: đặt mới. */
  biMat?: string
  anhXa: AnhXaNguon
  bat: boolean
}

export interface NguonApi extends Omit<NguonApiGhi, 'biMat'> {
  id: string
  /** Đã lưu bí mật hay chưa — giá trị KHÔNG BAO GIỜ trả về. */
  coBiMat: boolean
  lanCuoi: { luc: string; trangThai: 'xong' | 'loi'; soDong: number; soLoi: number } | null
}

const DUONG = /^[\w$-]+(\.[\w$-]+)*$/
const hopLeDuong = (s: string, choRong: boolean) => (s === '' ? choRong : s.length <= 200 && DUONG.test(s))

/** Kiểm cấu hình nguồn API (hình thức). Rỗng = hợp lệ. Địa chỉ còn được máy chủ kiểm thêm. */
export function kiemNguonApi(n: NguonApiGhi): string[] {
  const loi: string[] = []
  if (!n.ten.trim() || n.ten.length > 200) loi.push('Tên nguồn: bắt buộc, tối đa 200 ký tự')
  if (!/^https?:\/\/[^\s/]+/i.test(n.diaChi) || n.diaChi.length > 1000)
    loi.push('Địa chỉ phải là http(s)://…')
  if (n.xacThuc === 'header' && !/^[A-Za-z0-9-]{1,64}$/.test(n.tenHeader ?? ''))
    loi.push('Tên header chỉ gồm chữ, số, gạch nối')
  const a = n.anhXa
  if (!hopLeDuong(a.duongDan, true)) loi.push('Đường dẫn tới dữ liệu không hợp lệ (dạng a.b.c)')
  if (!hopLeDuong(a.truongKy, true)) loi.push('Trường kỳ không hợp lệ')
  if (a.kieu === 'dong') {
    if (!hopLeDuong(a.truongMa, false)) loi.push('Thiếu trường mã chỉ tiêu')
    if (!hopLeDuong(a.truongGiaTri, false)) loi.push('Thiếu trường giá trị')
  } else {
    if (a.cap.length === 0) loi.push('Khai ít nhất một cặp trường → chỉ tiêu')
    if (a.cap.length > 200) loi.push('Tối đa 200 cặp trường → chỉ tiêu')
    const ma = new Set<string>()
    for (const c of a.cap) {
      if (!hopLeDuong(c.truong, false)) loi.push(`Trường "${c.truong.slice(0, 40)}" không hợp lệ`)
      const d = timChiTieu(c.maChiTieu)
      if (!d) loi.push(`Không có chỉ tiêu "${c.maChiTieu.slice(0, 40)}"`)
      else if (d.linhVuc === 'kpi') loi.push(`${c.maChiTieu}: KPI tự tính, không nạp`)
      if (ma.has(c.maChiTieu)) loi.push(`Chỉ tiêu ${c.maChiTieu} khai hai lần`)
      ma.add(c.maChiTieu)
    }
  }
  return loi
}

/** Lấy giá trị theo đường dẫn chấm; rỗng = chính nó. */
export function layTheoDuong(goc: unknown, duong: string): unknown {
  if (duong === '') return goc
  let x: unknown = goc
  for (const k of duong.split('.')) {
    if (x === null || typeof x !== 'object') return undefined
    x = (x as Record<string, unknown>)[k]
  }
  return x
}

/** JSON trả về + ánh xạ → các dòng thô. Ném lỗi (câu tiếng Việt) khi JSON không đúng hình. */
export function docTheoAnhXa(json: unknown, a: AnhXaNguon): { ma: unknown; ky: unknown; giaTri: unknown }[] {
  const goc = layTheoDuong(json, a.duongDan)
  const noi = a.duongDan ? `tại "${a.duongDan}"` : 'ở gốc'
  if (a.kieu === 'dong') {
    if (!Array.isArray(goc)) throw new Error(`Không thấy MẢNG dữ liệu ${noi} trong JSON trả về`)
    return goc.slice(0, SO_DONG_NAP_TOI_DA).map((p) => ({
      ma: layTheoDuong(p, a.truongMa),
      ky: a.truongKy ? layTheoDuong(p, a.truongKy) : undefined,
      giaTri: layTheoDuong(p, a.truongGiaTri),
    }))
  }
  if (goc === null || typeof goc !== 'object' || Array.isArray(goc))
    throw new Error(`Không thấy ĐỐI TƯỢNG dữ liệu ${noi} trong JSON trả về`)
  const ky = a.truongKy ? layTheoDuong(goc, a.truongKy) : undefined
  return a.cap.map((c) => ({ ma: c.maChiTieu, ky, giaTri: layTheoDuong(goc, c.truong) }))
}

/** Kết quả "Lấy thử" một nguồn API — chưa ghi gì. */
export interface KetQuaThuNguon extends KetQuaKiemNap {
  /** Lỗi cả lần gọi (không tới được, không phải JSON, sai hình). */
  loi: string | null
  /** Đoạn đầu JSON trả về — để dò đường dẫn khi cấu hình. */
  mauJson: string | null
}

// ── Kết quả lấy về ──────────────────────────────────────────────────────────

export interface LanNap {
  id: string
  kenh: KenhNap
  tenNguon: string
  trangThai: 'xong' | 'loi'
  soDong: number
  soLoi: number
  loi: string[]
  nguoiNap: string | null
  luc: string
}

export interface SoLieuDaNap {
  id: string
  maChiTieu: string
  ky: string
  giaTri: number
  kenh: KenhNap
  tenNguon: string
  luc: string
}
