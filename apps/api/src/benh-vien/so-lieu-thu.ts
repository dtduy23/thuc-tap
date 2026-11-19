import { NGUON_BENH_VIEN, type MaNguonBenhVien, type SoLieuBenhVien } from '@gdos/shared'
import { giaLapBenhVien } from '../chi-tieu/benh-vien.js'
import type { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { docKho, trongDonVi } from './kho-thu.js'

/** Nguồn mẫu chỉ trả số tổng hợp theo danh mục đầu mối của từng hệ thống. */
export function docNguonGiaLap(ma: MaNguonBenhVien, ky: string): SoLieuBenhVien[] {
  const nguon = NGUON_BENH_VIEN.find((n) => n.ma === ma)!
  return giaLapBenhVien([ky])
    .cacKy[0]!.soLieu.filter((d) => nguon.chiTieu.some((m) => m === d.ma))
    .map((d) => ({ ...d, nguon: `Giả lập · ${nguon.ten}` }))
}

/** Dashboard và báo cáo dùng cùng bộ số mẫu, với nguồn được ghi nhận theo kỳ của đơn vị. */
export function bangGiaLap(csdl: CoSoDuLieu, nd: NguoiDungPhien, ky: string[]) {
  return trongDonVi(csdl, nd, async (tx, dv) => {
    const kho = await docKho(tx, dv, 'ket-noi')
    const bang = giaLapBenhVien(ky)
    for (const k of bang.cacKy) {
      const theoMa = new Map<string, string>()
      for (const n of NGUON_BENH_VIEN) {
        if (kho.some((d) => d.ma === `${n.ma}:${k.ky}`))
          for (const ma of n.chiTieu) theoMa.set(ma, `Giả lập · ${n.ten}`)
      }
      k.soLieu = k.soLieu.map((d) => ({ ...d, nguon: theoMa.get(d.ma) ?? d.nguon }))
    }
    return bang
  })
}
