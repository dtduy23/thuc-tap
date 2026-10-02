import { useCallback, useEffect, useRef, useState } from 'react'
import { goiNative } from '@/dieu-hanh/lib/http'
import type { AskResult, Refusal } from '@/dieu-hanh/lib/api-tro-ly'

/**
 * Danh sách lượt hỏi, mỗi lượt đọc theo luồng SSE của `POST /api/assistant/ask/stream`.
 * Port `useAskTurns` của FOXAINATIVE — dùng chung cho Hỏi đáp AI và Trò chuyện với Chatbot.
 *
 * Giữ cả danh sách chứ không chỉ lượt cuối: người ta hỏi tiếp ("còn tháng 3 thì sao").
 */

// 33ms ≈ 30 khung/giây — đủ mượt, bằng nửa số lần dựng lại so với 60fps.
const NHIP_MS = 33
// Rút 1/6 phần đang chờ mỗi nhịp: đo trên nhịp Gemini thật, chữ xong sau mẩu cuối
// ~385ms; chia 12 tụt lại cả giây, chia 4 nhả tới 47 ký tự một lần.
const SO_NHIP_XA = 6
// Sàn để phần đuôi không bò từng ký tự trông như mạng đang lag.
const TOI_THIEU_KY_TU = 4

export type StepStatus = 'running' | 'ok' | 'warn' | 'error'

export interface Step {
  step: string
  detail: string
  status: StepStatus
}

export interface AskError {
  code: string
  message: string
  followUps?: string[]
  refusals?: Refusal[]
  sql?: string
  /** Nguồn sinh ra lời từ chối — đường "khai cột này" phải mở đúng nguồn ấy. */
  nguon?: string
}

export interface Turn {
  id: string
  question: string
  userSql?: string
  steps: Step[]
  /** Lời văn đang phát dần — giữ riêng khỏi `result` để bản nháp không bị lưu như đã xong. */
  vanDang?: string
  /** Máy chủ đã VIẾT LẠI lời văn giữa chừng. */
  daVietLai?: boolean
  result?: AskResult
  error?: AskError
  running: boolean
}

export interface AskBody {
  question: string
  sourceId?: string
  /** Nhiều nguồn cho MỘT lượt — mỗi nguồn một câu SQL riêng, không JOIN chéo. */
  sourceIds?: string[]
  chatbotId?: string
  sql?: string
  maxRows?: number
  /** Provider cho RIÊNG lượt này, không đổi trạng thái máy chủ. */
  model?: string
  mucVan?: string
  doDai?: string
  /** Mã giọng. Không gửi = không tổng hợp tiếng. */
  giong?: string
  /** Bên gọi đọc được PCM theo dòng. */
  tiengDan?: boolean
  bieuDo?: string
  web?: string
}

interface SseEvent {
  type: 'step' | 'van' | 'van_thay' | 'tieng' | 'done' | 'suggestions' | 'error'
  [key: string]: unknown
}

/** Lỗi trả về TRƯỚC khi luồng mở — giữ `refusals` để vẽ từng dòng sửa được. */
export class AskHttpError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly refusals: Refusal[] = [],
  ) {
    super(message)
    this.name = 'AskHttpError'
  }
}

export interface MauTieng {
  /** WAV trọn một câu. */
  wav?: string
  /** PCM16 thô, một mảnh của câu `cau`. */
  pcm?: string
  tanSo?: number
  cau?: number
}

export function useAskTurns(tieng?: {
  onTieng: (stt: number, goi: MauTieng) => void
  /** Máy chủ đã gửi xong — hàng đợi phát đừng chờ mẩu nào nữa. */
  onXongTieng?: () => void
}) {
  // Giữ trong ref: `ask` sống qua nhiều lần dựng, đóng gói hàm cũ là âm thanh vào hàng đợi đã bị thay.
  const oTieng = useRef(tieng)
  useEffect(() => {
    oTieng.current = tieng
  }, [tieng])

  const [turns, setTurns] = useState<Turn[]>([])
  const turnsRef = useRef<Turn[]>([])
  useEffect(() => {
    turnsRef.current = turns
  }, [turns])

  const abort = useRef<AbortController | null>(null)

  const patch = useCallback((id: string, fn: (t: Turn) => Turn) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? fn(t) : t)))
  }, [])

  // Chữ chảy đều: mẩu SSE về không đều nhịp, nối thẳng vào state là màn hình nhảy cục.
  const cho = useRef<{ id: string; con: string } | null>(null)
  const dongHo = useRef<ReturnType<typeof setInterval> | null>(null)

  const dungNhip = useCallback(() => {
    if (dongHo.current !== null) {
      clearInterval(dongHo.current)
      dongHo.current = null
    }
  }, [])

  // Đổ nốt phần còn chờ NGAY khi lượt kết thúc — không thì mất mấy chữ cuối.
  const xaHet = useCallback(() => {
    dungNhip()
    const c = cho.current
    if (c?.con) {
      const ra = c.con
      c.con = ''
      patch(c.id, (t) => ({ ...t, vanDang: (t.vanDang ?? '') + ra }))
    }
    cho.current = null
  }, [patch, dungNhip])

  const nap = useCallback(
    (id: string, them: string) => {
      if (cho.current?.id !== id) cho.current = { id, con: '' }
      cho.current.con += them
      // Chữ chạy dần là chuyển động — tôn trọng "giảm chuyển động" thì hiện thẳng.
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        xaHet()
        return
      }
      if (dongHo.current !== null) return
      dongHo.current = setInterval(() => {
        const c = cho.current
        if (!c?.con) {
          dungNhip()
          return
        }
        const so = Math.max(TOI_THIEU_KY_TU, Math.ceil(c.con.length / SO_NHIP_XA))
        const ra = c.con.slice(0, so)
        c.con = c.con.slice(so)
        patch(c.id, (t) => ({ ...t, vanDang: (t.vanDang ?? '') + ra }))
      }, NHIP_MS)
    },
    [patch, dungNhip, xaHet],
  )

  useEffect(() => dungNhip, [dungNhip])

  const ask = useCallback(
    async (body: AskBody): Promise<AskResult | null> => {
      abort.current?.abort()
      const ctl = new AbortController()
      abort.current = ctl

      const id = `turn_${Date.now()}`
      let ketQua: AskResult | null = null
      setTurns((prev) => [
        ...prev,
        { id, question: body.question, userSql: body.sql, steps: [], running: true },
      ])

      // Trợ lí không có phiên: gửi lịch sử để giải đại từ ở câu sau. Chỉ câu hỏi và
      // lời văn — kèm nguyên khối kịch bản để máy chủ tự quyết khi nào xong.
      const history = turnsRef.current
        .filter((t) => t.result?.answer)
        .slice(-4)
        .map((t) => ({
          question: t.question,
          answer: t.result?.answer ?? '',
          ...(t.result?.kichBan ? { kichBan: t.result.kichBan } : {}),
        }))

      try {
        const res = await goiNative('/api/assistant/ask/stream', {
          method: 'POST',
          body: { ...body, history },
          signal: ctl.signal,
        })
        if (!res.ok) {
          const chiTiet = (await res.json().catch(() => ({}))) as {
            message?: string
            error?: { code?: string; message?: string; details?: { refusals?: Refusal[] } }
          }
          throw new AskHttpError(
            chiTiet.error?.message ?? chiTiet.message ?? `Lỗi ${res.status}`,
            chiTiet.error?.code ?? String(res.status),
            chiTiet.error?.details?.refusals ?? [],
          )
        }
        if (!res.body) throw new Error('Trình duyệt không đọc được luồng sự kiện.')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE ngăn cách bằng dòng trống; phần đuôi chưa đủ một sự kiện thì giữ lại.
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() ?? ''
          for (const chunk of chunks) {
            const line = chunk.split('\n').find((l) => l.startsWith('data: '))
            if (!line) continue
            const event = JSON.parse(line.slice(6)) as SseEvent

            if (event.type === 'step') {
              patch(id, (t) => ({
                ...t,
                // Chặng `running` được THAY bằng chính nó khi xong, không nối thêm dòng.
                steps: [
                  ...t.steps.filter((s) => !(s.step === event.step && s.status === 'running')),
                  {
                    step: event.step as string,
                    detail: event.detail as string,
                    status: event.status as StepStatus,
                  },
                ],
              }))
            } else if (event.type === 'van') {
              nap(id, event.delta as string)
            } else if (event.type === 'tieng') {
              // Không đưa âm thanh vào `turns`: mỗi mẩu ~470 KB base64.
              oTieng.current?.onTieng(event.stt as number, {
                wav: event.wav as string | undefined,
                pcm: event.pcm as string | undefined,
                tanSo: event.tanSo as number | undefined,
                cau: event.cau as number | undefined,
              })
            } else if (event.type === 'van_thay') {
              // Máy chủ viết lại vì có số không nguồn: thay HẲN, và dừng nhịp trước để
              // phần đuôi của bản nháp sai không bị nối vào sau.
              dungNhip()
              cho.current = null
              patch(id, (t) => ({ ...t, vanDang: event.text as string, daVietLai: true }))
            } else if (event.type === 'done') {
              oTieng.current?.onXongTieng?.()
              const ket = event.result as AskResult
              ketQua = ket
              patch(id, (t) => ({
                ...t,
                result: ket,
                steps: (ket.steps as Step[] | undefined) ?? t.steps,
              }))
            } else if (event.type === 'suggestions') {
              // Phát SAU `done` để câu trả lời hiện sớm hơn một lời gọi mô hình.
              patch(id, (t) =>
                t.result
                  ? {
                      ...t,
                      result: {
                        ...t.result,
                        suggestions: event.suggestions as string[] | undefined,
                        followUps: event.followUps as string[] | undefined,
                      },
                    }
                  : t,
              )
            } else if (event.type === 'error') {
              patch(id, (t) => ({
                ...t,
                error: {
                  code: event.code as string,
                  message: event.message as string,
                  followUps: event.followUps as string[] | undefined,
                  refusals: event.refusals as Refusal[] | undefined,
                  sql: event.sql as string | undefined,
                  nguon: event.nguon as string | undefined,
                },
                steps: (event.steps as Step[] | undefined) ?? t.steps,
              }))
            }
          }
        }
      } catch (e) {
        const err = e as Error
        if (err.name !== 'AbortError') {
          patch(id, (t) => ({
            ...t,
            error:
              err instanceof AskHttpError
                ? { code: err.code, message: err.message, refusals: err.refusals }
                : { code: 'NETWORK', message: err.message },
          }))
        }
      } finally {
        xaHet()
        // Báo hết gửi ở cả ba lối kết thúc: lượt hỏng giữa chừng không bao giờ phát `done`.
        oTieng.current?.onXongTieng?.()
        patch(id, (t) => ({ ...t, running: false }))
      }
      return ketQua
    },
    [patch, nap, dungNhip, xaHet],
  )

  const stop = useCallback(() => abort.current?.abort(), [])
  const clear = useCallback(() => setTurns([]), [])

  return { turns, ask, stop, clear, running: turns.some((t) => t.running) }
}
