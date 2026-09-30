/**
 * Nhập danh sách dự án từ Excel — hàm THUẦN: dựng tệp mẫu, đọc tệp, kiểm từng dòng
 * theo danh mục đã tra (đã qua RLS). Không ghi gì: ghi là việc của NhapDuAnService,
 * và chỉ ghi khi MỌI dòng hợp lệ (tất cả hoặc không gì cả).
 */
import { BadRequestException } from '@nestjs/common'
import {
  LOAI_CHI,
  laNgay,
  NHOM_DU_AN,
  SO_DONG_NHAP_TOI_DA,
  type DongNhapDuAn,
  type KetQuaNhapDuAn,
} from '@gdos/shared'
import ExcelJS from 'exceljs'
import { docDuAnMoi, type DuAnMoi } from './du-an.service.js'

/** Thứ tự cột CỐ ĐỊNH — bộ đọc đọc đúng thứ tự này. */
export const COT_NHAP = [
  { nhan: 'Mã dự án', rong: 16, mo: 'Để trống — hệ thống tự sinh DA-năm-số' },
  { nhan: 'Tên dự án (*)', rong: 50 },
  { nhan: 'Chủ đầu tư (*)', rong: 28, mo: 'Tên hoặc mã đơn vị — xem sheet Hướng dẫn' },
  { nhan: 'Quy trình mẫu (*)', rong: 18, mo: 'Mã quy trình — xem sheet Hướng dẫn' },
  { nhan: 'Loại chi (*)', rong: 14, mo: 'dtpt (đầu tư phát triển) hoặc ctx (chi thường xuyên)' },
  { nhan: 'Nhóm dự án', rong: 11, mo: 'A, B hoặc C' },
  { nhan: 'Lĩnh vực', rong: 22, mo: 'Tên hoặc mã lĩnh vực' },
  { nhan: 'Tổng mức (triệu đồng)', rong: 16 },
  { nhan: 'Ngày bắt đầu (*)', rong: 15, mo: 'Ngày, hoặc dd/mm/yyyy' },
  { nhan: 'Địa điểm đầu tư', rong: 24 },
  { nhan: 'Căn cứ', rong: 30 },
  { nhan: 'Cán bộ phụ trách', rong: 20, mo: 'Tên đăng nhập — để trống là người nhập' },
] as const

export interface TraCuuNhap {
  donVi: { id: string; ma: string; ten: string }[]
  quyTrinh: { ma: string; ten: string }[]
  linhVuc: { id: string; ma: string; ten: string }[]
  /** tên đăng nhập (chữ thường) → id tài khoản */
  canBo: Map<string, string>
  /** Mã dự án đã có (chữ hoa) — báo trùng trước khi ghi. */
  maDaCo: Set<string>
}

const NAVY = 'FF1A2E55'
const FONT = 'Times New Roman'

export async function taoTepMau(tc: Omit<TraCuuNhap, 'canBo' | 'maDaCo'>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GDOS'
  const ws = wb.addWorksheet('Dự án', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = COT_NHAP.map((c) => ({ width: c.rong }))
  COT_NHAP.forEach((c, i) => {
    const o = ws.getCell(1, i + 1)
    o.value = c.nhan
    o.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    o.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    o.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    if ('mo' in c) o.note = c.mo
  })
  ws.getRow(1).height = 32
  // Ô chọn sẵn cho cột có giá trị cố định — gõ sai là Excel chặn ngay.
  for (let h = 2; h <= SO_DONG_NHAP_TOI_DA + 1; h++) {
    ws.getCell(h, 5).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${Object.keys(LOAI_CHI).join(',')}"`],
    }
    ws.getCell(h, 6).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${NHOM_DU_AN.join(',')}"`],
    }
    ws.getCell(h, 9).numFmt = 'dd/mm/yyyy'
  }

  const hd = wb.addWorksheet('Hướng dẫn')
  hd.columns = [{ width: 24 }, { width: 60 }]
  const khoi = (tieuDe: string, dong: [string, string][]) => {
    const r = hd.addRow([tieuDe])
    r.font = { name: FONT, bold: true, color: { argb: NAVY } }
    for (const d of dong) hd.addRow(d).font = { name: FONT }
    hd.addRow([])
  }
  khoi('Cách dùng', [
    ['1', 'Mỗi dòng ở sheet "Dự án" là một dự án. Cột có (*) bắt buộc.'],
    ['2', 'Nhập lên: hệ thống kiểm MỌI dòng trước. Có dòng sai thì không nhập dòng nào.'],
    ['3', `Tối đa ${SO_DONG_NHAP_TOI_DA} dòng mỗi lần. Tiền tính bằng triệu đồng.`],
  ])
  khoi(
    'Chủ đầu tư (tên hoặc mã)',
    tc.donVi.map((d) => [d.ma, d.ten]),
  )
  khoi(
    'Quy trình mẫu (mã)',
    tc.quyTrinh.map((q) => [q.ma, q.ten]),
  )
  khoi(
    'Loại chi',
    Object.entries(LOAI_CHI).map(([k, v]) => [k, v]),
  )
  khoi(
    'Lĩnh vực (tên hoặc mã)',
    tc.linhVuc.map((l) => [l.ma, l.ten]),
  )
  return Buffer.from(await wb.xlsx.writeBuffer())
}

/** Giá trị ô → chuỗi sạch. Ngày → YYYY-MM-DD (ô ngày Excel là ngày trần, đọc theo UTC). */
export function oChuoi(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date)
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-${String(v.getUTCDate()).padStart(2, '0')}`
  if (typeof v === 'object') {
    if ('richText' in v)
      return v.richText
        .map((x) => x.text)
        .join('')
        .trim()
    if ('text' in v && typeof v.text === 'string') return v.text.trim()
    if ('result' in v && v.result !== undefined && v.result !== null) return oChuoi(v.result)
    return ''
  }
  return String(v).trim()
}

/** dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd → YYYY-MM-DD; không hiểu → null. */
export function docNgay(s: string): string | null {
  if (laNgay(s)) return s
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s)
  if (!m) return null
  const kq = `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`
  return laNgay(kq) ? kq : null
}

const chuan = (s: string) => s.normalize('NFC').trim().toLowerCase()

export interface DongDaDoc extends DongNhapDuAn {
  duLieu: DuAnMoi | null
}

/** Đọc tệp và kiểm từng dòng. Không ghi gì. `nguoiNhap` = cán bộ phụ trách mặc định. */
export async function docTepNhap(buf: Buffer, tc: TraCuuNhap, nguoiNhap: string): Promise<DongDaDoc[]> {
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  } catch {
    throw new BadRequestException('Không đọc được tệp — cần tệp Excel .xlsx (tải tệp mẫu để điền)')
  }
  const ws = wb.getWorksheet('Dự án') ?? wb.worksheets[0]
  if (!ws) throw new BadRequestException('Tệp không có sheet nào')
  const dauBang = COT_NHAP.map((_, i) => chuan(oChuoi(ws.getCell(1, i + 1).value)))
  if (dauBang[1] !== chuan(COT_NHAP[1].nhan) || dauBang[2] !== chuan(COT_NHAP[2].nhan))
    throw new BadRequestException('Tệp không đúng mẫu — hàng 1 phải là tiêu đề cột của tệp mẫu')

  const dong: DongDaDoc[] = []
  const maTrongTep = new Map<string, number>()
  for (let h = 2; h <= ws.rowCount; h++) {
    const o = COT_NHAP.map((_, i) => oChuoi(ws.getCell(h, i + 1).value))
    if (o.every((x) => !x)) continue
    if (dong.length >= SO_DONG_NHAP_TOI_DA)
      throw new BadRequestException(`Tệp quá ${SO_DONG_NHAP_TOI_DA} dòng — chia thành nhiều tệp`)
    const [ma, ten, cdt, qt, loaiChi, nhom, lv, tongMuc, ngayBd, diaDiem, canCu, canBo] = o
    const loi: string[] = []

    const dv = tc.donVi.find((d) => chuan(d.ten) === chuan(cdt!) || chuan(d.ma) === chuan(cdt!))
    if (!cdt) loi.push('Thiếu chủ đầu tư')
    else if (!dv) loi.push(`Chủ đầu tư "${cdt}" không có trong phạm vi của bạn`)
    const quyTrinh = tc.quyTrinh.find((q) => chuan(q.ma) === chuan(qt!) || chuan(q.ten) === chuan(qt!))
    if (!qt) loi.push('Thiếu quy trình mẫu')
    else if (!quyTrinh) loi.push(`Không có quy trình mẫu "${qt}"`)
    const loai =
      (Object.keys(LOAI_CHI) as (keyof typeof LOAI_CHI)[]).find(
        (k) => chuan(k) === chuan(loaiChi!) || chuan(LOAI_CHI[k]) === chuan(loaiChi!),
      ) ?? null
    if (!loaiChi) loi.push('Thiếu loại chi')
    else if (!loai) loi.push(`Loại chi "${loaiChi}" không hợp lệ (dtpt hoặc ctx)`)
    const linhVuc = lv
      ? tc.linhVuc.find((l) => chuan(l.ten) === chuan(lv) || chuan(l.ma) === chuan(lv))
      : null
    if (lv && !linhVuc) loi.push(`Không có lĩnh vực "${lv}"`)
    const ngay = ngayBd ? docNgay(ngayBd) : null
    if (!ngayBd) loi.push('Thiếu ngày bắt đầu')
    else if (!ngay) loi.push(`Ngày bắt đầu "${ngayBd}" không hiểu được`)
    const tien = tongMuc ? Number(tongMuc.replace(/[.\s]/g, '').replace(',', '.')) : 0
    if (tongMuc && (!Number.isFinite(tien) || tien < 0)) loi.push(`Tổng mức "${tongMuc}" không phải số`)
    const canBoId = canBo ? tc.canBo.get(chuan(canBo)) : nguoiNhap
    if (canBo && !canBoId) loi.push(`Không có tài khoản "${canBo}"`)
    if (ma) {
      const MA = ma.toUpperCase()
      if (tc.maDaCo.has(MA)) loi.push(`Mã dự án "${ma}" đã có trên hệ thống`)
      if (maTrongTep.has(MA)) loi.push(`Mã dự án "${ma}" trùng với hàng ${maTrongTep.get(MA)}`)
      maTrongTep.set(MA, h)
    }

    let duLieu: DuAnMoi | null = null
    if (loi.length === 0) {
      try {
        duLieu = docDuAnMoi(
          {
            ma: ma || undefined,
            ten,
            donViId: dv!.id,
            quyTrinhMa: quyTrinh!.ma,
            loaiChi: loai,
            nhomDuAn: nhom ? nhom.toUpperCase() : undefined,
            linhVucId: linhVuc?.id,
            tongMuc: Math.round(tien),
            ngayBatDau: ngay,
            diaDiem: diaDiem || undefined,
            canCu: canCu || undefined,
            canBoId,
          },
          nguoiNhap,
        )
      } catch (e) {
        loi.push(e instanceof BadRequestException ? e.message : 'Dữ liệu không hợp lệ')
      }
    }
    dong.push({
      hang: h,
      ten: ten ?? '',
      chuDauTu: dv?.ten ?? cdt ?? '',
      quyTrinh: quyTrinh?.ten ?? qt ?? '',
      loi,
      duLieu,
    })
  }
  if (dong.length === 0) throw new BadRequestException('Tệp không có dòng dự án nào')
  return dong
}

export const tomTat = (dong: DongDaDoc[]): KetQuaNhapDuAn => ({
  dong: dong.map(({ duLieu: _bo, ...d }) => d),
  soHopLe: dong.filter((d) => d.loi.length === 0).length,
  soLoi: dong.filter((d) => d.loi.length > 0).length,
})
