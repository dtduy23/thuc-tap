import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { Timeline } from '@/dieu-hanh/components/ui/Timeline'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import type { ThuaDat } from '@/dieu-hanh/mocks/types'

interface Props {
  state: UseOverlayStateReturn
  thua: ThuaDat
}

/** Port từ lichSuBd() — bản gốc mở ở dạng modal hẹp (openModal(..., true)). */
export function ModalLichSu({ state, thua }: Props) {
  return (
    <ModalKhung
      state={state}
      tieuDe={`Lịch sử biến động — Thửa ${thua.id}`}
      nhanDong="Đóng lịch sử biến động"
      beRong="hep"
    >
      <Timeline moc={thua.ls.map((l) => ({ tieuDe: l[1], phu: l[0], xong: true }))} />
      <AiBox>✦ Toàn bộ biến động đồng bộ 2 chiều với CSDL Đất đai Quốc gia (VBDLIS) qua LGSP/NDXP.</AiBox>
    </ModalKhung>
  )
}
