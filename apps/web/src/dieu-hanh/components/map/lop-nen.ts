/** Hai lớp nền bản đồ của bản gốc — baseLayers(). */
export const LOP_NEN = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery',
    maxZoom: 19,
  },
} as const

/** Nền hiện trước khi ô bản đồ tải xong — bản gốc để #DDE3EA. */
export const NEN_BAN_DO = '#DDE3EA'
