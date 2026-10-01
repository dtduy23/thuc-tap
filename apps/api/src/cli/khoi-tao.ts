/**
 * Lệnh khởi tạo trên server:
 *
 *   pnpm --filter @gdos/api build
 *   pnpm --filter @gdos/api khoi-tao --don-vi-ma XA-01 --don-vi-ten "Xã …" --cap xa \
 *                                    --ten-dang-nhap quantri --ho-ten "Quản trị hệ thống" [--toan-quyen]
 *
 * 1. Chạy migration (idempotent).
 * 2. Tạo đơn vị gốc + quản trị viên đầu tiên — bỏ qua nếu đã có quản trị viên.
 *
 * Mật khẩu KHÔNG BAO GIỜ đi qua tham số dòng lệnh (lộ trong lịch sử shell và
 * danh sách tiến trình): nhập ẩn từ bàn phím, hoặc biến môi trường
 * GDOS_MAT_KHAU_QUAN_TRI khi chạy tự động.
 *
 * Kết nối bằng CHỦ BẢNG: DATABASE_URL_CHU_BANG, không có thì DATABASE_URL.
 * Máy dev không có Docker: DB_NHUNG=1 → khởi tạo thẳng vào database nhúng.
 * (Tắt `pnpm dev` trước — database nhúng chỉ mở được từ một tiến trình.)
 */
import { parseArgs } from 'node:util'
import { docCauHinh } from '../cau-hinh.js'
import { moDbNhung, moPostgresVaDiTru } from '../db/migration.js'
import { khoiTaoHeThong } from '../khoi-tao/khoi-tao.js'
import { hoiAn } from './hoi-an.js'

async function chay() {
  // pnpm 11 chuyển nguyên dấu "--" vào lệnh; parseArgs hiểu đó là "hết tham số".
  // Nhân viên gõ theo kiểu nào (có hay không "--") cũng phải chạy.
  const thamSo = process.argv.slice(2)
  if (thamSo[0] === '--') thamSo.shift()
  const { values: t } = parseArgs({
    args: thamSo,
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

  const ch = docCauHinh()
  const url = process.env.DATABASE_URL_CHU_BANG?.trim() || ch.duongDanDb
  if (!url && !ch.dbNhung)
    throw new Error('Thiếu DATABASE_URL_CHU_BANG (hoặc DATABASE_URL, hoặc DB_NHUNG=1 ở máy dev)')

  let matKhau = process.env.GDOS_MAT_KHAU_QUAN_TRI ?? ''
  if (!matKhau) {
    matKhau = await hoiAn('Mật khẩu quản trị viên: ')
    if ((await hoiAn('Nhập lại: ')) !== matKhau) throw new Error('Hai lần nhập không khớp')
  }

  const kn = url ? await moPostgresVaDiTru(url) : await moDbNhung(ch.dbNhung!)
  try {
    console.log('✓ Migration xong')
    const kq = await khoiTaoHeThong(kn.db, {
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
    await kn.dong()
  }
}

chay().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
