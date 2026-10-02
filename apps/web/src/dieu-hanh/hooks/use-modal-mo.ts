import { useOverlayState } from '@heroui/react'

/**
 * Modal của màn này được gắn/gỡ theo dữ liệu (tệp đang xóa, thư mục đang sửa…)
 * giống bản FOXAINATIVE, nên luôn mở khi đã gắn — đóng bằng nút X, nền hay Esc
 * đều quy về `dong` để state ở màn cha là nguồn sự thật duy nhất.
 */
export const useModalMo = (dong: () => void) =>
  useOverlayState({
    isOpen: true,
    onOpenChange: (mo) => {
      if (!mo) dong()
    },
  })
