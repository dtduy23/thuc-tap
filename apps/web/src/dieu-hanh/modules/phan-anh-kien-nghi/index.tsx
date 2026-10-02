import { HIST, P9 } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { CotDoc } from '@/dieu-hanh/components/charts/CotDoc'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { GaugeMucTieu, LuoiGauge } from '@/dieu-hanh/components/charts/GaugeMucTieu'
import { GhiChuCanhBao } from '@/dieu-hanh/components/ui/GhiChuCanhBao'
import { ChuChanThe, LuoiDashboard, TheDashboard } from '@/dieu-hanh/components/ui/LuoiDashboard'

/** Phản ánh – Kiến nghị — port từ #p-pakn + RENDER.pakn của Dashboard_GDOS_XaPhuong_3.html. */
export default function PhanAnhKienNghi() {
  return (
    <KhungDashboardXp trang="pakn">
      {(d) => {
        const g = d.PAKN_GAUGE
        return (
          <LuoiDashboard>
            {d.TILE_PAKN.map((t) => (
              <TheChiSoXu key={t.code} t={t} />
            ))}

            <TheDashboard nhip={4} tieuDe="Phản hồi trong vòng 3 ngày" phu="PAKN-05 · KPI-03 mục tiêu ≥ 90%">
              <LuoiGauge>
                <GaugeMucTieu value={g.v} label={g.label} target={g.target} sub={g.sub} dec={g.dec} />
              </LuoiGauge>
            </TheDashboard>

            <TheDashboard
              nhip={8}
              tieuDe="Tình trạng xử lý PAKN"
              phu="Biểu đồ cột · PAKN-01 → PAKN-04 · T9/2026"
            >
              <CotDoc
                rows={d.PAKN_COT}
                height={170}
                suffix=" lượt"
                max={Math.max(...d.PAKN_COT.map((r) => r.value))}
              />
              <GhiChuCanhBao ds={d.GHI_CHU_PAKN} className="mt-[14px]" />
            </TheDashboard>

            <TheDashboard
              nhip={12}
              tieuDe="Phản ánh, kiến nghị theo kỳ"
              moPhong
              phu="Tiếp nhận và đã xử lý – 10 kỳ gần nhất · T9/2026 là số liệu thực tế"
            >
              <DuongXuHuong
                labels={P9}
                series={[
                  { name: 'Tiếp nhận', color: 'var(--bd-7)', data: HIST['PAKN-01']! },
                  { name: 'Đã xử lý', color: 'var(--bd-3)', data: HIST['PAKN-02']! },
                ]}
                unit=" lượt"
                height={220}
              />
            </TheDashboard>

            <TheDashboard nhip={12} tieuDe="Quy trình & nguồn dữ liệu" phu="Thông tin khai báo trong phiếu">
              <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                {d.PAKN_QUY_TRINH.map(([k, v]) => (
                  <div key={k}>
                    <span className="block text-[12.5px] text-body">{k}</span>
                    <span className="block font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <ChuChanThe>
                Dữ liệu đang quản lý bằng sổ sách giấy – đề xuất chuyển sang hệ thống tiếp nhận PAKN số để
                theo dõi theo lĩnh vực, kênh tiếp nhận và thời hạn xử lý.
              </ChuChanThe>
            </TheDashboard>
          </LuoiDashboard>
        )
      }}
    </KhungDashboardXp>
  )
}
