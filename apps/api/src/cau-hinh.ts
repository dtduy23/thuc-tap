/**
 * Cấu hình đọc từ biến môi trường — một chỗ duy nhất, kiểm tra ngay lúc khởi động.
 *
 * Luật: thiếu thứ bắt buộc thì DỪNG, không lặng lẽ dùng giá trị dự phòng.
 * GDOS cũ từng để `https://nativev3.foxai.com.vn` làm mặc định, PMS từng có
 * JWT_SECRET dự phòng công khai — cả hai đều chạy "được" cho tới ngày chạy sai.
 */

export type MoiTruong = 'development' | 'test' | 'production'

export interface CauHinh {
  moiTruong: MoiTruong
  cong: number
  /** Chưa cấu hình ở máy dev thì API vẫn lên để xem /health; production thì bắt buộc. */
  duongDanDb: string | undefined
  phienBan: string
}

export const CAU_HINH = Symbol('CAU_HINH')

const MOI_TRUONG: readonly MoiTruong[] = ['development', 'test', 'production']

export function docCauHinh(env: NodeJS.ProcessEnv = process.env): CauHinh {
  const moiTruong = (env.NODE_ENV ?? 'development') as MoiTruong
  if (!MOI_TRUONG.includes(moiTruong)) {
    throw new Error(`NODE_ENV="${env.NODE_ENV}" không hợp lệ — chỉ nhận ${MOI_TRUONG.join(' | ')}`)
  }

  // Tên riêng API_PORT, KHÔNG dùng PORT chung chung: công cụ chạy dev và nhiều
  // nền tảng triển khai tự đặt PORT cho cả nhóm tiến trình — API từng lặng lẽ
  // chiếm luôn cổng của web (trên Windows cả hai đều bind được, lỗi rất khó thấy).
  const cong = Number(env.API_PORT ?? 4100)
  if (!Number.isInteger(cong) || cong < 1 || cong > 65535) {
    throw new Error(`API_PORT="${env.API_PORT}" không phải cổng hợp lệ`)
  }

  const duongDanDb = env.DATABASE_URL?.trim() || undefined
  if (moiTruong === 'production' && !duongDanDb) {
    throw new Error('Thiếu DATABASE_URL — môi trường production không được chạy khi chưa nối cơ sở dữ liệu')
  }

  return { moiTruong, cong, duongDanDb, phienBan: env.APP_VERSION?.trim() || 'dev' }
}
