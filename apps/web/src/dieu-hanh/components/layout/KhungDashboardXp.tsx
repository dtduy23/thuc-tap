import type { ReactNode } from 'react'
import type { BangChiTieu } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { goiApi } from '@/lib/http'
import { demSoThat, ganKpi, ganTile } from '@/dieu-hanh/lib/so-that'
import { KHOA_XA_PHUONG, layDashboardXaPhuong } from '@/dieu-hanh/lib/api'
import { timModule } from '@/dieu-hanh/app/modules'
import type { IdTrang } from '@/dieu-hanh/mocks/xa-phuong'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { ErrorState, ModuleSkeleton } from '@/dieu-hanh/components/ui/StateViews'
import { TooltipChuot } from '@/dieu-hanh/components/overlay/TooltipChuot'

export type DuLieuXp = Awaited<ReturnType<typeof layDashboardXaPhuong>>

/**
 * Khung chung của 8 màn nhóm ĐIỀU HÀNH: tải dữ liệu, dựng đầu trang từ PAGES
 * (tiêu đề, mô tả, chip "Kỳ số liệu") và đặt hộp tooltip bám chuột.
 *
 * Nâng cấp so với bản cũ: ghép SỐ THẬT của hệ thống mới (`/api/chi-tieu`) vào thẻ chỉ số và
 * KPI — xem lib/so-that.ts. Không đọc được số thật (không có quyền, máy chủ lỗi) thì màn vẫn
 * hiện đủ bằng số mẫu.
 */
const CAC_BO_THE = [
  'TILE_OVERVIEW',
  'TILE_TTHC',
  'TILE_KTXH',
  'TILE_KTXH_2',
  'TILE_ANTT',
  'TILE_HT',
  'TILE_YTGD',
  'TILE_PAKN',
] as const

function ganSoThat(d: DuLieuXp, b: BangChiTieu | undefined): { d: DuLieuXp; soThat: number } {
  const the = Object.fromEntries(CAC_BO_THE.map((bo) => [bo, d[bo].map((t) => ganTile(t, b))])) as Pick<
    DuLieuXp,
    (typeof CAC_BO_THE)[number]
  >
  const ma = [...CAC_BO_THE.flatMap((bo) => d[bo].map((t) => t.code)), ...d.KPIS.map((x) => x.code)]
  return { d: { ...d, ...the, KPIS: d.KPIS.map((x) => ganKpi(x, b)) }, soThat: demSoThat(ma, b) }
}
export function KhungDashboardXp({
  trang,
  children,
}: {
  trang: IdTrang
  children: (d: DuLieuXp) => ReactNode
}) {
  const q = useQuery({ queryKey: KHOA_XA_PHUONG, queryFn: layDashboardXaPhuong, staleTime: Infinity })

  const that = useQuery({
    queryKey: ['chi-tieu'],
    queryFn: () => goiApi<BangChiTieu>('/chi-tieu'),
    staleTime: 60_000,
    retry: false,
  })

  if (q.isPending) return <ModuleSkeleton />
  if (q.isError) return <ErrorState loi={q.error} thuLai={() => void q.refetch()} />

  const { d, soThat } = ganSoThat(q.data, that.data)
  const pg = d.TRANG[trang]
  const m = timModule(pg.module)

  return (
    <>
      <PageHeader
        crumb={`Trang chủ · ${pg.t}`}
        tieuDe={pg.t}
        moTa={pg.s}
        gocKey={m?.gocKey ?? 'ai'}
        mau={m?.mau ?? 'var(--brand)'}
        hanhDong={
          <span className="rounded-full border border-line bg-nen px-[11px] py-[5px] text-[12px] text-body">
            Kỳ số liệu: {pg.p}
          </span>
        }
      />
      <p className="mt-0 mb-3 rounded-lg border border-dashed border-line bg-nen-2 px-3 py-1.5 text-[12px] text-faint">
        {soThat > 0 ? (
          <>
            <b className="text-body">{soThat} chỉ tiêu</b> của bộ dashboard đang hiện{' '}
            <b className="text-body">số thật</b> (nguồn ghi ở chân thẻ). Các chỉ tiêu và biểu đồ còn lại là số
            mẫu.
          </>
        ) : (
          <>
            Bộ dashboard đang hiện <b className="text-body">số mẫu</b>.
          </>
        )}{' '}
        Nạp số của đơn vị ở{' '}
        <Link
          to="/$chucNang"
          params={{ chucNang: 'nd-excel' }}
          className="font-semibold text-brand hover:underline"
        >
          Quản trị › Nguồn dữ liệu vào
        </Link>
        .
      </p>
      {children(d)}
      <TooltipChuot />
    </>
  )
}
