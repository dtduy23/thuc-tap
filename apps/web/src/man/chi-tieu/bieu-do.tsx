/**
 * Biểu đồ của bảng Chỉ tiêu điều hành — SVG thuần, không thư viện. Màu chuỗi lấy theo
 * thứ tự cố định `--bd-1…8` (styles.css); chữ luôn dùng token chữ, không tô theo màu chuỗi;
 * trạng thái đạt / chưa đạt dùng token ok / danger kèm nhãn chữ. Mỗi dấu có chú giải khi rê chuột.
 */
import type { ReactNode } from 'react'

export const MAU = (i: number) => `var(--bd-${((i - 1) % 8) + 1})`
export const so = (v: number, le = 0) =>
  v.toLocaleString('vi-VN', { minimumFractionDigits: le, maximumFractionDigits: le })

/** Thẻ khung của một biểu đồ. */
export function The({
  tieuDe,
  phu,
  rong = 6,
  children,
}: {
  tieuDe: string
  phu?: ReactNode
  /** Số cột (trên lưới 12) ở màn rộng. */
  rong?: 3 | 4 | 5 | 6 | 7 | 8 | 12
  children: ReactNode
}) {
  const cot = {
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
    12: 'lg:col-span-12',
  }[rong]
  return (
    <section
      className={`col-span-12 min-w-0 rounded-[12px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)] ${cot}`}
    >
      <div className="border-b border-line-2 px-4 py-2.5">
        <h3 className="m-0 text-[13.5px] font-bold text-ink">{tieuDe}</h3>
        {phu && <p className="m-0 mt-0.5 text-[11.5px] text-faint">{phu}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export const Luoi12 = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 grid grid-cols-12 gap-4">{children}</div>
)

/** Đường xu hướng nhỏ trong thẻ số — không trục, chỉ hình dáng. */
export function DuongNho({ chuoi, mau }: { chuoi: number[]; mau: string }) {
  if (chuoi.length < 2) return null
  const W = 96
  const H = 28
  const lo = Math.min(...chuoi)
  const hi = Math.max(...chuoi)
  const x = (i: number) => (i / (chuoi.length - 1)) * (W - 4) + 2
  const y = (v: number) => (hi === lo ? H / 2 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6))
  const d = chuoi.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="flex-none">
      <path d={d} fill="none" stroke={mau} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(chuoi.length - 1)} cy={y(chuoi.at(-1)!)} r="2.5" fill={mau} />
    </svg>
  )
}

export interface Phan {
  nhan: string
  giaTri: number
  /** Thứ tự màu 1…8, hoặc màu trạng thái. */
  mau: string
}

/** Vành khuyên cơ cấu + chú giải có số và % (không bao giờ chỉ dựa vào màu). */
export function Donut({ phan, giua, donVi }: { phan: Phan[]; giua?: string; donVi?: string }) {
  const tong = phan.reduce((t, p) => t + p.giaTri, 0)
  const R = 54
  const CV = 2 * Math.PI * R
  let truoc = 0
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        role="img"
        aria-label="Biểu đồ cơ cấu"
        className="flex-none"
      >
        <circle cx="75" cy="75" r={R} fill="none" stroke="var(--line-2)" strokeWidth="18" />
        {tong > 0 &&
          phan
            .filter((p) => p.giaTri > 0)
            .map((p) => {
              // Chừa 2px nền giữa các phần để hai màu kề nhau không dính.
              const dai = Math.max(0, (p.giaTri / tong) * CV - 2)
              const lech = -truoc
              truoc += (p.giaTri / tong) * CV
              return (
                <circle
                  key={p.nhan}
                  cx="75"
                  cy="75"
                  r={R}
                  fill="none"
                  stroke={p.mau}
                  strokeWidth="18"
                  strokeDasharray={`${dai} ${CV - dai}`}
                  strokeDashoffset={lech}
                  transform="rotate(-90 75 75)"
                >
                  <title>{`${p.nhan}: ${so(p.giaTri)} (${so((p.giaTri / tong) * 100, 1)}%)`}</title>
                </circle>
              )
            })}
        <text x="75" y="73" textAnchor="middle" className="fill-ink text-[20px] font-extrabold">
          {giua ?? so(tong)}
        </text>
        {donVi && (
          <text x="75" y="91" textAnchor="middle" className="fill-faint text-[10.5px]">
            {donVi}
          </text>
        )}
      </svg>
      <ul className="m-0 grid min-w-[180px] flex-1 list-none gap-1.5 p-0">
        {phan.map((p) => (
          <li key={p.nhan} className="flex items-center gap-2 text-[12.5px]">
            <span
              aria-hidden="true"
              className="size-2.5 flex-none rounded-[3px]"
              style={{ background: p.mau }}
            />
            <span className="min-w-0 flex-1 truncate text-body">{p.nhan}</span>
            <b className="text-ink tabular-nums">{so(p.giaTri)}</b>
            <span className="w-12 text-right text-faint tabular-nums">
              {tong > 0 ? `${so((p.giaTri / tong) * 100, 1)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Vòng tiến độ một chỉ tiêu % so với mục tiêu — đạt / chưa đạt ghi bằng chữ. */
export function Vong({
  giaTri,
  mucTieu,
  nhan,
  phu,
  mau,
  soLe = 1,
}: {
  giaTri: number | null
  mucTieu?: number
  nhan: string
  phu?: string
  mau: string
  soLe?: number
}) {
  const R = 42
  const CV = 2 * Math.PI * R
  const pt = Math.max(0, Math.min(100, giaTri ?? 0))
  const dat = giaTri !== null && mucTieu !== undefined ? giaTri >= mucTieu : null
  // Vạch mục tiêu trên vòng.
  const goc = ((mucTieu ?? 0) / 100) * 2 * Math.PI - Math.PI / 2
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        role="img"
        aria-label={`${nhan}: ${giaTri ?? 'chưa có'}%`}
      >
        <circle cx="56" cy="56" r={R} fill="none" stroke="var(--line-2)" strokeWidth="10" />
        {giaTri !== null && (
          <circle
            cx="56"
            cy="56"
            r={R}
            fill="none"
            stroke={mau}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pt / 100) * CV} ${CV}`}
            transform="rotate(-90 56 56)"
          >
            <title>{`${nhan}: ${so(giaTri, soLe)}%${mucTieu !== undefined ? ` · mục tiêu ≥ ${mucTieu}%` : ''}`}</title>
          </circle>
        )}
        {mucTieu !== undefined && (
          <line
            x1={56 + Math.cos(goc) * (R - 8)}
            y1={56 + Math.sin(goc) * (R - 8)}
            x2={56 + Math.cos(goc) * (R + 8)}
            y2={56 + Math.sin(goc) * (R + 8)}
            stroke="var(--ink)"
            strokeWidth="2"
          />
        )}
        <text x="56" y="61" textAnchor="middle" className="fill-ink text-[17px] font-extrabold">
          {giaTri === null ? '—' : `${so(giaTri, soLe)}%`}
        </text>
      </svg>
      <p className="m-0 mt-1 text-[12.5px] font-semibold text-ink">{nhan}</p>
      {phu && <p className="m-0 text-[11px] text-faint">{phu}</p>}
      {dat !== null && (
        <p className={`m-0 mt-0.5 text-[11px] font-bold ${dat ? 'text-ok' : 'text-danger'}`}>
          {dat ? '✓ Đạt' : '✕ Chưa đạt'} · mục tiêu ≥ {mucTieu}%
        </p>
      )}
    </div>
  )
}

export interface Thanh {
  nhan: string
  giaTri: number
  mau?: string
  /** Chữ ở cột phải (mặc định là số). */
  hien?: string
}

/** Thanh ngang so sánh độ lớn — một màu khi so cùng một đại lượng. */
export function ThanhNgang({ ds, toiDa, hauTo = '' }: { ds: Thanh[]; toiDa?: number; hauTo?: string }) {
  const max = toiDa ?? Math.max(1, ...ds.map((d) => d.giaTri))
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {ds.map((d) => (
        <li
          key={d.nhan}
          className="grid grid-cols-[minmax(0,10.5rem)_1fr_auto] items-center gap-3 text-[12.5px]"
          title={`${d.nhan}: ${d.hien ?? so(d.giaTri)}${hauTo}`}
        >
          <span className="truncate text-body">{d.nhan}</span>
          <span className="h-3 overflow-hidden rounded-r-[4px] bg-line-2">
            <span
              className="block h-full rounded-r-[4px]"
              style={{ width: `${Math.min(100, (d.giaTri / max) * 100)}%`, background: d.mau ?? MAU(1) }}
            />
          </span>
          <b className="min-w-12 text-right text-ink tabular-nums">
            {d.hien ?? so(d.giaTri)}
            {d.hien ? '' : hauTo}
          </b>
        </li>
      ))}
    </ul>
  )
}

/** Mười kỳ gần nhất (tháng) kết thúc ở kỳ hiện tại, vd "T9/2026" → T12 … T9. */
export function nhanKy(ky: string, n = 10): string[] {
  const m = /^T(\d+)\/(\d+)$/.exec(ky)
  const thang = m ? Number(m[1]) : 1
  return Array.from({ length: n }, (_, i) => `T${((thang - (n - 1 - i) - 1 + 120) % 12) + 1}`)
}

/** Đường diễn biến theo kỳ, tối đa vài chuỗi; có chú giải và giá trị khi rê vào từng điểm. */
export function DuongKy({
  chuoi,
  ky,
  donVi = '',
}: {
  chuoi: { ten: string; mau: string; du: number[] }[]
  ky: string
  donVi?: string
}) {
  const co = chuoi.filter((c) => c.du.length > 1)
  if (co.length === 0)
    return <p className="m-0 py-8 text-center text-[12.5px] text-faint">Chưa có chuỗi số liệu theo kỳ.</p>
  const W = 560
  const H = 190
  const L = 44
  const B = 24
  const tat = co.flatMap((c) => c.du)
  const lo = Math.min(...tat)
  const hi = Math.max(...tat)
  const dem = (hi - lo) * 0.12 || 1
  const y0 = Math.max(0, lo - dem)
  const y1 = hi + dem
  const n = co[0]!.du.length
  const x = (i: number) => L + (i / (n - 1)) * (W - L - 12)
  const y = (v: number) => H - B - ((v - y0) / (y1 - y0)) * (H - B - 10)
  const nhan = nhanKy(ky, n)
  const vach = [0, 0.5, 1].map((t) => y0 + (y1 - y0) * t)
  return (
    <div>
      {co.length > 1 && (
        <ul className="m-0 mb-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px] text-body">
          {co.map((c) => (
            <li key={c.ten} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-4 rounded" style={{ background: c.mau }} />
              {c.ten}
            </li>
          ))}
        </ul>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Diễn biến theo kỳ">
        {vach.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--line-2)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end" className="fill-faint text-[10px]">
              {so(v, v < 100 && !Number.isInteger(v) ? 1 : 0)}
            </text>
          </g>
        ))}
        {nhan.map((t, i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-faint text-[10px]">
            {t}
          </text>
        ))}
        {co.map((c) => (
          <g key={c.ten}>
            <path
              d={c.du.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={c.mau}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {c.du.map((v, i) => (
              <g key={i}>
                <circle cx={x(i)} cy={y(v)} r="4" fill={c.mau} stroke="var(--nen)" strokeWidth="2" />
                {/* Vùng rê chuột rộng hơn dấu. */}
                <circle cx={x(i)} cy={y(v)} r="11" fill="transparent">
                  <title>{`${c.ten} · ${nhan[i]}: ${so(v, Number.isInteger(v) ? 0 : 1)}${donVi}`}</title>
                </circle>
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}

/** Bảng "nhãn — giá trị". */
export function BangKv({ ds }: { ds: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid gap-0 text-[12.5px]">
      {ds.map(([k, v]) => (
        <div
          key={k}
          className="flex items-baseline justify-between gap-3 border-b border-line-2 py-2 last:border-0"
        >
          <dt className="text-body">{k}</dt>
          <dd className="m-0 text-right font-bold text-ink tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
