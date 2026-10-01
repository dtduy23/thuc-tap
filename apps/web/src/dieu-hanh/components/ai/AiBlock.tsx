import type { ReactNode } from 'react'

/** Port từ .ai-chip — nhãn viền bo tròn có nền chuyển sắc. */
export function AiChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[20px] border border-ai-line px-2.5 py-1 text-[0.68rem] font-bold text-ai-ink"
      style={{ background: 'linear-gradient(90deg,var(--ai-chip-from),var(--ai-chip-to))' }}
    >
      {children}
    </span>
  )
}

/** Port từ .ai-box — hộp nội dung do AI sinh. */
export function AiBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[10px] border border-ai-box-line px-[15px] py-3 text-[0.78rem] leading-[1.55] text-body"
      style={{ background: 'linear-gradient(135deg,var(--ai-box-from),var(--ai-box-to))' }}
    >
      {children}
    </div>
  )
}
