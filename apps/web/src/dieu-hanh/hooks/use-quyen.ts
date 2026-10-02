import { useSuspenseQuery } from '@tanstack/react-query'
import { truyVanToi } from '@/lib/phien'

export type HanhDong = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT'

/**
 * Quyền của người đang đăng nhập cho các màn Trợ lý AI chép từ GDOS cũ. Bản cũ hỏi quyền
 * của Native (`ASSISTANT_CHATBOT.*`); hệ thống mới phân quyền TẠI GDOS — mọi mã phân hệ cũ
 * của Trợ lý AI quy về một mã `TRO_LY`, đúng tập quyền mà cổng chuyển tiếp dùng để chặn.
 */
export function useQuyen(_maPhanHeCu: string) {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const duoc = (hd: HanhDong) => toi.quyen.includes(`TRO_LY.${hd}`)
  return { duoc }
}
