/**
 * Lệnh DI TRÚ LƯỢC ĐỒ — chỉ chạy migration, không tạo dữ liệu gì.
 *
 *   node dist/cli/di-tru.js
 *
 * Đây là bước chạy trước mỗi lần triển khai (xem job `trien-khai` trong
 * .gitlab-ci.yml). Tách khỏi `khoi-tao` vì `khoi-tao` còn tạo đơn vị gốc và
 * quản trị viên đầu tiên — việc chỉ làm ĐÚNG MỘT LẦN, có nhập mật khẩu, không
 * được nằm trong đường triển khai tự động.
 *
 * Kết nối bằng CHỦ BẢNG: DATABASE_URL_CHU_BANG, không có thì DATABASE_URL —
 * role `gdos_app` của API không có quyền đổi lược đồ (ADR-0004).
 */
import { moPostgresVaDiTru } from '../db/migration.js'

async function chay() {
  const url = process.env.DATABASE_URL_CHU_BANG?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('Thiếu DATABASE_URL_CHU_BANG (hoặc DATABASE_URL)')

  const kn = await moPostgresVaDiTru(url)
  try {
    console.log('✓ Migration xong')
  } finally {
    await kn.dong()
  }
}

chay().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
