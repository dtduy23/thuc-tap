/**
 * Lệnh đặt lại mật khẩu QUẢN TRỊ VIÊN trên server — dùng khi quên mật khẩu và không còn quản
 * trị viên nào khác đăng nhập được:
 *
 *   docker compose run --rm --entrypoint node api dist/cli/dat-lai-mat-khau.js [--ten-dang-nhap quantri]
 *
 * Mật khẩu mới nhập ẩn từ bàn phím (hai lần), hoặc biến môi trường GDOS_MAT_KHAU_QUAN_TRI khi
 * chạy tự động — KHÔNG đi qua tham số dòng lệnh. Chỉ đặt lại được tài khoản có cờ quản trị.
 *
 * Kết nối bằng CHỦ BẢNG: DATABASE_URL_CHU_BANG, không có thì DATABASE_URL (máy dev: DB_NHUNG=1,
 * tắt `pnpm dev` trước).
 */
import { parseArgs } from 'node:util'
import { docCauHinh } from '../cau-hinh.js'
import { moDbNhung, moPostgresVaDiTru } from '../db/migration.js'
import { datLaiMatKhauQuanTri } from '../khoi-tao/dat-lai-mat-khau.js'
import { hoiAn } from './hoi-an.js'

async function chay() {
  const thamSo = process.argv.slice(2)
  if (thamSo[0] === '--') thamSo.shift()
  const { values: t } = parseArgs({
    args: thamSo,
    options: { 'ten-dang-nhap': { type: 'string', default: 'quantri' } },
  })
  const ten = t['ten-dang-nhap']

  const ch = docCauHinh()
  const url = process.env.DATABASE_URL_CHU_BANG?.trim() || ch.duongDanDb
  if (!url && !ch.dbNhung)
    throw new Error('Thiếu DATABASE_URL_CHU_BANG (hoặc DATABASE_URL, hoặc DB_NHUNG=1 ở máy dev)')

  let matKhau = process.env.GDOS_MAT_KHAU_QUAN_TRI ?? ''
  if (!matKhau) {
    matKhau = await hoiAn(`Mật khẩu mới cho "${ten}": `)
    if ((await hoiAn('Nhập lại: ')) !== matKhau) throw new Error('Hai lần nhập không khớp')
  }

  const kn = url ? await moPostgresVaDiTru(url) : await moDbNhung(ch.dbNhung!)
  try {
    const kq = await datLaiMatKhauQuanTri(kn.db, ten, matKhau)
    if (kq === 'khong-co') throw new Error(`Không có tài khoản "${ten}"`)
    if (kq === 'khong-phai-quan-tri')
      throw new Error(`"${ten}" không phải quản trị viên — nhờ quản trị viên cấp lại mật khẩu trên màn hình`)
    console.log(`✓ Đã đặt lại mật khẩu cho "${ten}". Mọi phiên đăng nhập cũ của tài khoản này đã bị thu hồi.`)
  } finally {
    await kn.dong()
  }
}

chay().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
