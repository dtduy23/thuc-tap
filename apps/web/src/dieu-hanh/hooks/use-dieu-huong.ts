import { useNavigate } from '@tanstack/react-router'
import { chucNangCua } from '@/dieu-hanh/app/modules'

/**
 * Bản gốc dùng go('<view>') để nhảy màn. Ở đây: điều hướng theo mã module của GDOS cũ, đổi
 * sang mã chức năng của hệ thống mới.
 */
export function useDieuHuong() {
  const navigate = useNavigate()
  return (moduleId: string) =>
    void navigate({ to: '/$chucNang', params: { chucNang: chucNangCua(moduleId) } })
}
