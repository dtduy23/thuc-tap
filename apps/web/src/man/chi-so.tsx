import type { LoaiChiSo } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { truyVanChiSo } from '@/lib/xuyen-suot'
import { CacKhoiSoLieu } from './khoi-so-lieu'

/** Điều hành › Bộ chỉ số — KPI và xếp hạng do các nghiệp vụ góp (ADR-0007). */
function ChiSo({ loai }: { loai: LoaiChiSo }) {
  const { data } = useSuspenseQuery(truyVanChiSo(loai))
  return <CacKhoiSoLieu ds={data} trong="Chưa có chỉ số nào trong phạm vi của bạn." />
}

export const TatCaChiSo = () => <ChiSo loai="tat-ca" />
export const XepHangDonVi = () => <ChiSo loai="xep-hang" />
