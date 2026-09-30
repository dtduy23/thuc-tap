/**
 * Báo cáo — phần CHUNG cho mọi nghiệp vụ (ADR-0007): kiểm tham số, phân nhóm nhiều
 * cấp, xuất Excel. Nghiệp vụ chỉ dựng KetQuaBaoCao; không nghiệp vụ nào tự viết Excel.
 */
import { BadRequestException } from '@nestjs/common'
import {
  homNay,
  laNgay,
  type BaoCaoDef,
  type CotBaoCao,
  type DongBaoCao,
  type GiaTriThamSo,
  type KetQuaBaoCao,
} from '@gdos/shared'
import ExcelJS from 'exceljs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function namHopLe(v: unknown, ten: string, macDinh: number): number {
  if (v === undefined || v === '') return macDinh
  const n = Number(v)
  if (!Number.isInteger(n) || n < 2000 || n > 2100)
    throw new BadRequestException(`"${ten}" phải là năm 2000–2100`)
  return n
}

/** Tham số từ query → giá trị đã kiểm, điền mặc định (năm nay, 5 năm, hôm nay). */
export function kiemThamSo(def: BaoCaoDef, q: Record<string, unknown>): GiaTriThamSo {
  const hn = homNay()
  const nam = namHopLe(q.nam, 'nam', Number(hn.slice(0, 4)))
  const tuNam = namHopLe(q.tuNam, 'tuNam', nam)
  const denNam = namHopLe(q.denNam, 'denNam', tuNam + 4)
  if (denNam < tuNam || denNam - tuNam > 20)
    throw new BadRequestException('Giai đoạn: "đến năm" không được trước "từ năm", tối đa 20 năm')
  const denNgay = q.denNgay === undefined || q.denNgay === '' ? hn : q.denNgay
  if (!laNgay(denNgay)) throw new BadRequestException('"denNgay" phải là ngày YYYY-MM-DD')
  const lv = q.linhVucId
  if (lv !== undefined && lv !== '' && (typeof lv !== 'string' || !UUID.test(lv)))
    throw new BadRequestException('"linhVucId" không hợp lệ')
  const truc = new Set((def.nhomTheo ?? []).map((n) => n.id))
  const nhom = typeof q.nhom === 'string' && q.nhom ? q.nhom.split(',') : []
  if (nhom.length > 3 || new Set(nhom).size !== nhom.length || nhom.some((n) => !truc.has(n)))
    throw new BadRequestException('"nhom": tối đa 3 trục khác nhau, trong danh sách của báo cáo')
  return { nam, tuNam, denNam, denNgay, linhVucId: typeof lv === 'string' && lv ? lv : null, nhom }
}

const laCong = (c: CotBaoCao) => c.kieu === 'so' && !c.khongCong

/** Ô của một dòng nhóm / dòng tổng: nhãn ở cột đầu, tổng ở cột số, còn lại trống. */
export function congNhom(
  nhan: string,
  dong: readonly DongBaoCao[],
  cot: readonly CotBaoCao[],
): (string | number | null)[] {
  const chiTiet = dong.filter((d) => d.cap === 0)
  return cot.map((c, i) =>
    i === 0 ? nhan : laCong(c) ? chiTiet.reduce((t, d) => t + (Number(d.o[i]) || 0), 0) : null,
  )
}

/**
 * Phân nhóm nhiều cấp: chèn dòng nhóm (cộng các cột số) trước các dòng chi tiết
 * của nó. Nhóm xếp theo tên tiếng Việt; dòng chi tiết giữ thứ tự đưa vào.
 */
export function phanNhom<T>(
  ds: readonly T[],
  khoa: readonly ((x: T) => string)[],
  dong: (x: T) => DongBaoCao,
  cot: readonly CotBaoCao[],
): DongBaoCao[] {
  const kq: DongBaoCao[] = []
  const di = (muc: readonly T[], cap: number) => {
    const k = khoa[cap]
    if (!k) {
      for (const x of muc) kq.push(dong(x))
      return
    }
    const g = new Map<string, T[]>()
    for (const x of muc) {
      const ten = k(x)
      g.set(ten, [...(g.get(ten) ?? []), x])
    }
    for (const ten of [...g.keys()].sort((a, b) => a.localeCompare(b, 'vi'))) {
      const vt = kq.length
      kq.push({ cap: cap + 1, o: [] })
      di(g.get(ten)!, cap + 1)
      kq[vt] = { cap: cap + 1, o: congNhom(ten, kq.slice(vt + 1), cot) }
    }
  }
  di(ds, 0)
  return kq
}

// ── Excel ───────────────────────────────────────────────────────────────────

const MAU = { navy: 'FF1A2E55', vang: 'FFC9A227', trang: 'FFFFFFFF', tong: 'FFC9D8EE', do: 'FFB23A48' }
const NEN_NHOM = ['FFE2EAF6', 'FFEAF0F8', 'FFF2F6FB'] as const
const NET: ExcelJS.Border = { style: 'thin', color: { argb: 'FFB9C4D6' } }
const VIEN: Partial<ExcelJS.Borders> = { top: NET, bottom: NET, left: NET, right: NET }
const to = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const FONT = 'Times New Roman'

/** Số cột (1-based) → chữ cột Excel: 1 → A, 27 → AA. */
export function chuCot(c: number): string {
  let s = ''
  for (let k = c; k > 0; k = Math.floor((k - 1) / 26)) s = String.fromCharCode(65 + ((k - 1) % 26)) + s
  return s
}

/**
 * KetQuaBaoCao → tệp .xlsx. Cột STT tự thêm. Dòng nhóm, dòng tổng dùng SUBTOTAL
 * (Excel không cộng trùng các SUBTOTAL lồng nhau) — sửa số trong Excel là tổng tự đổi.
 */
export async function vietExcel(kq: KetQuaBaoCao): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GDOS'
  wb.calcProperties.fullCalcOnLoad = true
  const coNhomCot = !!kq.nhomCot?.length
  const h1 = 4
  const hangDau = coNhomCot ? h1 + 1 : h1
  const ws = wb.addWorksheet('Báo cáo', { views: [{ state: 'frozen', ySplit: hangDau, xSplit: 2 }] })
  const n = kq.cot.length + 1
  ws.columns = [
    { width: 6 },
    ...kq.cot.map((c, i) => ({ width: c.rong ?? (i === 0 ? 46 : c.kieu === 'so' ? 14 : 18) })),
  ]

  const tieuDe = (hang: number, gt: string, font: Partial<ExcelJS.Font>) => {
    ws.mergeCells(hang, 1, hang, n)
    const o = ws.getCell(hang, 1)
    o.value = gt
    o.font = { name: FONT, ...font }
    o.fill = to(MAU.navy)
    o.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  }
  tieuDe(1, kq.tieuDe.toUpperCase(), { size: 13, bold: true, color: { argb: MAU.trang } })
  ws.getRow(1).height = 30
  tieuDe(2, kq.phuDe, { size: 10, italic: true, color: { argb: MAU.vang } })

  // Tiêu đề cột: một hoặc hai hàng.
  const oDau = (hang: number, cot: number, gt: string) => {
    const o = ws.getCell(hang, cot)
    o.value = gt
    o.font = { name: FONT, size: 10, bold: true, color: { argb: MAU.trang } }
    o.fill = to(MAU.navy)
    o.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    o.border = VIEN
  }
  const trongNhom = new Set<number>()
  for (const g of kq.nhomCot ?? []) {
    oDau(h1, g.tu + 2, g.nhan)
    if (g.so > 1) ws.mergeCells(h1, g.tu + 2, h1, g.tu + 1 + g.so)
    for (let k = 0; k < g.so; k++) {
      trongNhom.add(g.tu + k)
      oDau(h1 + 1, g.tu + 2 + k, kq.cot[g.tu + k]!.nhan)
    }
  }
  ;['STT', ...kq.cot.map((c) => c.nhan)].forEach((nhan, i) => {
    if (i > 0 && trongNhom.has(i - 1)) return
    oDau(h1, i + 1, nhan)
    if (coNhomCot) {
      oDau(h1 + 1, i + 1, '')
      ws.mergeCells(h1, i + 1, h1 + 1, i + 1)
    }
  })
  ws.getRow(h1).height = 32
  if (coNhomCot) ws.getRow(h1 + 1).height = 30

  const dauDL = hangDau + 1 + (kq.coTong ? 1 : 0)
  const cuoiDL = dauDL + kq.dong.length - 1
  const ghiO = (hang: number, i: number, c: CotBaoCao, v: string | number | null) => {
    const o = ws.getCell(hang, i + 2)
    if (v === null || v === '') o.value = null
    else if (c.kieu === 'ngay' && typeof v === 'string' && laNgay(v)) {
      o.value = new Date(`${v}T00:00:00Z`)
      o.numFmt = 'dd/mm/yyyy'
    } else o.value = v
    if (c.kieu === 'so') o.numFmt = '#,##0'
    if (c.kieu === 'phan-tram') o.numFmt = '0.0"%"'
    const laChu = !c.kieu || c.kieu === 'chu'
    o.alignment = { vertical: 'top', wrapText: laChu, horizontal: laChu ? 'left' : 'right' }
    o.border = VIEN
    o.font = { name: FONT, size: 10 }
    return o
  }
  const tongCot = (i: number, tu: number, den: number, kq0: number): ExcelJS.CellFormulaValue => ({
    formula: `SUBTOTAL(9,${chuCot(i + 2)}${tu}:${chuCot(i + 2)}${den})`,
    result: kq0,
    date1904: false,
  })

  // Dòng TỔNG SỐ.
  if (kq.coTong) {
    const hang = hangDau + 1
    const gt = congNhom(`TỔNG SỐ (${kq.dong.filter((d) => d.cap === 0).length})`, kq.dong, kq.cot)
    kq.cot.forEach((c, i) => {
      const o = ghiO(hang, i, c, gt[i] ?? null)
      if (laCong(c) && kq.dong.length) o.value = tongCot(i, dauDL, cuoiDL, Number(gt[i]) || 0)
    })
    for (let i = 1; i <= n; i++) {
      const o = ws.getCell(hang, i)
      o.fill = to(MAU.tong)
      o.font = { name: FONT, size: 10, bold: true }
      o.border = VIEN
    }
  }

  let stt = 0
  kq.dong.forEach((d, k) => {
    const hang = dauDL + k
    const oStt = ws.getCell(hang, 1)
    oStt.border = VIEN
    oStt.alignment = { horizontal: 'center', vertical: 'top' }
    if (d.cap === 0) {
      oStt.value = ++stt
      kq.cot.forEach((c, i) => ghiO(hang, i, c, d.o[i] ?? null))
      if (d.mau === 'danger')
        for (let i = 2; i <= n; i++)
          ws.getCell(hang, i).font = { name: FONT, size: 10, color: { argb: MAU.do } }
      return
    }
    // Dòng nhóm: SUBTOTAL tới trước dòng nhóm cùng cấp hoặc cấp trên kế tiếp.
    let het = k + 1
    while (het < kq.dong.length && !(kq.dong[het]!.cap > 0 && kq.dong[het]!.cap <= d.cap)) het++
    kq.cot.forEach((c, i) => {
      const o = ghiO(hang, i, c, d.o[i] ?? null)
      if (laCong(c) && het > k + 1) o.value = tongCot(i, hang + 1, dauDL + het - 1, Number(d.o[i]) || 0)
    })
    for (let i = 1; i <= n; i++) {
      const o = ws.getCell(hang, i)
      o.fill = to(NEN_NHOM[Math.min(d.cap - 1, 2)]!)
      o.font = { name: FONT, size: 10, bold: d.cap === 1, color: { argb: MAU.navy } }
    }
    ws.getCell(hang, 2).alignment = { indent: d.cap - 1, vertical: 'top', wrapText: true }
  })

  if (kq.ghiChu) {
    const hang = dauDL + kq.dong.length + 1
    ws.mergeCells(hang, 1, hang, n)
    const o = ws.getCell(hang, 1)
    o.value = kq.ghiChu
    o.font = { name: FONT, size: 10, italic: true }
    o.alignment = { wrapText: true }
  }
  return Buffer.from(await wb.xlsx.writeBuffer())
}

/** Header tải tệp Excel; tên tiếng Việt theo RFC 5987, bản không dấu dự phòng. */
export function headerTaiExcel(ten: string): Record<string, string> {
  const day = `${ten}.xlsx`
  const khongDau = day
    .normalize('NFD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/"/g, '')
  return {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${khongDau || 'bao-cao.xlsx'}"; filename*=UTF-8''${encodeURIComponent(day)}`,
    'X-Content-Type-Options': 'nosniff',
  }
}
