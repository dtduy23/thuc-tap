import { sql, type ExtractTablesWithRelations, type SQL } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core'
import type * as schema from './schema/index.js'

type LuocDo = typeof schema
export type CoSo = PgDatabase<PgQueryResultHKT, LuocDo>
export type GiaoDich = PgTransaction<PgQueryResultHKT, LuocDo, ExtractTablesWithRelations<LuocDo>>

/** Ai đang thao tác, trên những đơn vị nào — lấy từ phiên đăng nhập. */
export interface NguCanh {
  taiKhoanId: string
  donViIds: readonly string[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * CỬA DUY NHẤT để chạm dữ liệu nghiệp vụ.
 *
 * Mở một transaction, hạ quyền xuống `gdos_app` rồi đặt ngữ cảnh đơn vị — từ
 * đó RLS lọc mọi câu truy vấn bên trong. Viết `WHERE don_vi_id = …` là thừa;
 * QUÊN viết cũng không rò (ADR-0004).
 *
 * `SET LOCAL` chỉ sống trong transaction này: connection trả về pool sạch, request
 * sau không thể thừa hưởng ngữ cảnh của request trước.
 */
export async function trongPhamVi<T>(db: CoSo, nc: NguCanh, viec: (tx: GiaoDich) => Promise<T>): Promise<T> {
  // Tài khoản không có đơn vị là cấu hình sai — báo ngay, đừng để nó "thấy 0 dòng" rồi tưởng là trống.
  if (nc.donViIds.length === 0) throw new Error('Ngữ cảnh không có đơn vị nào')
  for (const id of [nc.taiKhoanId, ...nc.donViIds]) {
    if (!UUID.test(id)) throw new Error(`Mã không hợp lệ trong ngữ cảnh: "${id}"`)
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role gdos_app`)
    await tx.execute(
      sql`select set_config('app.don_vi_ids', ${nc.donViIds.join(',')}, true),
                 set_config('app.tai_khoan_id', ${nc.taiKhoanId}, true)`,
    )
    return viec(tx)
  })
}

/**
 * Câu SQL viết tay (gọi hàm, `current_user`…) trả về các dòng có kiểu rõ ràng.
 * Qua kiểu chung `CoSo`, `execute` ra `unknown`; cả node-postgres lẫn PGlite
 * đều trả `{ rows }`, nên chuẩn hóa ở một chỗ thay vì ép kiểu rải rác.
 */
export async function truyVan<T>(tx: GiaoDich, cau: SQL): Promise<T[]> {
  const kq = (await tx.execute(cau)) as { rows: T[] }
  return kq.rows
}

/**
 * Chạy dưới `gdos_app` nhưng KHÔNG có ngữ cảnh đơn vị — chỉ dùng cho đăng nhập,
 * lúc chưa biết người dùng là ai. RLS che hết; chỉ gọi được các hàm SECURITY
 * DEFINER đã cấp quyền (dang_nhap_tim, dang_nhap_ghi).
 */
export async function khongNguCanh<T>(db: CoSo, viec: (tx: GiaoDich) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role gdos_app`)
    return viec(tx)
  })
}

/** Mã lỗi Postgres của một lỗi từ Drizzle (Drizzle bọc lỗi gốc trong `cause`). */
export function maLoiPg(e: unknown): string | undefined {
  let x: unknown = e
  for (
    let sau = 0;
    sau < 5 && x !== null && typeof x === 'object';
    sau++, x = (x as { cause?: unknown }).cause
  ) {
    const ma = (x as { code?: unknown }).code
    if (typeof ma === 'string' && /^[0-9A-Z]{5}$/.test(ma)) return ma
  }
  return undefined
}

/** 23505 — trùng giá trị của một chỉ mục duy nhất. */
export const TRUNG_KHOA = '23505'
