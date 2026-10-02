import { useState, type ReactNode } from 'react'
import { Switch } from '@heroui/react'
import { ChevronRight } from 'lucide-react'

/** Màu theo LOẠI VIỆC của mục — tám mục xám hết thì icon chỉ còn là hình trang trí. */
const TONE = {
  brand: 'bg-tint-brand text-brand',
  tim: 'bg-tim-bg text-tim',
  teal: 'bg-tint-teal text-teal',
  warn: 'bg-warn-bg text-warn-tx',
  xam: 'bg-line-2 text-chu-phu',
} as const

/**
 * Một mục cấu hình, gấp lại được. Mục gấp vẫn nói ra nó có gì bên trong
 * (`tomTat`), nên gấp không phải là giấu.
 */
export function Muc({
  ten,
  mo,
  icon,
  tone = 'xam',
  tomTat,
  gapDuoc = false,
  children,
}: {
  ten: string
  mo?: string
  icon?: ReactNode
  tone?: keyof typeof TONE
  tomTat?: string
  gapDuoc?: boolean
  children: ReactNode
}) {
  const [dangMo, setDangMo] = useState(!gapDuoc)
  const Dau = gapDuoc ? 'button' : 'div'
  return (
    <section className="rounded-[11px] border border-line">
      <Dau
        {...(gapDuoc
          ? { type: 'button' as const, 'aria-expanded': dangMo, onClick: () => setDangMo((v) => !v) }
          : {})}
        className={`flex w-full items-start gap-2.5 px-4 py-3 text-left ${dangMo ? 'rounded-t-[11px]' : 'rounded-[11px]'} ${
          gapDuoc ? 'cursor-pointer hover:bg-nav-hover' : ''
        }`}
      >
        {icon && (
          <span
            className={`mt-0.5 grid flex-none place-items-center rounded-lg p-1.5 [&_svg]:size-3.5 ${TONE[tone]}`}
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[0.78rem] font-semibold text-ink">{ten}</span>
          {mo && <span className="block text-[0.74rem] leading-relaxed text-chu-phu">{mo}</span>}
          {gapDuoc && !dangMo && tomTat && (
            <span className="mt-0.5 block text-[0.72rem] text-faint">{tomTat}</span>
          )}
        </span>
        {gapDuoc && (
          <ChevronRight
            className={`mt-0.5 size-3.5 flex-none text-faint transition-transform ${dangMo ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
        )}
      </Dau>
      {dangMo && <div className="grid gap-3 border-t border-line px-4 py-3">{children}</div>}
    </section>
  )
}

export function CongTac({
  bat,
  doi,
  khoa,
  children,
}: {
  bat: boolean
  doi: (v: boolean) => void
  khoa?: boolean
  children: ReactNode
}) {
  return (
    <Switch isSelected={bat} onChange={doi} isDisabled={khoa} size="sm">
      <Switch.Content className="flex items-center gap-2">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <span className="text-[0.74rem] text-ink">{children}</span>
      </Switch.Content>
    </Switch>
  )
}

/** Hai hoặc ba lựa chọn dạng thẻ — dùng cho phạm vi trả lời và kênh giao tiếp. */
export function ChonThe<T extends string>({
  giaTri,
  doi,
  khoa,
  muc,
  cot = 2,
}: {
  giaTri: T
  doi: (v: T) => void
  khoa?: boolean
  muc: { ma: T; nhan: string; mo: string }[]
  cot?: 2 | 3
}) {
  return (
    <div className={`grid gap-2 ${cot === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {muc.map((m) => (
        <button
          key={m.ma}
          type="button"
          disabled={khoa}
          aria-pressed={giaTri === m.ma}
          onClick={() => doi(m.ma)}
          className={`rounded-[9px] border px-3 py-2 text-left transition-colors disabled:opacity-60 ${
            giaTri === m.ma
              ? 'border-brand bg-tint-brand ring-1 ring-brand'
              : 'border-line hover:bg-nav-hover'
          }`}
        >
          <span className="block text-[0.74rem] font-medium text-ink">{m.nhan}</span>
          <span className="mt-0.5 block text-[0.72rem] leading-snug text-chu-phu">{m.mo}</span>
        </button>
      ))}
    </div>
  )
}
