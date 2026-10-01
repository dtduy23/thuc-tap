import { P8, hist } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { DonutPhanRa } from '@/dieu-hanh/components/charts/DonutPhanRa'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { GaugeMucTieu, LuoiGauge } from '@/dieu-hanh/components/charts/GaugeMucTieu'
import { ThanhNgang } from '@/dieu-hanh/components/charts/ThanhNgang'
import { LuoiVong, VongTienDo } from '@/dieu-hanh/components/charts/VongTienDo'
import { GhiChuCanhBao } from '@/dieu-hanh/components/ui/GhiChuCanhBao'
import {
  BangKv,
  ChuChanThe,
  LuoiDashboard,
  TheDashboard,
  TieuDeMuc,
} from '@/dieu-hanh/components/ui/LuoiDashboard'

/** Y tế – Giáo dục — port từ #p-ytgd + RENDER.ytgd của Dashboard_GDOS_XaPhuong_3.html. */
export default function YTeGiaoDuc() {
  return (
    <KhungDashboardXp trang="ytgd">
      {(d) => {
        const xh = d.YT_XU_HUONG
        return (
          <LuoiDashboard>
            {d.TILE_YTGD.map((t) => (
              <TheChiSoXu key={t.code} t={t} />
            ))}

            <TieuDeMuc>Y tế</TieuDeMuc>
            <TheDashboard
              nhip={8}
              tieuDe="Lượt khám chữa bệnh theo tháng"
              moPhong
              phu="10 tháng gần nhất · T8/2026 là số liệu thực tế (YTGD-02)"
            >
              <DuongXuHuong
                labels={P8}
                series={[{ name: xh.name, color: xh.color, data: hist(xh.code, xh.value, xh.sim) }]}
                unit=" lượt"
                zero={false}
              />
            </TheDashboard>
            <TheDashboard nhip={4} tieuDe="Tỷ lệ chính" phu="DC-09, YTGD-03">
              <LuoiGauge>
                {d.YT_GAUGE.map((g) => (
                  <GaugeMucTieu
                    key={g.label}
                    value={g.v}
                    label={g.label}
                    sub={g.sub}
                    invalid={g.invalid}
                    dec={g.dec}
                  />
                ))}
              </LuoiGauge>
            </TheDashboard>
            <TheDashboard nhip={6} tieuDe="Nhóm dân số ưu tiên chăm sóc" phu="DC-04, DC-05 trên tổng dân số">
              <DonutPhanRa parts={d.YT_NHOM_UU_TIEN} center="30,8%" centerSub="nhóm ưu tiên" size={150} />
            </TheDashboard>
            <TheDashboard
              nhip={6}
              tieuDe="Tải khám chữa bệnh"
              phu="Chỉ số dẫn xuất từ YTGD-01, YTGD-02 và dân số"
            >
              <BangKv ds={d.YT_TAI_KHAM} />
            </TheDashboard>

            <TieuDeMuc>Giáo dục</TieuDeMuc>
            <TheDashboard nhip={4} tieuDe="Trường đạt chuẩn quốc gia" phu="YTGD-06">
              <LuoiVong>
                <VongTienDo {...d.GD_VONG} size={130} />
              </LuoiVong>
            </TheDashboard>
            <TheDashboard
              nhip={8}
              tieuDe="Quy mô giáo dục"
              phu="So sánh học sinh với dân số trẻ em 0–14 tuổi"
            >
              <ThanhNgang rows={d.GD_QUY_MO} />
              <ChuChanThe>
                Số học sinh bằng 57,2% số trẻ 0–14 tuổi. Phần còn lại có thể là trẻ dưới tuổi đi học hoặc học
                tại trường ngoài địa bàn (xã chỉ có 3 trường).
              </ChuChanThe>
            </TheDashboard>

            <TheDashboard nhip={12} tieuDe="Lưu ý chất lượng dữ liệu" phu={' '}>
              <GhiChuCanhBao ds={d.GHI_CHU_YT} />
            </TheDashboard>
          </LuoiDashboard>
        )
      }}
    </KhungDashboardXp>
  )
}
