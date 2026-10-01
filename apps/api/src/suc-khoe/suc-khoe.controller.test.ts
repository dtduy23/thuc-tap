import { ServiceUnavailableException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CoSoDuLieu, type TrangThaiDb } from '../db/co-so-du-lieu.js'
import { SucKhoeController } from './suc-khoe.controller.js'

/** Dựng module THẬT, chỉ thay kết nối DB — bắt luôn lỗi nối dây DI của Nest. */
async function dung(db: TrangThaiDb) {
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CoSoDuLieu)
    .useValue({ kiemTra: () => Promise.resolve(db) })
    .compile()
  return mod.get(SucKhoeController)
}

describe('SucKhoeController', () => {
  it('/health trả ok mà không hỏi DB', async () => {
    const c = await dung('khong-ket-noi')
    expect(c.song().trangThai).toBe('ok')
  })

  it('/health/deps trả ok khi Postgres sống', async () => {
    const c = await dung('ok')
    await expect(c.phuThuoc()).resolves.toEqual({ trangThai: 'ok', phuThuoc: { postgres: 'ok' } })
  })

  it('/health/deps trả 503 và nói rõ phụ thuộc nào hỏng', async () => {
    const c = await dung('khong-ket-noi')
    const loi = await c.phuThuoc().catch((e: unknown) => e)
    expect(loi).toBeInstanceOf(ServiceUnavailableException)
    expect((loi as ServiceUnavailableException).getResponse()).toEqual({
      trangThai: 'loi',
      phuThuoc: { postgres: 'khong-ket-noi' },
    })
  })
})
