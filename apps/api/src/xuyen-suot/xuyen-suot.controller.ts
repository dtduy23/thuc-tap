import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import {
  DANH_SACH_MODULE,
  GOC_NHIN_TONG_QUAN,
  timBaoCao,
  LOAI_CHI_SO,
  type CanhBaoDef,
  type DongCanhBao,
  type GocNhinTongQuan,
  type KetQuaBaoCao,
  type KhoiSoLieu,
  type LoaiChiSo,
  type MucViec,
} from '@gdos/shared'
import { CanQuyen, ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { headerTaiExcel, kiemThamSo, vietExcel } from './bao-cao-chung.js'
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

  /**
   * Một báo cáo — cùng dữ liệu dù mở từ Báo cáo điều hành hay từ module chủ
   * (ADR-0007). Quyền = quyền của module chủ trên báo cáo đó (thường READ, xuất là EXPORT).
   */
  @Get('bao-cao/:ma')
  @ChiCanDangNhap()
  baoCao(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('ma') ma: string,
    @Query() q: Record<string, unknown>,
  ): Promise<KetQuaBaoCao> {
    return this.chayBaoCao(nd, ma, q)
  }

  /** Cùng báo cáo, tải về dạng Excel (có định dạng, dòng tổng là công thức). */
  @Get('bao-cao/:ma/excel')
  @ChiCanDangNhap()
  async baoCaoExcel(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('ma') ma: string,
    @Query() q: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    const kq = await this.chayBaoCao(nd, ma, q)
    res.set(headerTaiExcel(kq.tenTep)).send(await vietExcel(kq))
  }

  private chayBaoCao(nd: NguoiDungPhien, ma: string, q: Record<string, unknown>): Promise<KetQuaBaoCao> {
    const tim = timBaoCao(DANH_SACH_MODULE, ma)
    const nguon = tim && this.nguon.find((n) => n.module.id === tim.module.id)
    if (!tim || !nguon?.baoCao) throw new NotFoundException('Không có báo cáo này')
    if (!nd.quyen.has(`${tim.module.maQuyen}.${tim.muc.hanhDong ?? 'READ'}`))
      throw new ForbiddenException('Tài khoản không có quyền xem báo cáo này')
    return nguon.baoCao(nd, ma, kiemThamSo(tim.muc, q))
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
