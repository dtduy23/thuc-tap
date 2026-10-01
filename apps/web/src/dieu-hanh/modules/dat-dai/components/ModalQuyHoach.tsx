import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import { toast } from '@/dieu-hanh/store/toast'
import type { ThuaDat } from '@/dieu-hanh/mocks/types'

interface Props {
  state: UseOverlayStateReturn
  thua: ThuaDat
  hoiAi: () => void
}

function Kv({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-2 py-[9px] text-[0.78rem] last:border-0">
      <span className="flex-none text-chu-phu">{nhan}</span>
      <b className="text-right text-ink">{giaTri}</b>
    </div>
  )
}

/** Port từ qhInfo() — modal thông tin quy hoạch. */
export function ModalQuyHoach({ state, thua, hoiAi }: Props) {
  // Bản gốc đối chiếu mục đích sử dụng: 'LUC' = đất lúa thì cảnh báo chỉ tiêu tỉnh
  const laDatLua = thua.md.indexOf('LUC') === 0

  return (
    <ModalKhung
      state={state}
      tieuDe="Thông tin quy hoạch — Tỉnh Tây Ninh"
      phu="Kỳ quy hoạch 2021–2030, tầm nhìn đến 2050"
      nhanDong="Đóng thông tin quy hoạch"
      chanTrang={
        <>
          <NutChinh
            onPress={() => {
              toast('Đã xuất Chứng chỉ quy hoạch (PDF) kèm sơ đồ vị trí thửa — demo')
              state.close()
            }}
          >
            Xuất chứng chỉ QH
          </NutChinh>
          <NutPhu
            onPress={() => {
              state.close()
              hoiAi()
            }}
          >
            ✦ Hỏi AI về thửa
          </NutPhu>
        </>
      }
    >
      <Kv
        nhan="Đồ án áp dụng"
        giaTri="QH chung phường Bình Minh + QH sử dụng đất TP Tây Ninh (chuyển tiếp)"
      />
      <Kv nhan="Căn cứ" giaTri="QĐ 1856/QĐ-UBND tỉnh Tây Ninh · bản đồ 1/2.000 khu vực phường Bình Minh" />
      <Kv nhan="Lớp trên bản đồ" giaTri="Đất ở · giao thông (vùng tím) · cây xanh · TM-DV · đất lúa" />
      <Kv nhan="Thửa đang chọn" giaTri={`${thua.id} — ${thua.qh}`} />
      <Kv nhan="Nguồn dữ liệu" giaTri="Đồng bộ CSDL quy hoạch tỉnh qua LGSP · 09/2026" />

      <AiBox>
        <span className="mt-3 block">
          ✦ AI đối chiếu:{' '}
          {laDatLua
            ? 'thửa thuộc vùng lúa ổn định — chuyển mục đích phải nằm trong chỉ tiêu tỉnh phân bổ.'
            : 'thửa nằm trong ranh đất ở hiện hữu, phù hợp cấp phép xây dựng nhà ở riêng lẻ.'}{' '}
          Vùng tím là QH đất giao thông dự kiến — công trình chạm ranh cần ý kiến cơ quan quản lý QH trước khi
          cấp phép.
        </span>
      </AiBox>
    </ModalKhung>
  )
}
