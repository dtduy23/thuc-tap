import {
  GIAI_DOAN,
  TRANG_THAI_BUOC,
  TRANG_THAI_DU_AN,
  type SucKhoe,
  type TrangThaiBuoc,
  type TrangThaiDuAn,
} from '@gdos/shared'
import { Chip } from '@/ui/co-ban'

type Mau = 'xam' | 'ok' | 'danger' | 'brand' | 'tim' | 'warn'

const MAU_SUC_KHOE: Record<SucKhoe, [Mau, string]> = {
  'qua-han': ['danger', 'Quá hạn'],
  'sap-han': ['warn', 'Sắp đến hạn'],
  'trong-han': ['brand', 'Trong hạn'],
  xong: ['ok', 'Hoàn thành'],
}

export function ChipSucKhoe({ sk }: { sk: SucKhoe }) {
  const [mau, nhan] = MAU_SUC_KHOE[sk]
  return <Chip mau={mau}>{nhan}</Chip>
}

const MAU_BUOC: Record<TrangThaiBuoc, Mau> = {
  'bo-qua': 'xam',
  'cho-xac-nhan': 'tim',
  xong: 'ok',
  'qua-han': 'danger',
  'sap-han': 'warn',
  'trong-han': 'xam',
}

export function ChipBuoc({ tt }: { tt: TrangThaiBuoc }) {
  return <Chip mau={MAU_BUOC[tt]}>{TRANG_THAI_BUOC[tt]}</Chip>
}

const MAU_TRANG_THAI: Record<TrangThaiDuAn, Mau> = {
  'dang-thuc-hien': 'brand',
  'hoan-thanh': 'ok',
  'tam-dung': 'warn',
  huy: 'xam',
}

export function ChipTrangThai({ tt }: { tt: TrangThaiDuAn }) {
  return <Chip mau={MAU_TRANG_THAI[tt]}>{TRANG_THAI_DU_AN[tt]}</Chip>
}

/** Thanh tiến độ: phần trăm bước đã xong. */
export function ThanhTienDo({ phanTram, nho = false }: { phanTram: number; nho?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`block overflow-hidden rounded-full bg-line ${nho ? 'h-1.5 w-20' : 'h-2 w-full'}`}
        role="progressbar"
        aria-valuenow={phanTram}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ"
      >
        <span className="block h-full rounded-full bg-brand" style={{ width: `${phanTram}%` }} />
      </span>
      <span className="text-[12px] text-faint tabular-nums">{phanTram}%</span>
    </span>
  )
}

export const tenGiaiDoan = (gd: keyof typeof GIAI_DOAN | null) =>
  gd ? `${gd} — ${GIAI_DOAN[gd]}` : 'Đã xong'

/** Tiền: triệu đồng, dấu chấm hàng nghìn. */
export const trieuDong = (n: number) => `${n.toLocaleString('vi-VN')} tr.đ`
