import type { ReactNode } from 'react'
import type { IconTile, MauTile, TileXp } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { P8, P9, hist } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { LOP_NHIP, LOP_THE } from '@/dieu-hanh/components/ui/LuoiDashboard'

/** [màu icon/đường, màu số] — port từ COLORS. */
const MAU: Record<MauTile, [string, string]> = {
  blue: ['var(--bd-1)', 'var(--bd-chu-xanh)'],
  green: ['var(--bd-dat)', 'var(--bd-dat-chu)'],
  amber: ['var(--bd-canh-bao)', 'var(--bd-canh-bao-chu)'],
  red: ['var(--bd-chua-dat)', 'var(--bd-chua-dat)'],
  violet: ['var(--bd-7)', 'var(--bd-chu-tim)'],
  teal: ['var(--bd-3)', 'var(--bd-chu-teal)'],
  orange: ['var(--bd-2)', 'var(--bd-chu-cam)'],
}

const I = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

/** Port từ TI — icon trong vòng tròn của thẻ chỉ số. */
const TI: Record<IconTile, ReactNode> = {
  users: (
    <I>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" />
    </I>
  ),
  home: (
    <I>
      <path d="M3 11 12 4l9 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </I>
  ),
  shield: (
    <I>
      <path d="M12 3 19 6v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </I>
  ),
  file: (
    <I>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </I>
  ),
  check: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.7L16.5 9.5" />
    </I>
  ),
  clock: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </I>
  ),
  alert: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.3v.2" />
    </I>
  ),
  msg: (
    <I>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </I>
  ),
  heart: (
    <I>
      <path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z" />
      <path d="M8.5 12h2l1-2 1.5 4 1-2h1.5" />
    </I>
  ),
  leaf: (
    <I>
      <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
      <path d="M5 19c3-4 6-7 10-9" />
    </I>
  ),
  patrol: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="2.5" />
    </I>
  ),
  ticket: (
    <I>
      <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <path d="M13 7v10" strokeDasharray="2 2" />
    </I>
  ),
  camera: (
    <I>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="m16 11 5-3v8l-5-3" />
    </I>
  ),
  road: (
    <I>
      <path d="M8 3 4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3" />
    </I>
  ),
  build: (
    <I>
      <path d="M3 21h18M6 21V9l6-4 6 4v12" />
      <path d="M10 21v-5h4v5M9.5 11h5" />
    </I>
  ),
  drop: (
    <I>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </I>
  ),
  bulb: (
    <I>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </I>
  ),
  hospital: (
    <I>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </I>
  ),
  steth: (
    <I>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v2a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="11" r="2" />
    </I>
  ),
  school: (
    <I>
      <path d="m2 9 10-5 10 5-10 5z" />
      <path d="M6 11v5c2 2 10 2 12 0v-5" />
    </I>
  ),
  student: (
    <I>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21c.5-4.5 3.2-7 7-7s6.5 2.5 7 7" />
    </I>
  ),
  shop: (
    <I>
      <path d="M4 9h16l-1.5-5h-13z" />
      <path d="M5 9v11h14V9M10 20v-5h4v5" />
    </I>
  ),
  timer: (
    <I>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </I>
  ),
  done: (
    <I>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </I>
  ),
  globe: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
    </I>
  ),
  task: (
    <I>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.8h6V4M9 11l2 2 4-4M9 17h6" />
    </I>
  ),
  scan: (
    <I>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
    </I>
  ),
  smile: (
    <I>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1.8 2 5.2 2 7 0M9 9.5v.5M15 9.5v.5" />
    </I>
  ),
}

const W = 132
const H = 38
const PAD = 4

function Sparkline({
  data,
  color,
  labels,
  unit,
  dec,
}: {
  data: ReadonlyArray<number>
  color: string
  labels: ReadonlyArray<string>
  unit: string
  dec: number
}) {
  const mn = Math.min(...data)
  const mx = Math.max(...data)
  const rg = mx - mn || 1
  const pts = data.map(
    (d, i) =>
      [PAD + (i * (W - 2 * PAD)) / (data.length - 1), H - PAD - ((d - mn) / rg) * (H - 2 * PAD)] as const,
  )
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')
  const last = pts[pts.length - 1]!
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="col-start-2 mt-0.5 justify-self-end overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={4} fill={color} stroke="var(--gdos-surface)" strokeWidth={2} />
      {pts.map((p, i) => (
        <rect
          key={labels[i]}
          x={(p[0] - (W - 2 * PAD) / 18).toFixed(1)}
          y={0}
          width={((W - 2 * PAD) / 9).toFixed(1)}
          height={H}
          fill="transparent"
          {...goiY({
            tieuDe: `${labels[i]}${i < 9 ? ' · mô phỏng' : ' · thực tế'}`,
            than: `${soCoDinh(data[i]!, dec)}${unit}`,
          })}
        />
      ))}
    </svg>
  )
}

interface Props {
  t: TileXp
  /** Thay chân thẻ dạng chuỗi — thẻ KPI cần gắn nhãn Đạt/Chưa đạt có màu. */
  chan?: ReactNode
}

/** Port từ renderTiles(): icon tròn, số chính, so kỳ trước và sparkline 10 kỳ. */
export function TheChiSoXu({ t, chan }: Props) {
  const [c, cv] = MAU[t.color]
  const foot =
    chan ?? (t.foot && (t.footCanhBao ? <span className="text-bd-canh-bao-chu">{t.foot}</span> : t.foot))
  const lop = `${LOP_THE} ${LOP_NHIP[t.span ?? 3]} grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-[18px] pb-3 pt-[18px]`
  const icon = (
    <div
      className="row-span-2 grid size-[54px] place-items-center rounded-full [&_svg]:size-6"
      style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}
    >
      {TI[t.icon]}
    </div>
  )
  const nhan = (
    <div
      className="flex justify-between gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-faint"
      title={`Mã chỉ tiêu: ${t.code}`}
    >
      {t.label}
    </div>
  )

  if (t.value == null) {
    return (
      <div className={lop}>
        {icon}
        {nhan}
        <div>
          <div className="my-0.5 text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-faint">—</div>
          <div className="text-[12.5px] text-body">
            <b className="font-bold text-faint">Chưa có dữ liệu nguồn</b>
            {foot && <> · {foot}</>}
          </div>
        </div>
        <svg width={W} height={H} aria-hidden="true" className="col-start-2 mt-0.5 justify-self-end">
          <line
            x1={4}
            x2={128}
            y1={30}
            y2={30}
            stroke="var(--bd-truc)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>
      </div>
    )
  }

  const dec = t.dec ?? 0
  const unit = t.unit ? ` ${t.unit}` : ''
  const data = t.data ?? hist(t.code, t.value, t.sim ?? {})
  const prev = data[8]!
  const cur = data[9]!
  const nhan8 = t.period === 'T8' ? P8 : P9

  let so: ReactNode
  if (prev === cur || (t.pp && Math.abs(cur - prev) < 0.05)) {
    so = <b className="font-bold text-faint">{t.pp ? '— 0 điểm %' : '— 0%'}</b>
  } else if (prev === 0) {
    so = <b className="font-bold text-bd-dat-chu">↑ mới</b>
  } else if (t.pp) {
    const df = cur - prev
    so = (
      <b className={`font-bold ${df > 0 ? 'text-bd-dat-chu' : 'text-bd-chua-dat'}`}>
        {df > 0 ? '↑' : '↓'} {soCoDinh(Math.abs(df), 1)} điểm %
      </b>
    )
  } else {
    const pc = ((cur - prev) / prev) * 100
    so = (
      <b className={`font-bold ${pc > 0 ? 'text-bd-dat-chu' : 'text-bd-chua-dat'}`}>
        {pc > 0 ? '↑' : '↓'} {soCoDinh(Math.abs(pc), Math.abs(pc) < 10 ? 1 : 0)}%
      </b>
    )
  }

  return (
    <div className={lop}>
      {icon}
      {nhan}
      <div>
        <div
          className="tnum my-0.5 text-[30px] font-bold leading-[1.1] tracking-[-0.02em]"
          style={{ color: cv }}
        >
          {soCoDinh(t.value, dec)}
          {t.unit && (
            <small className="ml-[3px] text-[14px] font-medium tracking-normal text-body">{t.unit}</small>
          )}
        </div>
        <div className="text-[12.5px] text-body">
          {so} <span title={`So với kỳ ${nhan8[8]}`}>so với kỳ trước</span>
          {foot && <> · {foot}</>}
        </div>
      </div>
      <Sparkline data={data} color={c} labels={nhan8} unit={unit} dec={dec} />
    </div>
  )
}
