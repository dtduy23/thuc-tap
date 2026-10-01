/**
 * Thành phần giao diện nguyên thủy — không biết gì về nghiệp vụ.
 * Chỉ dùng class token (bg-nen, text-ink…), không viết mã màu.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

type KieuNut = 'chinh' | 'phu' | 'nguy-hiem'
const MAU_NUT: Record<KieuNut, string> = {
  chinh: 'border-brand bg-brand text-white hover:bg-brand-dim',
  phu: 'border-line bg-nen text-ink hover:border-brand hover:text-brand',
  'nguy-hiem': 'border-line bg-nen text-danger hover:border-danger hover:bg-tint-danger',
}

export function Nut({
  kieu = 'phu',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { kieu?: KieuNut }) {
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3.5 py-[7px] text-[13px] font-semibold active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${MAU_NUT[kieu]} ${className}`}
    />
  )
}

const LOP_O =
  'w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-brand focus:bg-nen focus:shadow-[0_0_0_3px_var(--tint-brand)] disabled:opacity-60'

export function ONhap({
  nhan,
  id,
  goiY,
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { nhan: string; id: string; goiY?: string }) {
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-body">
        {nhan}
      </label>
      <input id={id} {...p} className={LOP_O} aria-describedby={goiY ? `${id}-goi-y` : undefined} />
      {goiY && (
        <p id={`${id}-goi-y`} className="mt-1 text-[11.5px] text-faint">
          {goiY}
        </p>
      )}
    </div>
  )
}

export function OChon({
  nhan,
  id,
  children,
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { nhan: string; id: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-body">
        {nhan}
      </label>
      <select id={id} {...p} className={LOP_O}>
        {children}
      </select>
    </div>
  )
}

type KieuThongBao = 'loi' | 'ok' | 'thong-tin'
const MAU_TB: Record<KieuThongBao, string> = {
  loi: 'border-danger bg-tint-danger text-danger',
  ok: 'border-ok bg-tint-ok text-ok',
  'thong-tin': 'border-brand bg-tint-brand text-body',
}

export function ThongBao({ kieu = 'thong-tin', children }: { kieu?: KieuThongBao; children: ReactNode }) {
  return (
    <div
      role={kieu === 'loi' ? 'alert' : 'status'}
      className={`mb-4 rounded-r-lg border-l-[3px] px-3.5 py-2.5 text-[12.8px] leading-relaxed ${MAU_TB[kieu]}`}
    >
      {children}
    </div>
  )
}

export function The({ tieuDe, phu, children }: { tieuDe?: string; phu?: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-[10px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,34,54,.06),0_4px_16px_rgba(16,34,54,.06)]">
      {tieuDe && (
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
          <h2 className="m-0 text-[13.5px] font-bold text-ink">{tieuDe}</h2>
          {phu && <span className="text-[11.5px] text-faint">{phu}</span>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Nhãn nhỏ dạng viên thuốc. */
export function Chip({
  mau = 'xam',
  children,
}: {
  mau?: 'xam' | 'ok' | 'danger' | 'brand' | 'tim' | 'warn'
  children: ReactNode
}) {
  const lop = {
    xam: 'bg-line-2 text-faint',
    ok: 'bg-tint-ok text-ok',
    danger: 'bg-tint-danger text-danger',
    brand: 'bg-tint-brand text-brand',
    tim: 'bg-tint-tim text-tim',
    warn: 'bg-tint-warn text-warn',
  }[mau]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-bold whitespace-nowrap ${lop}`}
    >
      {mau !== 'xam' && <i aria-hidden="true" className="size-[7px] flex-none rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function ODanhDau({
  nhan,
  id,
  mo,
  ...p
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { nhan: ReactNode; id: string; mo?: string }) {
  return (
    <div className="mb-2 flex items-start gap-2">
      <input id={id} type="checkbox" {...p} className="mt-[3px] size-3.5 accent-brand" />
      <label htmlFor={id} className="text-[13px] text-body">
        {nhan}
        {mo && <span className="block text-[11.5px] text-faint">{mo}</span>}
      </label>
    </div>
  )
}

/** Bảng dữ liệu: cuộn ngang trên màn hẹp thay vì vỡ khung. */
export function KhungBang({ children, nhan }: { children: ReactNode; nhan: string }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,34,54,.05)]">
      <table
        aria-label={nhan}
        className="w-full border-collapse text-left text-[13px] [&_tbody_tr:hover>td]:bg-nav-hover"
      >
        {children}
      </table>
    </div>
  )
}

export const LOP_TH =
  'border-b-[1.5px] border-line bg-nen-2 px-3 py-2 text-[11px] font-bold tracking-[.06em] text-faint uppercase whitespace-nowrap'
export const LOP_TD = 'border-b border-line-2 px-3 py-2 align-top'
