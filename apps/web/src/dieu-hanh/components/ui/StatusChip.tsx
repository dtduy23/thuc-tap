import type { MauPill, TrangThai } from '@/dieu-hanh/mocks/types'

/** Bản gốc: .pill + .p-red/.p-yel/.p-blue/.p-green/.p-gray/.p-pur */
const LOP: Record<MauPill, string> = {
  red: 'bg-canh-bao-bg text-canh-bao',
  yel: 'bg-warn-bg text-warn-tx',
  blue: 'bg-brand-soft text-brand',
  green: 'bg-ok-bg text-ok-tx',
  gray: 'bg-line-2 text-chu-phu',
  pur: 'bg-tim-bg text-tim',
}

interface Props {
  trangThai: TrangThai
}

export function StatusChip({ trangThai }: Props) {
  const [nhan, mau] = trangThai
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[20px] px-2.5 py-[3px] text-[0.68rem] font-bold ${LOP[mau]}`}
    >
      {nhan}
    </span>
  )
}
