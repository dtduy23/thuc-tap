/**
 * Cấu hình đọc từ biến môi trường — một chỗ duy nhất, kiểm tra ngay lúc khởi động.
 *
 * Luật: thiếu thứ bắt buộc thì DỪNG, không lặng lẽ dùng giá trị dự phòng.
 * GDOS cũ từng để `https://nativev3.foxai.com.vn` làm mặc định, PMS từng có
 * JWT_SECRET dự phòng công khai — cả hai đều chạy "được" cho tới ngày chạy sai.
 */
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export type MoiTruong = 'development' | 'test' | 'production'

export interface CauHinh {
  moiTruong: MoiTruong
  cong: number
  /** Chưa cấu hình ở máy dev thì API vẫn lên để xem /health; production thì bắt buộc. */
  duongDanDb: string | undefined
  /**
   * Thư mục database NHÚNG (PGlite) cho máy dev không có Docker — bật bằng DB_NHUNG=1.
   * Cùng migration, cùng RLS như Postgres thật. Production CẤM.
   */
  dbNhung: string | undefined
  phienBan: string
  /** Khóa ký vé đăng nhập. Production bắt buộc; dev thiếu thì sinh tạm mỗi lần chạy. */
  khoaKyVe: string
  /** Thư mục kho tệp đính kèm (KHO_TEP_THU_MUC). Production bắt buộc đặt tường minh. */
  thuMucTep: string
  /** Cookie chỉ gửi qua HTTPS. Bật ở production; máy dev chạy http://localhost nên tắt. */
  cookieAnToan: boolean
  /**
   * Địa chỉ được tin khi đọc X-Forwarded-For — IP này đi vào nhật ký phiên
   * đăng nhập, nên tin sai là ghi sai người. Mặc định `loopback`: chỉ nginx
   * chạy cùng máy. Trong Docker, nginx là container KHÁC nên IP nguồn là IP
   * mạng nội bộ của compose — phải khai mạng đó qua TIN_PROXY, ví dụ
   * `TIN_PROXY=172.31.0.0/16`. Có proxy ở ngoài nữa thì thêm cả IP proxy đó.
   */
  tinProxy: string
  /**
   * FOXAI Native (ADR-0009). `gia`: bản giả cho máy dev (NATIVE_GIA=1, production cấm).
   * `url`: địa chỉ Native thật (NATIVE_URL) — KHÔNG có giá trị mặc định (GDOS cũ từng
   * để sẵn nativev3 làm mặc định). Vắng cả hai: tính năng gọi Native báo "chưa kết nối".
   */
  native: { gia: boolean; url: string | undefined }
}

export const CAU_HINH = Symbol('CAU_HINH')

const MOI_TRUONG: readonly MoiTruong[] = ['development', 'test', 'production']
const DO_DAI_KHOA_TOI_THIEU = 32

export function docCauHinh(env: NodeJS.ProcessEnv = process.env): CauHinh {
  const moiTruong = (env.NODE_ENV ?? 'development') as MoiTruong
  if (!MOI_TRUONG.includes(moiTruong)) {
    throw new Error(`NODE_ENV="${env.NODE_ENV}" không hợp lệ — chỉ nhận ${MOI_TRUONG.join(' | ')}`)
  }
  const laProduction = moiTruong === 'production'

  // Tên riêng API_PORT, KHÔNG dùng PORT chung chung: công cụ chạy dev và nhiều
  // nền tảng triển khai tự đặt PORT cho cả nhóm tiến trình — API từng lặng lẽ
  // chiếm luôn cổng của web (trên Windows cả hai đều bind được, lỗi rất khó thấy).
  const cong = Number(env.API_PORT ?? 4100)
  if (!Number.isInteger(cong) || cong < 1 || cong > 65535) {
    throw new Error(`API_PORT="${env.API_PORT}" không phải cổng hợp lệ`)
  }

  const duongDanDb = env.DATABASE_URL?.trim() || undefined
  if (laProduction && !duongDanDb) {
    throw new Error('Thiếu DATABASE_URL — môi trường production không được chạy khi chưa nối cơ sở dữ liệu')
  }

  let dbNhung: string | undefined
  if (env.DB_NHUNG === '1') {
    if (laProduction) throw new Error('DB_NHUNG chỉ dùng ở máy dev — production phải dùng Postgres thật')
    if (duongDanDb) throw new Error('Đặt DATABASE_URL hoặc DB_NHUNG=1, không đặt cả hai')
    // pnpm chạy script với thư mục hiện tại là apps/api → mặc định <gốc repo>/.data/pglite
    dbNhung = resolve(env.DB_NHUNG_THU_MUC?.trim() || '../../.data/pglite')
  }

  let khoaKyVe = env.AUTH_SECRET?.trim() ?? ''
  if (!khoaKyVe) {
    if (laProduction)
      throw new Error('Thiếu AUTH_SECRET — production không được chạy với khóa ký vé đoán được')
    // Dev/test: khóa ngẫu nhiên mỗi lần chạy — khởi động lại là phải đăng nhập lại, không sao.
    khoaKyVe = randomBytes(32).toString('base64url')
  } else if (khoaKyVe.length < DO_DAI_KHOA_TOI_THIEU) {
    throw new Error(`AUTH_SECRET phải dài ít nhất ${DO_DAI_KHOA_TOI_THIEU} ký tự`)
  }

  // Kho tệp: production phải nói rõ lưu ở đâu (ổ đĩa gắn vào container); dev mặc định
  // <gốc repo>/.data/tep (đã gitignore); test dùng thư mục tạm, không bẩn repo.
  const thuMucTep =
    env.KHO_TEP_THU_MUC?.trim() ||
    (laProduction
      ? (() => {
          throw new Error('Thiếu KHO_TEP_THU_MUC — production phải chỉ rõ thư mục lưu tệp đính kèm')
        })()
      : moiTruong === 'test'
        ? join(tmpdir(), 'gdos-tep-test')
        : resolve('../../.data/tep'))

  // Cố tình KHÔNG mặc định là "tin mọi proxy": để `true` thì bất cứ ai cũng tự
  // khai được IP của mình bằng một header, và nhật ký đăng nhập thành vô nghĩa.
  const tinProxy = env.TIN_PROXY?.trim() || 'loopback'

  const nativeGia = env.NATIVE_GIA === '1'
  if (nativeGia && laProduction)
    throw new Error('NATIVE_GIA chỉ dùng ở máy dev — production phải nối Native thật')
  const nativeUrl = env.NATIVE_URL?.trim().replace(/\/+$/, '') || undefined
  if (nativeUrl && !/^https?:\/\/[^\s/]+/.test(nativeUrl))
    throw new Error(`NATIVE_URL="${nativeUrl}" không phải địa chỉ http(s)`)
  if (nativeUrl && laProduction && !nativeUrl.startsWith('https://'))
    throw new Error('NATIVE_URL ở production phải là https://')

  return {
    moiTruong,
    native: { gia: nativeGia, url: nativeUrl },
    thuMucTep,
    cong,
    duongDanDb,
    dbNhung,
    phienBan: env.APP_VERSION?.trim() || 'dev',
    khoaKyVe,
    cookieAnToan: laProduction,
    tinProxy,
  }
}
