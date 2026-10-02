import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import { anhMinhHoa, NEN_THUMB } from '@/dieu-hanh/lib/anh'
import { toast } from '@/dieu-hanh/store/toast'
import type { Truong } from '@/dieu-hanh/mocks/types'
import { CHUYEN_CAN_TRUONG } from '../du-lieu'

interface Props {
  state: UseOverlayStateReturn
  truong: Truong | null
  /** Chỉ số trong D.truong — bản gốc dùng làm khóa ảnh (lock = i + 11). */
  chiSo: number
}

function Kv({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-2 py-[9px] text-[0.78rem] last:border-0">
      <span className="flex-none text-chu-phu">{nhan}</span>
      <b className="text-right text-ink">{giaTri}</b>
    </div>
  )
}

/** Port từ openTruong() — modal chi tiết một trường. */
export function ChiTietTruong({ state, truong: t, chiSo }: Props) {
  if (!t) return null

  return (
    <ModalKhung
      state={state}
      tieuDe={t.ten}
      phu={`${t.to} · Cấp ${t.cap}`}
      nhan={
        <>
          <StatusChip trangThai={t.csvc} />
          <StatusChip trangThai={t.chuan} />
        </>
      }
      nhanDong="Đóng chi tiết trường"
    >
      <div className="grid gap-[22px] md:grid-cols-2">
        <div>
          <div className="mb-3 overflow-hidden rounded-[10px]">
            <div
              className="bg-cover bg-center"
              style={{
                aspectRatio: '16/8',
                backgroundImage: `url('${anhMinhHoa('school', chiSo + 11, 640, 320)}'), ${NEN_THUMB}`,
              }}
              role="img"
              aria-label={`Ảnh minh họa ${t.ten}`}
            />
          </div>
          <Kv nhan="Học sinh" giaTri={`${t.hs} em · ${t.lop} lớp`} />
          <Kv nhan="Sĩ số TB/lớp" giaTri={`${t.ss} ${t.ss > 36 ? '(vượt chuẩn 35)' : ''}`} />
          <Kv nhan="Giáo viên" giaTri={`${t.gv} người`} />
          <div className="mt-3">
            <AiBox>
              <b>✦ Ghi chú:</b> {t.note}
            </AiBox>
          </div>
        </div>

        <div>
          <b className="text-[0.84rem] text-ink">Chuyên cần 4 tuần</b>
          <div className="my-3.5 flex h-[90px] items-end gap-2">
            {CHUYEN_CAN_TRUONG.map((v, k) => (
              <div key={k} className="flex-1 text-center">
                {/* Bản gốc: chiều cao (v - 90) * 10 px, độ mờ tăng dần theo tuần */}
                <div
                  className="rounded-md bg-brand"
                  style={{ height: (v - 90) * 10, opacity: 0.5 + k * 0.15 }}
                />
                <small className="text-[0.64rem] text-faint">T{k + 1}</small>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <NutChinh onPress={() => toast('Đã yêu cầu trường báo cáo CSVC chi tiết kèm dự toán')}>
              Yêu cầu báo cáo
            </NutChinh>
            <NutPhu onPress={() => toast('Đã đưa vào danh mục đề xuất đầu tư 2026 trình Phòng GD')}>
              Đề xuất đầu tư
            </NutPhu>
          </div>
        </div>
      </div>
    </ModalKhung>
  )
}
