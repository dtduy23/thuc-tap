import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { manCu } from '@/man/dieu-hanh-cu'
import { gopMan } from '@/man/gop-man'

/**
 * Chức năng cấp 4 → màn hình. Tách bundle theo màn (lazy): người không có quyền
 * Tầng 2 không bao giờ tải mã màn quản trị.
 *
 * Chức năng nào trong registry cũng phải có màn ở đây, TRỪ màn phác (`phac`) —
 * test man-hinh.test.ts chặn cả hai chiều.
 */
// Hai màn của hệ thống mới (số do Dự án đóng góp) — hiện thành thẻ trong trang Tổng quan / KPI.
const TONG_QUAN_DU_AN = lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanToanCanh })))
const CHAM_DIEM_DU_AN = lazy(() => import('@/man/chi-so').then((m) => ({ default: m.TatCaChiSo })))

export const MAN_HINH: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  // ── Điều hành — màn chép từ GDOS cũ (apps/web/src/dieu-hanh), sắp theo cây mới: mỗi chủ đề
  // một mục, các góc nhìn của cùng chủ đề là thẻ trong trang (gopMan).
  'dh-bang-dieu-hanh': gopMan('bang-dieu-hanh', [
    { id: 'chung', nhan: 'Tổng quan', Man: manCu(() => import('@/dieu-hanh/modules/tong-quan')) },
    {
      id: 'chi-tieu',
      nhan: 'Bộ chỉ tiêu xã/phường',
      Man: manCu(() => import('@/dieu-hanh/modules/dashboard-tong-quan'), { mau: false }),
    },
    { id: 'du-an', nhan: 'Tình hình dự án', Man: TONG_QUAN_DU_AN },
    { id: 'benh-vien', nhan: 'Bệnh viện', Man: lazy(() => import('@/man/dieu-hanh-benh-vien')) },
  ]),
  'dh-kpi': gopMan('kpi', [
    {
      id: 'cap-tren',
      nhan: 'KPI cấp trên giao',
      Man: manCu(() => import('@/dieu-hanh/modules/bo-chi-so-kpi'), { mau: false }),
    },
    {
      id: 'dieu-hanh',
      nhan: 'Bộ chỉ số điều hành',
      Man: manCu(() => import('@/dieu-hanh/modules/bo-chi-so')),
    },
    { id: 'du-an', nhan: 'Chấm điểm dự án', Man: CHAM_DIEM_DU_AN },
  ]),
  'dh-tthc-mot-cua': manCu(() => import('@/dieu-hanh/modules/tthc-mot-cua'), { mau: false }),
  'dh-phan-anh-kien-nghi': manCu(() => import('@/dieu-hanh/modules/phan-anh-kien-nghi'), { mau: false }),
  'dh-kinh-te-dan-cu-xa-hoi': gopMan('ktxh', [
    {
      id: 'dashboard',
      nhan: 'Dashboard',
      Man: manCu(() => import('@/dieu-hanh/modules/kinh-te-dan-cu-xa-hoi'), { mau: false }),
    },
    {
      id: 'chi-tieu',
      nhan: 'Chỉ tiêu kế hoạch năm',
      Man: manCu(() => import('@/dieu-hanh/modules/chi-tieu-ktxh')),
    },
  ]),
  'dh-nong-nghiep': manCu(() => import('@/dieu-hanh/modules/nong-nghiep')),
  'dh-an-ninh-trat-tu': manCu(() => import('@/dieu-hanh/modules/an-ninh-trat-tu'), { mau: false }),
  'dh-ha-tang-do-thi': manCu(() => import('@/dieu-hanh/modules/ha-tang-do-thi'), { mau: false }),
  'dh-dat-dai': manCu(() => import('@/dieu-hanh/modules/dat-dai')),
  'dh-y-te-giao-duc': gopMan('yt-gd', [
    {
      id: 'chi-tieu',
      nhan: 'Chỉ tiêu',
      Man: manCu(() => import('@/dieu-hanh/modules/y-te-giao-duc'), { mau: false }),
    },
    {
      id: 'chi-tiet',
      nhan: 'Trường học & cơ sở y tế',
      Man: manCu(() => import('@/dieu-hanh/modules/giao-duc-y-te')),
    },
  ]),
  'dh-di-tich': manCu(() => import('@/dieu-hanh/modules/di-tich')),
  'dh-khu-pho-thong-minh': manCu(() => import('@/dieu-hanh/modules/khu-pho-thong-minh')),
  // Chuyển khỏi Điều hành: danh sách để XỬ LÝ nằm ở Tác nghiệp, công cụ nằm ở Quản trị › Hiển thị.
  'dh-ho-so-tthc': manCu(() => import('@/dieu-hanh/modules/ho-so-tthc')),
  'dh-phan-anh': manCu(() => import('@/dieu-hanh/modules/phan-anh')),
  'dh-thiet-ke-dashboard': manCu(() => import('@/dieu-hanh/modules/thiet-ke-dashboard')),
  // Trợ lý AI — màn chép từ GDOS cũ, gọi FOXAI Native qua cổng chuyển tiếp của máy chủ GDOS.
  'tl-tro-chuyen': manCu(() => import('@/dieu-hanh/modules/tro-chuyen-chatbot'), { mau: false }),
  'tl-cau-hinh': manCu(() => import('@/dieu-hanh/modules/cau-hinh-chatbot'), { mau: false }),
  'nk-tat-ca': lazy(() => import('@/man/nhat-ky-ds')),
  'nk-ho-so': lazy(() => import('@/man/nhat-ky-theo').then((m) => ({ default: m.NhatKyTheoHoSo }))),
  'nk-nguoi': lazy(() => import('@/man/nhat-ky-theo').then((m) => ({ default: m.NhatKyTheoNguoi }))),
  'da-tat-ca': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.TatCaDuAn }))),
  'da-cua-toi': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.DuAnCuaToi }))),
  'da-cho-xac-nhan': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.DuAnChoXacNhan }))),
  'da-tao': lazy(() => import('@/man/du-an/tao')),
  'da-nhap': lazy(() => import('@/man/du-an/nhap')),
  'da-don-doc': lazy(() => import('@/man/du-an/don-doc')),
  'dm-linh-vuc': lazy(() => import('@/man/danh-muc/gia-tri').then((m) => ({ default: m.LinhVuc }))),
  'dm-loai-vb': lazy(() => import('@/man/danh-muc/gia-tri').then((m) => ({ default: m.LoaiVanBan }))),
  'kb-tham-so': lazy(() => import('@/man/danh-muc/gia-tri').then((m) => ({ default: m.NguonVon }))),
  'nv-cua-toi': lazy(() => import('@/man/nhiem-vu/danh-sach').then((m) => ({ default: m.ViecCuaToi }))),
  'nv-da-giao': lazy(() => import('@/man/nhiem-vu/danh-sach').then((m) => ({ default: m.ViecDaGiao }))),
  'nv-theo-doi': lazy(() => import('@/man/nhiem-vu/danh-sach').then((m) => ({ default: m.TheoDoiChung }))),
  'dm-don-vi': lazy(() => import('@/man/danh-muc/to-chuc').then((m) => ({ default: m.DanhBaDonVi }))),
  'dm-can-bo': lazy(() => import('@/man/danh-muc/to-chuc').then((m) => ({ default: m.DanhBaCanBo }))),
  'dm-quy-trinh': lazy(() => import('@/man/danh-muc/quy-trinh')),
  'da-bao-cao': lazy(() => import('@/man/bao-cao/danh-sach').then((m) => ({ default: m.BaoCaoDuAn }))),
  'bc-tat-ca': lazy(() => import('@/man/bao-cao/danh-sach').then((m) => ({ default: m.TatCaBaoCao }))),
  'bc-dinh-ky': lazy(() => import('@/man/bao-cao/danh-sach').then((m) => ({ default: m.BaoCaoDinhKy }))),
  'bc-xuat': lazy(() => import('@/man/bao-cao/danh-sach').then((m) => ({ default: m.XuatDuLieu }))),
  'qh-sla': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.DaQuaHan }))),
  'qh-sap': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.SapDenHan }))),
  'qh-lau': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.LauKhongCapNhat }))),
  'tq-don-vi': lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanDonVi }))),
  'tq-lv': lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanLinhVuc }))),
  'bcs-xep-hang': lazy(() => import('@/man/chi-so').then((m) => ({ default: m.XepHangDonVi }))),
  'vb-den': lazy(() => import('@/man/van-ban/den')),
  'vb-tom-tat': lazy(() => import('@/man/van-ban/tom-tat')),
  'vb-soan-thao': lazy(() => import('@/man/van-ban/soan-thao')),
  'vb-phan-cong': lazy(() => import('@/man/van-ban/phan-cong')),
  'vb-mau': lazy(() => import('@/man/van-ban/mau')),
  'vb-don-vi': lazy(() => import('@/man/van-ban/don-vi-nhan-viec')),
  'kn-ds': lazy(() => import('@/man/ket-noi').then((m) => ({ default: m.DanhSachKetNoi }))),
  'kn-kiem-tra': lazy(() => import('@/man/ket-noi').then((m) => ({ default: m.KiemTraKetNoi }))),
  'pd-ds': lazy(() => import('@/man/luong-duyet')),
  'nd-api': lazy(() => import('@/man/nguon-vao/api')),
  'nd-excel': lazy(() => import('@/man/nguon-vao/excel')),
  'nd-ket-qua': lazy(() => import('@/man/nguon-vao/ket-qua')),
  'ocr-loai': lazy(() => import('@/man/ocr/quan-tri').then((m) => ({ default: m.LoaiOcr }))),
  'ocr-ket-qua': lazy(() => import('@/man/ocr/quan-tri').then((m) => ({ default: m.KetQuaOcr }))),
  'tk-ds': lazy(() => import('@/man/tai-khoan-ds')),
  'tk-khoa': lazy(() => import('@/man/tai-khoan-khoa')),
  'tk-tao': lazy(() => import('@/man/tai-khoan-tao')),
  'dv-ds': lazy(() => import('@/man/don-vi-ds')),
  'kb-cay': lazy(() => import('@/man/cay-phan-he-xem')),
  'vh-suc-khoe': lazy(() => import('@/man/van-hanh').then((m) => ({ default: m.SucKhoeHeThongMan }))),
  'vh-hang-doi': lazy(() => import('@/man/van-hanh').then((m) => ({ default: m.HangDoiXuLyMan }))),
  'vh-tep': lazy(() => import('@/man/van-hanh').then((m) => ({ default: m.LuuTruTepMan }))),
  'vt-tra-cuu': lazy(() => import('@/man/vai-tro-tra-cuu')),
  'vt-ma-tran': lazy(() => import('@/man/vai-tro-ma-tran')),
  'ch-bao-mat': lazy(() => import('@/man/cau-hinh-bao-mat')),
  'cb-sla': lazy(() => import('@/man/cau-hinh-canh-bao')),
  'ht-trang-dau': lazy(() => import('@/man/cau-hinh-trang-dau')),
  'ch-nhan-dien': lazy(() => import('@/man/cau-hinh-nhan-dien')),
}
