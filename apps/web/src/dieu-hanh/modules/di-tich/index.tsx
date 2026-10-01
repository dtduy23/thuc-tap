import { useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { MapPanel } from '@/dieu-hanh/components/map/MapPanel'
import { Lightbox } from '@/dieu-hanh/components/overlay/Lightbox'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import { BangDiTich } from './components/BangDiTich'
import { HoSoDiTich } from './components/HoSoDiTich'
import { Pano360 } from './components/Pano360'
import { VideoDiTich } from './components/VideoDiTich'
import { CHU_GIAI_GHIM, DRILL_SO_HOA, QUET_THEO_DIEM, THE_DI_TICH, THEO_XEP_HANG, TONG_DIEM } from './du-lieu'

/** Màn Di tích & Địa chỉ đỏ — port từ `V.ditich`. */
export default function DiTich() {
  const drill = useDrill()
  const [chiTieu, datChiTieu] = useState<ChiTieuDrill | null>(null)
  // Bản gốc initView('ditich') gọi selDt(1) — mở sẵn hồ sơ di tích thứ hai
  const [chon, datChon] = useState(1)

  const tour = useOverlayState()
  const video = useOverlayState()

  // Lightbox: mảng rỗng = đang đóng, khớp API của component dùng chung
  const [anh, datAnh] = useState<string[]>([])
  const [viTriAnh, datViTriAnh] = useState(0)

  const moDrill = (ct: ChiTieuDrill) => {
    datChiTieu(ct)
    drill.open()
  }

  const moAnh = (ds: string[], i: number) => {
    datAnh(ds)
    datViTriAnh(i)
  }

  const p = D.dt[chon]!

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Di tích & Địa chỉ đỏ"
        tieuDe="Di tích & Địa chỉ đỏ"
        moTa="Bấm ghim trên bản đồ thật hoặc dòng trong danh mục để mở hồ sơ — QR thuyết minh, tour ảo 360°"
        gocKey="ditich"
        mau="#7C3AED"
        hanhDong={
          <div className="flex flex-wrap gap-2">
            <NutPhu onPress={() => toast('Chế độ ĐÁNH DẤU: bấm vào vị trí di tích trên bản đồ')}>
              ＋ Đánh dấu di tích
            </NutPhu>
            <NutChinh
              onPress={() =>
                toast('AI đã soạn dự thảo tờ trình chống thấm Tháp cổ Bình Thạnh — chuyển Văn phòng rà soát')
              }
            >
              ✦ AI soạn tờ trình tu bổ
            </NutChinh>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {THE_DI_TICH.map((t) => (
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

      <div className="my-4 grid gap-4 lg:grid-cols-3">
        <SectionCard tieuDe="8 điểm theo xếp hạng">
          <div className="flex items-center gap-3.5">
            <Donut items={THEO_XEP_HANG} size={142} thick={24} center={TONG_DIEM} />
            <div className="flex-1">
              <DonutLegend items={THEO_XEP_HANG} />
            </div>
          </div>
        </SectionCard>

        <SectionCard tieuDe="Lượt quét QR thuyết minh theo điểm · 30 ngày">
          <Bar items={QUET_THEO_DIEM} h={176} />
        </SectionCard>

        <SectionCard tieuDe="Tỷ lệ số hóa" onClick={() => moDrill(DRILL_SO_HOA)}>
          <div className="grid place-items-center">
            <Gauge val={75} sub="6/8 điểm gắn QR · 2 tour 360°" color="#7C3AED" />
          </div>
        </SectionCard>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <SectionCard>
            <MapPanel diTich={D.dt} chieuCao={400} chon={datChon} zoom={15} />
            <div className="mt-2.5 flex flex-wrap gap-3.5 text-[0.72rem] text-body">
              {CHU_GIAI_GHIM.map((c) => (
                <span key={c.nhan} className="flex items-center gap-1.5">
                  <i
                    className="inline-block size-3 rounded-full"
                    style={{ background: c.mau }}
                    aria-hidden="true"
                  />
                  {c.nhan}
                </span>
              ))}
              <span className="text-faint">Nền OpenStreetMap — bấm ghim để mở hồ sơ</span>
            </div>
          </SectionCard>

          <SectionCard tieuDe="Danh mục di tích · bấm để mở hồ sơ" khongDem>
            <BangDiTich dangChon={chon} chon={datChon} />
          </SectionCard>
        </div>

        <HoSoDiTich diTich={p} moAnh={moAnh} moTour={() => tour.open()} moVideo={() => video.open()} />
      </div>

      <Pano360 state={tour} diTich={p} />
      <VideoDiTich state={video} diTich={p} />
      <Lightbox anh={anh} viTri={viTriAnh} doiViTri={datViTriAnh} dong={() => datAnh([])} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
