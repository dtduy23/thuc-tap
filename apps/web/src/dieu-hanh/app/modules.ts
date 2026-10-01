/**
 * Các màn ĐIỀU HÀNH chép từ GDOS cũ — bảng tra thay cho registry `app/modules.ts` của bản cũ.
 * `id` và `gocKey` giữ nguyên như bản cũ (dữ liệu mẫu và các nút "mở phân hệ nguồn" tham chiếu
 * theo hai khóa này); `chucNang` là mã chức năng tương ứng trong registry của hệ thống mới
 * (@gdos/shared, dang-ky.ts).
 */
export interface ModuleDef {
  /** Mã module trong GDOS cũ. */
  id: string
  /** Khóa view trong bản gốc. */
  gocKey: string
  nhan: string
  /** Màu biểu tượng của module trong bản gốc. */
  mau: string
  /** Mã chức năng trong hệ thống mới. */
  chucNang: string
}

const m = (id: string, gocKey: string, nhan: string, mau: string, chucNang = `dh-${id}`): ModuleDef => ({
  id,
  gocKey,
  nhan,
  mau,
  chucNang,
})

export const MODULES: readonly ModuleDef[] = [
  // Nhóm ĐIỀU HÀNH
  m('tong-quan', 'tongquan', 'Tổng quan', '#1B66E0'),
  m('ho-so-tthc', 'tthc', 'Hồ sơ TTHC', '#1B66E0'),
  m('phan-anh', 'phananh', 'Phản ánh kiến nghị', '#D97E06'),
  // Hai mục này hệ thống mới đã có phân hệ thật — dẫn sang đó.
  m('nhiem-vu', 'nhiemvu', 'Nhiệm vụ được giao', '#0E9488', 'nv-cua-toi'),
  m('van-ban-den', 'vanban', 'Văn bản đến', '#7C3AED', 'vb-den'),
  // Dashboard Xã/Phường (bộ chỉ tiêu đã thông qua)
  m('dashboard-tong-quan', 'xp-overview', 'Dashboard tổng quan', '#2A78D6'),
  m('bo-chi-so-kpi', 'xp-kpi', 'Bộ chỉ số KPI', '#0E9488'),
  m('tthc-mot-cua', 'xp-tthc', 'TTHC – Một cửa', '#1B66E0'),
  m('kinh-te-dan-cu-xa-hoi', 'xp-ktxh', 'Kinh tế – Dân cư – Xã hội', '#1B66E0'),
  m('an-ninh-trat-tu', 'xp-antt', 'An ninh – Trật tự', '#C2410C'),
  m('ha-tang-do-thi', 'xp-ht', 'Hạ tầng – Đô thị', '#B7791F'),
  m('y-te-giao-duc', 'xp-ytgd', 'Y tế – Giáo dục', '#D93843'),
  m('phan-anh-kien-nghi', 'xp-pakn', 'Phản ánh – Kiến nghị', '#7C3AED'),
  // Nhóm QUẢN LÝ ĐỊA BÀN
  m('chi-tieu-ktxh', 'ktxh', 'Chỉ tiêu Kinh tế - Xã hội', '#1B66E0'),
  m('bo-chi-so', 'chiso', 'Bộ chỉ số điều hành', '#0E9488'),
  m('thiet-ke-dashboard', 'dashboard', 'Thiết kế Dashboard', '#C2410C'),
  // Nhóm PHÂN HỆ MỞ RỘNG
  m('dat-dai', 'datdai', 'Quản lý đất đai', '#B7791F'),
  m('nong-nghiep', 'nongnghiep', 'Nông nghiệp số', '#12A150'),
  m('giao-duc-y-te', 'gdyt', 'Giáo dục & Y tế', '#D93843'),
  m('di-tich', 'ditich', 'Di tích & Địa chỉ đỏ', '#7C3AED'),
  m('khu-pho-thong-minh', 'apthongminh', 'Khu phố thông minh', '#0E9488'),
]

export const timModule = (id: string): ModuleDef | undefined => MODULES.find((x) => x.id === id)

/** Mã chức năng (hệ thống mới) của một module GDOS cũ; không có thì về trang Tổng quan. */
export const chucNangCua = (id: string): string => timModule(id)?.chucNang ?? 'dh-tong-quan'
