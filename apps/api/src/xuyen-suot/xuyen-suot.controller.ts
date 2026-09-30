import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common'
import {
  GOC_NHIN_TONG_QUAN,
  LOAI_CHI_SO,
  type CanhBaoDef,
  type DongCanhBao,
  type GocNhinTongQuan,
  type KhoiSoLieu,
  type LoaiChiSo,
  type MucViec,
} from '@gdos/shared'
import { CanQuyen, ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { NGUON_DONG_GOP, type NguonDongGop } from './nguon-dong-gop.js'

const LOAI_CANH_BAO: readonly CanhBaoDef['loai'][] = ['qua-han', 'sap-han', 'lau-khong-cap-nhat']

const THU_TU_MUC_DO: Record<MucViec['mucDo'], number> = { 'qua-han': 0, 'sap-han': 1, thuong: 2 }

/**
 * Điểm GOM của các nhóm xuyên suốt (ADR-0007). Không biết gì về nghiệp vụ cụ thể —
 * chỉ gọi các nguồn đóng góp. Mỗi nguồn tự kiểm quyền của chủ và RLS tự lọc phạm vi.
 */
@Controller()
export class XuyenSuotController {
  constructor(@Inject(NGUON_DONG_GOP) private readonly nguon: NguonDongGop[]) {}

  /** Giám sát › Hồ sơ quá hạn. Cần quyền của nhóm Giám sát; từng nguồn kiểm quyền của chủ. */
  @Get('canh-bao')
  @CanQuyen('QUA_HAN.READ')
  async canhBao(@NguoiDung() nd: NguoiDungPhien, @Query('loai') loai?: string): Promise<DongCanhBao[]> {
    if (!LOAI_CANH_BAO.includes(loai as CanhBaoDef['loai']))
      throw new BadRequestException(`"loai" phải là một trong: ${LOAI_CANH_BAO.join(', ')}`)
    const ds = await Promise.all(
      this.nguon.map(async (n) => (n.canhBao ? n.canhBao(nd, loai as CanhBaoDef['loai']) : [])),
    )
    return ds.flat()
  }

  /** Điều hành › Tổng quan — mỗi nghiệp vụ góp một khối số liệu. */
  @Get('tong-quan')
  @CanQuyen('TONG_QUAN.READ')
  async tongQuan(@NguoiDung() nd: NguoiDungPhien, @Query('theo') theo?: string): Promise<KhoiSoLieu[]> {
    if (!GOC_NHIN_TONG_QUAN.includes(theo as GocNhinTongQuan))
      throw new BadRequestException(`"theo" phải là một trong: ${GOC_NHIN_TONG_QUAN.join(', ')}`)
    const ds = await Promise.all(
      this.nguon.map(async (n) => (n.tongQuan ? n.tongQuan(nd, theo as GocNhinTongQuan) : null)),
    )
    return ds.filter((k): k is KhoiSoLieu => k !== null)
  }

  /** Điều hành › Bộ chỉ số. */
  @Get('chi-so')
  @CanQuyen('BO_CHI_SO.READ')
  async chiSo(@NguoiDung() nd: NguoiDungPhien, @Query('loai') loai?: string): Promise<KhoiSoLieu[]> {
    if (!LOAI_CHI_SO.includes(loai as LoaiChiSo))
      throw new BadRequestException(`"loai" phải là một trong: ${LOAI_CHI_SO.join(', ')}`)
    const ds = await Promise.all(
      this.nguon.map(async (n) => (n.chiSo ? n.chiSo(nd, loai as LoaiChiSo) : null)),
    )
    return ds.filter((k): k is KhoiSoLieu => k !== null)
  }

  /** "Việc của tôi" trên trang chủ — ai đăng nhập cũng có, nội dung theo quyền từng nguồn. */
  @Get('viec-cua-toi')
  @ChiCanDangNhap()
  async viecCuaToi(@NguoiDung() nd: NguoiDungPhien): Promise<MucViec[]> {
    const ds = (await Promise.all(this.nguon.map(async (n) => (n.viec ? n.viec(nd) : [])))).flat()
    return ds.sort(
      (a, b) => THU_TU_MUC_DO[a.mucDo] - THU_TU_MUC_DO[b.mucDo] || (a.han ?? '9').localeCompare(b.han ?? '9'),
    )
  }
}
