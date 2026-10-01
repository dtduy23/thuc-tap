import type { GocNhinTongQuan } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { truyVanTongQuan } from '@/lib/xuyen-suot'
import { CacKhoiSoLieu } from './khoi-so-lieu'

/** Điều hành › Tổng quan — một màn cho ba góc nhìn; số liệu do các nghiệp vụ góp (ADR-0007). */
function TongQuan({ theo }: { theo: GocNhinTongQuan }) {
  const { data } = useSuspenseQuery(truyVanTongQuan(theo))
  return <CacKhoiSoLieu ds={data} trong="Chưa có nghiệp vụ nào có số liệu trong phạm vi của bạn." />
}

export const TongQuanToanCanh = () => <TongQuan theo="toan" />
export const TongQuanDonVi = () => <TongQuan theo="don-vi" />
export const TongQuanLinhVuc = () => <TongQuan theo="linh-vuc" />
