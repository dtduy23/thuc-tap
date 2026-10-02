import { useMemo, useState } from 'react'
import { Spinner } from '@heroui/react'
import { Check, ChevronRight, RotateCw, TriangleAlert } from 'lucide-react'
import type { NodeTiming } from '@/dieu-hanh/lib/api-tro-ly'
import type { Step } from '@/dieu-hanh/hooks/use-ask-turns'

const soMs = (n: number) => n.toLocaleString('vi-VN')

/**
 * Tiến trình của một lượt — một dòng chữ nhạt, không phải một cái hộp: nó là
 * siêu dữ liệu về câu trả lời. LUÔN thu gọn; nhãn nút đã hiện chặng đang chạy
 * kèm spinner. Hai dòng tin cậy (tự viết lại SQL, số không nguồn) nằm ngoài
 * phần thu gọn — giấu chúng thì câu từng bị bác trông y hệt câu chưa từng kiểm.
 */
export function TienTrinh({
  steps,
  nodes,
  soLanGoiLlm,
  model,
  running,
  attempts = 1,
  khongNguon = [],
}: {
  steps: Step[]
  nodes?: NodeTiming[]
  soLanGoiLlm?: number
  model?: string
  running: boolean
  attempts?: number
  khongNguon?: string[]
}) {
  const [mo, setMo] = useState(false)
  const vietLai = attempts > 1

  // Chặng chạy chồng lấn không cộng dồn — tính bằng chặng lâu nhất.
  const tongMs = useMemo(() => {
    const ds = nodes ?? []
    const noiDuoi = ds.filter((n) => !n.songSong).reduce((a, b) => a + b.ms, 0)
    const chongLan = ds.filter((n) => n.songSong).map((n) => n.ms)
    return noiDuoi + (chongLan.length ? Math.max(...chongLan) : 0) || 1
  }, [nodes])

  if (!steps.length && !running && !vietLai) return null
  const cuoi = steps[steps.length - 1]

  return (
    <div className="mt-1">
      <button
        type="button"
        aria-expanded={mo}
        onClick={() => setMo((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[0.72rem] text-faint transition-colors hover:text-ink"
      >
        <ChevronRight className={`size-3 transition-transform ${mo ? 'rotate-90' : ''}`} />
        {running ? (
          <>
            <Spinner size="sm" />
            <span>{cuoi?.detail ?? 'Đang bắt đầu…'}</span>
          </>
        ) : (
          <>
            <Check className="size-3" />
            <span>
              {mo ? 'Ẩn' : 'Xem'} tiến trình · {steps.length} chặng
            </span>
          </>
        )}
      </button>

      {!running && vietLai && (
        <p className="mt-1 flex items-start gap-1.5 text-[0.72rem] font-medium text-ok-tx">
          <RotateCw className="mt-0.5 size-3 flex-none" />
          Hệ thống đã tự bác câu SQL của mình và viết lại {attempts - 1} lần; lượt cuối qua được bộ canh cổng.
        </p>
      )}
      {!running && khongNguon.length > 0 && (
        <p className="mt-1 flex items-start gap-1.5 text-[0.72rem] font-medium text-warn-tx">
          <TriangleAlert className="mt-0.5 size-3 flex-none" />
          {khongNguon.length} con số trong lời văn không quy về được ô hay đoạn tài liệu nào:{' '}
          {khongNguon.join(', ')} — hãy đối chiếu phần số liệu và tài liệu bên dưới.
        </p>
      )}

      {mo && (
        <ul className="mt-1.5 grid gap-1 border-l-2 border-line pl-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[0.72rem]">
              <Dau trangThai={s.status} dangChay={i === steps.length - 1 && running} />
              <span className="w-[74px] flex-none text-body">{s.step}</span>
              <span
                className={
                  s.status === 'error' ? 'text-canh-bao' : s.status === 'warn' ? 'text-warn-tx' : 'text-body'
                }
              >
                {s.detail}
              </span>
            </li>
          ))}

          {/* Không cộng dồn một chặng chạy nhiều lượt: 3 lượt × 35s không phải một lời gọi 105s. */}
          {nodes && nodes.length > 0 && (
            <li className="mt-2 border-t border-line pt-2 text-[0.72rem]">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-faint">
                <span className="font-medium">Thời gian từng chặng</span>
                {soLanGoiLlm != null && <span>· {soLanGoiLlm} lời gọi mô hình</span>}
                {model && <span>· {model}</span>}
              </div>
              <div className="grid gap-0.5">
                {nodes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-8 flex-none font-medium ${n.llm ? 'text-warn-tx' : 'text-faint'}`}>
                      {n.llm ? 'LLM' : ''}
                    </span>
                    <span className="w-[74px] flex-none text-body">
                      {n.node}
                      {n.songSong && (
                        <span
                          className="ml-1 text-faint"
                          title="Chặng này chạy cùng lúc với các chặng khác có dấu ∥ — không cộng dồn thời gian của chúng."
                        >
                          ∥
                        </span>
                      )}
                    </span>
                    <span className="tnum w-16 flex-none text-right text-ink">{soMs(n.ms)} ms</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                      <span
                        className={`block h-full rounded-full ${n.llm ? 'bg-warn' : 'bg-faint'}`}
                        style={{ width: `${Math.min(100, Math.max(1, (n.ms / tongMs) * 100))}%` }}
                      />
                    </span>
                    {n.msMauDau != null && (
                      <span className="tnum hidden w-[168px] flex-none text-right text-faint sm:inline">
                        mẩu đầu {soMs(n.msMauDau)} ms
                      </span>
                    )}
                    {n.tokensIn != null && (
                      <span className="tnum hidden w-[168px] flex-none text-right text-faint sm:inline">
                        {soMs(n.tokensIn)} vào · {soMs(n.tokensOut ?? 0)} ra
                        {/* Đệm nguội đắt nhất: 13.823 ms so 1.827 ms trên cùng câu hỏi. */}
                        {n.cached != null && n.tokensIn > 0 && (
                          <span
                            className={
                              n.cached / n.tokensIn > 0.5 ? ' text-ok-tx' : ' font-medium text-warn-tx'
                            }
                          >
                            {' '}
                            · đệm {Math.round((n.cached / n.tokensIn) * 100)}%
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function Dau({ trangThai, dangChay }: { trangThai: Step['status']; dangChay: boolean }) {
  if (trangThai === 'running' || dangChay) return <Spinner size="sm" className="mt-0.5" />
  if (trangThai === 'error') return <TriangleAlert className="mt-0.5 size-3 flex-none text-canh-bao" />
  if (trangThai === 'warn') return <RotateCw className="mt-0.5 size-3 flex-none text-warn" />
  return <Check className="mt-0.5 size-3 flex-none text-ok" />
}
