/**
 * Lệnh khởi tạo trên server:
 *
 *   pnpm --filter @gdos/api build
 *   pnpm --filter @gdos/api khoi-tao -- --don-vi-ma XA-01 --don-vi-ten "Xã …" --cap xa \
 *                                       --ten-dang-nhap quantri --ho-ten "Quản trị hệ thống" [--toan-quyen]
 *
 * 1. Chạy migration (idempotent).
 * 2. Tạo đơn vị gốc + quản trị viên đầu tiên — bỏ qua nếu đã có quản trị viên.
 *
 * Mật khẩu KHÔNG BAO GIỜ đi qua tham số dòng lệnh (lộ trong lịch sử shell và
 * danh sách tiến trình): nhập ẩn từ bàn phím, hoặc biến môi trường
 * GDOS_MAT_KHAU_QUAN_TRI khi chạy tự động.
 *
 * Kết nối bằng CHỦ BẢNG: DATABASE_URL_CHU_BANG, không có thì DATABASE_URL.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import pg from 'pg'
import * as schema from '../db/schema/index.js'
import { khoiTaoHeThong } from '../khoi-tao/khoi-tao.js'

/** Đọc một dòng từ bàn phím mà không hiện ký tự nào — như lệnh sudo. */
function hoiAn(cauHoi: string): Promise<string> {
  const vao = process.stdin
  process.stdout.write(cauHoi)
  if (!vao.isTTY) {
    // Có ống dẫn vào (echo … | lệnh): đọc dòng đầu.
    return new Promise((xong) => {
      let du = ''
      vao.setEncoding('utf8')
      vao.on('data', (d: string) => (du += d))
      vao.on('end', () => xong(du.split(/\r?\n/)[0] ?? ''))
    })
  }
  return new Promise((xong) => {
    let kq = ''
    vao.setRawMode(true)
    vao.resume()
    vao.setEncoding('utf8')
    const nghe = (kyTu: string) => {
      for (const c of kyTu) {
        if (c === '\r' || c === '\n') {
          vao.setRawMode(false)
          vao.pause()
          vao.off('data', nghe)
          process.stdout.write('\n')
          return xong(kq)
        }
        if (c === '\u0003') process.exit(130) // Ctrl+C
        if (c === '\u007f' || c === '\b') kq = kq.slice(0, -1)
        else kq += c
      }
    }
    vao.on('data', nghe)
  })
}

async function chay() {
  const { values: t } = parseArgs({
    options: {
      'don-vi-ma': { type: 'string' },
      'don-vi-ten': { type: 'string' },
      cap: { type: 'string', default: 'xa' },
      'ten-dang-nhap': { type: 'string', default: 'quantri' },
      'ho-ten': { type: 'string', default: 'Quản trị hệ thống' },
      'toan-quyen': { type: 'boolean', default: false },
    },
  })
  const thieu = ['don-vi-ma', 'don-vi-ten'].filter((k) => !t[k as keyof typeof t])
  if (thieu.length) throw new Error(`Thiếu tham số: ${thieu.map((k) => `--${k}`).join(', ')}`)
  if (t.cap !== 'tinh' && t.cap !== 'xa') throw new Error('--cap chỉ nhận "tinh" hoặc "xa"')

  const url = process.env.DATABASE_URL_CHU_BANG?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('Thiếu DATABASE_URL_CHU_BANG (hoặc DATABASE_URL)')

  let matKhau = process.env.GDOS_MAT_KHAU_QUAN_TRI ?? ''
  if (!matKhau) {
    matKhau = await hoiAn('Mật khẩu quản trị viên: ')
    if ((await hoiAn('Nhập lại: ')) !== matKhau) throw new Error('Hai lần nhập không khớp')
  }

  const pool = new pg.Pool({ connectionString: url, max: 1 })
  try {
    const db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) })
    console.log('✓ Migration xong')

    const kq = await khoiTaoHeThong(db, {
      donVi: { ma: t['don-vi-ma']!, ten: t['don-vi-ten']!, cap: t.cap },
      quanTri: { tenDangNhap: t['ten-dang-nhap'], hoTen: t['ho-ten'], matKhau },
      toanQuyen: t['toan-quyen'],
    })
    console.log(
      kq === 'da-tao'
        ? `✓ Đã tạo quản trị viên "${t['ten-dang-nhap']}"${t['toan-quyen'] ? ' (toàn quyền — chỉ dùng lúc xây dựng)' : ''}`
        : '• Đã có quản trị viên — không làm gì thêm',
    )
  } finally {
    await pool.end()
  }
}

chay().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
