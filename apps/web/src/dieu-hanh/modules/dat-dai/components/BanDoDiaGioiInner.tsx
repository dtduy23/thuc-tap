import { useEffect } from 'react'
import {
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { divIcon, latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LOP_NEN, NEN_BAN_DO } from '@/dieu-hanh/components/map/lop-nen'
import { GIAP_RANH, TEN_DON_VI, NHAN_KHU_PHO, RANH_CU, RANH_TN, VI_TRI_MOC } from '../ranh-gioi'

const icMoc = (i: number) =>
  divIcon({
    className: '',
    html: `<div class="moc-ic">▲<span>M${i + 1}</span></div>`,
    iconSize: [34, 22],
    iconAnchor: [10, 14],
  })

const icKhuPho = (ten: string) =>
  divIcon({ className: '', html: `<div class="kv-lb">${ten}</div>`, iconSize: [80, 20] })

const icPhuong = divIcon({
  className: '',
  html: `<div style="font-size:12.5px;font-weight:800;color:#0A2540;background:rgba(255,255,255,.92);border-radius:8px;padding:3px 10px;box-shadow:0 2px 8px rgba(10,37,64,.25);white-space:nowrap">${TEN_DON_VI}</div>`,
  iconSize: [110, 22],
  iconAnchor: [55, 0],
})

const icGiapRanh = (ten: string) =>
  divIcon({
    className: '',
    html: `<div style="font-size:11px;font-style:italic;color:#6B7A8C;font-weight:600;text-shadow:0 1px 2px #fff">${ten}</div>`,
    iconSize: [130, 16],
  })

const icNui = divIcon({
  className: '',
  html: '<div style="font-size:12px;font-weight:800;color:#4A5A3A;text-shadow:0 1px 2px #fff">⛰ NÚI BÀ ĐEN (986m)</div>',
  iconSize: [150, 18],
})

/** Bản gốc fitBounds(RANH_TN).pad(0.22) khi mở tab lần đầu. */
function KhopRanh() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(latLngBounds(RANH_TN).pad(0.22))
  }, [map])
  return null
}

/** Đưa bản đồ về mốc đang xem — port focusMoc(). */
function BayVeMoc({ moc }: { moc: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (moc === null) return
    map.setView(VI_TRI_MOC[moc]!, 17)
  }, [map, moc])
  return null
}

interface Props {
  chieuCao: number
  hienRanhCu: boolean
  mocDangXem: number | null
}

export default function BanDoDiaGioiInner({ chieuCao, hienRanhCu, mocDangXem }: Props) {
  return (
    <div className="mapwrap" style={{ height: chieuCao }}>
      <MapContainer
        center={[11.345, 106.145]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: NEN_BAN_DO }}
      >
        <LayersControl position="topright" collapsed={false}>
          <LayersControl.BaseLayer checked name="Đường phố (OSM)">
            <TileLayer url={LOP_NEN.osm.url} attribution={LOP_NEN.osm.attribution} maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Vệ tinh (Esri)">
            <TileLayer url={LOP_NEN.sat.url} attribution={LOP_NEN.sat.attribution} maxZoom={19} />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Polygon
          positions={RANH_TN}
          pathOptions={{ color: '#E5484D', weight: 3, fillColor: '#F03E3E', fillOpacity: 0.2 }}
        />

        {hienRanhCu &&
          RANH_CU.map((duong, i) => (
            <Polyline
              key={i}
              positions={duong}
              pathOptions={{ color: '#7C3AED', weight: 2.5, dashArray: '8 6' }}
            />
          ))}

        <Marker position={[11.345, 106.145]} />
        <Marker position={[11.3415, 106.145]} interactive={false} icon={icPhuong} />

        {GIAP_RANH.map((g) => (
          <Marker key={g.ten} position={g.ll} interactive={false} icon={icGiapRanh(g.ten)} />
        ))}
        <Marker position={[11.3745, 106.169]} interactive={false} icon={icNui} />

        {NHAN_KHU_PHO.map((k) => (
          <Marker key={k.ten} position={k.ll} interactive={false} icon={icKhuPho(k.ten)} />
        ))}

        {VI_TRI_MOC.map((p, i) => (
          <Marker key={i} position={p} icon={icMoc(i)}>
            <Popup>
              <b>Mốc địa giới M{i + 1}</b>
              <br />
              Tọa độ VN-2000 đã số hóa
              <br />
              Biên bản cắm mốc + 4 ảnh hiện trạng
            </Popup>
          </Marker>
        ))}

        <KhopRanh />
        <BayVeMoc moc={mocDangXem} />
      </MapContainer>

      {/* .map-chip — nhãn đơn vị hành chính góc dưới trái */}
      <div className="map-chip">
        <span className="mc-org">{TEN_DON_VI}</span>
        <span className="mc-w">Tỉnh Tây Ninh</span>
      </div>
    </div>
  )
}
