import { useState, type MouseEvent } from 'react'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { niceStep } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { useDoRong } from '@/dieu-hanh/hooks/use-do-rong'
import { anGoiY, hienGoiY } from '@/dieu-hanh/components/overlay/TooltipChuot'

export interface ChuoiDuong {
  name: string
  color: string
  data: ReadonlyArray<number>
}

interface Props {
  labels: ReadonlyArray<string>
  series: ReadonlyArray<ChuoiDuong>
  unit?: string
  dec?: number
  height?: number
  /** Trục tung bắt đầu từ 0 và tô vùng dưới chuỗi đầu tiên. */
  zero?: boolean
}

const M = { l: 48, r: 16, t: 30, b: 28 }

/**
 * Port từ lineChart() của Dashboard Xã/Phường: đường + vùng, thước dọc bám chuột.
 * Kỳ cuối là số thực tế, các kỳ trước là mô phỏng — tooltip ghi rõ điều đó.
 */
export function DuongXuHuong({ labels, series, unit = '', dec = 0, height = 250, zero = true }: Props) {
  const [ref, rong] = useDoRong<HTMLDivElement>()
  const [kyChon, setKyChon] = useState<number | null>(null)

  const W = Math.max(rong, 300)
  const H = height
  const all = series.flatMap((s) => s.data)
  const mx = Math.max(...all)
  const mn = zero ? 0 : Math.min(...all)
  const step = niceStep((mx - mn) / 4)
  const top = Math.ceil(mx / step) * step
  const bot = zero ? 0 : Math.floor(mn / step) * step
  const n = labels.length
  const X = (i: number) => M.l + (i * (W - M.l - M.r)) / (n - 1)
  const Y = (v: number) => M.t + (1 - (v - bot) / (top - bot || 1)) * (H - M.t - M.b)

  const luoi: number[] = []
  for (let v = bot; v <= top + 1e-9; v += step) luoi.push(v)

  const diChuot = (e: MouseEvent<SVGRectElement>) => {
    const bx = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const i = Math.max(
      0,
      Math.min(n - 1, Math.round((e.clientX - bx.left - M.l) / ((W - M.l - M.r) / (n - 1)))),
    )
    setKyChon(i)
    hienGoiY(e, {
      tieuDe: `${labels[i]} ${i === n - 1 ? '· thực tế' : '· mô phỏng'}`,
      than: series.map((s, si) => (
        <span key={s.name}>
          {si > 0 && <br />}
          {s.name}: {soCoDinh(s.data[i]!, dec)}
          {unit}
        </span>
      )),
    })
  }

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="absolute top-0 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-body"
        style={{ left: M.l }}
      >
        {series.map((s) => (
          <span key={s.name}>
            <i
              className="mr-1.5 inline-block h-[3px] w-3.5 rounded-sm align-[3px]"
              style={{ background: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>
      {rong > 0 && (
        <svg
          width={W}
          height={H}
          className="block"
          role="img"
          aria-label={series.map((s) => s.name).join(', ')}
        >
          {luoi.map((v) => (
            <g key={v}>
              <line
                x1={M.l}
                x2={W - M.r}
                y1={Y(v)}
                y2={Y(v)}
                stroke={v === bot ? 'var(--bd-truc)' : 'var(--bd-luoi)'}
              />
              <text
                x={M.l - 8}
                y={Y(v) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--faint)"
                className="tnum"
              >
                {soCoDinh(v)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            W < 520 && i % 2 ? null : (
              <text
                key={l}
                x={X(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={11}
                fill={i === n - 1 ? 'var(--ink)' : 'var(--faint)'}
                fontWeight={i === n - 1 ? 600 : 400}
              >
                {l}
              </text>
            ),
          )}
          {series.map((s, si) => {
            const d = s.data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
            const li = s.data.length - 1
            return (
              <g key={s.name}>
                {si === 0 && zero && (
                  <path d={`${d}L${X(li)} ${Y(bot)}L${X(0)} ${Y(bot)}Z`} fill={s.color} fillOpacity={0.1} />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={X(li)}
                  cy={Y(s.data[li]!)}
                  r={4.5}
                  fill={s.color}
                  stroke="var(--gdos-surface)"
                  strokeWidth={2}
                />
              </g>
            )
          })}
          {kyChon !== null && (
            <g>
              <line x1={X(kyChon)} x2={X(kyChon)} y1={M.t} y2={H - M.b} stroke="var(--bd-truc)" />
              {series.map((s) => (
                <circle
                  key={s.name}
                  cx={X(kyChon)}
                  cy={Y(s.data[kyChon]!)}
                  r={5}
                  fill={s.color}
                  stroke="var(--gdos-surface)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
          <rect
            x={M.l}
            y={M.t}
            width={W - M.l - M.r}
            height={H - M.t - M.b}
            fill="transparent"
            onMouseMove={diChuot}
            onMouseLeave={() => {
              setKyChon(null)
              anGoiY()
            }}
          />
        </svg>
      )}
    </div>
  )
}
