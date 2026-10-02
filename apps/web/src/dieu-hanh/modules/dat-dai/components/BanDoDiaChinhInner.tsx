import { useMemo } from 'react'
import { MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { divIcon, type LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LOP_NEN, NEN_BAN_DO } from '@/dieu-hanh/components/map/lop-nen'
import { doCanh, doDienTich, sinhToBanDo, type Diem } from '../dia-chinh'

/** Kiểu nét thửa của bản gốc: đất ở xanh mờ, cây lâu năm xanh lá. */
const NET = {
  ont: { color: '#2A5CFF', weight: 1.6, fillColor: '#7FA6FF', fillOpacity: 0.08 },
  cln: { color: '#2A5CFF', weight: 1.4, fillColor: '#3E9C55', fillOpacity: 0.1 },
} as const

/** Nét thửa đang chọn. */
const NET_CHON = { color: '#C2183B', weight: 2.6, fillColor: '#3D7BFF', fillOpacity: 0.5 }

const nhanCanh = (chu: string) =>
  divIcon({
    className: '',
    html: `<div class="edge-lb">${chu}</div>`,
    iconSize: [46, 16],
    iconAnchor: [23, 8],
  })

const nhanVungIcon = (chu: string, co: number, mau: string, xoay: number) =>
  divIcon({
    className: '',
    html: `<div class="qz-lb" style="font-size:${co}px;color:${mau};transform:rotate(${xoay}deg)">${chu}</div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })

interface Props {
  chieuCao: number
  /** Chỉ số thửa đang chọn trong danh sách sinh ra. */
  thuaChon: number
  chonThua: (i: number) => void
  hienQh: boolean
  /** Độ mờ lớp quy hoạch, 0–80 như thanh trượt bản gốc. */
  moQh: number
  anhVeTinh: boolean
  moThongTinQh: () => void
}

/** Đưa bản đồ về thửa đang chọn — bản gốc gọi setView khi bấm dòng hồ sơ. */
function BayVeThua({ pts, khoa }: { pts: Diem[]; khoa: number }) {
  const map = useMap()
  useMemo(() => {
    const la = pts.map((p) => p[0])
    const ln = pts.map((p) => p[1])
    const tam: [number, number] = [
      (Math.min(...la) + Math.max(...la)) / 2,
      (Math.min(...ln) + Math.max(...ln)) / 2,
    ]
    // Bản gốc: setView(center, 18) sau 80ms — ở đây chạy ngay vì không phải chờ invalidateSize
    map.setView(tam, 18)
    return khoa
  }, [khoa, map, pts])
  return null
}

export default function BanDoDiaChinhInner({
  chieuCao,
  thuaChon,
  chonThua,
  hienQh,
  moQh,
  anhVeTinh,
  moThongTinQh,
}: Props) {
  // Hình học sinh một lần, y như bản gốc dựng lớp khi khởi tạo bản đồ
  const to = useMemo(() => sinhToBanDo(), [])
  const thua = to.thua[thuaChon] ?? to.thua[0]!

  const canh = useMemo(() => {
    const pts = thua.pts
    return pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length]!
      const giua: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      return { giua, dai: doCanh(a, b).toFixed(2) }
    })
  }, [thua])

  const gioiHan = to.gioiHan as unknown as LatLngBoundsExpression

  return (
    <div className="mapwrap" style={{ height: chieuCao }}>
      <MapContainer
        center={[11.3353, 106.127]}
        zoom={18}
        bounds={gioiHan}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: NEN_BAN_DO }}
      >
        <TileLayer
          key={anhVeTinh ? 'sat' : 'osm'}
          url={anhVeTinh ? LOP_NEN.sat.url : LOP_NEN.osm.url}
          attribution={anhVeTinh ? LOP_NEN.sat.attribution : LOP_NEN.osm.attribution}
          maxZoom={19}
        />

        {/* Vùng quy hoạch sử dụng đất — fillOpacity = f * 0.35 như bản gốc */}
        {to.vungQh.map((v, i) => (
          <Polygon
            key={i}
            positions={v.pts}
            pathOptions={{ stroke: false, fillColor: v.mau, fillOpacity: v.f * 0.35 }}
            interactive={false}
          />
        ))}

        {to.nhanVung.map((n) => (
          <Marker
            key={n.chu + n.co}
            position={n.ll}
            interactive={false}
            icon={nhanVungIcon(n.chu, n.co, n.mau, n.xoay)}
          />
        ))}

        {/* Khung tờ bản đồ số 32 */}
        <Polygon positions={to.khung} pathOptions={{ color: '#B34700', weight: 3.5, fill: false }}>
          <Tooltip permanent direction="top" className="ptip">
            Tờ bản đồ số 32 — Khu phố 1, phường Mẫu
          </Tooltip>
        </Polygon>

        {hienQh && (
          <Polygon
            positions={to.lopQh}
            pathOptions={{
              color: '#7C3AED',
              weight: 2,
              dashArray: '6 5',
              fillColor: '#7C3AED',
              fillOpacity: moQh / 100,
            }}
            eventHandlers={{ click: moThongTinQh }}
          >
            <Tooltip direction="center" className="ptip qh">
              QH đường giao thông dự kiến — lộ giới 20m
            </Tooltip>
          </Polygon>
        )}

        {to.thua.map((t, i) => (
          <Polygon
            key={t.cid}
            positions={t.pts}
            pathOptions={i === thuaChon ? NET_CHON : NET[t.loai]}
            eventHandlers={{ click: () => chonThua(i) }}
          >
            <Tooltip direction="center" className="ptip" permanent={t.nhanCoDinh}>
              {t.cid + (t.loai === 'cln' ? ' · cây ăn quả' : '')}
            </Tooltip>
          </Polygon>
        ))}

        {/* Số đo cạnh thửa đang chọn */}
        {canh.map((c, i) => (
          <Marker key={i} position={c.giua} interactive={false} icon={nhanCanh(c.dai)} />
        ))}

        <BayVeThua pts={thua.pts} khoa={thuaChon} />
      </MapContainer>
    </div>
  )
}

/** Diện tích thửa đang chọn — dùng cho bảng thông tin bên phải. */
export { doDienTich }
