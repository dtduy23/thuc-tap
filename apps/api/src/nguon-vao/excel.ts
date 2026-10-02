/**
 * Tệp Excel nạp số liệu chỉ tiêu: mỗi hàng là (mã chỉ tiêu, kỳ, giá trị). Tệp mẫu liệt kê sẵn
 * cả bộ chỉ tiêu nạp được (trừ KPI — KPI tự tính), người nạp chỉ điền cột Giá trị.
 */
import { BadRequestException } from '@nestjs/common'
import { BO_CHI_TIEU, LINH_VUC_CHI_TIEU, SO_DONG_NAP_TOI_DA, kyHien, kyHienTai } from '@gdos/shared'
import ExcelJS from 'exceljs'

const TEN_SHEET = 'Số liệu'
const COT = ['Mã chỉ tiêu', 'Kỳ (MM/YYYY)', 'Giá trị', 'Tên chỉ tiêu', 'Đơn vị tính', 'Lĩnh vực'] as const
const RONG = [16, 16, 16, 60, 14, 28]

export async function taoTepMauSoLieu(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(TEN_SHEET)
  ws.addRow([...COT])
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  RONG.forEach((r, i) => (ws.getColumn(i + 1).width = r))
  // Cột Kỳ là CHỮ — để Excel không tự đổi "09/2026" thành ngày.
  ws.getColumn(2).numFmt = '@'
  const ky = kyHien(kyHienTai()).slice(1).padStart(7, '0')
  for (const c of BO_CHI_TIEU) {
    if (c.linhVuc === 'kpi') continue
    ws.addRow([c.ma, ky, null, c.ten, c.donVi, LINH_VUC_CHI_TIEU[c.linhVuc]])
  }
  const hd = wb.addWorksheet('Hướng dẫn')
  hd.getColumn(1).width = 110
  for (const d of [
    'Mỗi hàng là MỘT số: mã chỉ tiêu + kỳ + giá trị. Chỉ ba cột đầu được đọc; các cột sau để tham khảo.',
    'Kỳ là tháng, viết MM/YYYY (vd 09/2026). Muốn nạp nhiều kỳ thì chép thêm hàng và đổi kỳ.',
    'Hàng để trống Giá trị được bỏ qua — chỉ điền những chỉ tiêu có số.',
    'Chỉ tiêu tính bằng % điền số từ 0 đến 100 (vd 96,5).',
    'KPI điều hành không nạp: hệ thống tự tính từ chỉ tiêu lĩnh vực.',
    'Nạp lại cùng chỉ tiêu và kỳ thì số mới thay số cũ.',
  ])
    hd.addRow([d])
  return Buffer.from(await wb.xlsx.writeBuffer())
}

/** Giá trị một ô → thứ `kiemDongNap` hiểu được (chữ, số, ngày; công thức lấy kết quả). */
function o(v: ExcelJS.CellValue): unknown {
  if (v === null || v === undefined) return undefined
  if (v instanceof Date || typeof v === 'number') return v
  if (typeof v === 'string') return v.trim() || undefined
  if (typeof v === 'object') {
    if ('result' in v) return o(v.result)
    if ('richText' in v)
      return (
        v.richText
          .map((r) => r.text)
          .join('')
          .trim() || undefined
      )
    if ('text' in v) return String(v.text).trim() || undefined
  }
  return undefined
}

/** Đọc tệp → các dòng thô kèm số hàng. Hàng không có Giá trị được bỏ qua. */
export async function docTepSoLieu(
  buf: Buffer,
): Promise<{ hang: number; ma: unknown; ky: unknown; giaTri: unknown }[]> {
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  } catch {
    throw new BadRequestException('Không đọc được tệp — cần tệp Excel .xlsx')
  }
  const ws = wb.getWorksheet(TEN_SHEET) ?? wb.worksheets[0]
  if (!ws) throw new BadRequestException('Tệp không có sheet nào')
  const dau = [1, 2, 3].map((i) => {
    const v = o(ws.getCell(1, i).value)
    return typeof v === 'string' ? v.toLowerCase() : ''
  })
  if (!dau[0]!.includes('mã') || !dau[1]!.includes('kỳ') || !dau[2]!.includes('giá trị'))
    throw new BadRequestException(
      'Hàng tiêu đề không đúng mẫu (Mã chỉ tiêu · Kỳ · Giá trị) — tải lại tệp mẫu',
    )
  const dong: { hang: number; ma: unknown; ky: unknown; giaTri: unknown }[] = []
  for (let h = 2; h <= ws.rowCount; h++) {
    const [ma, ky, giaTri] = [1, 2, 3].map((i) => o(ws.getCell(h, i).value))
    if (giaTri === undefined) continue
    dong.push({ hang: h, ma, ky, giaTri })
    if (dong.length > SO_DONG_NAP_TOI_DA)
      throw new BadRequestException(`Tệp quá nhiều dòng — tối đa ${SO_DONG_NAP_TOI_DA} dòng có giá trị`)
  }
  if (dong.length === 0) throw new BadRequestException('Tệp chưa có dòng nào điền Giá trị')
  return dong
}
