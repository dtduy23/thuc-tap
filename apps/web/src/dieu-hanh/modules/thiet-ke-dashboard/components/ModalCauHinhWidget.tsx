import { useState } from 'react'
import { Input, Label, ListBox, Select, TextField, type UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { TEN_WIDGET, type BoDuLieu, type Widget } from '../du-lieu'

interface Props {
  state: UseOverlayStateReturn
  widget: Widget | null
  bo: BoDuLieu
  luu: (id: number, title: string, lbl: number, val: number) => void
}

/** Port từ cfgW() + saveW(). */
export function ModalCauHinhWidget({ state, widget: w, bo, luu }: Props) {
  const [tieuDe, datTieuDe] = useState('')
  const [lbl, datLbl] = useState('0')
  const [val, datVal] = useState('1')

  // Mỗi lần mở modal nạp lại giá trị hiện tại của widget
  const [truoc, datTruoc] = useState<{ w: Widget | null; mo: boolean }>({ w: null, mo: false })
  if (truoc.w !== w || truoc.mo !== state.isOpen) {
    datTruoc({ w, mo: state.isOpen })
    if (w && state.isOpen) {
      datTieuDe(w.title)
      datLbl(String(w.lbl))
      datVal(String(w.val))
    }
  }

  if (!w) return null

  const cot = bo.headers.map((h, i) => ({ id: String(i), nhan: h }))

  return (
    <ModalKhung
      state={state}
      tieuDe={`Cấu hình widget — ${TEN_WIDGET[w.type]}`}
      nhanDong="Đóng cấu hình widget"
      beRong="hep"
      chanTrang={
        <div className="flex w-full justify-end gap-2">
          <NutPhu onPress={() => state.close()}>Hủy</NutPhu>
          <NutChinh
            onPress={() => {
              luu(w.id, tieuDe || w.title, Number(lbl), Number(val))
              state.close()
            }}
          >
            Áp dụng
          </NutChinh>
        </div>
      }
    >
      <div className="grid gap-3">
        <TextField value={tieuDe} onChange={datTieuDe}>
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">TIÊU ĐỀ</Label>
          <Input />
        </TextField>

        <Select selectedKey={lbl} onSelectionChange={(k) => datLbl(String(k))} aria-label="Cột nhãn">
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">
            CỘT NHÃN (trục ngang / tên nhóm)
          </Label>
          <Select.Trigger />
          <Select.Popover>
            <ListBox>
              {cot.map((c) => (
                <ListBox.Item key={c.id} id={c.id}>
                  {c.nhan}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select selectedKey={val} onSelectionChange={(k) => datVal(String(k))} aria-label="Cột giá trị">
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">
            CỘT GIÁ TRỊ (số liệu)
          </Label>
          <Select.Trigger />
          <Select.Popover>
            <ListBox>
              {cot.map((c) => (
                <ListBox.Item key={c.id} id={c.id}>
                  {c.nhan}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </ModalKhung>
  )
}
