import { DANH_SACH_MODULE, dongGopCua, type BaoCaoDef } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { truyVanToi } from '@/lib/phien'
import { TheBaoCao } from '@/trang/bao-cao'

/**
 * Danh sách báo cáo — MỘT màn cho Báo cáo điều hành (mọi nghiệp vụ) và cho "Báo cáo
 * dự án" trong module (lọc theo module chủ). Báo cáo do module khai một lần (ADR-0007).
 */
function DanhSachBaoCao({ loai, moduleId }: { loai?: BaoCaoDef['loai']; moduleId?: string }) {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const ds = dongGopCua(DANH_SACH_MODULE, 'baoCao', new Set(toi.quyen)).filter(
    (x) => (!loai || x.muc.loai === loai) && (!moduleId || x.module.id === moduleId),
  )
  const theoNghiepVu = new Map<string, typeof ds>()
  for (const x of ds) theoNghiepVu.set(x.module.nhan, [...(theoNghiepVu.get(x.module.nhan) ?? []), x])

  if (ds.length === 0) return <p className="text-[13px] text-faint">Chưa có báo cáo nào bạn xem được.</p>
  return (
    <>
      {[...theoNghiepVu.entries()].map(([nghiepVu, muc]) => (
        <section key={nghiepVu} className="mb-5">
          {!moduleId && <h2 className="mt-0 mb-2 text-[14px] font-semibold">{nghiepVu}</h2>}
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {muc.map((x) => (
              <TheBaoCao key={x.muc.id} muc={x.muc} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export const TatCaBaoCao = () => <DanhSachBaoCao />
export const BaoCaoDinhKy = () => <DanhSachBaoCao loai="dinh-ky" />
export const XuatDuLieu = () => <DanhSachBaoCao loai="xuat" />
export const BaoCaoDuAn = () => <DanhSachBaoCao moduleId="du-an" />
