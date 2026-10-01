import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { ThanhNgang } from '@/dieu-hanh/components/charts/ThanhNgang'
import { LuoiVong, VongTienDo } from '@/dieu-hanh/components/charts/VongTienDo'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'
import { ChuChanThe, LOP_BANG, LuoiDashboard, TheDashboard } from '@/dieu-hanh/components/ui/LuoiDashboard'

/** Hạ tầng – Đô thị — port từ #p-ht + RENDER.ht của Dashboard_GDOS_XaPhuong_3.html. */
export default function HaTangDoThi() {
  return (
    <KhungDashboardXp trang="ht">
      {(d) => (
        <LuoiDashboard>
          {d.TILE_HT.map((t) => (
            <TheChiSoXu key={t.code} t={t} />
          ))}

          <TheDashboard nhip={7} tieuDe="Mức độ hoàn thiện hạ tầng thiết yếu" phu="HT-02 → HT-05 · T8/2026">
            <LuoiVong>
              {d.HT_VONG.map(([l, c, v, col]) => (
                <VongTienDo key={c} v={v} label={l} sub={c} color={col} size={120} dec={v % 1 ? 1 : 0} />
              ))}
            </LuoiVong>
          </TheDashboard>

          <TheDashboard nhip={5} tieuDe="Ưu tiên đầu tư gợi ý" phu="Khoảng trống tới 100% (điểm %)">
            <ThanhNgang rows={d.HT_KHOANG_TRONG} max={50} />
          </TheDashboard>

          <TheDashboard
            nhip={12}
            tieuDe="Hiện trạng dữ liệu bản đồ số (GIS)"
            phu="GIS-01 → GIS-05 · đầu mối: Phòng Kinh tế · đánh giá chung: Trung bình – có nhưng rời rạc, thủ công"
          >
            <div className="overflow-x-auto">
              <table className={LOP_BANG}>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Nội dung</th>
                    <th>Hiện trạng</th>
                    <th>Chất lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {d.GIS.map(([c, n, s, v]) => (
                    <tr key={c}>
                      <td className="text-faint">{c}</td>
                      <td>{n}</td>
                      <td>
                        {s === 'na' ? (
                          v
                        ) : (
                          <NhanDanhGia loai={s} coIcon>
                            {v}
                          </NhanDanhGia>
                        )}
                      </td>
                      <td className="text-body">Trung bình</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ChuChanThe>
              Mâu thuẫn: GIS-01/03 khai báo có dữ liệu GIS nhưng GIS-04 cho biết định dạng hiện có là PDF –
              cần chuyển sang Shapefile/GeoJSON để tích hợp bản đồ số điều hành.
            </ChuChanThe>
          </TheDashboard>
        </LuoiDashboard>
      )}
    </KhungDashboardXp>
  )
}
