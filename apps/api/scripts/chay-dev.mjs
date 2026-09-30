#!/usr/bin/env node
/**
 * Chạy API ở máy dev: khởi động lại khi mã trong dist/ THẬT SỰ đổi.
 *
 * Không dùng `node --watch`: trên Windows, phần mềm diệt virus quét dist/ sinh ra
 * sự kiện "đổi" giả, API khởi động lại liên tục mỗi vài chục giây dù không file
 * nào đổi (gặp ngày 30/09/2026). Ở đây mỗi sự kiện đều được đối chiếu lại dấu vân
 * tay (thời điểm sửa + kích thước của mọi tệp .js) — không đổi thì bỏ qua.
 *
 * Gom các thay đổi dồn dập (tsc ghi hàng chục tệp một lượt) thành một lần khởi động lại.
 */
import { spawn } from 'node:child_process'
import { readdirSync, statSync, watch } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const CHO_GOM_MS = 400

function vanTay() {
  const ds = []
  const duyet = (thuMuc) => {
    for (const t of readdirSync(thuMuc, { withFileTypes: true })) {
      const p = join(thuMuc, t.name)
      if (t.isDirectory()) duyet(p)
      else if (t.name.endsWith('.js')) {
        const s = statSync(p)
        ds.push(`${p}:${s.mtimeMs}:${s.size}`)
      }
    }
  }
  try {
    duyet(DIST)
  } catch {
    return '' // tsc đang dọn/ghi dở — lần sau đọc lại
  }
  return ds.sort().join('|')
}

let con = null
let vanTayCu = vanTay()

function khoiDong() {
  con = spawn(process.execPath, ['--env-file-if-exists=../../.env', 'dist/main.js'], { stdio: 'inherit' })
  con.on('exit', (ma, tinHieu) => {
    if (tinHieu === null && ma !== 0)
      console.error(`✗ API dừng với mã ${ma} — sửa lỗi rồi lưu tệp, API sẽ tự chạy lại`)
  })
}

async function khoiDongLai() {
  if (con && con.exitCode === null) {
    const xong = new Promise((r) => con.once('exit', r))
    con.kill()
    await xong
  }
  console.log('↻ Mã đổi — khởi động lại API')
  khoiDong()
}

let hen = null
watch(DIST, { recursive: true }, () => {
  clearTimeout(hen)
  hen = setTimeout(() => {
    const moi = vanTay()
    if (!moi || moi === vanTayCu) return
    vanTayCu = moi
    void khoiDongLai()
  }, CHO_GOM_MS)
})

khoiDong()
for (const tinHieu of ['SIGINT', 'SIGTERM']) process.on(tinHieu, () => (con?.kill(), process.exit(0)))
