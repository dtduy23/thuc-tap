import { defineConfig } from 'drizzle-kit'

// Migration sinh ra nằm ở ./drizzle và ĐƯỢC commit — đó là lịch sử lược đồ.
// Migration chạy bằng CHỦ BẢNG; API thì không bao giờ (ADR-0004).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL_CHU_BANG || process.env.DATABASE_URL || '' },
  strict: true,
  verbose: true,
})
