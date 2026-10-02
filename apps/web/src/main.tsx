import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { taoRouter } from '@/app/router'
import { apDungGiaoDien } from '@/lib/giao-dien'
import { LoiApi } from '@/lib/http'
import { KHOA_TOI } from '@/lib/phien'
import '@heroui/styles/css'
import '@/styles.css'

apDungGiaoDien()

/**
 * Phiên hết hạn giữa chừng (lớp http đã thử làm mới mà vẫn 401) → về màn đăng
 * nhập, giữ đường dẫn để quay lại. Bỏ qua truy vấn "tôi là ai": guard của
 * portal tự xử lý nó, xử lý hai nơi là chuyển trang hai lần.
 */
function hetPhien(loi: unknown, khoa?: readonly unknown[]) {
  if (!(loi instanceof LoiApi) || loi.ma !== 401) return
  if (khoa && khoa.join('/') === KHOA_TOI.join('/')) return
  if (router.state.location.pathname === '/dang-nhap') return
  void router.navigate({ to: '/dang-nhap', search: { tiep: router.state.location.href } })
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e, q) => hetPhien(e, q.queryKey) }),
  mutationCache: new MutationCache({ onError: (e) => hetPhien(e) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Lỗi quyền / không tìm thấy thì thử lại cũng vô ích.
      retry: (lan, loi) => !(loi instanceof LoiApi && [401, 403, 404].includes(loi.ma)) && lan < 1,
    },
  },
})
const router = taoRouter(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
