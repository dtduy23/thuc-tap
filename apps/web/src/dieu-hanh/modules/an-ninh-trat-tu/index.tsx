import { P8, hist } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { DonutPhanRa } from '@/dieu-hanh/components/charts/DonutPhanRa'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { LuoiVong, VongTienDo } from '@/dieu-hanh/components/charts/VongTienDo'
import { BangKv, ChuChanThe, LuoiDashboard, TheDashboard } from '@/dieu-hanh/components/ui/LuoiDashboard'

/** An ninh – Trật tự — port từ #p-antt + RENDER.antt của Dashboard_GDOS_XaPhuong_3.html. */
export default function AnNinhTratTu() {
  return (
    <KhungDashboardXp trang="antt">
      {(d) => {
        const xh = d.ANTT_XU_HUONG
        return (
          <LuoiDashboard>
            {d.TILE_ANTT.map((t) => (
              <TheChiSoXu key={t.code} t={t} />
            ))}

            <TheDashboard
              nhip={8}
              tieuDe="Vi phạm TTĐT / ATGT đã xử lý theo kỳ"
              moPhong
              phu="10 kỳ gần nhất · kỳ T8/2026 là số liệu thực tế"
            >
              <DuongXuHuong
                labels={P8}
                series={[{ name: xh.name, color: xh.color, data: hist(xh.code, xh.value, xh.sim) }]}
                unit=" vụ"
                zero={false}
              />
            </TheDashboard>

            <TheDashboard nhip={4} tieuDe="Cơ cấu vụ việc được xử lý" phu="ANTT-02, ANTT-05 · T8/2026">
              <DonutPhanRa parts={d.ANTT_DONUT} center="237" centerSub="vụ đã xử lý" size={150} />
            </TheDashboard>

            <TheDashboard nhip={4} tieuDe="Tỷ lệ xử lý vụ việc ANTT" phu="ANTT-02 / ANTT-01">
              <LuoiVong>
                <VongTienDo {...d.ANTT_VONG} size={130} />
              </LuoiVong>
            </TheDashboard>

            <TheDashboard
              nhip={4}
              tieuDe="Mật độ nguồn lực an ninh"
              phu="Chỉ số dẫn xuất trên dân số 28.514 người"
            >
              <BangKv ds={d.ANTT_MAT_DO} />
            </TheDashboard>

            <TheDashboard nhip={4} tieuDe="Nguồn số liệu" phu="ANTT-07">
              <BangKv ds={d.ANTT_NGUON} />
              <ChuChanThe>Kỳ số liệu ANTT-07 ghi "T8/2027" – nhiều khả năng nhập nhầm.</ChuChanThe>
            </TheDashboard>
          </LuoiDashboard>
        )
      }}
    </KhungDashboardXp>
  )
}
