import type { ReactNode } from 'react'
import { Modal, type UseOverlayStateReturn } from '@heroui/react'

/**
 * Bản gốc dùng .modal{width:min(860px,100%)} và .modal.sm{width:min(520px,100%)}.
 * HeroUI v3 chỉ có tới size="lg" (max-w-lg = 512px) nên modal hai cột bị bó hẹp —
 * ghi đè max-width qua className của Modal.Dialog để khớp bản gốc.
 */
export const BE_RONG = {
  /** .modal — modal chi tiết hai cột */
  rong: 'max-w-[min(860px,100%)]',
  /** .modal.sm — biểu mẫu một cột */
  hep: 'max-w-[min(520px,100%)]',
} as const

interface Props {
  state: UseOverlayStateReturn
  /** Tiêu đề chính. */
  tieuDe: ReactNode
  /** Dòng phụ dưới tiêu đề. */
  phu?: ReactNode
  /** Khối bên phải tiêu đề, trước nút đóng (thường là StatusChip). */
  nhan?: ReactNode
  /** Nhãn tiếng Việt cho nút đóng. */
  nhanDong: string
  children: ReactNode
  chanTrang?: ReactNode
  /** Mặc định rộng 860px như bản gốc; `hep` cho biểu mẫu một cột. */
  beRong?: keyof typeof BE_RONG
}

/** Khung modal dùng chung — gom phần Backdrop/Container/Dialog/Header lặp ở mọi màn. */
export function ModalKhung({
  state,
  tieuDe,
  phu,
  nhan,
  nhanDong,
  children,
  chanTrang,
  beRong = 'rong',
}: Props) {
  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable variant="blur">
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog className={`${BE_RONG[beRong]} bg-nen`}>
            <Modal.Header className="flex items-start justify-between gap-3 border-b border-line-2 px-[18px] py-3.5">
              <div className="min-w-0">
                <Modal.Heading className="text-base font-bold text-ink">{tieuDe}</Modal.Heading>
                {phu && <div className="mt-0.5 text-[0.72rem] text-faint">{phu}</div>}
              </div>
              <div className="flex flex-none items-center gap-2">
                {nhan}
                <Modal.CloseTrigger aria-label={nhanDong} />
              </div>
            </Modal.Header>

            <Modal.Body className="px-[18px] py-3.5">{children}</Modal.Body>

            {chanTrang && (
              <Modal.Footer className="flex flex-wrap gap-2 px-[18px] pb-4">{chanTrang}</Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
