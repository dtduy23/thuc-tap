import { Button } from '@heroui/react'
import { Globe } from 'lucide-react'

/**
 * Công tắc tra web ba bậc, đặt trong khối nhập chứ không giấu trong menu: nó đổi
 * chỗ hệ thống ĐI TÌM và cộng 6–7 giây vào độ trễ. Bậc tắt nghĩa là KHÔNG chạy —
 * một công tắc tắt mà vẫn chạy sáu giây rưỡi là công tắc nói dối.
 */
export const BAC_WEB = ['khong', 'tu_dong', 'chi_web'] as const
export type BacWeb = (typeof BAC_WEB)[number]

const NHAN: Record<BacWeb, [string, string]> = {
  khong: ['Không tra', 'Bỏ qua web hoàn toàn — trả lời nhanh nhất'],
  tu_dong: ['Tự động', 'Chỉ tra khi số liệu và tài liệu không có gì — chậm thêm 6–7 giây khi nó chạy'],
  chi_web: ['Chỉ tra web', 'Bỏ hẳn số liệu và tài liệu, chỉ dùng các trang đã khai'],
}

export function NutTraWeb({
  web,
  doi,
  khoa = false,
}: {
  web: string
  doi: (v: BacWeb) => void
  khoa?: boolean
}) {
  const i = Math.max(0, BAC_WEB.indexOf(web as BacWeb))
  const bac = BAC_WEB[i] ?? 'khong'
  const tat = bac === 'khong'
  return (
    <Button
      size="sm"
      variant={bac === 'chi_web' ? 'primary' : tat ? 'secondary' : 'outline'}
      aria-label={`Tra trên web: ${NHAN[bac][0]} — ${NHAN[bac][1]}`}
      isDisabled={khoa}
      className="flex-none"
      onPress={() => doi(BAC_WEB[(i + 1) % BAC_WEB.length] ?? 'khong')}
    >
      <Globe className="size-3.5" />
      {tat ? 'Tra web' : NHAN[bac][0]}
    </Button>
  )
}
