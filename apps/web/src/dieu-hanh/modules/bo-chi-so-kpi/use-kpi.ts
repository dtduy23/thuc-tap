import { useMemo } from 'react'
import type { KpiXp } from '@/dieu-hanh/mocks/xa-phuong'
import { hist } from '@/dieu-hanh/lib/chuoi-mo-phong'

export interface KpiDayDu extends KpiXp {
  /** 10 kỳ, kỳ cuối là số thực tế; không có khi KPI chưa có chỉ tiêu nguồn. */
  hist?: number[]
  /** null = chưa có dữ liệu để đánh giá. */
  met: boolean | null
}

/** Port từ KPIS.forEach(k => { k.hist = …; k.met = … }). */
export function useKpi(kpis: ReadonlyArray<KpiXp>): KpiDayDu[] {
  return useMemo(
    () =>
      kpis.map((k) => ({
        ...k,
        hist: k.v != null ? hist(k.code, k.v, k.sim) : undefined,
        met: k.v == null ? null : k.v >= k.t,
      })),
    [kpis],
  )
}
