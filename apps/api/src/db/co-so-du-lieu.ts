import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import * as schema from './schema/index.js'

export type TrangThaiDb = 'ok' | 'chua-cau-hinh' | 'khong-ket-noi'

/** Chờ tối đa bấy nhiêu cho một lần kiểm tra — /health không được treo theo DB. */
const HAN_KIEM_TRA_MS = 2000

/**
 * Kết nối Postgres dùng chung. Pool tạo lười: máy dev chưa có DB thì API vẫn
 * lên, chỉ /health/deps báo "chua-cau-hinh".
 *
 * Mốc 1 thêm ở đây: mỗi request chạy trong một transaction có
 * `SET LOCAL app.user_id / app.org_ids` để RLS lọc theo đơn vị (ADR-0004).
 */
@Injectable()
export class CoSoDuLieu implements OnApplicationShutdown {
  private readonly pool: pg.Pool | undefined
  readonly db: NodePgDatabase<typeof schema> | undefined

  constructor(@Inject(CAU_HINH) cauHinh: CauHinh) {
    if (cauHinh.duongDanDb) {
      this.pool = new pg.Pool({ connectionString: cauHinh.duongDanDb, max: 10 })
      this.db = drizzle(this.pool, { schema })
    }
  }

  async kiemTra(): Promise<TrangThaiDb> {
    if (!this.pool) return 'chua-cau-hinh'
    try {
      await Promise.race([
        this.pool.query('select 1'),
        new Promise((_, tuChoi) => setTimeout(() => tuChoi(new Error('quá hạn')), HAN_KIEM_TRA_MS)),
      ])
      return 'ok'
    } catch {
      return 'khong-ket-noi'
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end()
  }
}
