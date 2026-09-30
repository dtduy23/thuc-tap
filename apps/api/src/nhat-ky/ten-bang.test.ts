import { TEN_BANG } from '@gdos/shared'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

let db: CoSoThu

beforeAll(async () => {
  db = await taoCoSoThu()
}, 60_000)

afterAll(async () => {
  await db.pg.close()
})

/** Bảng mới có trigger nhật ký mà quên đặt tên → màn nhật ký hiện tên bảng thô. Chặn ở đây. */
it('mọi bảng có trigger ghi nhật ký đều có tên hiển thị trong TEN_BANG', async () => {
  const { rows } = await db.pg.query<{ bang: string }>(
    `select distinct c.relname as bang from pg_trigger t join pg_class c on c.oid = t.tgrelid
     where t.tgname = 'ghi_nhat_ky' and not t.tgisinternal`,
  )
  expect(rows.length).toBeGreaterThan(10)
  expect(rows.map((r) => r.bang).filter((b) => !(b in TEN_BANG))).toEqual([])
})
