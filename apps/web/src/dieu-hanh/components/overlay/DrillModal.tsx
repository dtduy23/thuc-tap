import { useOverlayState, type UseOverlayStateReturn } from '@heroui/react'
import { useNavigate } from '@tanstack/react-router'
import { soVN } from '@/dieu-hanh/lib/format'
import { MODULES } from '@/dieu-hanh/app/modules'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { ProgressMetric } from '@/dieu-hanh/components/metrics/ProgressMetric'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { ModalKhung } from './ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'

/** MODNAME của bản gốc: khóa view → tên phân hệ hiển thị trong modal. */
const MODNAME: Record<string, string> = {
  tthc: 'Hồ sơ TTHC',
  phananh: 'Phản ánh kiến nghị',
  nhiemvu: 'Nhiệm vụ',
  gdyt: 'Giáo dục & Y tế',
  nongnghiep: 'Nông nghiệp số',
  datdai: 'Quản lý đất đai',
  ditich: 'Di tích & Địa chỉ đỏ',
  apthongminh: 'Khu phố thông minh',
  chiso: 'Bộ chỉ số điều hành',
}

export interface ChiTieuDrill {
  ten: string
  val: number
  sub: string
  pct: number
  /** Khóa view nguồn trong bản gốc. */
  mod: string
  /** Đơn vị phụ trách. */
  dv: string
}

/** Port từ spark() — 6 kỳ gần nhất suy ra từ giá trị hiện tại. */
function diemDienBien(v: number): number[] {
  const buoc = v / 14
  return [v - buoc * 5, v - buoc * 4.2, v - buoc * 3.1, v - buoc * 2.4, v - buoc * 1.1, v].map((x) =>
    Number(x.toFixed(1)),
  )
}

interface Props {
  chiTieu: ChiTieuDrill | null
  state: UseOverlayStateReturn
}

/** Port từ drillCt() — modal chi tiết một chỉ tiêu điều hành. */
export function DrillModal({ chiTieu, state }: Props) {
  const navigate = useNavigate()
  if (!chiTieu) return null

  const { ten, val, sub, pct, mod, dv } = chiTieu
  const mau = pct >= 95 ? 'var(--ok)' : pct >= 80 ? 'var(--brand)' : 'var(--warn)'
  const tenMod = MODNAME[mod] ?? mod
  const dich = MODULES.find((m) => m.gocKey === mod)

  return (
    <ModalKhung
      state={state}
      tieuDe={ten}
      phu={`Chỉ tiêu điều hành · nguồn: ${tenMod} · phụ trách: ${dv}`}
      nhanDong="Đóng chi tiết chỉ tiêu"
      chanTrang={
        <>
          {dich && (
            <NutChinh
              onPress={() => {
                state.close()
                void navigate({ to: '/$chucNang', params: { chucNang: dich.chucNang } })
              }}
            >
              {`Mở phân hệ nguồn: ${tenMod} →`}
            </NutChinh>
          )}
          <NutPhu onPress={() => state.close()}>Giao nhiệm vụ cải thiện</NutPhu>
        </>
      }
    >
      <div className="grid gap-[22px] sm:grid-cols-[220px_1fr]">
        <div className="text-center">
          <div className="tnum text-[2.6rem] font-extrabold leading-none" style={{ color: mau }}>
            {soVN(val)}
          </div>
          <div className="mt-1 text-[0.74rem] text-chu-phu">{sub}</div>
          <ProgressMetric pct={Math.min(pct, 100)} mau={mau} className="mt-3" />
          <div className="mt-2">
            {pct >= 95 ? (
              <StatusChip trangThai={['✓ Đạt / vượt', 'green']} />
            ) : pct >= 80 ? (
              <StatusChip trangThai={['Bám sát kế hoạch', 'blue']} />
            ) : (
              <StatusChip trangThai={['⚠ Chậm tiến độ', 'yel']} />
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.68rem] font-bold tracking-[0.08em] text-faint">
            DIỄN BIẾN 6 KỲ GẦN NHẤT
          </div>
          <Line
            vals={diemDienBien(typeof val === 'number' ? val : pct)}
            labels={['K1', 'K2', 'K3', 'K4', 'K5', 'K6']}
            h={132}
            color={mau}
          />
          <div className="mt-1.5 text-[0.72rem] text-chu-phu">
            Số liệu tổng hợp tự động từ phân hệ nguồn — đồng bộ realtime về Data Lake, đẩy IOC Tỉnh/TP hằng
            ngày.
          </div>
        </div>
      </div>
    </ModalKhung>
  )
}

/** Tiện ích dùng chung: quản lý chỉ tiêu đang mở + state của modal. */
export function useDrill() {
  const state = useOverlayState()
  return state
}
