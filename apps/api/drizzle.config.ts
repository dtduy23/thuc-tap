import { defineConfig } from 'drizzle-kit'

// Migration sinh ra nằm ở ./drizzle và ĐƯỢC commit — đó là lịch sử lược đồ.
// Bảng đầu tiên xuất hiện ở Mốc 1 (tài khoản, đơn vị, quyền, nhật ký).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
})
