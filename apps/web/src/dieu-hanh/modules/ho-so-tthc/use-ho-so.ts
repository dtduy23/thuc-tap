import { useMemo, useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { D } from '@/dieu-hanh/mocks/data'
import type { HoSoTthc } from '@/dieu-hanh/mocks/types'
import { chuanHoa } from '@/dieu-hanh/lib/tim-kiem'

/**
 * Gom trạng thái của màn Hồ sơ TTHC: danh sách, bộ lọc, hồ sơ đang xem
 * và hành động phê duyệt (port từ `renderTthc()` + `duyetHs()`).
 */
export function useHoSo() {
  const [loc, setLoc] = useState('')
  const [danhSach, setDanhSach] = useState<ReadonlyArray<HoSoTthc>>(D.tthc)
  const [dangXem, setDangXem] = useState<HoSoTthc | null>(null)
  const chiTietState = useOverlayState()

  const hoSoLoc = useMemo(() => {
    const q = chuanHoa(loc.trim())
    if (!q) return danhSach
    return danhSach.filter((h) =>
      chuanHoa(`${h.id} ${h.cd} ${h.cccd} ${h.loai} ${h.nhom} ${h.cv} ${h.st[0]}`).includes(q),
    )
  }, [danhSach, loc])

  const moChiTiet = (id: string) => {
    const h = danhSach.find((x) => x.id === id)
    if (!h) return
    setDangXem(h)
    chiTietState.open()
  }

  /** Port từ duyetHs(): đổi trạng thái sang Hoàn thành rồi đóng modal. */
  const pheDuyet = (id: string) => {
    setDanhSach((ds) => ds.map((h) => (h.id === id ? { ...h, st: ['Hoàn thành', 'green'] as const } : h)))
    chiTietState.close()
  }

  return { loc, setLoc, hoSoLoc, dangXem, chiTietState, moChiTiet, pheDuyet }
}
