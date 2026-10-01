import { useState } from 'react'
import { Input, Label, TextField, type UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'

interface Props {
  state: UseOverlayStateReturn
  /** Định vị thửa theo id — bản gốc: selParcelById(). */
  dinhVi: (id: string) => void
}

/** Port từ traCuu() + doTraCuu() — modal tra cứu thửa đất. */
export function ModalTraCuu({ state, dinhVi }: Props) {
  const [tuKhoa, datTuKhoa] = useState('')

  const traCuu = () => {
    const q = tuKhoa.trim()
    const p = D.parcels.find((x) => x.id === q || x.cs.toLowerCase().includes(q.toLowerCase()))
    if (p) {
      state.close()
      dinhVi(p.id)
    } else {
      toast('Không tìm thấy — dữ liệu demo có 4 thửa: 125/32, 126/32, 98/31, 141/32')
    }
  }

  return (
    <ModalKhung
      state={state}
      tieuDe="Tra cứu thửa đất"
      nhanDong="Đóng tra cứu thửa đất"
      beRong="hep"
      chanTrang={
        <div className="flex w-full justify-end">
          <NutChinh onPress={traCuu}>Tra cứu</NutChinh>
        </div>
      }
    >
      <TextField
        value={tuKhoa}
        onChange={datTuKhoa}
        onKeyDown={(e) => {
          if (e.key === 'Enter') traCuu()
        }}
      >
        <Label className="text-[0.66rem] font-bold tracking-[0.06em] text-faint">
          SỐ THỬA / TỜ BẢN ĐỒ hoặc TÊN CHỦ SỬ DỤNG
        </Label>
        <Input placeholder="VD: 125/32 hoặc Nguyễn Văn Hòa" />
      </TextField>

      <div className="mb-2 mt-3 text-[0.7rem] text-faint">GỢI Ý</div>
      {D.parcels.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            state.close()
            dinhVi(p.id)
          }}
          className="flex w-full items-center gap-3 border-b border-line-2 py-2.5 text-left last:border-0 hover:bg-row-hover"
        >
          <div className="min-w-0 flex-1">
            <b className="text-[0.78rem] text-ink">Thửa {p.id}</b>
            <small className="block text-[0.7rem] text-faint">
              {p.cs} · {p.dt} · {p.md}
            </small>
          </div>
          <StatusChip trangThai={['Định vị', 'blue']} />
        </button>
      ))}
    </ModalKhung>
  )
}
