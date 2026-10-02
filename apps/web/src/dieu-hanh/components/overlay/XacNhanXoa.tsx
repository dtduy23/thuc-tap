import type { ReactNode } from 'react'
import { Button } from '@heroui/react'
import { Trash2 } from 'lucide-react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { useModalMo } from '@/dieu-hanh/hooks/use-modal-mo'

/**
 * Hộp xác nhận thao tác phá hủy (xóa, xoay khoá…). Dùng thay `window.confirm`:
 * câu cảnh báo cần vài dòng để nói đủ hậu quả, hộp của trình duyệt không xuống dòng được.
 */
export function XacNhanXoa({
  tieuDe,
  noiDung,
  phu,
  nhanNut,
  icon = <Trash2 className="size-4" />,
  dangXoa,
  dong,
  xacNhan,
}: {
  tieuDe: string
  noiDung: ReactNode
  phu?: ReactNode
  nhanNut: string
  /** Icon trên nút và ô tròn bên trái; mặc định thùng rác. */
  icon?: ReactNode
  dangXoa?: boolean
  dong: () => void
  xacNhan: () => void
}) {
  const state = useModalMo(dong)
  return (
    <ModalKhung state={state} beRong="hep" tieuDe={tieuDe} nhanDong="Đóng hộp xác nhận">
      <div className="flex items-start gap-3">
        <span className="grid size-9 flex-none place-items-center rounded-full bg-canh-bao-bg text-canh-bao">
          {icon}
        </span>
        <div className="text-[0.82rem] text-body">
          {noiDung}
          {phu && <div className="mt-1 text-[0.72rem]">{phu}</div>}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-line-2 pt-3">
        <Button variant="outline" onPress={dong} isDisabled={dangXoa}>
          Hủy
        </Button>
        <Button variant="danger" onPress={xacNhan} isPending={dangXoa}>
          {icon}
          {nhanNut}
        </Button>
      </div>
    </ModalKhung>
  )
}
