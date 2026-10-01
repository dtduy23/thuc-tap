import { describe, expect, it } from 'vitest'
import { hoiPhuThuoc } from './suc-khoe'

const traVe =
  (status: number, than: unknown): typeof fetch =>
  () =>
    Promise.resolve(new Response(typeof than === 'string' ? than : JSON.stringify(than), { status }))

describe('hoiPhuThuoc', () => {
  it('200 là ok', async () => {
    expect(await hoiPhuThuoc(traVe(200, { trangThai: 'ok' }))).toEqual({ loai: 'ok' })
  })

  it('503 đọc được phụ thuộc nào hỏng', async () => {
    const kq = await hoiPhuThuoc(traVe(503, { trangThai: 'loi', phuThuoc: { postgres: 'chua-cau-hinh' } }))
    expect(kq).toEqual({ loai: 'thieu', phuThuoc: { postgres: 'chua-cau-hinh' } })
  })

  it('proxy trả trang lỗi HTML thì coi như chưa tới được API', async () => {
    expect(await hoiPhuThuoc(traVe(502, '<html>Bad Gateway</html>'))).toEqual({ loai: 'khong-toi-api' })
  })

  it('mất mạng thì coi như chưa tới được API', async () => {
    const hong: typeof fetch = () => Promise.reject(new TypeError('Failed to fetch'))
    expect(await hoiPhuThuoc(hong)).toEqual({ loai: 'khong-toi-api' })
  })
})
