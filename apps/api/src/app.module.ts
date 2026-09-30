import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { CAU_HINH, docCauHinh, type CauHinh } from './cau-hinh.js'
import { CoSoDuLieu } from './db/co-so-du-lieu.js'
import { DanhMucController } from './danh-muc/danh-muc.controller.js'
import { QuanLyDanhMucController } from './danh-muc/quan-ly.controller.js'
import { QuanLyDanhMucService } from './danh-muc/quan-ly.service.js'
import { DuAnController } from './du-an/du-an.controller.js'
import { DuAnService } from './du-an/du-an.service.js'
import { DongGopDuAnService } from './du-an/dong-gop.service.js'
import { HoSoDuAnController } from './du-an/ho-so.controller.js'
import { XuyenSuotController } from './xuyen-suot/xuyen-suot.controller.js'
import { NGUON_DONG_GOP } from './xuyen-suot/nguon-dong-gop.js'
import { HoSoDuAnService } from './du-an/ho-so.service.js'
import { NhapDuAnService } from './du-an/nhap.service.js'
import { KHO_TEP, KhoTepThuMuc } from './kho-tep/kho-tep.js'
import { KET_NOI_NATIVE, taoKetNoiNative } from './native/ket-noi-native.js'
import { NhatKyController } from './nhat-ky/nhat-ky.controller.js'
import { NhatKyService } from './nhat-ky/nhat-ky.service.js'
import { DonViController } from './quan-tri/don-vi.controller.js'
import { DonViService } from './quan-tri/don-vi.service.js'
import { TaiKhoanController } from './quan-tri/tai-khoan.controller.js'
import { TaiKhoanService } from './quan-tri/tai-khoan.service.js'
import { ThietLapController } from './thiet-lap/thiet-lap.controller.js'
import { ThietLapService } from './thiet-lap/thiet-lap.service.js'
import { SucKhoeController } from './suc-khoe/suc-khoe.controller.js'
import { KetNoiController, VanBanController } from './van-ban/van-ban.controller.js'
import { VanBanService } from './van-ban/van-ban.service.js'
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
    HoSoDuAnController,
    XuyenSuotController,
    DanhMucController,
    QuanLyDanhMucController,
    VanBanController,
    KetNoiController,
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
    HoSoDuAnService,
    DongGopDuAnService,
    NhapDuAnService,
    QuanLyDanhMucService,
    VanBanService,
    // Nguồn đóng góp cho nhóm xuyên suốt (ADR-0007). Module nghiệp vụ mới: thêm vào đây.
    {
      provide: NGUON_DONG_GOP,
      useFactory: (duAn: DongGopDuAnService) => [duAn],
      inject: [DongGopDuAnService],
    },
    // FOXAI Native (ADR-0009): bản giả / thật / chưa nối — theo cấu hình.
    { provide: KET_NOI_NATIVE, useFactory: (ch: CauHinh) => taoKetNoiNative(ch.native), inject: [CAU_HINH] },
    { provide: KHO_TEP, useFactory: (ch: CauHinh) => new KhoTepThuMuc(ch.thuMucTep), inject: [CAU_HINH] },
    // Toàn cục: mọi route mặc định bị chặn cho tới khi khai rõ (xem bao-ve.ts).
    { provide: APP_GUARD, useClass: BaoVeGuard },
  ],
})
export class AppModule {}
