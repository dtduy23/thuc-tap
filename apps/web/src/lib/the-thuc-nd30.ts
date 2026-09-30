/**
 * Thể thức văn bản hành chính (Điều 8 Nghị định 30/2020/NĐ-CP) + lọc HTML. Dùng chung
 * cho Mẫu văn bản (xem trước mẫu) và Soạn thảo văn bản (xem trước bản ghép).
 *
 * Khung đầu / khung ký phải khớp `_build_header` / `_build_sign` của Document Service
 * bên FOXAI Native: server ghép đúng khung này lúc soạn văn bản thật, xem trước ở GDOS
 * mà dựng khác là người dùng thấy một đằng, in ra một nẻo.
 */
import { lamSachHtml as locHtml } from './html-sach'
import type { TheThucMau, TruongMau } from './native-vb'

/** Lọc HTML — DOMPurify (ADR-0005). Thân mẫu và văn bản đi qua Native rồi quay lại, Native không lọc. */
export { lamSachHtml as locHtml } from './html-sach'

export const thoatHtml = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/* ── Khung thể thức ────────────────────────────────────────────────────────── */

export interface TheThucDung {
  cqch: string
  cq: string
  so: string
  kyhieu: string
  dd: string
  cv: string
  ky: string
  noinhan: string
  /** Quốc hiệu căn giữa — đơn, tờ khai (không có cơ quan ban hành). */
  canGiua: boolean
}

export const THE_THUC_RONG: TheThucDung = {
  cqch: '',
  cq: '',
  so: '',
  kyhieu: '',
  dd: '',
  cv: '',
  ky: '',
  noinhan: '',
  canGiua: false,
}

const hai = (n: number) => String(n).padStart(2, '0')
const chuoiNgay = (d: Date) =>
  `ngày ${hai(d.getDate())} tháng ${hai(d.getMonth() + 1)} năm ${d.getFullYear()}`

/** Cơ quan và chức vụ viết hoa theo thể thức; còn lại chỉ cắt khoảng trắng. */
const chuanHoa = (t: TheThucDung): TheThucDung => ({
  ...t,
  cqch: t.cqch.trim().toUpperCase(),
  cq: t.cq.trim().toUpperCase(),
  cv: t.cv.trim().toUpperCase(),
  so: t.so.trim(),
  kyhieu: t.kyhieu.trim(),
  dd: t.dd.trim(),
  ky: t.ky.trim(),
  noinhan: t.noinhan.trim(),
})

const khoiTieuDe = (ten: string) =>
  `<div style="text-align:center;margin:18px 0 12px;">` +
  `<div style="font-weight:bold;font-size:1.06em;">${thoatHtml(
    ten.trim() === '' ? '(Tên mẫu văn bản)' : ten.toUpperCase(),
  )}</div>` +
  `<div style="width:90px;border-bottom:1px solid currentColor;margin:6px auto 0;"></div></div>`

const quocHieu = (rong: string) =>
  `<div style="font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>` +
  `<div style="font-weight:bold;">Độc lập - Tự do - Hạnh phúc</div>` +
  `<div style="width:${rong};border-bottom:1px solid currentColor;margin:3px auto 8px;"></div>`

/** Phần đầu: quốc hiệu, cơ quan, số/ký hiệu, địa danh — kèm khối tên loại. */
export function htmlPhanDau(ten: string, maKyHieu: string, tho: TheThucDung): string {
  const t = chuanHoa(tho)
  const ngay = t.dd ? `${thoatHtml(t.dd)}, ${chuoiNgay(new Date())}` : chuoiNgay(new Date())
  if (t.canGiua)
    return (
      `<div style="text-align:center;">${quocHieu('180px')}</div>` +
      `<div style="text-align:right;font-style:italic;margin-bottom:6px;">${ngay}</div>` +
      khoiTieuDe(ten)
    )
  const trai: string[] = []
  if (t.cqch) trai.push(`<div>${thoatHtml(t.cqch)}</div>`)
  if (t.cq) trai.push(`<div style="font-weight:bold;">${thoatHtml(t.cq)}</div>`)
  if (t.cqch || t.cq)
    trai.push(`<div style="width:70px;border-bottom:1px solid currentColor;margin:3px auto 8px;"></div>`)
  if (t.so) {
    const kh = t.kyhieu ? `-${t.kyhieu}` : ''
    trai.push(`<div>Số: ${thoatHtml(`${t.so}/${maKyHieu.trim() || '…'}${kh}`)}</div>`)
  }
  return (
    `<table style="border-collapse:collapse;width:100%;"><tr>` +
    `<td style="width:42%;text-align:center;vertical-align:top;padding:0;">${trai.join('')}</td>` +
    `<td style="text-align:center;vertical-align:top;padding:0;">${quocHieu('170px')}` +
    `<div style="font-style:italic;">${ngay}</div></td></tr></table>` +
    khoiTieuDe(ten)
  )
}

const khoiNoiNhan = (noinhan: string): string => {
  if (noinhan === '') return ''
  const dong = noinhan
    .split('\n')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `<div>- ${thoatHtml(d.replace(/^[-–•]\s*/, ''))}</div>`)
    .join('')
  return `<div style="font-weight:bold;font-style:italic;">Nơi nhận:</div>${dong}`
}

/** Phần ký: nơi nhận bên trái, chức vụ và họ tên người ký bên phải. */
export function htmlPhanKy(tho: TheThucDung): string {
  const t = chuanHoa(tho)
  if (t.canGiua)
    return (
      `<div style="text-align:right;margin-top:26px;">` +
      `<div style="font-weight:bold;">${thoatHtml(t.cv || 'NGƯỜI LÀM ĐƠN')}</div>` +
      `<div style="font-style:italic;margin-top:2px;">(Ký, ghi rõ họ tên)</div>` +
      `<div style="height:46px;"></div>` +
      (t.ky ? `<div style="font-weight:bold;">${thoatHtml(t.ky)}</div>` : '') +
      `</div>`
    )
  return (
    `<table style="width:100%;border-collapse:collapse;margin-top:26px;"><tr>` +
    `<td style="width:50%;vertical-align:top;">${khoiNoiNhan(t.noinhan)}</td>` +
    `<td style="text-align:center;vertical-align:top;">` +
    (t.cv ? `<div style="font-weight:bold;">${thoatHtml(t.cv)}</div>` : '') +
    (t.cv || t.ky ? `<div style="font-style:italic;margin-top:2px;">(Đã ký)</div>` : '') +
    `<div style="height:46px;"></div>` +
    (t.ky ? `<div style="font-weight:bold;">${thoatHtml(t.ky)}</div>` : '') +
    `</td></tr></table>`
  )
}

/** Có khai thể thức thì ghép khung quanh thân; không thì để trần. */
export function ghepKhung(than: string, tho: TheThucDung, tenMau: string, maKyHieu: string): string {
  const co = tho.cq.trim() !== '' || tho.cqch.trim() !== '' || tho.canGiua
  return co ? htmlPhanDau(tenMau, maKyHieu, tho) + than + htmlPhanKy(tho) : than
}

export const sangTheThucDung = (t: TheThucMau | null | undefined): TheThucDung => ({
  cqch: t?.cqch ?? '',
  cq: t?.cq ?? '',
  so: t?.so ?? '',
  kyhieu: t?.kyhieu ?? '',
  dd: t?.dd ?? '',
  cv: t?.cv ?? '',
  ky: t?.ky ?? '',
  noinhan: t?.noinhan ?? '',
  canGiua: t?.header_style === 'CENTERED',
})

export const sangTheThucMau = (t: TheThucDung): TheThucMau => ({
  cqch: t.cqch.trim() || null,
  cq: t.cq.trim() || null,
  so: t.so.trim() || null,
  kyhieu: t.kyhieu.trim() || null,
  dd: t.dd.trim() || null,
  cv: t.cv.trim() || null,
  ky: t.ky.trim() || null,
  noinhan: t.noinhan.trim() || null,
  header_style: t.canGiua ? 'CENTERED' : null,
})

export const coTheThuc = (t: TheThucDung): boolean =>
  t.canGiua || [t.cqch, t.cq, t.so, t.kyhieu, t.dd, t.cv, t.ky, t.noinhan].some((v) => v.trim() !== '')

/** Trường DATE: ISO của `<input type="date">` → dd/mm/yyyy — khớp `_display_values` bên Native. */
export function giaTriHienThi(giaTri: Readonly<Record<string, string>>, truong: readonly TruongMau[]) {
  const ngay = new Set(truong.filter((t) => t.type === 'DATE').map((t) => t.key))
  const ra: Record<string, string> = {}
  for (const [k, v] of Object.entries(giaTri)) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
    ra[k] = ngay.has(k) && m ? `${m[3]}/${m[2]}/${m[1]}` : v
  }
  return ra
}

/* ── Chip trường trong thân mẫu ───────────────────────────────────────────── */

/** Bắt `{{key}}`, cho phép khoảng trắng thừa: `{{ ho_ten }}` cũng tính. */
export const DAU_MOC = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

/** Nhãn tiếng Việt → mã trường snake_case không dấu ("Họ và tên" → "ho_va_ten"). */
export function chuanHoaKhoa(nhan: string): string {
  const goc = nhan
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (goc === '') return 'truong'
  // Native bắt `^[a-z][a-z0-9_]*$`.
  return /^[a-z]/.test(goc) ? goc : `f_${goc}`
}

export function khoaDuyNhat(nhan: string, daCo: readonly string[]): string {
  const goc = chuanHoaKhoa(nhan)
  if (!daCo.includes(goc)) return goc
  let i = 2
  while (daCo.includes(`${goc}_${i}`)) i += 1
  return `${goc}_${i}`
}

export const htmlChip = (t: Pick<TruongMau, 'key' | 'label'>): string =>
  `<span class="chip-truong" data-truong="${thoatHtml(t.key)}" contenteditable="false">${thoatHtml(t.label)}</span>`

/** `body_template` → HTML cho trình soạn thảo (mỗi `{{key}}` thành chip). */
export function mauSangHtml(than: string, truong: readonly TruongMau[]): string {
  const theoKhoa = new Map(truong.map((t) => [t.key, t]))
  return locHtml(than).replace(DAU_MOC, (nguyen, khoa: string) => {
    const t = theoKhoa.get(khoa)
    // Chỗ chèn mồ côi (trường đã xóa) giữ nguyên chữ để người dùng thấy mà sửa.
    return t ? htmlChip(t) : nguyen
  })
}

/** Các `{{key}}` còn trong thân nhưng không trường nào khai báo — Native trả 422. */
export function khoaMoCoi(than: string, truong: readonly TruongMau[]): string[] {
  const daKhai = new Set(truong.map((t) => t.key))
  return [...new Set([...than.matchAll(DAU_MOC)].map((m) => m[1]!))].filter((k) => !daKhai.has(k))
}

export const GOI_Y_THAN = 'Soạn nội dung mẫu tại đây. Bấm các trường thông tin phía trên để chèn vào văn bản.'

/** Thân mặc định: mỗi trường một dòng "Nhãn: [chip]" — có sẵn khung mà sửa. */
export function htmlThanMacDinh(truong: readonly TruongMau[]): string {
  const co = truong.filter((t) => t.label.trim() !== '')
  if (co.length === 0) return `<p data-ph="1" style="margin:6px 0;text-align:justify;">${GOI_Y_THAN}</p>`
  return co
    .map(
      (t) =>
        `<p style="margin:6px 0;text-align:justify;">${thoatHtml(t.label.trim())}: ${htmlChip(t)}&nbsp;</p>`,
    )
    .join('')
}

/** HTML trình soạn thảo → `body_template`. Chưa soạn gì thì trả chuỗi rỗng. */
export function thanSangMau(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${locHtml(html)}</body>`, 'text/html')
  for (const n of Array.from(doc.body.querySelectorAll('[data-ph]')))
    if ((n.textContent ?? '').replace(/\s+/g, ' ').trim() === GOI_Y_THAN) n.remove()
  for (const chip of Array.from(doc.body.querySelectorAll('[data-truong]')))
    chip.replaceWith(doc.createTextNode(`{{${chip.getAttribute('data-truong') ?? ''}}}`))
  return (doc.body.textContent ?? '').trim() === '' ? '' : doc.body.innerHTML.trim()
}

/** Mẫu cũ từng "nướng" khung thể thức vào thân — gỡ ra, không thì quốc hiệu hiện hai lần. */
export function goKhungCu(html: string): string {
  if (html === '') return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  for (const b of Array.from(doc.body.querySelectorAll('table')))
    if (/CỘNG HÒA XÃ HỘI|Nơi nhận|\(Đã ký\)/i.test(b.textContent ?? '')) b.remove()
  for (const d of Array.from(doc.body.querySelectorAll('div')))
    if ((d.getAttribute('style') ?? '').includes('margin:18px 0 12px')) d.remove()
  return doc.body.innerHTML.trim()
}

/** Xem trước một mẫu: `{{key}}` → `[Nhãn]`, rồi ghép khung — khớp `_preview_from_body` bên Native. */
export function xemTruocMau(
  than: string | null,
  truong: readonly TruongMau[],
  tho: TheThucDung,
  ten: string,
  kyHieu: string,
): string {
  const nhan = new Map(truong.map((t) => [t.key, t.label]))
  const noiDung = locHtml(goKhungCu(than ?? '')).replace(DAU_MOC, (_m, k: string) =>
    thoatHtml(`[${nhan.get(k) ?? k}]`),
  )
  return ghepKhung(noiDung, tho, ten, kyHieu)
}

/* ── Xuất .doc ─────────────────────────────────────────────────────────────── */

/** HTML → tệp .doc Word mở được (HTML có namespace Word; BOM để giữ tiếng Việt). */
export function xuatDoc(tenTep: string, tieuDe: string, than: string): void {
  const html =
    `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">` +
    `<title>${thoatHtml(tieuDe)}</title></head>` +
    `<body style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;">${than}</body></html>`
  const url = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${tenTep.slice(0, 80).replace(/[\\/:*?"<>|]/g, '')}.doc`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
