/**
 * Giao diện mà mỗi module nghiệp vụ cài để ĐÓNG GÓP cho nhóm xuyên suốt (ADR-0007).
 * Điều hành, Giám sát, "Việc của tôi" chỉ gọi qua giao diện này — thêm nghiệp vụ là
 * thêm một nguồn vào danh sách NGUON_DONG_GOP (app.module.ts), không sửa chúng.
 */
import type { CanhBaoDef, DongCanhBao, ModuleDef, MucViec } from '@gdos/shared'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

export interface NguonDongGop {
  /** Module chủ — lấy tên và mã quyền từ registry. */
  readonly module: ModuleDef
  canhBao?(nd: NguoiDungPhien, loai: CanhBaoDef['loai']): Promise<DongCanhBao[]>
  viec?(nd: NguoiDungPhien): Promise<MucViec[]>
}

export const NGUON_DONG_GOP = Symbol('NGUON_DONG_GOP')
