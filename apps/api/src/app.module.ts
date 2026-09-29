import { Module } from '@nestjs/common'
import { CAU_HINH, docCauHinh } from './cau-hinh.js'
import { CoSoDuLieu } from './db/co-so-du-lieu.js'
import { SucKhoeController } from './suc-khoe/suc-khoe.controller.js'

@Module({
  controllers: [SucKhoeController],
  providers: [{ provide: CAU_HINH, useFactory: () => docCauHinh() }, CoSoDuLieu],
})
export class AppModule {}
