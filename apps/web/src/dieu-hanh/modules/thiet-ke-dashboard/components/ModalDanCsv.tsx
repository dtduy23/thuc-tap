import { useState } from 'react'
import { Label, TextArea, TextField, type UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'

interface Props {
  state: UseOverlayStateReturn
  nap: (name: string, text: string) => void
}

/** Port từ dbPasteCsv() + doPaste(). */
export function ModalDanCsv({ state, nap }: Props) {
  const [csv, datCsv] = useState('')

  return (
    <ModalKhung
      state={state}
      tieuDe="Dán dữ liệu CSV — tạo bộ dữ liệu mới"
      nhanDong="Đóng biểu mẫu dán CSV"
      beRong="hep"
      chanTrang={
        <div className="flex w-full justify-end gap-2">
          <NutPhu onPress={() => state.close()}>Hủy</NutPhu>
          <NutChinh
            onPress={() => {
              nap('Dữ liệu dán tay', csv)
              datCsv('')
              state.close()
            }}
          >
            Nạp dữ liệu
          </NutChinh>
        </div>
      }
    >
      <TextField value={csv} onChange={datCsv}>
        <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">
          DÒNG ĐẦU LÀ TIÊU ĐỀ CỘT — ngăn cách bằng dấu phẩy / chấm phẩy / tab
        </Label>
        <TextArea rows={7} placeholder={'Tháng,Thu NS,Chi TX\nT1,8.6,5.9\nT2,10.1,6.2'} />
      </TextField>
    </ModalKhung>
  )
}
