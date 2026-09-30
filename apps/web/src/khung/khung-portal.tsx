import { DANH_SACH_MODULE, locTheoQuyen } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { truyVanToi } from '@/lib/phien'
import { CayPhanHe } from './cay-phan-he'
import { ThanhTren } from './thanh-tren'

/**
 * Khung portal: thanh trên + cây phân hệ + nội dung. Màn hẹp (< md): cây thành
 * ngăn kéo mở bằng nút ☰ — KHÔNG BAO GIỜ ẩn hẳn, không thì người dùng mất đường đi.
 */
export function KhungPortal() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const cay = useMemo(() => locTheoQuyen(DANH_SACH_MODULE, new Set(toi.quyen)), [toi.quyen])
  const duongDan = useRouterState({ select: (s) => s.location.pathname })
  const dangXem = duongDan.slice(1) || undefined
  const [ngan, datNgan] = useState(false)

  // Chuyển trang thì đóng ngăn kéo (màn hẹp). Điều chỉnh ngay lúc render khi đường
  // dẫn đổi — cách React khuyên, thay cho useEffect gây thêm một vòng render.
  const [duongDanTruoc, datDuongDanTruoc] = useState(duongDan)
  if (duongDan !== duongDanTruoc) {
    datDuongDanTruoc(duongDan)
    datNgan(false)
  }

  return (
    <div className="flex h-full flex-col">
      <ThanhTren toi={toi} cay={cay} moMenu={() => datNgan((x) => !x)} />
      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-[252px] flex-none overflow-y-auto border-r border-line bg-nen px-2 pt-2.5 pb-6 max-md:fixed max-md:top-[54px] max-md:bottom-0 max-md:left-0 max-md:z-40 max-md:shadow-xl max-md:transition-transform ${ngan ? '' : 'max-md:-translate-x-[105%]'}`}
        >
          <CayPhanHe cay={cay} dangXem={dangXem} />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-4 pb-10 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
