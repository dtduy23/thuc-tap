import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, InputGroup, TextField } from '@heroui/react'
import { Eye, EyeOff, RotateCw } from 'lucide-react'
import { moTaLoi, xoayKhoaNhung } from '@/dieu-hanh/lib/api-tro-ly'
import { goiApi as goiGdos } from '@/lib/http'
import { XacNhanXoa } from '@/dieu-hanh/components/overlay/XacNhanXoa'
import { toast } from '@/dieu-hanh/store/toast'

/**
 * Khoá nhúng và đoạn mã — hai thứ người dùng phải MANG ĐI. Khoá nằm trong HTML
 * công khai nên che không phải bảo mật; che để khỏi lộ khi trình chiếu, chia sẻ
 * màn hình — làm việc để lộ thành một hành động CÓ Ý.
 */
export function KhoiNhung({
  khoa,
  botId,
  suaDuoc,
  daXoay,
}: {
  khoa: string
  /** `null` = bot chưa lưu lần nào, chưa có gì để xoay. */
  botId: string | null
  suaDuoc: boolean
  daXoay: (moi: string) => void
}) {
  const [hien, setHien] = useState(false)
  const [hoiXoay, setHoiXoay] = useState(false)

  // Xoay làm hỏng mọi trang đang nhúng — nên phải hỏi, bằng hộp nói đủ hậu quả.
  const xoay = useMutation({
    mutationFn: () => xoayKhoaNhung(botId as string),
    onSuccess: (b) => {
      daXoay(b.widget.embedKey)
      // Hiện luôn khoá mới: việc tiếp theo chắc chắn là chép nó đi gửi.
      setHien(true)
      setHoiXoay(false)
      toast.thanhCong('Đã cấp khoá mới. Gửi lại đoạn mã cho những nơi bạn muốn giữ.')
    },
    onError: (e) => toast.loi(`Không xoay được khoá: ${moTaLoi(e)}`),
  })

  // SDK phục vụ từ chính context-service qua gateway ĐANG gọi — không suy từ
  // thanh địa chỉ, vì cổng dev của portal không chuyển tiếp `/api/`.
  const diaChi = useQuery({
    queryKey: ['native', 'dia-chi'],
    queryFn: () => goiGdos<{ diaChi: string | null }>('/native/dia-chi'),
    staleTime: Infinity,
  })
  const goc = diaChi.data?.diaChi ?? 'https://<địa-chỉ-FOXAI-Native>'
  const doanMa = `<script src="${goc}/api/context/v1/nhung/sdk.js"\n        data-key="${khoa}" defer></script>`

  const chep = async (text: string, nhan: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.thanhCong(`Đã sao chép ${nhan}`)
    } catch {
      // Trang http nội bộ không có `navigator.clipboard` — nói ra thay vì im.
      toast.loi('Trình duyệt không cho sao chép ở đây — bôi đen rồi chép tay.')
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-1 text-[0.74rem] font-medium text-body">Khoá nhúng</p>
        <div className="flex items-center gap-1.5">
          <TextField
            aria-label="Khoá nhúng"
            isReadOnly
            value={hien ? khoa : '•'.repeat(Math.min(khoa.length, 32))}
            className="flex-1"
          >
            <InputGroup>
              <InputGroup.Input className="font-mono text-[0.74rem]" />
            </InputGroup>
          </TextField>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={hien ? 'Ẩn khoá' : 'Hiện khoá'}
            onPress={() => setHien((v) => !v)}
          >
            {hien ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          {/* Chép được KỂ CẢ khi đang ẩn: bắt hiện lên mới chép được là bắt để lộ để lấy. */}
          <Button size="sm" variant="secondary" onPress={() => void chep(khoa, 'khoá')}>
            Sao chép
          </Button>
          {botId && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Xoay khoá"
              isDisabled={!suaDuoc}
              onPress={() => setHoiXoay(true)}
            >
              <RotateCw className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-1 text-[0.72rem] text-faint">
          Nền tảng sinh, không sửa được. Che ở đây chỉ để đỡ lộ khi trình chiếu — khoá vẫn nằm trong mã trang
          của bạn.
        </p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.74rem] font-medium text-body">Đoạn mã dán vào trang</p>
          <Button size="sm" variant="ghost" onPress={() => void chep(doanMa, 'đoạn mã')}>
            Sao chép đoạn mã
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-[9px] bg-bg p-3 text-[0.72rem] leading-relaxed text-ink">
          {doanMa}
        </pre>
      </div>

      {hoiXoay && (
        <XacNhanXoa
          tieuDe="Cấp khoá nhúng mới?"
          noiDung="Khoá cũ hết dùng được ngay, và mọi trang đang nhúng bot sẽ không hiện bong bóng chat cho tới khi bạn gửi đoạn mã mới. Không hoàn tác được."
          nhanNut="Cấp khoá mới"
          icon={<RotateCw className="size-4" />}
          dangXoa={xoay.isPending}
          dong={() => setHoiXoay(false)}
          xacNhan={() => xoay.mutate()}
        />
      )}
    </div>
  )
}
