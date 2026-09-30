import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { CAU_HINH, docCauHinh, type CauHinh } from './cau-hinh.js'
import { CoSoDuLieu } from './db/co-so-du-lieu.js'
import { DanhMucController } from './danh-muc/danh-muc.controller.js'
import { DuAnController } from './du-an/du-an.controller.js'
import { DuAnService } from './du-an/du-an.service.js'
import { NhatKyController } from './nhat-ky/nhat-ky.controller.js'
import { NhatKyService } from './nhat-ky/nhat-ky.service.js'
import { DonViController } from './quan-tri/don-vi.controller.js'
import { DonViService } from './quan-tri/don-vi.service.js'
import { TaiKhoanController } from './quan-tri/tai-khoan.controller.js'
import { TaiKhoanService } from './quan-tri/tai-khoan.service.js'
import { ThietLapController } from './thiet-lap/thiet-lap.controller.js'
import { ThietLapService } from './thiet-lap/thiet-lap.service.js'
import { SucKhoeController } from './suc-khoe/suc-khoe.controller.js'
import { BaoVeGuard } from './xac-thuc/bao-ve.js'
import { XacThucController } from './xac-thuc/xac-thuc.controller.js'
import { XacThucService } from './xac-thuc/xac-thuc.service.js'

@Module({
  controllers: [
    SucKhoeController,
    XacThucController,
    TaiKhoanController,
    DonViController,
    NhatKyController,
    ThietLapController,
    DuAnController,
    DanhMucController,
  ],
  providers: [
    { provide: CAU_HINH, useFactory: () => docCauHinh() },
    { provide: CoSoDuLieu, useFactory: (ch: CauHinh) => CoSoDuLieu.tao(ch), inject: [CAU_HINH] },
    XacThucService,
    TaiKhoanService,
    DonViService,
    NhatKyService,
    ThietLapService,
    DuAnService,
    // Toàn cục: mọi route mặc định bị chặn cho tới khi khai rõ (xem bao-ve.ts).
    { provide: APP_GUARD, useClass: BaoVeGuard },
  ],
})
export class AppModule {}
