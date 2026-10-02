import { useMemo, useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { Tabs } from '@/dieu-hanh/components/ui/Tabs'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import { doDienTich, sinhToBanDo } from './dia-chinh'
import { ModalLichSu } from './components/ModalLichSu'
import { ModalQuyHoach } from './components/ModalQuyHoach'
import { ModalTraCuu } from './components/ModalTraCuu'
import { TabDiaChinh } from './components/TabDiaChinh'
import { TabDiaGioi } from './components/TabDiaGioi'

/** Màn Quản lý đất đai — port từ `V.datdai`. */
export default function DatDai() {
  const [tab, datTab] = useState(0)
  const drill = useDrill()
  const [chiTieu, datChiTieu] = useState<ChiTieuDrill | null>(null)

  // Lớp bản đồ — giá trị mặc định đúng bản gốc: QH bật, vệ tinh bật, độ mờ 35%
  const [hienQh, datHienQh] = useState(true)
  const [anhVeTinh, datAnhVeTinh] = useState(true)
  const [moQh, datMoQh] = useState(35)
  const [hienRanhCu, datHienRanhCu] = useState(true)
  const [mocDangXem, datMocDangXem] = useState<number | null>(null)

  const to = useMemo(() => sinhToBanDo(), [])
  const [thuaChon, datThuaChon] = useState(to.chonDau)

  const traCuu = useOverlayState()
  const lichSu = useOverlayState()
  const quyHoach = useOverlayState()

  const thuaBanDo = to.thua[thuaChon] ?? to.thua[0]!
  // Bản gốc: poly._pIdx = num % 4 → mỗi thửa trên bản đồ trỏ về một bản ghi trong D.parcels
  const thua = D.parcels[thuaBanDo.pIdx]!

  /** Diện tích đo từ hình học, thay '.' bằng ',' như bản gốc. */
  const dienTich = doDienTich(thuaBanDo.pts).toFixed(1).replace('.', ',')

  const moDrill = (ct: ChiTieuDrill) => {
    datChiTieu(ct)
    drill.open()
  }

  /** Port selParcelById() — chuyển về tab bản đồ rồi định vị thửa. */
  const dinhVi = (id: string) => {
    const i = D.parcels.findIndex((p) => p.id === id)
    if (i < 0) {
      toast(`Không tìm thấy thửa ${id} — thử: 125/32, 126/32, 98/31, 141/32`)
      return
    }
    const j = to.thua.findIndex((t) => t.pIdx === i)
    if (j < 0) {
      toast(`Đã mở thông tin thửa ${id}`)
      return
    }
    datTab(0)
    datThuaChon(j)
    toast(`Đã định vị thửa ${id} trên bản đồ`)
  }

  /** Port focusMoc() — chuyển sang tab địa giới rồi bay tới mốc. */
  const xemMoc = (i: number) => {
    datTab(1)
    datMocDangXem(i)
  }

  /**
   * Bản gốc mở ngăn Trợ lý AI rồi đọc nhận định vào khung chat (openAI + aiSay).
   * Ngăn AI thuộc đợt 5 chưa dựng, nên tạm bắn nội dung đúng nguyên văn qua toast —
   * đã ghi vào docs/PORT-PLAN.md để nối lại khi làm ai-tro-ly.
   */
  const hoiAi = () => {
    const phapLy = thua.gcn.includes('Đã cấp') ? 'hồ sơ pháp lý đầy đủ' : 'GCN đang thẩm định'
    const khuyenNghi = thua.md.startsWith('ODT')
      ? 'Nếu công dân xin tách thửa: diện tích tối thiểu sau tách theo quy định tỉnh là 60m² đất ở đô thị — thửa này đủ điều kiện. Cần: đo đạc hiện trạng + ý kiến Địa chính.'
      : thua.md.startsWith('LUC')
        ? 'Đất trồng lúa — chuyển mục đích phải phù hợp chỉ tiêu được tỉnh phân bổ và trình đúng thẩm quyền.'
        : 'Đất thương mại dịch vụ — lưu ý tiến độ đưa đất vào sử dụng theo cam kết đấu giá.'
    toast(`Thửa ${thua.id} (${thua.cs}): ${phapLy}, ${thua.qh.toLowerCase()}. ${khuyenNghi}`)
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Quản lý đất đai"
        tieuDe="Quản lý đất đai & Địa giới hành chính"
        moTa="GIS trên nền bản đồ thật (OpenStreetMap / vệ tinh) — click thửa, bật tắt lớp, tra cứu, kéo & zoom như Google Maps"
        gocKey="datdai"
        mau="#B7791F"
        hanhDong={
          <div className="flex flex-wrap gap-2">
            <NutPhu onPress={() => toast('Chế độ THÊM THỬA: bấm vào vị trí trên bản đồ để đặt thửa mới')}>
              ＋ Thêm thửa
            </NutPhu>
            <NutPhu onPress={() => traCuu.open()}>Tra cứu thửa đất</NutPhu>
            <NutChinh onPress={() => toast('Đã xuất sơ đồ PDF kèm chữ ký số (demo)')}>
              Xuất sơ đồ PDF
            </NutChinh>
          </div>
        }
      />

      <Tabs
        nhanDong="Chế độ xem bản đồ đất đai"
        dangMo={tab}
        doiTab={datTab}
        muc={[
          {
            nhan: 'Bản đồ địa chính',
            noiDung: (
              <TabDiaChinh
                moDrill={moDrill}
                thua={thua}
                cid={thuaBanDo.cid}
                dienTich={dienTich}
                thuaChon={thuaChon}
                chonThua={datThuaChon}
                dinhVi={dinhVi}
                hienQh={hienQh}
                datHienQh={datHienQh}
                anhVeTinh={anhVeTinh}
                datAnhVeTinh={datAnhVeTinh}
                moQh={moQh}
                datMoQh={datMoQh}
                hoiAi={hoiAi}
                moLichSu={() => lichSu.open()}
                moQuyHoach={() => quyHoach.open()}
              />
            ),
          },
          {
            nhan: 'Địa giới hành chính',
            noiDung: (
              <TabDiaGioi
                moDrill={moDrill}
                hienRanhCu={hienRanhCu}
                datHienRanhCu={datHienRanhCu}
                mocDangXem={mocDangXem}
                xemMoc={xemMoc}
              />
            ),
          },
        ]}
      />

      <ModalTraCuu state={traCuu} dinhVi={dinhVi} />
      <ModalLichSu state={lichSu} thua={thua} />
      <ModalQuyHoach state={quyHoach} thua={thua} hoiAi={hoiAi} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
