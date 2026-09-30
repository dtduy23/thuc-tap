import type { OnApplicationShutdown } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type { CauHinh } from '../cau-hinh.js'
import { moDbNhung, type KetNoiDb } from './migration.js'
import type { CoSo } from './pham-vi.js'
import * as schema from './schema/index.js'

export type TrangThaiDb = 'ok' | 'chua-cau-hinh' | 'khong-ket-noi'

/** Chờ tối đa bấy nhiêu cho một lần kiểm tra — /health không được treo theo DB. */
const HAN_KIEM_TRA_MS = 2000

/**
 * Kết nối database dùng chung — tạo bằng `CoSoDuLieu.tao()` trong app.module.ts.
 *
 *   DATABASE_URL  → Postgres thật qua pool. Pool tạo lười: sai mật khẩu hay DB
 *                   chưa lên thì API vẫn khởi động, /health/deps báo lỗi.
 *   DB_NHUNG=1    → PGlite ghi ra thư mục, cho máy dev không có Docker.
 *   không có gì   → API vẫn lên để xem /health; mọi thao tác dữ liệu báo 503.
 *
 * Không dùng `db` trực tiếp để chạm dữ liệu nghiệp vụ — đi qua `trongPhamVi()`
 * (pham-vi.ts), nơi hạ quyền xuống gdos_app và đặt ngữ cảnh đơn vị cho RLS.
 */
export class CoSoDuLieu implements OnApplicationShutdown {
  private constructor(private readonly ketNoi: KetNoiDb | undefined) {}

  get db(): CoSo | undefined {
    return this.ketNoi?.db
  }

  static async tao(cauHinh: CauHinh): Promise<CoSoDuLieu> {
    if (cauHinh.dbNhung) {
      const kn = await moDbNhung(cauHinh.dbNhung)
      console.warn(`⚠ Đang dùng database NHÚNG (PGlite) tại ${cauHinh.dbNhung} — chỉ dành cho máy dev`)
      return new CoSoDuLieu(kn)
    }
    if (cauHinh.duongDanDb) {
      const pool = new pg.Pool({ connectionString: cauHinh.duongDanDb, max: 10 })
      return new CoSoDuLieu({
        db: drizzle(pool, { schema }),
        kiem: () => pool.query('select 1'),
        dong: () => pool.end(),
      })
    }
    return new CoSoDuLieu(undefined)
  }

  async kiemTra(): Promise<TrangThaiDb> {
    if (!this.ketNoi) return 'chua-cau-hinh'
    try {
      await Promise.race([
        this.ketNoi.kiem(),
        new Promise((_, tuChoi) => setTimeout(() => tuChoi(new Error('quá hạn')), HAN_KIEM_TRA_MS)),
      ])
      return 'ok'
    } catch {
      return 'khong-ket-noi'
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.ketNoi?.dong()
  }
}
