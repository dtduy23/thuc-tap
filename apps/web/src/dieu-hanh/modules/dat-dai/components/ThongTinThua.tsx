import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import type { ThuaDat } from '@/dieu-hanh/mocks/types'

interface Props {
  thua: ThuaDat
  /** Số hiệu thửa trên bản đồ — bản gốc: "<cid> / TBĐ 32". */
  cid: string
  /** Diện tích đo từ hình học, định dạng dấu phẩy như bản gốc. */
  dienTich: string
  hoiAi: () => void
  moLichSu: () => void
  moQuyHoach: () => void
}

/** Cặp nhãn — giá trị, port từ .kv của bản gốc. */
function Kv({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-2 py-[9px] text-[0.78rem] last:border-0">
      <span className="flex-none text-chu-phu">{nhan}</span>
      <b className="text-right text-ink">{giaTri}</b>
    </div>
  )
}

/** Panel "Thông tin thửa đất" bên phải bản đồ địa chính. */
export function ThongTinThua({ thua, cid, dienTich, hoiAi, moLichSu, moQuyHoach }: Props) {
  return (
    <SectionCard tieuDe="Thông tin thửa đất" phu={<StatusChip trangThai={[`${cid} / TBĐ 32`, 'blue']} />}>
      <div className="pt-0.5">
        <Kv nhan="Chủ sử dụng" giaTri={thua.cs} />
        <Kv nhan="Số CCCD/MST" giaTri={thua.cccd} />
        <Kv nhan="Diện tích" giaTri={`${dienTich} m²`} />
        <Kv nhan="Mục đích SD" giaTri={thua.md} />
        <Kv nhan="GCN" giaTri={thua.gcn} />
        <Kv nhan="Quy hoạch" giaTri={thua.qh} />
        <Kv nhan="Biến động" giaTri={thua.bd} />
      </div>

      <div className="mt-3 grid gap-2">
        <NutChinh onPress={hoiAi} className="w-full justify-center">
          ✦ Hỏi AI về thửa đất này
        </NutChinh>
        <NutPhu onPress={moLichSu} className="w-full justify-center">
          Xem lịch sử biến động
        </NutPhu>
        <NutPhu onPress={moQuyHoach} className="w-full justify-center">
          ⓘ Quy hoạch thửa này
        </NutPhu>
      </div>
    </SectionCard>
  )
}
