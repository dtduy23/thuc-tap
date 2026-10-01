/**
 * Báo cáo của module Dự án — hàm THUẦN: nhận dữ liệu đã tải (đã qua RLS), trả
 * KetQuaBaoCao. Mẫu cột theo Biểu 01/02/03 của tỉnh và mẫu xuất của PMS.
 * Tiền: triệu đồng. Giải ngân luôn là tổng các đợt, không có số nhập tay.
 */
import {
  congNgay,
  GIAI_DOAN,
  HINH_THUC,
  soNgayGiua,
  TRANG_THAI_BUOC,
  trangThaiBuoc,
  type CotBaoCao,
  type DongBaoCao,
  type DuAnDong,
  type GiaTriThamSo,
  type HoSoDuAn,
  type KetQuaBaoCao,
  type SucKhoe,
} from '@gdos/shared'
import { phanNhom } from '../xuyen-suot/bao-cao-chung.js'
import type { DuAnTongHop } from './dieu-hanh.js'

export interface DuLieuBaoCao {
  ds: DuAnTongHop[]
  /** Thông tin thêm từng dự án: địa điểm, mô tả tiến độ, ngày kết thúc dự kiến, ngày xong bước cuối. */
  them: Map<
    string,
    { diaDiem: string | null; tienDoMoTa: string | null; ketThuc: string | null; xongNgay: string | null }
  >
  von: { duAnId: string; nam: number; nguonVonId: string; keHoach: number }[]
  giaiNgan: { duAnId: string; nam: number; nguonVonId: string; ngay: string; soTien: number }[]
  /** Nguồn vốn theo thứ tự danh mục. */
  nguonVon: { id: string; ten: string }[]
  nhaThau: { duAnId: string; tenDonVi: string }[]
}

const MO_TA_TIEN = 'Đơn vị tiền: triệu đồng'

const TINH_TRANG: Record<SucKhoe, string> = {
  xong: 'Hoàn thành',
  'qua-han': 'Quá hạn',
  'sap-han': 'Sắp đến hạn',
  'trong-han': 'Trong hạn',
}
const tinhTrang = (d: DuAnDong): SucKhoe => (d.trangThai === 'hoan-thanh' ? 'xong' : d.thongKe.sucKhoe)

const TRUC: Record<string, (d: DuAnDong) => string> = {
  'don-vi': (d) => d.donViTen,
  'linh-vuc': (d) => d.linhVucTen ?? '(Chưa phân lĩnh vực)',
  'hinh-thuc': (d) => HINH_THUC[d.hinhThuc],
  'nhom-du-an': (d) => (d.nhomDuAn ? `Nhóm ${d.nhomDuAn}` : '(Chưa phân nhóm)'),
}

const lienKet = (d: DuAnDong) => `/du-an/${d.id}`
const ngayVn = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`

/** Dự án đưa vào báo cáo: bỏ dự án hủy, lọc lĩnh vực nếu có. */
function loc(dl: DuLieuBaoCao, ts: GiaTriThamSo): DuAnTongHop[] {
  return dl.ds.filter((x) => x.d.trangThai !== 'huy' && (!ts.linhVucId || x.d.linhVucId === ts.linhVucId))
}

/** Nguồn vốn thật sự có số trong tập dự án — không vẽ cột toàn số 0. */
function nguonCo(dl: DuLieuBaoCao, ids: Set<string>): { id: string; ten: string }[] {
  const co = new Set([
    ...dl.von.filter((v) => ids.has(v.duAnId)).map((v) => v.nguonVonId),
    ...dl.giaiNgan.filter((g) => ids.has(g.duAnId)).map((g) => g.nguonVonId),
  ])
  return dl.nguonVon.filter((n) => co.has(n.id))
}

const cong = <T>(ds: readonly T[], f: (x: T) => number) => ds.reduce((t, x) => t + f(x), 0)

function thoiGian(d: DuAnDong, them: DuLieuBaoCao['them']): string {
  const kt = them.get(d.id)?.ketThuc
  return `${d.ngayBatDau.slice(0, 4)}–${kt ? kt.slice(0, 4) : '…'}`
}

function nhomVaDong(
  ds: DuAnTongHop[],
  ts: GiaTriThamSo,
  cot: CotBaoCao[],
  o: (d: DuAnDong) => (string | number | null)[],
  mau?: (d: DuAnDong) => DongBaoCao['mau'],
): DongBaoCao[] {
  return phanNhom(
    ds.map((x) => x.d),
    ts.nhom.map((t) => TRUC[t]!),
    (d) => ({ cap: 0, o: o(d), lienKet: lienKet(d), mau: mau?.(d) }),
    cot,
  )
}

// ── Biểu 01 — Dự án đầu tư công ─────────────────────────────────────────────

export function bieu01(dl: DuLieuBaoCao, ts: GiaTriThamSo): KetQuaBaoCao {
  const ds = loc(dl, ts).filter((x) => x.d.loaiChi === 'dtpt')
  const ids = new Set(ds.map((x) => x.d.id))
  const nv = nguonCo(dl, ids)
  const N = ts.nam
  const khNam = (id: string, f: string | null) =>
    cong(
      dl.von.filter((v) => v.duAnId === id && v.nam === N && (f === null || v.nguonVonId === f)),
      (v) => v.keHoach,
    )
  const gnNam = (id: string, f: string | null) =>
    cong(
      dl.giaiNgan.filter(
        (g) => g.duAnId === id && g.nam === N && g.ngay <= ts.denNgay && (f === null || g.nguonVonId === f),
      ),
      (g) => g.soTien,
    )
  const theoNguon = (f: (id: string, n: string | null) => number, id: string) => [
    f(id, null),
    ...nv.map((n) => f(id, n.id)),
  ]
  const cotNguon: CotBaoCao[] = [
    { nhan: 'Tổng số', kieu: 'so' },
    ...nv.map((n): CotBaoCao => ({ nhan: n.ten, kieu: 'so' })),
  ]
  const cot: CotBaoCao[] = [
    { nhan: 'Tên dự án' },
    { nhan: 'Địa điểm đầu tư' },
    { nhan: 'Chủ đầu tư', rong: 24 },
    { nhan: 'Thời gian thực hiện', rong: 13 },
    { nhan: 'Tổng mức đầu tư', kieu: 'so' },
    ...cotNguon,
    ...cotNguon,
    { nhan: 'Tình hình thực hiện', rong: 44 },
  ]
  return {
    ma: 'du-an-bieu-01',
    tieuDe: `Biểu 01 — Dự án đầu tư công — năm ${N}`,
    phuDe: `${MO_TA_TIEN} · Giải ngân đến ngày ${ngayVn(ts.denNgay)}`,
    cot,
    nhomCot: [
      { nhan: `Kế hoạch vốn năm ${N} đã giao`, tu: 5, so: cotNguon.length },
      { nhan: `Giải ngân kế hoạch vốn năm ${N}`, tu: 5 + cotNguon.length, so: cotNguon.length },
    ],
    dong: nhomVaDong(ds, ts, cot, (d) => [
      d.ten,
      dl.them.get(d.id)?.diaDiem ?? '',
      d.donViTen,
      thoiGian(d, dl.them),
      d.tongMuc,
      ...theoNguon(khNam, d.id),
      ...theoNguon(gnNam, d.id),
      dl.them.get(d.id)?.tienDoMoTa ?? '',
    ]),
    coTong: true,
    tenTep: `Bieu01_${N}`,
  }
}

// ── Biểu 02 / 03 — Chi thường xuyên (chuyển tiếp / mới) ─────────────────────

/** Năm bắt đầu của hoạt động: năm sớm nhất giữa ngày bắt đầu và kế hoạch vốn. */
function namBatDau(dl: DuLieuBaoCao, d: DuAnDong): number {
  return Math.min(
    Number(d.ngayBatDau.slice(0, 4)),
    ...dl.von.filter((v) => v.duAnId === d.id).map((v) => v.nam),
  )
}

export function bieu0203(dl: DuLieuBaoCao, ts: GiaTriThamSo, bieu: '02' | '03'): KetQuaBaoCao {
  const N = ts.nam
  const ds = loc(dl, ts).filter(
    (x) => x.d.loaiChi === 'ctx' && (bieu === '02' ? namBatDau(dl, x.d) < N : namBatDau(dl, x.d) >= N),
  )
  const ids = new Set(ds.map((x) => x.d.id))
  const nv = nguonCo(dl, ids)
  const khNam = (id: string, f: string | null) =>
    cong(
      dl.von.filter((v) => v.duAnId === id && v.nam === N && (f === null || v.nguonVonId === f)),
      (v) => v.keHoach,
    )
  const cotNguon: CotBaoCao[] = [
    { nhan: 'Tổng số', kieu: 'so' },
    ...nv.map((n): CotBaoCao => ({ nhan: n.ten, kieu: 'so' })),
  ]
  const cot: CotBaoCao[] = [
    { nhan: 'Tên dự án / hoạt động' },
    { nhan: 'Hình thức', rong: 20 },
    { nhan: 'Thời gian', rong: 13 },
    { nhan: `Tổng kinh phí giai đoạn ${ts.tuNam}–${ts.denNam}`, kieu: 'so', rong: 16 },
    ...cotNguon,
    { nhan: 'Giải ngân lũy kế', kieu: 'so' },
    { nhan: 'Tiến độ thực hiện', rong: 44 },
  ]
  const ten = bieu === '02' ? 'Biểu 02 — Chi thường xuyên (chuyển tiếp)' : 'Biểu 03 — Chi thường xuyên (mới)'
  return {
    ma: `du-an-bieu-${bieu}`,
    tieuDe: `${ten} — năm ${N}`,
    phuDe: `${MO_TA_TIEN} · Giải ngân lũy kế đến ngày ${ngayVn(ts.denNgay)}`,
    cot,
    nhomCot: [{ nhan: `Dự kiến kinh phí năm ${N}`, tu: 4, so: cotNguon.length }],
    dong: nhomVaDong(ds, ts, cot, (d) => [
      d.ten,
      HINH_THUC[d.hinhThuc],
      thoiGian(d, dl.them),
      cong(
        dl.von.filter((v) => v.duAnId === d.id && v.nam >= ts.tuNam && v.nam <= ts.denNam),
        (v) => v.keHoach,
      ),
      khNam(d.id, null),
      ...nv.map((n) => khNam(d.id, n.id)),
      cong(
        dl.giaiNgan.filter((g) => g.duAnId === d.id && g.ngay <= ts.denNgay),
        (g) => g.soTien,
      ),
      dl.them.get(d.id)?.tienDoMoTa ?? '',
    ]),
    coTong: true,
    tenTep: `Bieu${bieu}_${N}`,
  }
}

// ── Nghĩa vụ báo cáo Điều 35 ────────────────────────────────────────────────

/** Chủ đầu tư cung cấp thông tin trong 20 ngày sau khi xong; tổng hợp gửi Bộ trong 30 ngày tiếp theo. */
export const HAN_BC35 = { chuDauTu: 20, tongHop: 30 } as const

export function bc35(dl: DuLieuBaoCao, ts: GiaTriThamSo, hn: string): KetQuaBaoCao {
  const xong = loc(dl, ts)
    .map((x) => ({ d: x.d, ngay: dl.them.get(x.d.id)?.xongNgay ?? null }))
    .filter((x): x is { d: DuAnDong; ngay: string } => tinhTrang(x.d) === 'xong' && !!x.ngay)
    .sort((a, b) => b.ngay.localeCompare(a.ngay))
  const cot: CotBaoCao[] = [
    { nhan: 'Dự án' },
    { nhan: 'Chủ đầu tư', rong: 26 },
    { nhan: 'Ngày hoàn thành', kieu: 'ngay', rong: 14 },
    { nhan: `Hạn chủ đầu tư cung cấp (${HAN_BC35.chuDauTu} ngày)`, kieu: 'ngay', rong: 18 },
    { nhan: `Hạn tổng hợp gửi Bộ (+${HAN_BC35.tongHop} ngày)`, kieu: 'ngay', rong: 18 },
    { nhan: 'Tình trạng', rong: 16 },
  ]
  return {
    ma: 'du-an-bc35',
    tieuDe: 'Nghĩa vụ báo cáo Điều 35 — dự án đã hoàn thành',
    phuDe: `Tính đến ngày ${ngayVn(hn)}`,
    cot,
    dong: xong.map(({ d, ngay }) => {
      const h1 = congNgay(ngay, HAN_BC35.chuDauTu)
      const h2 = congNgay(h1, HAN_BC35.tongHop)
      const tt = h1 < hn ? 'Quá hạn' : soNgayGiua(hn, h1) <= 10 ? 'Sắp đến hạn' : 'Trong hạn'
      return {
        cap: 0,
        o: [d.ten, d.donViTen, ngay, h1, h2, tt],
        lienKet: lienKet(d),
        mau: tt === 'Quá hạn' ? 'danger' : tt === 'Sắp đến hạn' ? 'warn' : undefined,
      }
    }),
    coTong: false,
    ghiChu: 'Báo cáo định kỳ năm: tổng hợp và gửi trong tháng 01 hằng năm.',
    tenTep: `BC35_${hn}`,
  }
}

// ── Danh sách dự án (xuất dữ liệu) ──────────────────────────────────────────

export function danhSach(dl: DuLieuBaoCao, ts: GiaTriThamSo, hn: string): KetQuaBaoCao {
  const ds = loc(dl, ts)
  const kpi = new Map(ds.map((x) => [x.d.id, x.kpi]))
  const nt = new Map<string, string[]>()
  for (const t of dl.nhaThau) nt.set(t.duAnId, [...(nt.get(t.duAnId) ?? []), t.tenDonVi])
  const cot: CotBaoCao[] = [
    { nhan: 'Tên dự án' },
    { nhan: 'Mã', rong: 14 },
    { nhan: 'Chủ đầu tư', rong: 24 },
    { nhan: 'Nhà thầu', rong: 24 },
    { nhan: 'Hình thức', rong: 18 },
    { nhan: 'Nhóm', rong: 7 },
    { nhan: 'Lĩnh vực', rong: 18 },
    { nhan: 'Giai đoạn', rong: 18 },
    { nhan: 'Tiến độ', kieu: 'phan-tram', rong: 9 },
    { nhan: 'Tổng mức', kieu: 'so' },
    { nhan: 'Đã giải ngân', kieu: 'so' },
    { nhan: 'Giải ngân', kieu: 'phan-tram', rong: 10 },
    { nhan: 'Tình trạng', rong: 13 },
    { nhan: 'Ngày chậm', kieu: 'so', khongCong: true, rong: 10 },
    { nhan: 'Điểm KPI', kieu: 'so', khongCong: true, rong: 9 },
    { nhan: 'Loại', rong: 6 },
  ]
  return {
    ma: 'du-an-danh-sach',
    tieuDe: 'Danh sách dự án',
    phuDe: `Tình hình triển khai đến ngày ${ngayVn(hn)} · ${MO_TA_TIEN}`,
    cot,
    dong: nhomVaDong(
      ds,
      ts,
      cot,
      (d) => {
        const tt = tinhTrang(d)
        return [
          d.ten,
          d.ma,
          d.donViTen,
          (nt.get(d.id) ?? []).join('; '),
          HINH_THUC[d.hinhThuc],
          d.nhomDuAn ?? '',
          d.linhVucTen ?? '',
          d.thongKe.giaiDoan ? `${d.thongKe.giaiDoan} — ${GIAI_DOAN[d.thongKe.giaiDoan]}` : 'Đã xong',
          d.thongKe.phanTram,
          d.tongMuc,
          d.daGiaiNgan,
          d.tongMuc > 0 ? Math.round((d.daGiaiNgan / d.tongMuc) * 1000) / 10 : null,
          d.trangThai === 'tam-dung' ? 'Tạm dừng' : TINH_TRANG[tt],
          tt === 'qua-han' ? d.thongKe.treNhat : null,
          kpi.get(d.id)?.diem ?? null,
          kpi.get(d.id)?.xepLoai ?? '',
        ]
      },
      (d) => (tinhTrang(d) === 'qua-han' ? 'danger' : undefined),
    ),
    coTong: true,
    tenTep: `Danh_sach_du_an_${hn}`,
  }
}

// ── Checklist tiến độ của MỘT dự án ─────────────────────────────────────────

export function checklist(hs: HoSoDuAn, hn: string, nguongSapHan?: number): KetQuaBaoCao {
  const cot: CotBaoCao[] = [
    { nhan: 'Nội dung công việc', rong: 56 },
    { nhan: 'STT', rong: 8 },
    { nhan: 'Số ngày', kieu: 'so', khongCong: true, rong: 9 },
    { nhan: 'Hạn', kieu: 'ngay', rong: 12 },
    { nhan: 'Hoàn thành', kieu: 'ngay', rong: 12 },
    { nhan: 'Văn bản', rong: 24 },
    { nhan: 'Đơn vị thực hiện', rong: 24 },
    { nhan: 'Trạng thái', rong: 14 },
    { nhan: 'Ghi chú', rong: 30 },
  ]
  const dong: DongBaoCao[] = hs.buoc
    .filter((b) => !b.laNhap)
    .map((b): DongBaoCao => {
      if (b.laNhom) return { cap: 1, o: [b.ten, b.stt, b.soNgay || null, null, null, null, null, null, null] }
      const tt = trangThaiBuoc(b, hn, nguongSapHan)
      return {
        cap: 0,
        o: [
          b.ten,
          b.stt,
          b.soNgay,
          b.han,
          b.ngayHoanThanh,
          b.soVanBan ?? '',
          b.donViThucHien ?? '',
          TRANG_THAI_BUOC[tt],
          b.boQua ? `Bỏ qua: ${b.lyDoBoQua ?? ''}` : (b.ghiChu ?? ''),
        ],
        mau: tt === 'qua-han' ? 'danger' : undefined,
      }
    })
  return {
    ma: 'du-an-checklist',
    tieuDe: `Checklist tiến độ — ${hs.ten}`,
    phuDe: `Mã ${hs.ma} · Chủ đầu tư: ${hs.donViTen} · Xuất ngày ${ngayVn(hn)}`,
    cot,
    dong,
    coTong: false,
    tenTep: `Checklist_${hs.ma}`,
  }
}
