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

export const DANH_SACH_MODULE: readonly ModuleDef[] = [
  // ══ TẦNG 1 · NGHIỆP VỤ ═════════════════════════════════════════════════

  // ── Điều hành — đọc tổng hợp nhiều hồ sơ, không sửa gì ─────────────────
  {
    id: 'tong-quan',
    nhan: 'Tổng quan',
    nhom: 'dieu-hanh',
    maQuyen: 'TONG_QUAN',
    nguon: 'db',
    phac: true,
    mo: 'Bức tranh chung của mọi nghiệp vụ: tiến độ, cảnh báo, giải ngân. Mỗi nghiệp vụ góp thẻ số liệu của mình (ADR-0007).',
    con: [
      { id: 'tq-toan', nhan: 'Toàn cảnh' },
      { id: 'tq-don-vi', nhan: 'Theo đơn vị' },
      { id: 'tq-lv', nhan: 'Theo lĩnh vực' },
    ],
  },
  {
    id: 'bao-cao',
    nhan: 'Báo cáo điều hành',
    nhom: 'dieu-hanh',
    maQuyen: 'BAO_CAO',
    nguon: 'db',
    phac: true,
    mo: 'Trung tâm báo cáo của mọi nghiệp vụ. Báo cáo do module nghiệp vụ khai báo một lần, hiện cả ở đây lẫn trong module (ADR-0007).',
    con: [
      { id: 'bc-tat-ca', nhan: 'Tất cả báo cáo' },
      { id: 'bc-dinh-ky', nhan: 'Báo cáo định kỳ' },
      { id: 'bc-xuat', nhan: 'Xuất dữ liệu', hanhDong: 'EXPORT' },
    ],
  },
  {
    id: 'bo-chi-so',
    nhan: 'Bộ chỉ số',
    nhom: 'dieu-hanh',
    maQuyen: 'BO_CHI_SO',
    nguon: 'db',
    phac: true,
    mo: 'KPI 100 điểm: đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20 → A/B/C/D.',
    con: [
      { id: 'bcs-tat-ca', nhan: 'Tất cả chỉ số' },
      { id: 'bcs-xep-hang', nhan: 'Xếp hạng đơn vị' },
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
      { id: 'da-nhap', nhan: 'Nhập từ Excel', hanhDong: 'CREATE', phac: true },
      {
        id: 'da-don-doc',
        nhan: 'Đôn đốc',
        hanhDong: 'ASSIGN',
        phac: true,
        mo: 'Gửi nhắc việc quá hạn. Chỉ cơ quan quản lý (Điều 36 NĐ 45).',
      },
      { id: 'da-bao-cao', nhan: 'Báo cáo dự án', phac: true },
    ],
  },
  {
    id: 'xu-ly-van-ban',
    nhan: 'Xử lý văn bản',
    nhom: 'tac-nghiep',
    maQuyen: 'VAN_BAN',
    nguon: 'native',
    phac: true,
    mo: 'Văn bản đi qua Document Service của FOXAI Native. Tóm tắt, soạn thảo là chức năng của văn bản — không phải một nhóm "AI".',
    con: [
      { id: 'vb-den', nhan: 'Văn bản đến' },
      { id: 'vb-tom-tat', nhan: 'Tóm tắt văn bản' },
      { id: 'vb-soan-thao', nhan: 'Soạn thảo văn bản', hanhDong: 'CREATE' },
      { id: 'vb-phan-cong', nhan: 'Phân công từ văn bản', hanhDong: 'ASSIGN' },
      { id: 'vb-mau', nhan: 'Mẫu văn bản' },
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
    nguon: 'db',
    phac: true,
    mo: 'Việc giao từ văn bản, cuộc họp, chỉ đạo.',
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
    phac: true,
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
    phac: true,
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
      { id: 'nk-ho-so', nhan: 'Theo hồ sơ', phac: true },
      { id: 'nk-nguoi', nhan: 'Theo người dùng', phac: true },
    ],
  },
  {
    id: 'qua-han',
    nhan: 'Hồ sơ quá hạn',
    nhom: 'giam-sat',
    maQuyen: 'QUA_HAN',
    nguon: 'db',
    phac: true,
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
    mo: 'Ba vai cố định (ADR-0006) và ma trận quyền sinh ra từ đó. Chỉ xem — vai đổi bằng ADR, không đổi bằng màn hình.',
    con: [
      { id: 'vt-tra-cuu', nhan: 'Tra cứu phân công', phac: true },
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
    phac: true,
    mo: 'Các hệ thống GDOS gọi tới: FOXAI Native trước tiên, sau là trục liên thông, Cổng dịch vụ công… Dữ liệu nghiệp vụ vẫn ở Postgres của GDOS.',
    con: [
      { id: 'kn-ds', nhan: 'Danh sách kết nối' },
      { id: 'kn-kiem-tra', nhan: 'Kiểm tra & trạng thái' },
    ],
  },
  {
    id: 'qt-nguon-vao',
    nhan: 'Nguồn dữ liệu vào',
    nhom: 'qt-ket-noi',
    maQuyen: 'QT_NGUON_VAO',
    nguon: 'native',
    phac: true,
    mo: 'Khai nguồn cho Hỏi đáp AI. Kết nối thật do Context Service làm phía máy chủ.',
    con: [
      { id: 'nd-graphql', nhan: 'Nguồn GraphQL / ERP' },
      { id: 'nd-ban-sao', nhan: 'Bản sao dữ liệu' },
      { id: 'nd-cong-cu', nhan: 'Công cụ API' },
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
    phac: true,
    mo: 'Bật/tắt và đổi nhãn module theo từng khách hàng — không tách nhánh mã.',
    con: [
      { id: 'kb-cay', nhan: 'Cây phân hệ' },
      { id: 'kb-nhan', nhan: 'Nhãn theo khách hàng' },
      { id: 'kb-tham-so', nhan: 'Tham số nghiệp vụ' },
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
      { id: 'ht-trang-dau', nhan: 'Trang mặc định theo vai', phac: true },
    ],
  },
  {
    id: 'qt-canh-bao',
    nhan: 'Quy tắc cảnh báo',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_CANH_BAO',
    nguon: 'db',
    phac: true,
    mo: 'QUY TẮC cảnh báo. Còn cảnh báo ĐANG MỞ nằm ở Giám sát & Lưu vết.',
    con: [
      { id: 'cb-sla', nhan: 'Hạn & ngưỡng cảnh báo' },
      { id: 'cb-kenh', nhan: 'Kênh gửi thông báo' },
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
    phac: true,
    mo: 'Sức khỏe hệ thống — người xem là kỹ thuật, không phải thanh tra.',
    con: [
      { id: 'vh-suc-khoe', nhan: 'Sức khỏe hệ thống' },
      { id: 'vh-hang-doi', nhan: 'Hàng đợi xử lý' },
      { id: 'vh-tep', nhan: 'Lưu trữ tệp' },
      { id: 'vh-nhat-ky', nhan: 'Nhật ký hệ thống' },
    ],
  },
]
