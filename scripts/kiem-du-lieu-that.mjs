#!/usr/bin/env node
/**
 * Chặn dữ liệu cá nhân THẬT lọt vào repo — chạy trong `pnpm lint` và CI.
 *
 * Bài học: GDOS cũ có họ tên + SĐT + email công vụ (.gov.vn) của cán bộ thật
 * trong mocks/, và nó chạy công khai trên host demo. Dữ liệu mẫu phải là dữ
 * liệu giả, và việc đó phải do máy kiểm, không do trí nhớ.
 *
 * Dòng nào cố ý chứa mẫu giống thật (vd ví dụ trong tài liệu) thì ghi chú
 * `kiem-du-lieu-that: bo-qua` ngay trên dòng đó.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Dãy số đứng liền dấu "-" là một khúc của UUID (khúc cuối dài đúng 12 ký tự,
// toàn số thì trông y hệt CCCD) — không phải số của người.
const KHONG_DINH = String.raw`(?<![\d.\-])`
const KHONG_DUOI = String.raw`(?![\d.\-])`

const MAU = [
  { ten: 'email công vụ .gov.vn', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.gov\.vn\b/ },
  { ten: 'email cá nhân', re: /[A-Za-z0-9._%+-]+@(?:gmail|yahoo|outlook|hotmail)\.com\b/ },
  { ten: 'số di động Việt Nam', re: new RegExp(`${KHONG_DINH}0[35789]\\d{8}${KHONG_DUOI}`) },
  { ten: 'số CCCD (12 chữ số)', re: new RegExp(`${KHONG_DINH}0\\d{11}${KHONG_DUOI}`) },
]

const BO_QUA_TEP = [
  /^pnpm-lock\.yaml$/,
  /\.(png|jpe?g|ico|pdf|xlsx|docx|woff2?)$/i,
  /^scripts\/kiem-du-lieu-that\.mjs$/,
]

const tep = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter((t) => t && !BO_QUA_TEP.some((re) => re.test(t)))

const vipham = []
for (const t of tep) {
  let noiDung
  try {
    noiDung = readFileSync(t, 'utf8')
  } catch {
    continue // tệp đã xoá khỏi đĩa nhưng còn trong index
  }
  noiDung.split('\n').forEach((dong, i) => {
    if (dong.includes('kiem-du-lieu-that: bo-qua')) return
    for (const { ten, re } of MAU) if (re.test(dong)) vipham.push(`${t}:${i + 1}  ${ten}`)
  })
}

if (vipham.length) {
  console.error('Phát hiện dữ liệu có dạng thông tin cá nhân thật:\n')
  for (const v of vipham) console.error('  ' + v)
  console.error(
    '\nThay bằng dữ liệu giả. Nếu đúng là cố ý, ghi chú "kiem-du-lieu-that: bo-qua" trên dòng đó.',
  )
  process.exit(1)
}
console.log(`kiem-du-lieu-that: ${tep.length} tệp, không có dữ liệu cá nhân thật.`)
