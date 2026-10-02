import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, ListBox, Select, Spinner } from '@heroui/react'
import { Pause, Volume2 } from 'lucide-react'
import { moTaLoi, ngheThuGiong } from '@/dieu-hanh/lib/api-tro-ly'
import { toast } from '@/dieu-hanh/store/toast'

const MAC_DINH = '__mac_dinh__'

/**
 * Chọn giọng đọc của bot, với nút nghe thử ngay cạnh: tên giọng (`Puck`,
 * `Kore`…) không nói được nghe ra sao, và không nghe thử thì người chịu hậu quả
 * của lựa chọn bừa là khách thật. Mỗi lần nghe thử là một lượt TTS tính tiền.
 */
export function ChonGiongBot({
  danhSach,
  giong,
  doi,
  khoa,
}: {
  danhSach: { ma: string; nhan: string }[]
  /** `''` = để máy chủ chọn giọng đầu danh sách. */
  giong: string
  doi: (ma: string) => void
  khoa?: boolean
}) {
  // Một thẻ audio dùng lại: đổi giọng rồi nghe ngay mà tiếng cũ còn chạy thì hai giọng chồng nhau.
  const loa = useRef<HTMLAudioElement | null>(null)
  const [dangPhat, setDangPhat] = useState(false)

  const dung = () => {
    loa.current?.pause()
    loa.current = null
    setDangPhat(false)
  }

  const thu = useMutation({
    mutationFn: ngheThuGiong,
    onSuccess: (b64) => {
      dung()
      const am = new Audio(`data:audio/wav;base64,${b64}`)
      loa.current = am
      setDangPhat(true)
      am.onended = () => setDangPhat(false)
      void am.play().catch(() => setDangPhat(false))
    },
    onError: (e) => toast.loi(`Không nghe thử được — ${moTaLoi(e)}`),
  })

  if (!danhSach.length) {
    return (
      <p className="text-[0.72rem] leading-relaxed text-warn-tx">
        Máy chủ chưa cấu hình giọng đọc, nên bot sẽ không đọc thành tiếng. Cần khai GEMINI_API_KEY ở dịch vụ
        trợ lí.
      </p>
    )
  }

  // Giọng "mặc định" nghe thử được thì sẽ đọc một giọng rồi giao một giọng khác.
  const ngheDuoc = Boolean(giong)
  const goiY = !ngheDuoc
    ? 'Chọn một giọng cụ thể rồi mới nghe thử được — “Mặc định” do máy chủ quyết lúc chạy.'
    : dangPhat
      ? 'Dừng nghe thử'
      : 'Nghe thử giọng này'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Giọng đọc"
        isDisabled={khoa}
        className="w-full sm:max-w-xs"
        selectedKey={giong || MAC_DINH}
        onSelectionChange={(k) => {
          dung()
          doi(k === MAC_DINH || k === null ? '' : String(k))
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id={MAC_DINH}>Mặc định — máy chủ chọn giọng đầu danh sách</ListBox.Item>
            {danhSach.map((g) => (
              <ListBox.Item key={g.ma} id={g.ma}>
                {g.nhan}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={goiY}
        isDisabled={khoa || !ngheDuoc}
        onPress={() => (dangPhat ? dung() : thu.mutate(giong))}
      >
        {thu.isPending ? (
          <Spinner size="sm" />
        ) : dangPhat ? (
          <Pause className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </Button>
      {!ngheDuoc && <span className="text-[0.72rem] text-faint">{goiY}</span>}
    </div>
  )
}
