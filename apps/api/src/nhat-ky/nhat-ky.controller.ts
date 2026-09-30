import { Controller, Get, Inject, Query } from '@nestjs/common'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { NhatKyService, type LocNhatKy } from './nhat-ky.service.js'

@Controller('nhat-ky')
export class NhatKyController {
  constructor(@Inject(NhatKyService) private readonly dv: NhatKyService) {}

  @Get()
  @CanQuyen('NHAT_KY.READ')
  danhSach(@NguoiDung() nd: NguoiDungPhien, @Query() loc: LocNhatKy) {
    // Query lặp khóa (?bang=a&bang=b) ra mảng — chỉ nhận chuỗi.
    const chiChuoi = Object.fromEntries(
      Object.entries(loc).filter((e): e is [string, string] => typeof e[1] === 'string'),
    ) as LocNhatKy
    return this.dv.danhSach(nd, chiChuoi)
  }
}
