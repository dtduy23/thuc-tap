import { useState } from 'react'
import type { UseOverlayStateReturn } from '@heroui/react'
import type { PhanAnh } from '@/dieu-hanh/mocks/types'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { Lightbox } from '@/dieu-hanh/components/overlay/Lightbox'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { anhMinhHoa } from '@/dieu-hanh/lib/anh'
import { hatAnh } from '../du-lieu'
import { CotNoiDung } from './CotNoiDung'
import { CotPhanCong } from './CotPhanCong'

interface Props {
  phanAnh: PhanAnh | null
  state: UseOverlayStateReturn
  giaiQuyet: (id: string) => void
}

/** Port từ openPa() — modal hai cột: nội dung + ảnh, và phân công + timeline. */
export function ChiTietPhanAnh({ phanAnh, state, giaiQuyet }: Props) {
  const [anhDangXem, setAnhDangXem] = useState<number | null>(null)
  if (!phanAnh) return null
  const p = phanAnh

  const anhTo = [0, 1, 2].map((k) => anhMinhHoa(p.kw || 'street', hatAnh(p.id, k), 1100, 800))

  return (
    <>
      <ModalKhung
        state={state}
        tieuDe={p.ten}
        phu={`${p.id} · ${p.nguoi} · ${p.ngay}/2026 · qua Mobile App`}
        nhan={<StatusChip trangThai={p.st} />}
        nhanDong="Đóng chi tiết phản ánh"
      >
        <div className="grid gap-[22px] md:grid-cols-2">
          <CotNoiDung p={p} xemAnh={setAnhDangXem} />
          <CotPhanCong p={p} dong={() => state.close()} giaiQuyet={giaiQuyet} />
        </div>
      </ModalKhung>

      <Lightbox
        anh={anhDangXem === null ? [] : anhTo}
        viTri={anhDangXem ?? 0}
        doiViTri={setAnhDangXem}
        dong={() => setAnhDangXem(null)}
      />
    </>
  )
}
