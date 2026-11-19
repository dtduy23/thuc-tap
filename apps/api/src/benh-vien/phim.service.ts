import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  SO_PHIM_LICH_SU,
  VIEC_NGHIEN_CUU,
  type DanhSachPhimThu,
  type LocPhim,
  type MucNghienCuu,
  type NghienCuuPhimThu,
  type NguonPhim,
  type NhanPhim,
  type PhimThu,
} from '@gdos/shared'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import type { GiaoDich } from '../db/pham-vi.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { docKho, doiTrangThai, ghiKho, trongDonVi } from './kho-thu.js'
import {
  anhPhimThu,
  chayMoHinhThu,
  maPhimThu,
  nguonPhimThu,
  nhanThamChieu,
  nhomPhimThu,
  SO_PHIM_MOI_MAY,
} from './x-quang.js'

const macDinhPhim = (so: number) =>
  so <= 24 || so > SO_PHIM_LICH_SU
    ? 'cho-nhan'
    : so <= 40
      ? `cho-duyet:${nhanThamChieu(so)}`
      : `da-duyet:${nhanThamChieu(so)}`
const trangThai = (v: string): PhimThu['trangThai'] =>
  v.startsWith('da-duyet:') ? 'da-duyet' : v.startsWith('cho-duyet:') ? 'cho-duyet' : 'cho-nhan'

function doiChieu(ds: PhimThu[]): NghienCuuPhimThu['doiChieu'] {
  const kq = { dungCoDau: 0, dungKhongDau: 0, baoDu: 0, boSot: 0 }
  for (const p of ds) {
    if (p.nhom === 'Học' || p.trangThai !== 'da-duyet' || !p.goiY || !p.nhan || p.nhan === 'khong-doc')
      continue
    if (p.nhan === 'co-dau') kq[p.goiY.nhan === 'co-dau' ? 'dungCoDau' : 'boSot']++
    else kq[p.goiY.nhan === 'co-dau' ? 'baoDu' : 'dungKhongDau']++
  }
  return kq
}

@Injectable()
export class PhimThuService {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private async danhMuc(tx: GiaoDich, donViId: string): Promise<PhimThu[]> {
    const kho = await docKho(tx, donViId, 'phim', 'goi-y', 'nguon-phim')
    const sua = new Map(kho.filter((d) => d.loai === 'phim').map((d) => [d.ma, d]))
    const daChay = new Map(kho.filter((d) => d.loai === 'goi-y').map((d) => [d.ma, d.giaTri]))
    const daNhan = new Set(kho.filter((d) => d.loai === 'nguon-phim').map((d) => d.ma))
    return Array.from({ length: SO_PHIM_LICH_SU + 2 * SO_PHIM_MOI_MAY }, (_, i) => i + 1)
      .filter((so) => so <= SO_PHIM_LICH_SU || daNhan.has(nguonPhimThu(so)))
      .map((so) => {
        const ma = maPhimThu(so)
        const d = sua.get(ma)
        const v = d?.giaTri ?? macDinhPhim(so)
        const goiY = daChay.get(ma)
        return {
          ma,
          so,
          maChiDinh: `HIS-${ma}`,
          nguon: nguonPhimThu(so),
          nhom: nhomPhimThu(so),
          trangThai: trangThai(v),
          nhan: (v.split(':')[1] as NhanPhim | undefined) ?? null,
          goiY: goiY ? (JSON.parse(goiY) as PhimThu['goiY']) : null,
          capNhatLuc: d?.updatedAt.toISOString() ?? null,
        }
      })
  }

  async danhSach(
    nd: NguoiDungPhien,
    loc: LocPhim,
    nguon: NguonPhim | undefined,
    tim: string,
    trang: number,
  ): Promise<DanhSachPhimThu> {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = await this.danhMuc(tx, dv)
      const locDuoc = ds.filter(
        (p) =>
          (loc === 'tat-ca' || p.trangThai === loc) && (!nguon || p.nguon === nguon) && p.ma.includes(tim),
      )
      return {
        dong: locDuoc.slice((trang - 1) * 25, trang * 25),
        tong: locDuoc.length,
        choNhan: ds.filter((p) => p.trangThai === 'cho-nhan').length,
        choDuyet: ds.filter((p) => p.trangThai === 'cho-duyet').length,
        daDuyet: ds.filter((p) => p.trangThai === 'da-duyet').length,
        daChay: ds.filter((p) => p.goiY).length,
      }
    })
  }

  private async timPhim(tx: GiaoDich, dv: string, ma: string): Promise<number> {
    const so = Number(ma.slice(3))
    const hopLe = /^XQ-\d{4}$/.test(ma) && so >= 1 && so <= SO_PHIM_LICH_SU + 2 * SO_PHIM_MOI_MAY
    if (
      !hopLe ||
      (so > SO_PHIM_LICH_SU && !(await docKho(tx, dv, 'nguon-phim')).some((d) => d.ma === nguonPhimThu(so)))
    )
      throw new NotFoundException('Không có phim trong đợt thử nghiệm')
    return so
  }

  anh(nd: NguoiDungPhien, ma: string) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => anhPhimThu(await this.timPhim(tx, dv, ma)))
  }

  nhan(nd: NguoiDungPhien, ma: string, nhan: NhanPhim) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const so = await this.timPhim(tx, dv, ma)
      await doiTrangThai(tx, dv, 'phim', ma, macDinhPhim(so), (cu) => {
        if (trangThai(cu) === 'da-duyet') throw new ConflictException('Phim đã được duyệt')
        return `cho-duyet:${nhan}`
      })
    })
  }

  duyet(nd: NguoiDungPhien, ma: string, nhanDangDuyet: NhanPhim, chapNhan: boolean) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const so = await this.timPhim(tx, dv, ma)
      await doiTrangThai(tx, dv, 'phim', ma, macDinhPhim(so), (cu) => {
        if (cu !== `cho-duyet:${nhanDangDuyet}`)
          throw new ConflictException('Nhãn chờ duyệt đã thay đổi, vui lòng tải lại')
        return chapNhan ? `da-duyet:${nhanDangDuyet}` : 'cho-nhan'
      })
    })
  }

  chay(nd: NguoiDungPhien, ma: string) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const so = await this.timPhim(tx, dv, ma)
      const nhan = (await docKho(tx, dv, 'phim')).find((d) => d.ma === ma)?.giaTri ?? macDinhPhim(so)
      if (trangThai(nhan) !== 'da-duyet' || nhan.endsWith(':khong-doc'))
        throw new ConflictException(
          'Chỉ đối chiếu sau khi người đọc duyệt nhãn và phim đạt chất lượng mô phỏng',
        )
      const goiY = chayMoHinhThu(so)
      await ghiKho(tx, dv, 'goi-y', ma, JSON.stringify(goiY))
      return goiY
    })
  }

  chayLoDanhGia(nd: NguoiDungPhien) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = (await this.danhMuc(tx, dv))
        .filter(
          (p) => p.nhom === 'Đánh giá' && p.trangThai === 'da-duyet' && p.nhan !== 'khong-doc' && !p.goiY,
        )
        .slice(0, 25)
      for (const p of ds) await ghiKho(tx, dv, 'goi-y', p.ma, JSON.stringify(chayMoHinhThu(p.so)))
      return { soPhim: ds.length }
    })
  }

  nhanLo(nd: NguoiDungPhien, nguon: NguonPhim) {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const nghienCuu = await docKho(tx, dv, 'nghien-cuu')
      if (!nghienCuu.some((d) => d.ma === 'dao-duc' && d.giaTri === 'da-ghi-nhan'))
        throw new ConflictException(
          'Ghi nhận bước Hội đồng đạo đức trong diễn tập trước khi nhận lô chạy song song',
        )
      await ghiKho(tx, dv, 'nguon-phim', nguon, 'da-nhan')
      return { soPhim: SO_PHIM_MOI_MAY }
    })
  }

  nghienCuu(nd: NguoiDungPhien): Promise<NghienCuuPhimThu> {
    return trongDonVi(this.csdl, nd, async (tx, dv) => {
      const ds = await this.danhMuc(tx, dv)
      const lichSu = ds.filter((p) => p.nhom !== 'Chạy song song')
      const viec = await docKho(tx, dv, 'nghien-cuu')
      return {
        viec: VIEC_NGHIEN_CUU.map(({ ma }) => {
          const d = viec.find((v) => v.ma === ma)
          return { ma, daGhiNhan: d?.giaTri === 'da-ghi-nhan', luc: d?.updatedAt.toISOString() ?? null }
        }),
        doiChieu: doiChieu(ds),
        soPhimLichSu: lichSu.length,
        daDuyet: lichSu.filter((p) => p.trangThai === 'da-duyet').length,
        choDuyet: lichSu.filter((p) => p.trangThai === 'cho-duyet').length,
        choNhan: lichSu.filter((p) => p.trangThai === 'cho-nhan').length,
        daChaySongSong: ds.filter((p) => p.nhom === 'Chạy song song' && p.goiY).length,
      }
    })
  }

  ghiViec(nd: NguoiDungPhien, ma: MucNghienCuu, daGhiNhan: boolean) {
    return trongDonVi(this.csdl, nd, async (tx, dv) =>
      ghiKho(tx, dv, 'nghien-cuu', ma, daGhiNhan ? 'da-ghi-nhan' : 'chua'),
    )
  }

  xuatNhan(nd: NguoiDungPhien) {
    return trongDonVi(this.csdl, nd, async (tx, dv) =>
      (await this.danhMuc(tx, dv)).filter((p) => p.nhom !== 'Chạy song song' && p.trangThai === 'da-duyet'),
    )
  }
}
