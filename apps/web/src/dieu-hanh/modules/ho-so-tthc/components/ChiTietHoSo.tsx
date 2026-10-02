import type { UseOverlayStateReturn } from '@heroui/react'
import type { HoSoTthc } from '@/dieu-hanh/mocks/types'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import { Timeline } from '@/dieu-hanh/components/ui/Timeline'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'

interface Props {
  hoSo: HoSoTthc | null
  state: UseOverlayStateReturn
  pheDuyet: (id: string) => void
}

/** Port từ openHoso() — modal chi tiết hồ sơ, hai cột: thông tin + timeline. */
export function ChiTietHoSo({ hoSo, state, pheDuyet }: Props) {
  if (!hoSo) return null
  const h = hoSo

  const tomTatAi =
    h.nhom === 'Đất đai'
      ? 'Xin đăng ký biến động QSDĐ thửa 87, tờ BĐ 12, 92m², Tổ 8. Lý do: chuyển quyền từ bố mẹ cho con. Thiếu: bản sao chứng thực hợp đồng tặng cho.'
      : 'Hồ sơ đủ điều kiện theo quy trình một cửa. AI đã đối chiếu tự động với CSDL Dân cư — thông tin khớp.'

  return (
    <ModalKhung
      state={state}
      tieuDe={h.loai}
      phu={`${h.id} · ${h.nhom} · CV ${h.cv}`}
      nhan={<StatusChip trangThai={h.st} />}
      nhanDong="Đóng chi tiết hồ sơ"
    >
      <div className="grid gap-[22px] md:grid-cols-2">
        <div>
          {[
            ['Công dân', h.cd],
            ['CCCD', h.cccd],
            ['Tiếp nhận', `${h.nhan} · Cổng DVC tỉnh/TP`],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-3 border-b border-line-2 py-[9px] text-[0.78rem]"
            >
              <span className="text-faint">{k}</span>
              <b className="text-right text-ink">{v}</b>
            </div>
          ))}
          <div className="flex justify-between gap-3 py-[9px] text-[0.78rem]">
            <span className="text-faint">Hạn xử lý</span>
            <b className={`text-right ${h.st[1] === 'red' ? 'text-canh-bao' : 'text-ink'}`}>{h.han}</b>
          </div>

          <div className="mt-3.5">
            <AiBox>
              <b>✦ AI tóm tắt hồ sơ:</b> {tomTatAi}
            </AiBox>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <NutChinh onPress={() => pheDuyet(h.id)}>✓ Phê duyệt</NutChinh>
            <NutPhu onPress={() => state.close()}>Yêu cầu bổ sung</NutPhu>
          </div>
        </div>

        <div>
          <b className="text-[0.84rem] text-ink">Timeline xử lý</b>
          <div className="mt-3.5">
            <Timeline
              moc={[
                { tieuDe: 'Tiếp nhận hồ sơ', phu: `${h.nhan} 09:14 · Cổng DVC tỉnh/TP`, xong: true },
                { tieuDe: 'Chuyển chuyên viên', phu: `${h.nhan} 10:02 · CV ${h.cv}`, xong: true },
                { tieuDe: 'Thẩm định & xử lý', phu: 'AI hỗ trợ đối chiếu CSDL', xong: h.st[1] === 'green' },
                {
                  tieuDe: 'Trả kết quả',
                  phu: `hạn ${h.han}${h.st[1] === 'red' ? ' · ĐÃ QUÁ HẠN' : ''}`,
                  canh: h.st[1] === 'red',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </ModalKhung>
  )
}
