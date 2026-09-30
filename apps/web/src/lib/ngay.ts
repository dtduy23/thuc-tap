/**
 * Ngày giờ hiển thị theo kiểu Việt Nam: 30/09/2026 14:05. Luôn theo giờ Việt
 * Nam, không theo múi giờ của máy đang xem.
 */
const NGAY_GIO = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const NGAY = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function ghep(dinhDang: Intl.DateTimeFormat, iso: string, coGio: boolean): string {
  const p = Object.fromEntries(dinhDang.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  const ngay = `${p.day}/${p.month}/${p.year}`
  return coGio ? `${ngay} ${p.hour}:${p.minute}:${p.second}` : ngay
}

export const ngayGio = (iso: string) => ghep(NGAY_GIO, iso, true)
export const ngay = (iso: string) => ghep(NGAY, iso, false)

/** Ngày nghiệp vụ 'YYYY-MM-DD' → 30/09/2026. Không qua Date — không lệch múi giờ. */
export const ngayVn = (s: string | null | undefined): string =>
  s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—'
