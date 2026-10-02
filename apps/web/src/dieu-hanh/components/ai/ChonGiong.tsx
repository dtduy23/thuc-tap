import { Button, ListBox, Select } from '@heroui/react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { Giong } from '@/dieu-hanh/hooks/use-giong'

/**
 * Ô chọn giọng + công tắc đọc thành tiếng + nút tạm dừng. Ba trạng thái ba hình
 * (tắt · bật chờ · đang đọc), và tạm dừng tách khỏi tắt: bật lại là đọc lại từ đầu.
 */
export function ChonGiong({
  danhSach,
  giong,
  doiGiong,
  bat,
  doiBat,
  dangDoc,
  dangTam,
  tam,
}: {
  danhSach: Giong[]
  giong: string | null
  doiGiong: (v: string) => void
  bat: boolean
  doiBat: (v: boolean) => void
  dangDoc: boolean
  dangTam: boolean
  tam: () => void
}) {
  if (!danhSach.length) {
    return (
      <span
        className="grid size-8 place-items-center text-faint"
        title="Máy chủ chưa có giọng đọc nào."
        aria-label="Máy chủ chưa có giọng đọc nào."
      >
        <VolumeX className="size-4" />
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1">
      {(dangDoc || dangTam) && (
        <Button
          isIconOnly
          size="sm"
          variant="primary"
          aria-label={dangTam ? 'Nghe tiếp' : 'Tạm dừng đọc'}
          onPress={tam}
        >
          {dangTam ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </Button>
      )}
      <Button
        isIconOnly
        size="sm"
        variant={bat ? 'secondary' : 'ghost'}
        aria-label={bat ? 'Tắt đọc thành tiếng' : 'Đọc câu trả lời thành tiếng'}
        aria-pressed={bat}
        onPress={() => doiBat(!bat)}
      >
        {bat ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </Button>
      {bat && (
        <Select
          aria-label="Giọng đọc"
          className="w-[168px]"
          selectedKey={giong}
          onSelectionChange={(k) => k !== null && doiGiong(String(k))}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {danhSach.map((g) => (
                <ListBox.Item key={g.ma} id={g.ma}>
                  {g.nhan}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
    </div>
  )
}
