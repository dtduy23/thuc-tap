import { Button, ListBox, Select, TextField } from '@heroui/react'
import type { PhanAnh } from '@/dieu-hanh/mocks/types'
import { Timeline } from '@/dieu-hanh/components/ui/Timeline'
import { toast } from '@/dieu-hanh/store/toast'
import { DON_VI_XU_LY } from '../du-lieu'

interface Props {
  p: PhanAnh
  dong: () => void
  giaiQuyet: (id: string) => void
}

/** Cột phải modal: biểu mẫu phân công, nút hành động, timeline. */
export function CotPhanCong({ p, dong, giaiQuyet }: Props) {
  return (
    <div>
      <div className="mb-3 grid gap-[5px]">
        <span className="text-[0.68rem] font-bold tracking-[0.06em] text-faint">PHÂN CÔNG XỬ LÝ</span>
        <Select defaultSelectedKey={DON_VI_XU_LY[0]} aria-label="Phân công xử lý">
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {DON_VI_XU_LY.map((dv) => (
                <ListBox.Item key={dv} id={dv}>
                  {dv}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="mb-3 grid gap-[5px]">
        <span className="text-[0.68rem] font-bold tracking-[0.06em] text-faint">HẠN XỬ LÝ</span>
        <TextField defaultValue="3 ngày làm việc" aria-label="Hạn xử lý" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onPress={() => {
            toast('Đã phân công — công dân nhận thông báo tiến độ qua App')
            dong()
          }}
        >
          Phân công
        </Button>
        <Button
          variant="outline"
          onPress={() => toast('AI đã soạn dự thảo trả lời công dân dựa trên 4 phản ánh tương tự')}
        >
          ✦ AI soạn trả lời
        </Button>
        <Button variant="outline" onPress={() => giaiQuyet(p.id)}>
          ✓ Đã giải quyết
        </Button>
      </div>

      <div className="mb-1.5 mt-3.5 text-[0.68rem] text-faint">TIMELINE</div>
      <Timeline
        moc={[
          { tieuDe: 'Công dân gửi qua App', phu: `${p.ngay}/2026 · kèm 3 ảnh, định vị GPS`, xong: true },
          { tieuDe: 'AI phân loại & đề xuất', phu: `${p.ngay}/2026 · 12 giây`, xong: true },
          {
            tieuDe: 'Xử lý & phản hồi',
            phu: p.st[1] === 'green' ? 'hoàn thành' : 'đang thực hiện',
            xong: p.st[1] === 'green',
          },
        ]}
      />
    </div>
  )
}
