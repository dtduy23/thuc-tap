import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  BAO_CAO_BENH_VIEN,
  BAO_CAO_PHIM_THU,
  DANH_SACH_MODULE,
  kyHienTai,
  type GiaTriThamSo,
} from '@gdos/shared'
import { baoCaoBenhVien } from '../chi-tieu/benh-vien.js'
import { ChiTieuService } from '../chi-tieu/chi-tieu.service.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import type { NguonDongGop } from '../xuyen-suot/nguon-dong-gop.js'
import { PhimThuService } from './phim.service.js'
import { baoCaoBoNhan, baoCaoNghienCuu } from './tai-lieu.js'

@Injectable()
export class DongGopBenhVienService {
  constructor(
    @Inject(ChiTieuService) private readonly ct: ChiTieuService,
    @Inject(PhimThuService) private readonly p: PhimThuService,
  ) {}

  cacNguon(): NguonDongGop[] {
    return ['bao-cao', 'ho-so-bhyt', 'dieu-tri-lao', 'phim-x-quang'].map((id) => ({
      module: DANH_SACH_MODULE.find((m) => m.id === id)!,
      baoCao: (nd, ma, ts) => this.baoCao(nd, ma, ts),
    }))
  }

  private async baoCao(nd: NguoiDungPhien, ma: string, ts: GiaTriThamSo) {
    const phim = BAO_CAO_PHIM_THU.find((m) => m.id === ma)
    if (phim) {
      const kq =
        phim.mau === 'bo-nhan'
          ? baoCaoBoNhan(await this.p.xuatNhan(nd))
          : baoCaoNghienCuu(phim.mau, await this.p.nghienCuu(nd))
      return { ...kq, ma }
    }
    const mau = BAO_CAO_BENH_VIEN.find((m) => m.maBaoCao === ma)
    if (!mau) throw new NotFoundException('Không có báo cáo bệnh viện này')
    const bang = await this.ct.benhVien(nd, ts.ky ?? kyHienTai(), ts.nguon ?? 'tu-dong')
    return baoCaoBenhVien(bang, bang.cacKy.at(-1)!, mau)
  }
}
