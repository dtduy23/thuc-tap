import { DANH_SACH_MODULE } from '@gdos/shared'
import { describe, expect, it } from 'vitest'
import { MAN_HINH } from './man-hinh'

describe('màn hình của registry', () => {
  it('mọi chức năng cấp 4 đều có màn — khai registry mà quên màn là đỏ', () => {
    const thieu = DANH_SACH_MODULE.flatMap((m) => m.con.map((c) => c.id)).filter((id) => !MAN_HINH[id])
    expect(thieu).toEqual([])
  })

  it('không có màn "mồ côi" — màn nào cũng thuộc một chức năng trong registry', () => {
    const ids = new Set(DANH_SACH_MODULE.flatMap((m) => m.con.map((c) => c.id)))
    expect(Object.keys(MAN_HINH).filter((id) => !ids.has(id))).toEqual([])
  })
})
