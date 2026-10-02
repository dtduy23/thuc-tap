/**
 * Bọc một màn ĐIỀU HÀNH chép từ GDOS cũ (apps/web/src/dieu-hanh) để chạy trong khung của hệ
 * thống mới: với màn còn chạy bằng dữ liệu mẫu, thêm một dòng nói rõ điều đó, để người điều
 * hành không nhầm số mẫu với số của đơn vị. (Vùng thông báo nổi của các màn này nằm ở khung portal.)
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

function DuLieuMau() {
  return (
    <p className="mt-0 mb-3 rounded-lg border border-dashed border-line bg-nen-2 px-3 py-1.5 text-[12px] text-faint">
      Màn này đang hiện <b className="text-body">dữ liệu mẫu</b> để xem bố cục và tính năng — chưa nối phân hệ
      nguồn, không dùng để báo cáo.
    </p>
  )
}

export function manCu(
  tai: () => Promise<{ default: ComponentType }>,
  { mau = true }: { mau?: boolean } = {},
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const Man = (await tai()).default
    return {
      default: function ManDieuHanhCu() {
        return (
          <>
            {mau && <DuLieuMau />}
            <Man />
          </>
        )
      },
    }
  })
}
