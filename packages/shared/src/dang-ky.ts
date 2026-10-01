/**
 * REGISTRY — toàn bộ cây phân hệ của GDOS: module cấp 3 và chức năng cấp 4.
 *
 * Nguồn duy nhất cho: cây sidebar (web), kiểm quyền (API), trang chủ, ma trận quyền.
 * Khai ĐỦ cây theo bản mẫu `docs/khung-mau.html` để ai nhìn vào cũng thấy khung;
 * chỗ nào chưa xây màn thì đánh `phac: true` (màn phác). Test chặn hai chiều:
 * chức năng không phác phải có màn, chức năng phác không được có màn — xây xong
 * thì bỏ cờ.
 *
 * Cấp 1–2 ĐÓNG (phan-he.ts). Việc hằng ngày của đội nằm ở cấp 3–4 trong file này.
 * Thêm module: khai ở đây + tạo màn hình + viết test quyền. `kiemTraCay()` chạy
 * trong test nên khai sai là CI đỏ.
 */
import type { ModuleDef } from './phan-he.js'

/** Trục phân nhóm của các báo cáo dự án. */
const NHOM_BAO_CAO_DU_AN = [
  { id: 'don-vi', nhan: 'Chủ đầu tư' },
  { id: 'linh-vuc', nhan: 'Lĩnh vực' },
  { id: 'hinh-thuc', nhan: 'Hình thức' },
  { id: 'nhom-du-an', nhan: 'Nhóm dự án' },
] as const

export const DANH_SACH_MODULE: readonly ModuleDef[] = [
  // ══ TẦNG 1 · NGHIỆP VỤ ═════════════════════════════════════════════════

  // ── Điều hành — đọc tổng hợp nhiều hồ sơ, không sửa gì ─────────────────
  //
  // Bốn module đầu GIỮ ĐÚNG MENU của GDOS cũ (màn chép nguyên sang, apps/web/src/dieu-hanh):
  //   Tổng quan điều hành  = nhóm "ĐIỀU HÀNH"
  //   Dashboard xã/phường  = bộ 8 dashboard theo bộ chỉ tiêu đã thông qua
  //   Quản lý địa bàn      = nhóm "QUẢN LÝ ĐỊA BÀN"
  //   Phân hệ mở rộng      = nhóm "PHÂN HỆ MỞ RỘNG"
  // "Nhiệm vụ được giao" và "Văn bản đến" của menu cũ đã là phân hệ thật ở Tác nghiệp.
  // Hai module sau là của hệ thống mới: số do các nghiệp vụ đóng góp (ADR-0007) và biểu báo cáo.
  {
    id: 'tong-quan',
    nhan: 'Tổng quan điều hành',
    nhom: 'dieu-hanh',
    maQuyen: 'TONG_QUAN',
    nguon: 'db',
    mo: 'Màn tổng quan điều hành, hồ sơ thủ tục hành chính và phản ánh kiến nghị — như GDOS trước đây.',
    con: [
      { id: 'dh-tong-quan', nhan: 'Tổng quan' },
      { id: 'dh-ho-so-tthc', nhan: 'Hồ sơ TTHC' },
      { id: 'dh-phan-anh', nhan: 'Phản ánh kiến nghị' },
    ],
  },
  {
    id: 'chi-tieu',
    nhan: 'Dashboard xã/phường',
    nhom: 'dieu-hanh',
    maQuyen: 'CHI_TIEU',
    nguon: 'db',
    mo: 'Tám dashboard theo bộ chỉ tiêu cấp xã/phường đã thông qua. Chỉ tiêu nào có số thật (phân hệ đã xây, hoặc nạp qua API / Excel ở Nguồn dữ liệu vào) thì hiện số thật kèm nguồn; còn lại là số mẫu.',
    con: [
      { id: 'dh-dashboard-tong-quan', nhan: 'Dashboard tổng quan' },
      { id: 'dh-bo-chi-so-kpi', nhan: 'Bộ chỉ số KPI' },
      { id: 'dh-tthc-mot-cua', nhan: 'TTHC – Một cửa' },
      { id: 'dh-kinh-te-dan-cu-xa-hoi', nhan: 'Kinh tế – Dân cư – Xã hội' },
      { id: 'dh-an-ninh-trat-tu', nhan: 'An ninh – Trật tự' },
      { id: 'dh-ha-tang-do-thi', nhan: 'Hạ tầng – Đô thị' },
      { id: 'dh-y-te-giao-duc', nhan: 'Y tế – Giáo dục' },
      { id: 'dh-phan-anh-kien-nghi', nhan: 'Phản ánh – Kiến nghị' },
    ],
  },
  {
    id: 'quan-ly-dia-ban',
    nhan: 'Quản lý địa bàn',
    nhom: 'dieu-hanh',
    maQuyen: 'DIA_BAN',
    nguon: 'db',
    mo: 'Chỉ tiêu kinh tế – xã hội, bộ chỉ số điều hành và trình thiết kế dashboard — như GDOS trước đây.',
    con: [
      { id: 'dh-chi-tieu-ktxh', nhan: 'Chỉ tiêu Kinh tế - Xã hội' },
      { id: 'dh-bo-chi-so', nhan: 'Bộ chỉ số điều hành' },
      { id: 'dh-thiet-ke-dashboard', nhan: 'Thiết kế Dashboard' },
    ],
  },
  {
    id: 'phan-he-mo-rong',
    nhan: 'Phân hệ mở rộng',
    nhom: 'dieu-hanh',
    maQuyen: 'MO_RONG',
    nguon: 'db',
    mo: 'Đất đai, nông nghiệp số, giáo dục & y tế, di tích, khu phố thông minh — như GDOS trước đây.',
    con: [
      { id: 'dh-dat-dai', nhan: 'Quản lý đất đai' },
      { id: 'dh-nong-nghiep', nhan: 'Nông nghiệp số' },
      { id: 'dh-giao-duc-y-te', nhan: 'Giáo dục & Y tế' },
      { id: 'dh-di-tich', nhan: 'Di tích & Địa chỉ đỏ' },
      { id: 'dh-khu-pho-thong-minh', nhan: 'Khu phố thông minh' },
    ],
  },
  {
    id: 'bo-chi-so',
    nhan: 'Tình hình nghiệp vụ',
    nhom: 'dieu-hanh',
    maQuyen: 'BO_CHI_SO',
    nguon: 'db',
    mo: 'Số liệu do các nghiệp vụ đóng góp (hiện có Dự án): tiến độ, cảnh báo, giải ngân theo từng góc nhìn; chấm điểm 100 (đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20 → A/B/C/D) và xếp hạng đơn vị.',
    con: [
      { id: 'tq-toan', nhan: 'Toàn cảnh' },
      { id: 'tq-don-vi', nhan: 'Theo đơn vị' },
      { id: 'tq-lv', nhan: 'Theo lĩnh vực' },
      { id: 'bcs-tat-ca', nhan: 'Chấm điểm thực hiện' },
      { id: 'bcs-xep-hang', nhan: 'Xếp hạng đơn vị' },
    ],
  },
  {
    id: 'bao-cao',
    nhan: 'Báo cáo',
    nhom: 'dieu-hanh',
    maQuyen: 'BAO_CAO',
    nguon: 'db',
    mo: 'Mọi biểu báo cáo của các nghiệp vụ ở một nơi — cũng mở được ngay trong từng nghiệp vụ.',
    con: [
      { id: 'bc-dinh-ky', nhan: 'Báo cáo định kỳ' },
      { id: 'bc-tat-ca', nhan: 'Tất cả báo cáo' },
      { id: 'bc-xuat', nhan: 'Xuất dữ liệu', hanhDong: 'EXPORT' },
    ],
  },

  // ── Tác nghiệp — có mã hồ sơ + thời hạn + người chịu trách nhiệm ───────
  {
    id: 'du-an',
    nhan: 'Dự án',
    nhom: 'tac-nghiep',
    maQuyen: 'DU_AN',
    nguon: 'db',
    mo: 'Danh mục dự án. Mở một dự án để vào hồ sơ: checklist tiến độ, giải ngân, vướng mắc, tài liệu.',
    con: [
      { id: 'da-tat-ca', nhan: 'Tất cả dự án' },
      { id: 'da-cua-toi', nhan: 'Dự án tôi phụ trách' },
      { id: 'da-cho-xac-nhan', nhan: 'Chờ xác nhận bước' },
      { id: 'da-tao', nhan: 'Tạo dự án mới', hanhDong: 'CREATE' },
      { id: 'da-nhap', nhan: 'Nhập từ Excel', hanhDong: 'CREATE' },
      {
        id: 'da-don-doc',
        nhan: 'Đôn đốc',
        hanhDong: 'ASSIGN',

        mo: 'Gửi nhắc việc quá hạn. Chỉ cơ quan quản lý (Điều 36 NĐ 45).',
      },
      { id: 'da-bao-cao', nhan: 'Báo cáo dự án' },
    ],
    dongGop: {
      baoCao: [
        {
          id: 'du-an-bieu-01',
          ten: 'Biểu 01 — Dự án đầu tư công',
          loai: 'dinh-ky',
          mo: 'Tổng mức, kế hoạch vốn năm, giải ngân năm theo nguồn vốn.',
          thamSo: ['nam', 'den-ngay', 'linh-vuc'],
          nhomTheo: NHOM_BAO_CAO_DU_AN,
        },
        {
          id: 'du-an-bieu-02',
          ten: 'Biểu 02 — Chi thường xuyên (chuyển tiếp)',
          loai: 'dinh-ky',
          mo: 'Hoạt động chi thường xuyên bắt đầu từ các năm trước.',
          thamSo: ['nam', 'giai-doan', 'den-ngay', 'linh-vuc'],
          nhomTheo: NHOM_BAO_CAO_DU_AN,
        },
        {
          id: 'du-an-bieu-03',
          ten: 'Biểu 03 — Chi thường xuyên (mới)',
          loai: 'dinh-ky',
          mo: 'Hoạt động chi thường xuyên bắt đầu trong năm báo cáo.',
          thamSo: ['nam', 'giai-doan', 'den-ngay', 'linh-vuc'],
          nhomTheo: NHOM_BAO_CAO_DU_AN,
        },
        {
          id: 'du-an-bc35',
          ten: 'Nghĩa vụ báo cáo Điều 35',
          loai: 'dinh-ky',
          mo: 'Dự án hoàn thành: hạn chủ đầu tư cung cấp thông tin (20 ngày), hạn tổng hợp gửi Bộ (30 ngày).',
          thamSo: ['linh-vuc'],
        },
        {
          id: 'du-an-danh-sach',
          ten: 'Danh sách dự án',
          loai: 'xuat',
          hanhDong: 'EXPORT',
          mo: 'Xuất danh sách dự án kèm tiến độ, giải ngân ra Excel.',
          thamSo: ['linh-vuc'],
          nhomTheo: NHOM_BAO_CAO_DU_AN,
        },
      ],
      chiSo: [
        {
          id: 'du-an-kpi',
          ten: 'KPI dự án',
          mo: '100 điểm: đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20 → A/B/C/D.',
        },
        {
          id: 'du-an-xep-hang',
          ten: 'Xếp hạng chủ đầu tư',
          mo: 'KPI bình quân các dự án của mỗi chủ đầu tư.',
        },
      ],
      canhBao: [
        { id: 'du-an-qua-han', ten: 'Bước dự án quá hạn', loai: 'qua-han', mo: 'Bước chưa xong đã quá hạn.' },
        {
          id: 'du-an-sap-han',
          ten: 'Bước dự án sắp đến hạn',
          loai: 'sap-han',
          mo: 'Bước chưa xong sắp đến hạn (mặc định trong 10 ngày tới — đổi ở Quy tắc cảnh báo).',
        },
        {
          id: 'du-an-lau-cap-nhat',
          ten: 'Dự án lâu không cập nhật',
          loai: 'lau-khong-cap-nhat',
          mo: 'Dự án đang thực hiện mà lâu không ai cập nhật (mặc định quá 15 ngày — đổi ở Quy tắc cảnh báo).',
        },
      ],
      viec: [
        {
          id: 'du-an-buoc',
          ten: 'Bước dự án tôi phụ trách sắp / quá hạn',
          mo: 'Dự án bạn là cán bộ phụ trách.',
        },
        {
          id: 'du-an-xac-nhan',
          ten: 'Cập nhật chờ tôi xác nhận',
          mo: 'Nhà thầu, tư vấn gửi — chờ chủ đầu tư xác nhận.',
        },
        { id: 'du-an-don-doc', ten: 'Đôn đốc gửi tới dự án tôi phụ trách', mo: 'Trong 30 ngày gần nhất.' },
        { id: 'du-an-vuong-mac', ten: 'Vướng mắc chưa giải quyết', mo: 'Ở dự án bạn phụ trách.' },
      ],
    },
  },
  {
    id: 'xu-ly-van-ban',
    nhan: 'Xử lý văn bản',
    nhom: 'tac-nghiep',
    maQuyen: 'VAN_BAN',
    nguon: 'native',
    mo: 'Văn bản đi qua Document Service của FOXAI Native. Tóm tắt, soạn thảo là chức năng của văn bản — không phải một nhóm "AI".',
    con: [
      { id: 'vb-den', nhan: 'Văn bản đến' },
      { id: 'vb-tom-tat', nhan: 'Tóm tắt văn bản' },
      { id: 'vb-soan-thao', nhan: 'Soạn thảo văn bản', hanhDong: 'CREATE' },
      { id: 'vb-phan-cong', nhan: 'Phân công từ văn bản', hanhDong: 'ASSIGN' },
      { id: 'vb-mau', nhan: 'Mẫu văn bản' },
      // Danh sách AI chọn khi phân công — cấu hình riêng của nghiệp vụ văn bản.
      { id: 'vb-don-vi', nhan: 'Đơn vị nhận việc' },
    ],
  },
  {
    id: 'don-thu',
    nhan: 'Đơn thư — Khiếu nại',
    nhom: 'tac-nghiep',
    maQuyen: 'DON_THU',
    nguon: 'db',
    phac: true,
    mo: 'Cấp 4 xếp theo HÀNH TRÌNH của một lá đơn, không đẻ nhóm "giai đoạn".',
    con: [
      { id: 'dt-tiep-nhan', nhan: 'Tiếp nhận — chờ thụ lý' },
      { id: 'dt-thu-ly', nhan: 'Đang thụ lý, xác minh' },
      { id: 'dt-giai-quyet', nhan: 'Đang giải quyết' },
      { id: 'dt-xong', nhan: 'Đã giải quyết' },
    ],
  },
  {
    id: 'nhiem-vu',
    nhan: 'Nhiệm vụ',
    nhom: 'tac-nghiep',
    maQuyen: 'NHIEM_VU',
    nguon: 'native',
    mo: 'Việc giao từ văn bản, cuộc họp, chỉ đạo — cây việc nhiều cấp của FOXAI Native (ADR-0009).',
    con: [
      { id: 'nv-cua-toi', nhan: 'Việc được giao cho tôi' },
      { id: 'nv-da-giao', nhan: 'Việc tôi đã giao' },
      { id: 'nv-theo-doi', nhan: 'Theo dõi chung' },
    ],
  },

  // ── Danh mục — chỉ lên đây khi có TỪ HAI nhóm nghiệp vụ tham chiếu ──────
  {
    id: 'dm-to-chuc',
    nhan: 'Tổ chức',
    nhom: 'danh-muc',
    maQuyen: 'DM_TO_CHUC',
    nguon: 'db',
    mo: 'Danh bạ đơn vị và cán bộ cho mọi nghiệp vụ tra cứu, chọn — chỉ đọc. Khai báo ở Tầng 2 › Đơn vị, Tài khoản.',
    con: [
      { id: 'dm-don-vi', nhan: 'Đơn vị' },
      { id: 'dm-can-bo', nhan: 'Cán bộ' },
    ],
  },
  {
    id: 'dm-nghiep-vu',
    nhan: 'Danh mục nghiệp vụ',
    nhom: 'danh-muc',
    maQuyen: 'DM_NGHIEP_VU',
    nguon: 'db',
    mo: 'Do GDOS sở hữu, sửa được. Chỉ lên đây khi có TỪ HAI nhóm nghiệp vụ dùng tới.',
    con: [
      { id: 'dm-linh-vuc', nhan: 'Lĩnh vực' },
      { id: 'dm-quy-trinh', nhan: 'Quy trình mẫu' },
      { id: 'dm-loai-vb', nhan: 'Loại văn bản' },
    ],
  },

  // ── Giám sát & Lưu vết — vết của việc đã làm, người xem là thanh tra ────
  {
    id: 'nhat-ky',
    nhan: 'Nhật ký thao tác',
    nhom: 'giam-sat',
    maQuyen: 'NHAT_KY',
    nguon: 'db',
    mo: 'Ai, lúc nào, làm gì — bằng chứng pháp lý. Do database tự ghi, không ai sửa hay xóa được.',
    con: [
      { id: 'nk-tat-ca', nhan: 'Tất cả thao tác' },
      { id: 'nk-ho-so', nhan: 'Theo hồ sơ' },
      { id: 'nk-nguoi', nhan: 'Theo người dùng' },
    ],
  },
  {
    id: 'qua-han',
    nhan: 'Hồ sơ quá hạn',
    nhom: 'giam-sat',
    maQuyen: 'QUA_HAN',
    nguon: 'db',
    mo: 'Cảnh báo đang mở của mọi nghiệp vụ. Quy tắc (hạn luật định, ngưỡng) đặt ở Tầng 2 › Quy tắc cảnh báo.',
    con: [
      { id: 'qh-sla', nhan: 'Đã quá hạn' },
      { id: 'qh-sap', nhan: 'Sắp đến hạn' },
      { id: 'qh-lau', nhan: 'Lâu không cập nhật' },
    ],
  },

  // ══ TẦNG 2 · QUẢN TRỊ HỆ THỐNG ═════════════════════════════════════════

  // ── Người dùng & Phân quyền — ai được vào, được làm gì ─────────────────
  {
    id: 'qt-tai-khoan',
    nhan: 'Tài khoản',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_TAI_KHOAN',
    nguon: 'db',
    mo: 'Tạo, khóa tài khoản; gán vai và phân công phân hệ.',
    con: [
      { id: 'tk-ds', nhan: 'Danh sách tài khoản' },
      { id: 'tk-khoa', nhan: 'Tài khoản bị khóa' },
      { id: 'tk-tao', nhan: 'Tạo tài khoản', hanhDong: 'CREATE' },
    ],
  },
  {
    id: 'qt-don-vi',
    nhan: 'Đơn vị',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_DON_VI',
    nguon: 'db',
    mo: 'Đơn vị hành chính (tỉnh, xã). Phạm vi dữ liệu của mỗi tài khoản tính theo đơn vị.',
    con: [{ id: 'dv-ds', nhan: 'Danh sách đơn vị' }],
  },
  {
    id: 'qt-vai-tro',
    nhan: 'Vai trò & quyền',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_VAI_TRO',
    nguon: 'db',
    mo: 'Ba vai cố định và ma trận quyền sinh ra từ đó. Chỉ xem.',
    con: [
      { id: 'vt-tra-cuu', nhan: 'Tra cứu phân công' },
      { id: 'vt-ma-tran', nhan: 'Ma trận quyền' },
    ],
  },
  {
    id: 'qt-dang-nhap',
    nhan: 'Chính sách đăng nhập',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_DANG_NHAP',
    nguon: 'db',
    mo: 'Khóa tạm khi nhập sai, hạn vé và phiên, độ dài mật khẩu. Chỉ quản trị ở đơn vị gốc được sửa.',
    con: [
      { id: 'ch-bao-mat', nhan: 'Mật khẩu & phiên' },
      { id: 'dn-sso', nhan: 'Đăng nhập một lần (SSO)', phac: true },
    ],
  },
  {
    id: 'qt-phe-duyet',
    nhan: 'Luồng phê duyệt',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_PHE_DUYET',
    nguon: 'db',
    phac: true,
    mo: 'Định nghĩa luồng (quy tắc) — còn việc CHỜ DUYỆT (thể hiện) nằm ở "Việc của tôi".',
    con: [
      { id: 'pd-ds', nhan: 'Luồng theo nghiệp vụ' },
      { id: 'pd-them', nhan: 'Thêm luồng mới', hanhDong: 'CREATE' },
    ],
  },

  // ── Kết nối — hệ thống nói chuyện với bên ngoài qua đâu ────────────────
  {
    id: 'qt-dich-vu',
    nhan: 'Dịch vụ nền tảng',
    nhom: 'qt-ket-noi',
    maQuyen: 'QT_DICH_VU',
    nguon: 'native',
    mo: 'Các hệ thống GDOS gọi tới: FOXAI Native trước tiên, sau là trục liên thông, Cổng dịch vụ công… Dữ liệu nghiệp vụ vẫn ở Postgres của GDOS.',
    con: [
      { id: 'kn-ds', nhan: 'Danh sách kết nối' },
      { id: 'kn-kiem-tra', nhan: 'Kiểm tra & trạng thái' },
    ],
  },
  {
    id: 'qt-ocr',
    nhan: 'Nhận dạng chứng từ (OCR)',
    nhom: 'qt-ket-noi',
    maQuyen: 'QT_OCR',
    nguon: 'native',
    mo: 'Nối OCR Service của FOXAI Native: chọn loại chứng từ và LẤY KẾT QUẢ nhận dạng về GDOS. Kết quả giữ dạng động theo từng loại; trực quan hóa và dùng thế nào là việc của phân hệ tác nghiệp.',
    con: [
      { id: 'ocr-loai', nhan: 'Loại chứng từ' },
      { id: 'ocr-ket-qua', nhan: 'Kết quả đã lấy về' },
    ],
  },
  {
    id: 'qt-nguon-vao',
    nhan: 'Nguồn dữ liệu vào',
    nhom: 'qt-ket-noi',
    maQuyen: 'QT_NGUON_VAO',
    nguon: 'db',
    mo: 'Số liệu chỉ tiêu điều hành nạp từ NGOÀI hệ thống qua hai kênh ngang hàng: API của khách và tệp Excel (khi khách không có API). Cả hai đổ vào một kho; Điều hành chỉ đọc kho đó. Đây là kênh nạp của quản trị — không phải màn nhập liệu nghiệp vụ.',
    con: [
      { id: 'nd-api', nhan: 'Nguồn API' },
      { id: 'nd-excel', nhan: 'Nạp từ Excel' },
      { id: 'nd-ket-qua', nhan: 'Kết quả lấy về' },
    ],
  },
  {
    id: 'qt-tich-hop',
    nhan: 'Tích hợp ra',
    nhom: 'qt-ket-noi',
    maQuyen: 'QT_TICH_HOP',
    nguon: 'db',
    phac: true,
    mo: 'Trình duyệt không bao giờ gọi thẳng bên thứ ba — mọi lời gọi ra đi qua máy chủ GDOS.',
    con: [
      { id: 'th-webhook', nhan: 'Webhook' },
      { id: 'th-api-key', nhan: 'API key cho đối tác' },
      { id: 'th-nhat-ky', nhan: 'Nhật ký gọi ra' },
    ],
  },

  // ── Cấu hình & Vận hành — hệ thống chạy thế nào, đang chạy ra sao ──────
  {
    id: 'qt-khai-bao',
    nhan: 'Khai báo module',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_KHAI_BAO',
    nguon: 'db',
    mo: 'Bật/tắt và đổi nhãn module theo từng khách hàng — không tách nhánh mã.',
    con: [
      { id: 'kb-cay', nhan: 'Cây phân hệ' },
      { id: 'kb-nhan', nhan: 'Nhãn theo khách hàng', phac: true },
      {
        id: 'kb-tham-so',
        nhan: 'Tham số nghiệp vụ',
        mo: 'Giá trị chỉ MỘT nghiệp vụ dùng (vd nguồn vốn của Dự án) — hai nghiệp vụ trở lên dùng thì lên Danh mục.',
      },
    ],
  },
  {
    id: 'qt-hien-thi',
    nhan: 'Hiển thị',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_HIEN_THI',
    nguon: 'db',
    mo: 'Tên và nhận diện của hệ thống, trang mặc định. Tông màu thì mỗi người tự chọn ở Cài đặt cá nhân.',
    con: [
      { id: 'ch-nhan-dien', nhan: 'Tên & nhận diện' },
      { id: 'ht-trang-dau', nhan: 'Trang mặc định theo vai' },
    ],
  },
  {
    id: 'qt-canh-bao',
    nhan: 'Quy tắc cảnh báo',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_CANH_BAO',
    nguon: 'db',
    mo: 'QUY TẮC cảnh báo. Còn cảnh báo ĐANG MỞ nằm ở Giám sát & Lưu vết.',
    con: [
      { id: 'cb-sla', nhan: 'Hạn & ngưỡng cảnh báo' },
      { id: 'cb-kenh', nhan: 'Kênh gửi thông báo', phac: true },
    ],
  },
  {
    id: 'qt-ai',
    nhan: 'Mô hình AI',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_AI',
    nguon: 'native',
    phac: true,
    mo: 'Chọn và kiểm tra mô hình — KHÔNG giữ khóa nhà cung cấp tại đây.',
    con: [
      { id: 'ai-mac-dinh', nhan: 'Mô hình mặc định' },
      { id: 'ai-giong', nhan: 'Giọng đọc' },
      { id: 'ai-han-muc', nhan: 'Hạn mức token theo đơn vị' },
    ],
  },
  {
    id: 'qt-van-hanh',
    nhan: 'Theo dõi vận hành',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_VAN_HANH',
    nguon: 'db',
    mo: 'Sức khỏe hệ thống — người xem là kỹ thuật, không phải thanh tra.',
    con: [
      { id: 'vh-suc-khoe', nhan: 'Sức khỏe hệ thống' },
      { id: 'vh-hang-doi', nhan: 'Hàng đợi xử lý' },
      { id: 'vh-tep', nhan: 'Lưu trữ tệp' },
      { id: 'vh-nhat-ky', nhan: 'Nhật ký hệ thống', phac: true },
    ],
  },
]
