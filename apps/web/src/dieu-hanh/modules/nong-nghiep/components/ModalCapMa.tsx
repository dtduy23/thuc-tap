import { useState } from 'react'
import { Input, Label, TextField, type UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import type { VungTrong } from '@/dieu-hanh/mocks/types'

interface Props {
  state: UseOverlayStateReturn
  /** Bản gốc saveVt(): thêm vùng trồng mới vào đầu bảng rồi chọn luôn. */
  luu: (v: VungTrong) => void
}

/** Port từ capMaVt() + saveVt(). */
export function ModalCapMa({ state, luu }: Props) {
  const [ten, datTen] = useState('')
  const [dt, datDt] = useState('')
  const [ho, datHo] = useState('')

  const gui = () => {
    luu({
      sp: ten.trim() || 'Vùng trồng mới',
      dt: `${dt.trim() || '10'} ha`,
      ho: `Tổ ? — ${ho.trim() || '5'} hộ`,
      quet: '0',
      seed: Math.floor(Math.random() * 200) + 10,
      st: ['Mới cấp', 'gray'],
      nk: ['Chưa có', 'gray'],
      logs: [['08/04', 'Khởi tạo sổ nhật ký điện tử — chờ hộ SX ghi kỳ đầu']],
    })
    datTen('')
    datDt('')
    datHo('')
    state.close()
  }

  return (
    <ModalKhung
      state={state}
      tieuDe="Cấp mã vùng trồng mới"
      nhanDong="Đóng biểu mẫu cấp mã vùng trồng"
      beRong="hep"
      chanTrang={
        <div className="flex w-full justify-end gap-2">
          <NutPhu onPress={() => state.close()}>Hủy</NutPhu>
          <NutChinh onPress={gui}>Cấp mã &amp; sinh QR</NutChinh>
        </div>
      }
    >
      <div className="grid gap-3">
        <TextField value={ten} onChange={datTen}>
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">
            TÊN VÙNG TRỒNG / SẢN PHẨM
          </Label>
          <Input placeholder="VD: Ổi lê — Tổ 6" />
        </TextField>

        <TextField value={dt} onChange={datDt}>
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">DIỆN TÍCH (HA)</Label>
          <Input placeholder="VD: 18" />
        </TextField>

        <TextField value={ho} onChange={datHo}>
          <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">SỐ HỘ THAM GIA</Label>
          <Input placeholder="VD: 7" />
        </TextField>
      </div>

      <div className="mt-3">
        <AiBox>✦ Hệ thống sẽ sinh mã QR chuẩn, tạo sổ nhật ký điện tử và mời các hộ qua Zalo.</AiBox>
      </div>
    </ModalKhung>
  )
}
