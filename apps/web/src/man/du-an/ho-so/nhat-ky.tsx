import type { HoSoDuAn } from '@gdos/shared'
import NhatKyDs from '@/man/nhat-ky-ds'

/**
 * Thẻ Nhật ký — CHÍNH màn Giám sát › Nhật ký thao tác, lọc sẵn theo dự án (ADR-0007:
 * một chủ, nhiều lối vào). Quyền cũng là của chủ: NHAT_KY.READ — chuyên viên không
 * xem nhật ký kiểm tra chính mình (ADR-0006), nên thẻ này ẩn với họ.
 */
export default function NhatKyHoSo({ hs }: { hs: HoSoDuAn }) {
  return <NhatKyDs duAnId={hs.id} />
}
