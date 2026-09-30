import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { CAU_HINH, docCauHinh } from './cau-hinh.js'
import { CoSoDuLieu } from './db/co-so-du-lieu.js'
import { SucKhoeController } from './suc-khoe/suc-khoe.controller.js'
import { BaoVeGuard } from './xac-thuc/bao-ve.js'
import { XacThucController } from './xac-thuc/xac-thuc.controller.js'
import { XacThucService } from './xac-thuc/xac-thuc.service.js'

@Module({
  controllers: [SucKhoeController, XacThucController],
  providers: [
    { provide: CAU_HINH, useFactory: () => docCauHinh() },
    CoSoDuLieu,
    XacThucService,
    // Toàn cục: mọi route mặc định bị chặn cho tới khi khai rõ (xem bao-ve.ts).
    { provide: APP_GUARD, useClass: BaoVeGuard },
  ],
})
export class AppModule {}
