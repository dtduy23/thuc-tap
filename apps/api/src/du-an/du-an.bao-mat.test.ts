/**
 * Lớp bảo mật database của Dự án (migration 0009) — Postgres thật (PGlite).
 *
 * Bộ test KHÔNG ĐƯỢC TẮT (ADR-0004): xã không thấy dự án xã khác; nhà thầu chỉ
 * thấy dự án mình tham gia và chỉ GỬI được cập nhật, không tự đánh dấu xong;
 * danh mục chỉ đơn vị gốc sửa; quy trình mẫu theo luật không ai sửa.
 */
import type { BuocMau } from '@gdos/shared'
import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { trongPhamVi, truyVan, type NguCanh } from '../db/pham-vi.js'
import {
  danhMucGiaTri,
  donVi,
  duAn,
  duAnBuoc,
  duAnThanhVien,
  nhatKyThaoTac,
  quyTrinhMau,
  taiKhoan,
} from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const DN = '00000000-0000-4000-8000-0000000000d1' // đơn vị doanh nghiệp (nhà thầu)
const DA_A = '00000000-0000-4000-8000-00000000da01' // dự án của xã A
const DA_B = '00000000-0000-4000-8000-00000000db01' // dự án của xã B
const BUOC_A = '00000000-0000-4000-8000-00000000da11'

let db: CoSoThu
const id: Record<string, string> = {}
const nc = (ten: string, donViIds: string[]): NguCanh => ({ taiKhoanId: id[ten]!, donViIds })

async function loiGoc(viec: Promise<unknown>): Promise<string> {
  try {
    await viec
  } catch (e) {
    const loi = e as Error & { cause?: Error }
    return loi.cause?.message ?? loi.message
  }
  throw new Error('Mong bị chặn nhưng câu lệnh lại chạy được')
}

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const c = db.chuBang
  await c
    .insert(donVi)
    .values({ id: DN, ma: 'DN-01', ten: 'Công ty Thử Nghiệm', cap: 'doanh-nghiep', chaId: MAU.TINH })
  await c
    .insert(taiKhoan)
    .values({ tenDangNhap: 'nhathau.dn', hoTen: 'Nhà thầu thử', donViId: DN, matKhauBam: 'x' })
  for (const t of await c.select({ id: taiKhoan.id, ten: taiKhoan.tenDangNhap }).from(taiKhoan))
    id[t.ten] = t.id

  const da = (ma: string, donViId: string, idDa: string) => ({
    id: idDa,
    donViId,
    ma,
    ten: `Dự án ${ma}`,
    hinhThuc: 'dau-tu',
    loaiChi: 'dtpt',
    ngayBatDau: '2026-10-01',
  })
  await c.insert(duAn).values([da('DA-A', MAU.XA_A, DA_A), da('DA-B', MAU.XA_B, DA_B)])
  await c.insert(duAnBuoc).values({
    id: BUOC_A,
    duAnId: DA_A,
    donViId: MAU.XA_A,
    thuTu: 0,
    giaiDoan: 'I',
    stt: '1',
    ten: 'Bước một',
    soNgay: 5,
  })
  await c
    .insert(duAnThanhVien)
    .values({ duAnId: DA_A, donViId: MAU.XA_A, taiKhoanId: id['nhathau.dn']!, vaiTro: 'nha-thau' })
}, 60_000)

afterAll(async () => {
  await db.pg.close()
})

describe('dữ liệu khởi tạo', () => {
  it('có 6 quy trình mẫu theo NĐ 45, đều khóa; bước nào cũng đúng hình dạng', async () => {
    const ds = await db.chuBang.select().from(quyTrinhMau)
    expect(ds).toHaveLength(6)
    expect(ds.every((q) => q.khoa)).toBe(true)
    for (const q of ds) {
      const buoc = q.buoc as BuocMau[]
      buoc.forEach((b, i) => {
        expect(['I', 'II', 'III']).toContain(b.gd)
        expect(['chu-dau-tu', 'tu-van', 'nha-thau']).toContain(b.ben)
        if (b.cha !== null) expect(b.cha).toBeLessThan(i) // cha luôn đứng trước con
      })
    }
    expect(JSON.stringify(ds)).not.toMatch(/Lao ?Cai|Lào Cai/i)
  })
})

describe('dự án — phạm vi', () => {
  it('xã chỉ thấy dự án của xã mình; tỉnh thấy mọi xã', async () => {
    const cua = async (n: NguCanh) =>
      (await trongPhamVi(db.coSo, n, (tx) => tx.select({ ma: duAn.ma }).from(duAn))).map((d) => d.ma).sort()
    expect(await cua(nc('chutich.a', [MAU.XA_A]))).toEqual(['DA-A'])
    expect(await cua(nc('canbo.b', [MAU.XA_B]))).toEqual(['DA-B'])
    expect(await cua(nc('lanhdao.tinh', [MAU.TINH, MAU.XA_A, MAU.XA_B]))).toEqual(['DA-A', 'DA-B'])
  })

  it('không tạo được dự án cho đơn vị ngoài phạm vi', async () => {
    const loi = await loiGoc(
      trongPhamVi(db.coSo, nc('chutich.a', [MAU.XA_A]), (tx) =>
        tx.insert(duAn).values({
          donViId: MAU.XA_B,
          ma: 'DA-LEN',
          ten: 'Lén',
          hinhThuc: 'dau-tu',
          loaiChi: 'dtpt',
          ngayBatDau: '2026-10-01',
        }),
      ),
    )
    expect(loi).toMatch(/row-level security/)
  })

  it('không ai xóa cứng được dự án hay bước', async () => {
    const loi = await loiGoc(
      trongPhamVi(db.coSo, nc('chutich.a', [MAU.XA_A]), (tx) =>
        tx.delete(duAnBuoc).where(eq(duAnBuoc.id, BUOC_A)),
      ),
    )
    expect(loi).toMatch(/permission denied/)
  })

  it('đơn vị của bước luôn lấy theo dự án — khai sai cũng bị sửa lại', async () => {
    await trongPhamVi(db.coSo, nc('chutich.a', [MAU.XA_A]), (tx) =>
      tx.insert(duAnBuoc).values({
        duAnId: DA_A,
        donViId: MAU.XA_A,
        thuTu: 1,
        giaiDoan: 'I',
        stt: '2',
        ten: 'Bước hai',
      }),
    )
    const [b] = await db.chuBang.select().from(duAnBuoc).where(eq(duAnBuoc.stt, '2'))
    expect(b!.donViId).toBe(MAU.XA_A)
  })
})

describe('nhà thầu — thành viên ngoài đơn vị', () => {
  const nt = () => nc('nhathau.dn', [DN])

  it('thấy đúng dự án mình tham gia và các bước của nó, không thấy dự án khác', async () => {
    const [ds, buoc] = await trongPhamVi(db.coSo, nt(), async (tx) => [
      await tx.select({ ma: duAn.ma }).from(duAn),
      await tx.select({ id: duAnBuoc.id }).from(duAnBuoc),
    ])
    expect(ds.map((d) => d.ma)).toEqual(['DA-A'])
    expect(buoc.length).toBeGreaterThan(0)
  })

  it('không sửa thẳng được bước — kể cả tự đánh dấu xong', async () => {
    const sua = await trongPhamVi(db.coSo, nt(), (tx) =>
      tx
        .update(duAnBuoc)
        .set({ ngayHoanThanh: '2026-10-03' })
        .where(eq(duAnBuoc.id, BUOC_A))
        .returning({ id: duAnBuoc.id }),
    )
    expect(sua).toEqual([]) // RLS: không có dòng nào được phép sửa
    const [b] = await db.chuBang.select().from(duAnBuoc).where(eq(duAnBuoc.id, BUOC_A))
    expect(b!.ngayHoanThanh).toBeNull()
  })

  it('gửi cập nhật qua hàm hẹp: bước vào trạng thái chờ xác nhận, có tên người gửi', async () => {
    await trongPhamVi(db.coSo, nt(), (tx) =>
      tx.execute(sql`select buoc_gui_cap_nhat(${BUOC_A}::uuid, '2026-10-04'::date, 'Đã xong phần việc')`),
    )
    const [b] = await db.chuBang.select().from(duAnBuoc).where(eq(duAnBuoc.id, BUOC_A))
    expect(b!.ngayHoanThanh).toBeNull()
    expect(b!.choXacNhan).toMatchObject({
      ngay: '2026-10-04',
      ghiChu: 'Đã xong phần việc',
      nguoiGui: id['nhathau.dn'],
    })
  })

  it('người không phải nhà thầu, tư vấn của dự án gọi hàm → bị từ chối', async () => {
    const loi = await loiGoc(
      trongPhamVi(db.coSo, nc('canbo.b', [MAU.XA_B]), (tx) =>
        tx.execute(sql`select buoc_gui_cap_nhat(${BUOC_A}::uuid, '2026-10-04'::date, '')`),
      ),
    )
    expect(loi).toMatch(/Chỉ nhà thầu, tư vấn/)
  })

  it('không tự thêm mình vào dự án khác', async () => {
    const loi = await loiGoc(
      trongPhamVi(db.coSo, nt(), (tx) =>
        tx
          .insert(duAnThanhVien)
          .values({ duAnId: DA_B, donViId: DN, taiKhoanId: id['nhathau.dn']!, vaiTro: 'nha-thau' }),
      ),
    )
    expect(loi).toMatch(/row-level security/)
  })
})

describe('danh mục và quy trình mẫu — dùng chung toàn hệ thống', () => {
  it('ai cũng đọc được', async () => {
    const ds = await trongPhamVi(db.coSo, nc('chuyenvien.a', [MAU.XA_A]), (tx) =>
      tx.select({ ma: danhMucGiaTri.ma }).from(danhMucGiaTri).where(eq(danhMucGiaTri.loai, 'linh-vuc')),
    )
    expect(ds.length).toBeGreaterThan(0)
  })

  it('tài khoản cấp xã không sửa được; tài khoản ở đơn vị gốc sửa được, nhật ký ghi vào đơn vị gốc', async () => {
    const sua = (ten: string, donViIds: string[]) =>
      trongPhamVi(db.coSo, nc(ten, donViIds), (tx) =>
        tx
          .update(danhMucGiaTri)
          .set({ ten: 'Công nghệ thông tin – sửa' })
          .where(eq(danhMucGiaTri.ma, 'cntt'))
          .returning({ id: danhMucGiaTri.id }),
      )
    expect(await sua('quantri', [MAU.XA_A])).toEqual([])
    expect(await sua('quantri.tinh', [MAU.TINH, MAU.XA_A, MAU.XA_B])).toHaveLength(1)

    const [nk] = await db.chuBang
      .select({ donViId: nhatKyThaoTac.donViId })
      .from(nhatKyThaoTac)
      .where(sql`${nhatKyThaoTac.bang} = 'danh_muc_gia_tri' and ${nhatKyThaoTac.hanhDong} = 'UPDATE'`)
    expect(nk!.donViId).toBe(MAU.TINH)
  })

  it('quy trình mẫu theo luật (khóa) không ai sửa được, kể cả đơn vị gốc', async () => {
    const sua = await trongPhamVi(db.coSo, nc('quantri.tinh', [MAU.TINH]), (tx) =>
      tx.update(quyTrinhMau).set({ ten: 'Sửa trộm' }).returning({ id: quyTrinhMau.id }),
    )
    expect(sua).toEqual([])
  })

  it('đơn vị gốc thêm được quy trình của riêng mình', async () => {
    const [q] = await trongPhamVi(db.coSo, nc('quantri.tinh', [MAU.TINH]), (tx) =>
      truyVan<{ id: string }>(
        tx,
        sql`insert into quy_trinh_mau (ma, ten, hinh_thuc, buoc) values ('rieng', 'Quy trình riêng', 'khac', '[]') returning id`,
      ),
    )
    expect(q?.id).toBeTruthy()
  })
})
