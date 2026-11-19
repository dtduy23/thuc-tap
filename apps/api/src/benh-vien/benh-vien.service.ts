import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  CHI_TIEU_BENH_VIEN,
  NGUON_BENH_VIEN,
  dongChiTieuBenhVien,
  kyHien,
  type CaLaoThu,
  type ChuDeTroLyBenhVien,
  type HoSoBhytThu,
  type KetNoiBenhVienThu,
  type KetQuaNhacLao,
  type MaNguonBenhVien,
  type TraLoiBenhVienThu,
} from '@gdos/shared'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { ChiTieuService } from '../chi-tieu/chi-tieu.service.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { CA_LAO_MAU, HO_SO_BHYT_MAU, hoSoBhytMau } from './ho-so-mau.js'
import { docKho, doiTrangThai, ghiKho, trongDonVi } from './kho-thu.js'
import { docNguonGiaLap } from './so-lieu-thu.js'

const PHONG_BHYT = {
  'ra-soat': ['cho-ra-soat'],
  'bo-sung': ['can-sua'],
  duyet: ['cho-duyet'],
  'tra-lai': ['cho-duyet'],
  gui: ['da-duyet'],
} as const
export type ThaoTacBhyt = keyof typeof PHONG_BHYT

function caLao(ma: string): CaLaoThu {
  const ca = CA_LAO_MAU.find((c) => c.ma === ma)
  if (!ca) throw new NotFoundException('Không có ca lao trong bộ dữ liệu diễn tập')
  return ca
}

@Injectable()
export class BenhVienThuService {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(ChiTieuService) private readonly ct: ChiTieuService,
  ) {}

  ketNoi(nd: NguoiDungPhien, ky: string): Promise<KetNoiBenhVienThu[]> {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = await docKho(tx, dv, 'ket-noi')
      return NGUON_BENH_VIEN.map(({ ma, ten }) => {
        const nhan = ds.find((d) => d.ma === `${ma}:${ky}`)
        return {
          ma,
          ten,
          ky,
          luc: nhan?.updatedAt.toISOString() ?? null,
          soLieu: nhan ? docNguonGiaLap(ma, ky) : [],
        }
      })
    })
  }

  dongBo(nd: NguoiDungPhien, ma: MaNguonBenhVien, ky: string) {
    const soLieu = docNguonGiaLap(ma, ky)
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      // Chỉ lưu vết diễn tập. Chỉ tiêu nhập thực tế vẫn dùng kho chung theo ADR-0010.
      await ghiKho(tx, dv, 'ket-noi', `${ma}:${ky}`, 'da-kiem-tra')
      return { soDong: soLieu.length }
    })
  }

  bhyt(nd: NguoiDungPhien): Promise<HoSoBhytThu[]> {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = await docKho(tx, dv, 'bhyt')
      return HO_SO_BHYT_MAU.map((h) => hoSoBhytMau(h, ds.find((d) => d.ma === h.ma)?.giaTri ?? 'cho-ra-soat'))
    })
  }

  doiBhyt(nd: NguoiDungPhien, ma: string, viec: ThaoTacBhyt) {
    const h = HO_SO_BHYT_MAU.find((d) => d.ma === ma)
    if (!h) throw new NotFoundException('Không có hồ sơ BHYT trong bộ dữ liệu diễn tập')
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      await doiTrangThai(tx, dv, 'bhyt', ma, 'cho-ra-soat', (cu) => {
        const daSua = cu.endsWith(':da-sua')
        const dang = cu.split(':')[0]!
        if (!PHONG_BHYT[viec].some((s) => s === dang))
          throw new ConflictException('Hồ sơ đã đổi trạng thái. Tải lại trước khi thao tác.')
        if (viec === 'bo-sung') return 'cho-ra-soat:da-sua'
        const duoi = daSua ? ':da-sua' : ''
        if (viec === 'ra-soat')
          return !daSua && hoSoBhytMau(h, cu).loi.length ? 'can-sua' : `cho-duyet${duoi}`
        if (viec === 'tra-lai') return `can-sua${duoi}`
        return `${viec === 'duyet' ? 'da-duyet' : 'da-gui'}${duoi}`
      })
    })
  }

  lao(nd: NguoiDungPhien): Promise<CaLaoThu[]> {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = await docKho(tx, dv, 'lao', 'nhac-lao', 'gui-lao')
      return CA_LAO_MAU.map((c) => {
        const v = ds.find((d) => d.loai === 'gui-lao' && d.ma === c.ma)
        const theoDoi = ds.find((d) => d.loai === 'lao' && d.ma === c.ma)
        const lanTheoDoi = c.lanTheoDoi.map(({ ngay }) => {
          const d = ds.find((d) => d.loai === 'nhac-lao' && d.ma === `${c.ma}:${ngay}`)
          return { ngay, ketQua: (d?.giaTri as KetQuaNhacLao | undefined) ?? null }
        })
        const thayDoiLuc = ds
          .filter((d) => d.loai === 'nhac-lao' && d.ma.startsWith(`${c.ma}:`))
          .reduce((luc, d) => Math.max(luc, d.updatedAt.getTime()), theoDoi?.updatedAt.getTime() ?? 0)
        return {
          ...c,
          hoanTat: theoDoi?.giaTri === 'hoan-tat',
          lanTheoDoi,
          dongBoLuc: v && v.updatedAt.getTime() >= thayDoiLuc ? v.updatedAt.toISOString() : null,
        }
      })
    })
  }

  nhacLao(nd: NguoiDungPhien, ma: string, ngay: string, ketQua: KetQuaNhacLao) {
    const ca = caLao(ma)
    if (!ca.lanTheoDoi.some((d) => d.ngay === ngay)) throw new NotFoundException('Không có lần theo dõi này')
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      await doiTrangThai(tx, dv, 'lao', ma, 'theo-doi', async (cu) => {
        if (cu === 'hoan-tat') throw new ConflictException('Đợt theo dõi đã hoàn tất')
        await ghiKho(tx, dv, 'nhac-lao', `${ma}:${ngay}`, ketQua)
        return cu
      })
    })
  }

  hoanTatLao(nd: NguoiDungPhien, ma: string) {
    const ca = caLao(ma)
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      await doiTrangThai(tx, dv, 'lao', ma, 'theo-doi', async () => {
        const ds = await docKho(tx, dv, 'nhac-lao')
        if (
          !ca.lanTheoDoi.every(({ ngay }) =>
            ds.some((d) => d.ma === `${ma}:${ngay}` && d.giaTri === 'da-xac-nhan'),
          )
        )
          throw new ConflictException('Còn lần theo dõi chưa xác nhận')
        return 'hoan-tat'
      })
    })
  }

  guiLao(nd: NguoiDungPhien, ma: string) {
    const ca = caLao(ma)
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      await doiTrangThai(tx, dv, 'lao', ma, 'theo-doi', async (cu) => {
        const ds = await docKho(tx, dv, 'nhac-lao')
        const soLan = ds.filter((d) => d.ma.startsWith(`${ma}:`)).length
        if (soLan === 0)
          throw new ConflictException('Cần ghi nhận ít nhất một lần theo dõi trước khi đồng bộ')
        await ghiKho(tx, dv, 'gui-lao', ma, `${ca.maIcd}:${cu}:${soLan}`)
        return cu
      })
    })
  }

  async troLy(
    nd: NguoiDungPhien,
    chuDe: ChuDeTroLyBenhVien,
    ky: string,
    ma?: string,
  ): Promise<TraLoiBenhVienThu> {
    if (chuDe === 'ma-icd') {
      const ca = caLao(ma ?? '')
      return {
        noiDung: `Hồ sơ mẫu ${ca.ma} đang lưu mã ICD ${ca.maIcd}. Mã này chỉ được trích lại từ hồ sơ diễn tập.`,
        nguon: 'Hồ sơ lao giả lập',
      }
    }
    if (chuDe === 'nhac-theo-doi') {
      const ca = (await this.lao(nd)).find((c) => c.ma === ma)
      if (!ca) throw new NotFoundException('Không có ca lao trong bộ dữ liệu diễn tập')
      const canTheoDoi = ca.lanTheoDoi.filter((d) => d.ketQua !== 'da-xac-nhan')
      const noiDung = canTheoDoi.length
        ? `Các mốc cần xác nhận của ${ca.ma}: ${canTheoDoi.map((d) => d.ngay).join(', ')}. Đầu mối: ${ca.theoDoi}.`
        : `Đã xác nhận mọi mốc theo dõi của ${ca.ma}.`
      return { noiDung, nguon: 'Lịch theo dõi lao giả lập' }
    }
    const dong = dongChiTieuBenhVien((await this.ct.benhVien(nd, ky, 'tu-dong')).cacKy.at(-1)!)
    if (chuDe === 'so-lieu') {
      const c = dong.find((d) => d.ma === ma)
      if (!c) throw new NotFoundException('Không có chỉ tiêu được hỏi')
      return {
        noiDung: `${kyHien(ky)}\n${c.ten}: ${c.giaTri?.toLocaleString('vi-VN') ?? '—'} ${c.donVi}.`,
        nguon: `Bảng điều hành bệnh viện · ${c.nguon ?? 'chưa có số liệu'}`,
      }
    }
    const noiDung = `BẢN NHÁP GIAO BAN · ${kyHien(ky)}\n\nKính gửi: Ban điều hành bệnh viện.\n\n${CHI_TIEU_BENH_VIEN.slice(
      0,
      3,
    )
      .map((c) => {
        const d = dong.find((d) => d.ma === c.ma)!
        return `• ${c.ten}: ${d.giaTri?.toLocaleString('vi-VN') ?? '—'} ${c.donVi} (${d.nguon ?? 'chưa có số liệu'})`
      })
      .join('\n')}\n\nĐề nghị các bộ phận đối soát số liệu trước khi trình ký.\n\nNgười soạn: [điền họ tên]`
    return { noiDung, nguon: 'Mẫu văn bản giao ban GDOS · Bảng điều hành bệnh viện' }
  }
}
