import { describe, expect, it } from 'vitest'
import { goiApi, LoiApi, tenTepTu } from './http'

interface GoiGhiLai {
  url: string
  init: RequestInit
}

/** fetch giả: trả lần lượt các phản hồi, ghi lại mọi lời gọi. */
function fetchGia(...phanHoi: (() => Response)[]) {
  const daGoi: GoiGhiLai[] = []
  let i = 0
  const goi = ((url: string, init: RequestInit) => {
    daGoi.push({ url, init })
    const tao = phanHoi[Math.min(i++, phanHoi.length - 1)]!
    return Promise.resolve(tao())
  }) as unknown as typeof fetch
  return { goi, daGoi }
}

const json = (status: number, than: unknown) => () =>
  new Response(JSON.stringify(than), { status, headers: { 'Content-Type': 'application/json' } })

describe('goiApi', () => {
  it('GET không gắn header chống giả mạo; POST thì có', async () => {
    const { goi, daGoi } = fetchGia(json(200, {}), json(200, {}))
    await goiApi('/a', { goi })
    await goiApi('/b', { method: 'POST', body: {}, goi })
    expect((daGoi[0]!.init.headers as Record<string, string>)['X-GDOS']).toBeUndefined()
    expect((daGoi[1]!.init.headers as Record<string, string>)['X-GDOS']).toBe('1')
  })

  it('401 → làm mới phiên một lần → gọi lại thành công', async () => {
    const { goi, daGoi } = fetchGia(
      json(401, {}),
      () => new Response(null, { status: 200 }),
      json(200, { ok: 1 }),
    )
    expect(await goiApi('/xac-thuc/toi', { goi })).toEqual({ ok: 1 })
    expect(daGoi.map((g) => g.url)).toEqual([
      '/api/xac-thuc/toi',
      '/api/xac-thuc/lam-moi',
      '/api/xac-thuc/toi',
    ])
  })

  it('làm mới thất bại thì ném 401, không lặp vô hạn', async () => {
    const { goi, daGoi } = fetchGia(json(401, {}), json(401, {}))
    await expect(goiApi('/x', { goi })).rejects.toMatchObject({ ma: 401 })
    expect(daGoi).toHaveLength(2)
  })

  it('đăng nhập sai (401) KHÔNG kích hoạt làm mới phiên', async () => {
    const { goi, daGoi } = fetchGia(json(401, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' }))
    await expect(goiApi('/xac-thuc/dang-nhap', { method: 'POST', body: {}, goi })).rejects.toThrow(
      'Tên đăng nhập hoặc mật khẩu không đúng',
    )
    expect(daGoi).toHaveLength(1)
  })

  it('đọc câu lỗi của NestJS, kể cả dạng mảng', async () => {
    const { goi } = fetchGia(json(400, { message: ['Thiếu trường "hoTen"'] }))
    await expect(goiApi('/x', { method: 'POST', body: {}, goi })).rejects.toThrow('Thiếu trường "hoTen"')
  })

  it('mất mạng → mã 0 và câu tiếng Việt', async () => {
    const goi = (() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch
    const loi = await goiApi('/x', { goi }).catch((e: unknown) => e)
    expect(loi).toBeInstanceOf(LoiApi)
    expect((loi as LoiApi).ma).toBe(0)
  })

  it('204 trả undefined', async () => {
    const { goi } = fetchGia(() => new Response(null, { status: 204 }))
    expect(await goiApi('/x', { method: 'POST', goi })).toBeUndefined()
  })
})

describe('tenTepTu', () => {
  it('ưu tiên filename* UTF-8, rồi filename, rồi tên mặc định', () => {
    expect(tenTepTu(`attachment; filename="Bieu01.xlsx"; filename*=UTF-8''Bi%E1%BB%83u01.xlsx`, 'x')).toBe(
      'Biểu01.xlsx',
    )
    expect(tenTepTu('attachment; filename="a.xlsx"', 'x')).toBe('a.xlsx')
    expect(tenTepTu(null, 'mac-dinh.xlsx')).toBe('mac-dinh.xlsx')
  })
})
