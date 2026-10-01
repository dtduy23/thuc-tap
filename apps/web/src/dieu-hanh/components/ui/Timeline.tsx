import type { ReactNode } from 'react'

export interface MocTl {
  tieuDe: ReactNode
  phu?: ReactNode
  /** Đã xong — chấm tô đặc (bản gốc: .tl-item.done). */
  xong?: boolean
  /** Cảnh báo — viền chấm đỏ (bản gốc: .tl-item.warn). */
  canh?: boolean
}

/** Port từ .tl / .tl-item — đường dọc bên trái, mỗi mốc một chấm tròn. */
export function Timeline({ moc }: { moc: ReadonlyArray<MocTl> }) {
  return (
    <div className="relative pl-6 before:absolute before:bottom-1.5 before:left-[7px] before:top-1.5 before:w-0.5 before:bg-line">
      {moc.map((m, i) => (
        <div key={i} className="relative pb-[18px]">
          <span
            className="absolute -left-6 top-1 size-3 rounded-full border-[3px]"
            style={{
              borderColor: m.canh ? 'var(--gdos-danger)' : 'var(--brand)',
              background: m.xong ? 'var(--brand)' : 'var(--gdos-surface)',
            }}
            aria-hidden="true"
          />
          <b className="text-[0.8rem] text-ink">{m.tieuDe}</b>
          {m.phu && <small className="block text-[0.68rem] text-faint">{m.phu}</small>}
        </div>
      ))}
    </div>
  )
}
