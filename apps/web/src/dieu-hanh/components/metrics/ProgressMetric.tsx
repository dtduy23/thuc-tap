interface Props {
  pct: number
  mau?: string
  className?: string
}

/** Port từ .bar/.bar i — thanh 8px, chạy width bằng transition .8s. */
export function ProgressMetric({ pct, mau = 'var(--brand)', className = '' }: Props) {
  return (
    <div className={`h-2 overflow-hidden rounded bg-track ${className}`}>
      <div
        className="h-full rounded transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: mau }}
      />
    </div>
  )
}
