import { HIST, P9 } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { CotDoc } from '@/dieu-hanh/components/charts/CotDoc'
import { DonutPhanRa } from '@/dieu-hanh/components/charts/DonutPhanRa'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { GhiChuCanhBao } from '@/dieu-hanh/components/ui/GhiChuCanhBao'
import { BangKv, ChuChanThe, LuoiDashboard, TheDashboard } from '@/dieu-hanh/components/ui/LuoiDashboard'
import { VongDongTam } from './components/VongDongTam'

/** TTHC – Một cửa — port từ #p-tthc + RENDER.tthc của Dashboard_GDOS_XaPhuong_3.html. */
export default function TthcMotCua() {
  return (
    <KhungDashboardXp trang="tthc">
      {(d) => (
        <LuoiDashboard>
          {d.TILE_TTHC.map((t) => (
            <TheChiSoXu key={t.code} t={t} />
          ))}

          <TheDashboard
            nhip={8}
            tieuDe="Hồ sơ tiếp nhận & giải quyết theo kỳ"
            moPhong
            phu="10 kỳ gần nhất · kỳ T9/2026 là số liệu thực tế"
          >
            <DuongXuHuong
              labels={P9}
              series={[
                { name: 'Tiếp nhận', color: 'var(--bd-1)', data: HIST['TTHC-01']! },
                { name: 'Đã giải quyết', color: 'var(--bd-3)', data: HIST['TTHC-02']! },
              ]}
              unit=" hồ sơ"
              zero={false}
            />
          </TheDashboard>

          <TheDashboard
            nhip={4}
            tieuDe="Tình trạng xử lý hồ sơ"
            phu="Phân rã 10.045 hồ sơ tiếp nhận · T9/2026"
          >
            <DonutPhanRa parts={d.TTHC_DONUT} center="10.045" centerSub="hồ sơ" size={160} />
          </TheDashboard>

          <TheDashboard
            nhip={7}
            tieuDe="Chỉ số chất lượng phục vụ"
            phu="Biểu đồ vòng đồng tâm · vạch đen = mục tiêu KPI"
          >
            <VongDongTam items={d.TTHC_RADIAL} />
          </TheDashboard>

          <TheDashboard nhip={5} tieuDe="Hệ thống Một cửa điện tử" phu="TTHC-15, TTHC-16">
            <BangKv ds={d.TTHC_MOT_CUA} className="mb-[14px]" />
            <GhiChuCanhBao ds={d.GHI_CHU_TTHC} />
          </TheDashboard>

          <TheDashboard nhip={12} tieuDe="Hồ sơ tiếp nhận theo lĩnh vực" phu="TTHC-09 → TTHC-14 · T9/2026">
            <CotDoc
              rows={d.TTHC_LINH_VUC.map((r) => ({
                ...r,
                tip: `${soCoDinh(r.value)} hồ sơ · ${soCoDinh((r.value / d.TTHC_TONG_TIEP_NHAN) * 100, 1)}% tổng`,
              }))}
              height={230}
            />
            <ChuChanThe>
              * Giá trị tính toán = tổng tiếp nhận − 5 lĩnh vực đã liệt kê (TTHC-14 để trống) – cần bổ sung
              chi tiết.
            </ChuChanThe>
          </TheDashboard>
        </LuoiDashboard>
      )}
    </KhungDashboardXp>
  )
}
