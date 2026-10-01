import { HIST, P9 } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { LuoiVong, VongTienDo } from '@/dieu-hanh/components/charts/VongTienDo'
import {
  LOP_BANG,
  LienKetTrang,
  LuoiDashboard,
  TheDashboard,
  TieuDeMuc,
} from '@/dieu-hanh/components/ui/LuoiDashboard'
import { RadarKpi } from './components/RadarKpi'
import { TheLinhVuc } from './components/TheLinhVuc'

/** Dashboard tổng quan — port từ #p-overview + RENDER.overview của Dashboard_GDOS_XaPhuong_3.html. */
export default function DashboardTongQuan() {
  return (
    <KhungDashboardXp trang="overview">
      {(d) => (
        <LuoiDashboard>
          {d.TILE_OVERVIEW.map((t) => (
            <TheChiSoXu key={t.code} t={t} />
          ))}

          <TheDashboard
            nhip={7}
            tieuDe="Bộ chỉ số điều hành (KPI)"
            phu="Biểu đồ radar: hiện trạng so với mục tiêu cấp trên giao · thang 50–100%"
            hanhDong={<LienKetTrang module={d.TRANG.kpi.module}>Xem chi tiết →</LienKetTrang>}
          >
            <RadarKpi kpis={d.KPIS} />
          </TheDashboard>

          <TheDashboard
            nhip={5}
            tieuDe="Mức độ đầy đủ dữ liệu theo lĩnh vực"
            phu="Tỷ lệ chỉ tiêu đã có số liệu / tổng chỉ tiêu trong phiếu"
          >
            <LuoiVong baCot>
              {d.COMP.map(([l, h, t]) => {
                const p = (h / t) * 100
                return (
                  <VongTienDo
                    key={l}
                    v={p}
                    label={l}
                    sub={`${h}/${t} chỉ tiêu`}
                    size={88}
                    color={p >= 100 ? 'var(--bd-1)' : p >= 50 ? 'var(--bd-4)' : 'var(--bd-2)'}
                  />
                )
              })}
            </LuoiVong>
          </TheDashboard>

          <TheDashboard
            nhip={12}
            tieuDe="Xu hướng hoạt động phục vụ người dân"
            moPhong
            phu="Hồ sơ TTHC tiếp nhận và đã giải quyết – 10 kỳ gần nhất"
          >
            <DuongXuHuong
              labels={P9}
              series={[
                { name: 'Tiếp nhận', color: 'var(--bd-1)', data: HIST['TTHC-01']! },
                { name: 'Đã giải quyết', color: 'var(--bd-3)', data: HIST['TTHC-02']! },
              ]}
              unit=" hồ sơ"
              height={230}
              zero={false}
            />
          </TheDashboard>

          <TieuDeMuc>Tóm tắt theo lĩnh vực</TieuDeMuc>
          {d.DOM.map((l) => (
            <TheLinhVuc key={l.id} d={l} trang={d.TRANG} />
          ))}

          <TheDashboard
            nhip={12}
            tieuDe="Đầu mối cung cấp số liệu"
            phu="Theo phòng ban, mô hình chính quyền 2 cấp"
          >
            <div className="overflow-x-auto">
              <table className={LOP_BANG}>
                <thead>
                  <tr>
                    {d.COT_DAU_MOI.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.CONTACTS.map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td key={i}>{c || <span className="text-faint">Chưa có</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TheDashboard>
        </LuoiDashboard>
      )}
    </KhungDashboardXp>
  )
}
