/**
 * Cây route — hai nhánh khung khác nhau:
 *
 *   gốc
 *   ├── /dang-nhap          màn đăng nhập, không có khung portal
 *   └── (portal)            khung portal — GUARD đặt ở đây, một chỗ cho mọi màn
 *       ├── /               trang chủ
 *       ├── /doi-mat-khau
 *       ├── /cai-dat        cài đặt cá nhân (tông màu, sáng/tối)
 *       ├── /du-an/$id      hồ sơ một dự án — các thẻ là trục phạm vi, không lên cây
 *       ├── /bao-cao/$ma    một báo cáo — cùng màn dù mở từ Điều hành hay từ module chủ
 *       └── /$chucNang      MỘT route động phủ toàn bộ registry — thêm chức năng
 *                           không phải sửa file này
 */
import type { ThongTinToi } from '@gdos/shared'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { KhungPortal } from '@/khung/khung-portal'
import { duongDanNoiBo } from '@/lib/duong-dan'
import { goiApi, LoiApi } from '@/lib/http'
import { KHOA_TOI, truyVanToi } from '@/lib/phien'
import { docThamSoUrl, TrangBaoCao } from '@/trang/bao-cao'
import { TrangCaiDat } from '@/trang/cai-dat'
import { THE_HO_SO, TrangHoSoDuAn, type MaThe } from '@/trang/ho-so-du-an'
import { TrangChucNang, KhongTimThay } from '@/trang/chuc-nang'
import { TrangDangNhap } from '@/trang/dang-nhap'
import { TrangDoiMatKhau } from '@/trang/doi-mat-khau'
import { TrangChu } from '@/trang/trang-chu'
import { Nut, ThongBao } from '@/ui/co-ban'

interface NguCanhRouter {
  queryClient: QueryClient
}

const goc = createRootRouteWithContext<NguCanhRouter>()({
  component: Outlet,
  notFoundComponent: KhongTimThay,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-[520px] p-6">
      <ThongBao kieu="loi">{error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'}</ThongBao>
      <Nut kieu="chinh" onClick={reset}>
        Thử lại
      </Nut>
    </div>
  ),
})

const dangNhap = createRoute({
  getParentRoute: () => goc,
  path: '/dang-nhap',
  validateSearch: (s: Record<string, unknown>): { tiep?: string } => ({ tiep: duongDanNoiBo(s.tiep) }),
  // Đã đăng nhập thì không cần xem form. Gọi thẳng API chứ không qua cache truy
  // vấn — để lỗi 401 ở đây không kích hoạt bộ xử lý "hết phiên" rồi vòng lại chính trang này.
  beforeLoad: async ({ context, search }) => {
    let toi: ThongTinToi
    try {
      toi = await goiApi<ThongTinToi>('/xac-thuc/toi')
    } catch {
      return
    }
    context.queryClient.setQueryData(KHOA_TOI, toi)
    throw redirect({ href: search.tiep ?? '/' })
  },
  component: function ManDangNhap() {
    const { tiep } = dangNhap.useSearch()
    return <TrangDangNhap tiep={tiep} />
  },
})

const portal = createRoute({
  getParentRoute: () => goc,
  id: 'portal',
  component: KhungPortal,
  beforeLoad: async ({ context, location }) => {
    let toi: ThongTinToi
    try {
      toi = await context.queryClient.ensureQueryData(truyVanToi)
    } catch (e) {
      if (e instanceof LoiApi && e.ma === 401) {
        throw redirect({ to: '/dang-nhap', search: { tiep: duongDanNoiBo(location.href) } })
      }
      throw e
    }
    // Mật khẩu do quản trị cấp: người khác đã biết, nên phải đổi trước khi làm gì khác.
    if (toi.phaiDoiMatKhau && location.pathname !== '/doi-mat-khau') throw redirect({ to: '/doi-mat-khau' })
  },
})

const trangChu = createRoute({ getParentRoute: () => portal, path: '/', component: TrangChu })

const doiMatKhau = createRoute({
  getParentRoute: () => portal,
  path: '/doi-mat-khau',
  component: TrangDoiMatKhau,
})

const caiDat = createRoute({ getParentRoute: () => portal, path: '/cai-dat', component: TrangCaiDat })

const hoSoDuAn = createRoute({
  getParentRoute: () => portal,
  path: '/du-an/$id',
  validateSearch: (s: Record<string, unknown>): { the?: MaThe } => ({
    the: THE_HO_SO.some((t) => t.id === s.the) ? (s.the as MaThe) : undefined,
  }),
  component: function ManHoSoDuAn() {
    const { id } = hoSoDuAn.useParams()
    const { the } = hoSoDuAn.useSearch()
    return <TrangHoSoDuAn id={id} the={the ?? 'tong-quan'} />
  },
})

const baoCao = createRoute({
  getParentRoute: () => portal,
  path: '/bao-cao/$ma',
  validateSearch: docThamSoUrl,
  component: function ManBaoCao() {
    const { ma } = baoCao.useParams()
    return <TrangBaoCao ma={ma} ts={baoCao.useSearch()} />
  },
})

const chucNang = createRoute({
  getParentRoute: () => portal,
  path: '/$chucNang',
  component: function ManChucNang() {
    const { chucNang: id } = chucNang.useParams()
    return <TrangChucNang id={id} />
  },
})

const cayRoute = goc.addChildren([
  dangNhap,
  portal.addChildren([trangChu, doiMatKhau, caiDat, hoSoDuAn, baoCao, chucNang]),
])

export function taoRouter(queryClient: QueryClient) {
  return createRouter({ routeTree: cayRoute, context: { queryClient }, defaultPreload: 'intent' })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof taoRouter>
  }
}
