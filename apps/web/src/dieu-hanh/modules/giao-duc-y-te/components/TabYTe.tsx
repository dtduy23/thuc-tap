import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { HBar } from '@/dieu-hanh/components/charts/HBar'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import { toast } from '@/dieu-hanh/store/toast'
import {
  CA_SXH,
  DAN_SO,
  DICH_BENH,
  DRILL_SXH,
  LUOT_KHAM,
  mauCot,
  mauTiem,
  nhanDich,
  THE_Y_TE,
  TIEM_CHUNG,
  TONG_DAN_SO,
  TONG_LUOT_KHAM,
  TRAM_Y_TE,
  TUAN,
} from '../du-lieu'

/** Tab 1 — "Y tế". */
export function TabYTe({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  const cotTiem: MucChart[] = TIEM_CHUNG.map(([ten, v]) => [ten, v, mauTiem(v)])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THE_Y_TE.map((t) => (
          <KpiCard
            key={t.nhan}
            nhan={t.nhan}
            giaTri={t.giaTri}
            phu={t.phu}
            mauSo={t.mau}
            onClick={() => moDrill(t.drill)}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard
          tieuDe="Ca SXH 4 tuần"
          phu={<StatusChip trangThai={['Vượt ngưỡng', 'red']} />}
          onClick={() => moDrill(DRILL_SXH)}
        >
          <Line vals={CA_SXH} labels={TUAN} h={176} color="#D93843" />
        </SectionCard>

        <SectionCard tieuDe="Lượt khám tháng theo nhóm tuổi">
          <div className="flex items-center gap-3.5">
            <Donut items={LUOT_KHAM} size={142} thick={24} center={TONG_LUOT_KHAM} />
            <div className="flex-1">
              <DonutLegend items={LUOT_KHAM} />
            </div>
          </div>
        </SectionCard>

        <SectionCard tieuDe="HSSK điện tử">
          <div className="grid place-items-center">
            <Gauge val={92} sub="50.610 / 55.010 dân" color="#0E9488" />
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <SectionCard tieuDe="Giám sát dịch bệnh · 4 tuần">
            {DICH_BENH.map((d) => (
              <button
                key={d.ten}
                type="button"
                onClick={() => toast(`${d.ten}: ${d.khuyenCao}`)}
                className="mb-4 flex w-full items-center gap-3.5 text-left last:mb-0"
              >
                <div className="min-w-0 flex-1">
                  <b className="text-[0.8rem] text-ink">{d.ten}</b>
                  <div className="text-[0.7rem] text-chu-phu">{d.tinhTrang}</div>
                </div>
                {/* Cột mini: bản gốc cao v * 2.4 px, độ mờ tăng dần theo tuần */}
                <div className="flex h-[52px] flex-none items-end gap-[5px]">
                  {d.ca.map((v, i) => (
                    <div
                      key={i}
                      className="w-[22px] rounded"
                      style={{ height: v * 2.4, background: mauCot(d.mau), opacity: 0.45 + i * 0.18 }}
                      title={`Tuần ${i + 1}: ${v} ca`}
                    />
                  ))}
                </div>
                <StatusChip trangThai={[nhanDich(d.mau), d.mau]} />
              </button>
            ))}
          </SectionCard>

          <SectionCard tieuDe="Trạm y tế & KCB ban đầu" khongDem>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  {['Trạm', 'Lượt khám/th', 'HSSK', 'Trạng thái'].map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-[0.62rem] font-bold tracking-[0.1em] text-faint first:rounded-l-lg last:rounded-r-lg"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRAM_Y_TE.map(([ten, nhanLuc, khams, hssk]) => (
                  <tr
                    key={ten}
                    onClick={() =>
                      toast(`${ten}: nhân lực, danh mục kỹ thuật, lịch trực, kết nối HIS (demo)`)
                    }
                    tabIndex={0}
                    role="button"
                    aria-label={`Xem chi tiết ${ten}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toast(`${ten}: nhân lực, danh mục kỹ thuật, lịch trực, kết nối HIS (demo)`)
                      }
                    }}
                    className="cursor-pointer border-b border-line-2 last:border-0 hover:bg-row-hover"
                  >
                    <td className="px-3.5 py-3 text-[0.8rem]">
                      <b className="text-ink">{ten}</b>
                      <small className="block text-[0.7rem] text-faint">{nhanLuc}</small>
                    </td>
                    <td className="tnum px-3.5 py-3 text-[0.8rem]">{khams}</td>
                    <td className="tnum px-3.5 py-3 text-[0.8rem]">{hssk}</td>
                    <td className="px-3.5 py-3">
                      <StatusChip trangThai={['Trực tuyến', 'green']} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mx-1 mb-0.5 mt-2.5 text-[0.72rem] text-ok-tx">
              ✓ Kết nối HIS trạm y tế · Hồ sơ sức khỏe · BHXH
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4">
          <SectionCard tieuDe="Tiêm chủng mở rộng · Q1/2026 · bấm để xem">
            <HBar items={cotTiem} max={100} labW={136} />
            <div className="h-2.5" />
            <NutPhu
              onPress={() => toast('Danh sách 126 trẻ chưa tiêm đủ — đã gửi trạm y tế mời qua Zalo')}
              className="w-full justify-center"
            >
              Nhắc lịch tiêm 38 trẻ còn thiếu
            </NutPhu>
          </SectionCard>

          <SectionCard tieuDe="Dân số & an sinh xã hội">
            <div className="flex items-center gap-3.5">
              <Donut items={DAN_SO} size={136} thick={23} center={TONG_DAN_SO} />
              <div className="flex-1">
                <DonutLegend items={DAN_SO} />
                <div className="mt-1.5 border-t border-line-2 pt-1.5 text-[0.72rem] text-chu-phu">
                  Hộ nghèo / cận nghèo: <b className="tnum text-ink">62 / 148</b>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[0.7rem] text-faint">Gắn CSDL Dân cư qua NDXP — cập nhật hằng đêm</div>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
