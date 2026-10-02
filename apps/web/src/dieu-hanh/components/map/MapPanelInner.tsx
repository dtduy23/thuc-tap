import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon, latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DiTich } from '@/dieu-hanh/mocks/types'
import { NEN_BAN_DO } from './lop-nen'

/** Tâm bản đồ của bản gốc. */
const CTR: [number, number] = [11.336, 106.128]

/** Ghim hình giọt nước xoay 45° — port từ .dt-pin. */
const ghim = (mau: string) =>
  divIcon({
    className: '',
    html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${mau};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(10,37,64,.4);position:relative"><i style="position:absolute;inset:5px;border-radius:50%;background:#fff;display:block"></i></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 20],
  })

interface Props {
  diTich: ReadonlyArray<DiTich>
  chieuCao: number
  /** Bấm ghim → chọn di tích (màn Di tích); bỏ trống thì ghim chỉ hiện popup. */
  chon?: (i: number) => void
  /** Mức zoom ban đầu — bản gốc màn Di tích dùng 15, màn Tổng quan 12. */
  zoom?: number
}

export default function MapPanelInner({ diTich, chieuCao, chon, zoom = 12 }: Props) {
  const bounds = latLngBounds(diTich.map((d) => d.ll as [number, number])).pad(0.12)

  return (
    <div className="mapwrap" style={{ height: chieuCao }}>
      <MapContainer
        center={CTR}
        zoom={zoom}
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: NEN_BAN_DO }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {diTich.map((d, i) => (
          <Marker
            key={d.ten}
            position={d.ll as [number, number]}
            icon={ghim(d.c)}
            eventHandlers={chon ? { click: () => chon(i) } : undefined}
          >
            <Popup>
              <b>{d.ten}</b>
              <br />
              {d.sub}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
