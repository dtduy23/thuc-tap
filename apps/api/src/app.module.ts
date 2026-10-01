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
import { ChuyenTiepNativeController, GOI_NATIVE } from './native/chuyen-tiep.controller.js'
import { KET_NOI_NATIVE, taoKetNoiNative } from './native/ket-noi-native.js'
import { LienKetNativeService } from './native/lien-ket.service.js'
import { XAC_THUC_NATIVE, XacThucNativeGia, XacThucNativeHttp } from './native/xac-thuc-native.js'
import { OcrController } from './ocr/ocr.controller.js'
import { OcrService } from './ocr/ocr.service.js'
import { NhatKyController } from './nhat-ky/nhat-ky.controller.js'
import { NhatKyService } from './nhat-ky/nhat-ky.service.js'
import { ChiTieuController } from './chi-tieu/chi-tieu.controller.js'
import { VanHanhController } from './van-hanh/van-hanh.controller.js'
import { ChiTieuService } from './chi-tieu/chi-tieu.service.js'
import { ToChucController } from './danh-muc/to-chuc.controller.js'
import { DonViController } from './quan-tri/don-vi.controller.js'
import { DonViService } from './quan-tri/don-vi.service.js'
import { TaiKhoanController } from './quan-tri/tai-khoan.controller.js'
import { TaiKhoanService } from './quan-tri/tai-khoan.service.js'
import { ThietLapController } from './thiet-lap/thiet-lap.controller.js'
import { ThietLapService } from './thiet-lap/thiet-lap.service.js'
import { SucKhoeController } from './suc-khoe/suc-khoe.controller.js'
import { KetNoiController, LienKetNativeController, VanBanController } from './van-ban/van-ban.controller.js'
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
    ToChucController,
    ChiTieuController,
    VanHanhController,
    NhatKyController,
    ThietLapController,
    DuAnController,
    HoSoDuAnController,
    XuyenSuotController,
    DanhMucController,
    QuanLyDanhMucController,
    VanBanController,
    KetNoiController,
    LienKetNativeController,
    ChuyenTiepNativeController,
    OcrController,
  ],
  providers: [
    { provide: CAU_HINH, useFactory: () => docCauHinh() },
    { provide: CoSoDuLieu, useFactory: (ch: CauHinh) => CoSoDuLieu.tao(ch), inject: [CAU_HINH] },
    XacThucService,
    TaiKhoanService,
    DonViService,
    ChiTieuService,
    NhatKyService,
    ThietLapService,
    DuAnService,
    HoSoDuAnService,
    DongGopDuAnService,
    NhapDuAnService,
    QuanLyDanhMucService,
    VanBanService,
    LienKetNativeService,
    OcrService,
    // Nguồn đóng góp cho nhóm xuyên suốt (ADR-0007). Module nghiệp vụ mới: thêm vào đây.
    {
      provide: NGUON_DONG_GOP,
      useFactory: (duAn: DongGopDuAnService) => [duAn],
      inject: [DongGopDuAnService],
    },
    // FOXAI Native (ADR-0009): bản giả / thật / chưa nối — theo cấu hình.
    {
      provide: XAC_THUC_NATIVE,
      useFactory: (ch: CauHinh) =>
        ch.native.gia ? new XacThucNativeGia() : ch.native.url ? new XacThucNativeHttp(ch.native.url) : null,
      inject: [CAU_HINH],
    },
    {
      provide: KET_NOI_NATIVE,
      useFactory: (ch: CauHinh, lienKet: LienKetNativeService) => taoKetNoiNative(ch.native, lienKet),
      inject: [CAU_HINH, LienKetNativeService],
    },
    { provide: GOI_NATIVE, useFactory: () => fetch.bind(globalThis) },
    { provide: KHO_TEP, useFactory: (ch: CauHinh) => new KhoTepThuMuc(ch.thuMucTep), inject: [CAU_HINH] },
    // Toàn cục: mọi route mặc định bị chặn cho tới khi khai rõ (xem bao-ve.ts).
    { provide: APP_GUARD, useClass: BaoVeGuard },
  ],
})
export class AppModule {}
