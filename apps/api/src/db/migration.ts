import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { CoSo } from './pham-vi.js'
import * as schema from './schema/index.js'

/** Thư mục migration — đúng từ cả `src/db` (test) lẫn `dist/db` (bản build). */
export const THU_MUC_MIGRATION = fileURLToPath(new URL('../../drizzle', import.meta.url))

export interface KetNoiDb {
  db: CoSo
  kiem: () => Promise<unknown>
  dong: () => Promise<void>
}

/**
 * Mở database NHÚNG (PGlite) ghi ra thư mục, chạy đủ migration. Chỉ dùng ở máy
 * dev (cau-hinh.ts chặn production). Nạp động: gói PGlite là devDependency,
 * bản chạy production không có và không bao giờ đi vào nhánh này.
 */
export async function moDbNhung(thuMuc: string): Promise<KetNoiDb> {
  const { PGlite } = await import('@electric-sql/pglite')
  const { citext } = await import('@electric-sql/pglite/contrib/citext')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')

  mkdirSync(thuMuc, { recursive: true })
  const pg = await PGlite.create(thuMuc, { extensions: { citext } })
  const db = drizzle(pg, { schema })
  await migrate(db, { migrationsFolder: THU_MUC_MIGRATION })
  return {
    db: db as unknown as CoSo,
    kiem: () => pg.query('select 1'),
    dong: () => pg.close(),
  }
}
