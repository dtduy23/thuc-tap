import { DANH_SACH_MODULE, laPhac } from '@gdos/shared'
import { describe, expect, it } from 'vitest'
import { MAN_HINH } from './man-hinh'

const LA = DANH_SACH_MODULE.flatMap((m) => m.con.map((c) => ({ id: c.id, phac: laPhac(m, c) })))

describe('màn hình của registry', () => {
  it('chức năng đã xây (không phác) phải có màn — khai registry mà quên màn là đỏ', () => {
    expect(LA.filter((c) => !c.phac && !MAN_HINH[c.id]).map((c) => c.id)).toEqual([])
  })

  it('màn phác thì chưa có màn — xây xong phải bỏ cờ phac, không để cây báo sai', () => {
    expect(LA.filter((c) => c.phac && MAN_HINH[c.id]).map((c) => c.id)).toEqual([])
  })

  it('không có màn "mồ côi" — màn nào cũng thuộc một chức năng trong registry', () => {
    const ids = new Set(LA.map((c) => c.id))
    expect(Object.keys(MAN_HINH).filter((id) => !ids.has(id))).toEqual([])
  })
})
