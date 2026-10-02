import { KhungDashboardXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { CotDoc } from '@/dieu-hanh/components/charts/CotDoc'
import { DonutPhanRa } from '@/dieu-hanh/components/charts/DonutPhanRa'
import { ThanhNgang } from '@/dieu-hanh/components/charts/ThanhNgang'
import { GhiChuCanhBao } from '@/dieu-hanh/components/ui/GhiChuCanhBao'
import { ICON_XP } from '@/dieu-hanh/components/ui/NhanDanhGia'
import {
  BangKv,
  ChuChanThe,
  LuoiDashboard,
  TheDashboard,
  TieuDeMuc,
} from '@/dieu-hanh/components/ui/LuoiDashboard'
import { BieuDoWaffle } from './components/BieuDoWaffle'

/** Kinh tế – Dân cư – Xã hội — port từ #p-ktxh + RENDER.ktxh của Dashboard_GDOS_XaPhuong_3.html. */
export default function KinhTeDanCuXaHoi() {
  return (
    <KhungDashboardXp trang="ktxh">
      {(d) => (
        <LuoiDashboard>
          {d.TILE_KTXH.map((t) => (
            <TheChiSoXu key={t.code} t={t} />
          ))}

          <TieuDeMuc>Dân cư – xã hội</TieuDeMuc>
          <TheDashboard nhip={4} tieuDe="Cơ cấu giới tính" phu="DC-02 · 111,8 nam / 100 nữ">
            <DonutPhanRa parts={d.KTXH_GIOI_TINH} center="28.514" centerSub="người" size={150} />
          </TheDashboard>
          <TheDashboard
            nhip={8}
            tieuDe="Cơ cấu nhóm tuổi"
            phu="Biểu đồ waffle · mỗi ô = 1% dân số (DC-03, DC-04, DC-05)"
          >
            <BieuDoWaffle parts={d.KTXH_NHOM_TUOI} total={d.DAN_SO} />
            <ChuChanThe>
              * 28.514 − (4.770 + 11.195 + 4.022) = 8.527 người chưa được phân nhóm trong phiếu.
            </ChuChanThe>
          </TheDashboard>
          <TheDashboard
            nhip={6}
            tieuDe="An sinh xã hội – hộ nghèo, cận nghèo"
            phu="DC-07, DC-08 · tỷ lệ trên 677 hộ"
          >
            <ThanhNgang rows={d.KTXH_NGHEO} max={100} pct />
            <ChuChanThe>
              Tỷ lệ cận nghèo (17%) cao gấp 16 lần hộ nghèo – nhóm có nguy cơ tái nghèo cần chính sách hỗ trợ
              sinh kế.
            </ChuChanThe>
          </TheDashboard>
          <TheDashboard nhip={6} tieuDe="Lao động, việc làm & số hóa dân cư" phu="DC-03, DC-10, DC-11, DC-12">
            <BangKv ds={d.KTXH_LAO_DONG} />
          </TheDashboard>

          <TieuDeMuc>Kinh tế – doanh nghiệp – nông nghiệp</TieuDeMuc>
          <TheDashboard
            nhip={5}
            tieuDe="Chủ thể kinh tế đang hoạt động"
            phu="Biểu đồ cột · KT-05, KT-07, KT-08"
          >
            <CotDoc rows={d.KTXH_CHU_THE} height={170} />
          </TheDashboard>
          {d.TILE_KTXH_2.map((t) => (
            <TheChiSoXu key={t.code} t={t} />
          ))}
          <TheDashboard nhip={4} tieuDe="Sản phẩm chủ lực" phu="KT-11">
            <div className="flex flex-wrap gap-2">
              {d.KTXH_SAN_PHAM.map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-bd-nen-nhan px-3 py-2 text-[13px] font-medium text-ink"
                >
                  {s}
                </span>
              ))}
            </div>
            <BangKv className="mt-[14px]" ds={d.KTXH_MA_VUNG} />
          </TheDashboard>

          <TheDashboard
            nhip={12}
            tieuDe="Ngân sách & thanh toán"
            phu="KT-01 → KT-04, KT-12 · đầu mối: Phòng Kinh tế"
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
              {d.KTXH_NGAN_SACH.map(([c, l, u]) => (
                <div
                  key={c}
                  className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-bd-truc p-[14px] text-[13px] text-faint [&_svg]:size-[18px] [&_svg]:flex-none"
                >
                  {ICON_XP.na}
                  <div>
                    <b className="text-body">{l}</b>{' '}
                    <span>
                      ({c}, {u})
                    </span>
                    <br />
                    Chưa có số liệu
                  </div>
                </div>
              ))}
            </div>
          </TheDashboard>

          <TheDashboard
            nhip={12}
            tieuDe="Lưu ý chất lượng dữ liệu"
            phu="Các điểm bất thường phát hiện khi đối chiếu"
          >
            <GhiChuCanhBao ds={d.GHI_CHU_KTXH} />
          </TheDashboard>
        </LuoiDashboard>
      )}
    </KhungDashboardXp>
  )
}
