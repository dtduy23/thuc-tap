import { soVN } from '@/dieu-hanh/lib/format'

interface Props {
  /** Phần trăm thay đổi; âm là giảm. */
  d: number
  /** true khi giảm mới là tốt (ví dụ số vụ việc). */
  inv?: boolean
}

/** Port từ TR() — 0% luôn trung tính, còn lại xanh khi tốt, đỏ khi xấu. */
export function Trend({ d, inv }: Props) {
  if (d === 0) return <b className="text-[0.72rem] font-bold text-faint">→ 0%</b>

  const up = d > 0
  const good = inv ? !up : up
  return (
    <b className={`text-[0.72rem] font-extrabold ${good ? 'text-ok' : 'text-canh-bao'}`}>
      {up ? '↑' : '↓'} {soVN(Math.abs(d))}%
    </b>
  )
}
