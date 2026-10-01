/**
 * Dự án → khối số liệu cho Điều hành (Tổng quan, Bộ chỉ số). Hàm THUẦN: nhận dữ
 * liệu đã tải (đã qua RLS), trả KhoiSoLieu. Không gọi database — test thẳng được.
 */
import {
  GIAI_DOAN,
  type DuAnDong,
  type GiaiDoan,
  type GocNhinTongQuan,
  type KhoiSoLieu,
  type KpiDuAn,
  type LoaiChiSo,
  type SucKhoe,
} from '@gdos/shared'

export interface DuAnTongHop {
  d: DuAnDong
  kpi: KpiDuAn
}

const NGUON = 'du-an'
const TEN = 'Dự án'

const so = (n: number) => n.toLocaleString('vi-VN')
const pt = (a: number, b: number) =>
  b > 0 ? `${(Math.round((a / b) * 1000) / 10).toLocaleString('vi-VN')}%` : '—'
const lienKet = (d: DuAnDong, the?: string) => `/du-an/${d.id}${the ? `?the=${the}` : ''}`

/** Tình trạng một dự án: đã hoàn thành (theo trạng thái hoặc xong hết bước) hay sức khỏe tiến độ. */
const tinhTrang = (d: DuAnDong): SucKhoe => (d.trangThai === 'hoan-thanh' ? 'xong' : d.thongKe.sucKhoe)

// ── Tổng quan ───────────────────────────────────────────────────────────────

export function tongQuanDuAn(ds: DuAnTongHop[], goc: GocNhinTongQuan): KhoiSoLieu {
  const duAn = ds.map((x) => x.d).filter((d) => d.trangThai !== 'huy')
  if (goc === 'toan') return toanCanh(duAn)
  const khoa =
    goc === 'don-vi' ? (d: DuAnDong) => d.donViTen : (d: DuAnDong) => d.linhVucTen ?? '(Chưa phân lĩnh vực)'
  const nhom = new Map<string, DuAnDong[]>()
  for (const d of duAn) nhom.set(khoa(d), [...(nhom.get(khoa(d)) ?? []), d])
  const dong = [...nhom.entries()]
    .map(([ten, g]) => {
      const tongMuc = g.reduce((t, d) => t + d.tongMuc, 0)
      const daGiai = g.reduce((t, d) => t + d.daGiaiNgan, 0)
      const quaHan = g.filter((d) => tinhTrang(d) === 'qua-han').length
      return {
        quaHan,
        o: [
          ten,
          g.length,
          quaHan,
          g.filter((d) => tinhTrang(d) === 'sap-han').length,
          g.filter((d) => tinhTrang(d) === 'xong').length,
          `${Math.round(g.reduce((t, d) => t + d.thongKe.phanTram, 0) / g.length)}%`,
          so(tongMuc),
          so(daGiai),
          pt(daGiai, tongMuc),
        ],
        mau: quaHan > 0 ? ('danger' as const) : undefined,
      }
    })
    .sort((a, b) => b.quaHan - a.quaHan || String(a.o[0]).localeCompare(String(b.o[0]), 'vi'))
  return {
    nguon: NGUON,
    nghiepVu: TEN,
    so: soTong(duAn),
    bang: [
      {
        tieuDe: goc === 'don-vi' ? 'Theo chủ đầu tư (đơn vị)' : 'Theo lĩnh vực',
        ghiChu: `Tiền: triệu đồng. Xếp ${goc === 'don-vi' ? 'đơn vị' : 'lĩnh vực'} có nhiều dự án quá hạn lên trước.`,
        cot: [
          { nhan: goc === 'don-vi' ? 'Đơn vị' : 'Lĩnh vực' },
          { nhan: 'Dự án', so: true },
          { nhan: 'Quá hạn', so: true },
          { nhan: 'Sắp hạn', so: true },
          { nhan: 'Hoàn thành', so: true },
          { nhan: 'Tiến độ BQ', so: true },
          { nhan: 'Tổng mức', so: true },
          { nhan: 'Đã giải ngân', so: true },
          { nhan: '% giải ngân', so: true },
        ],
        dong: dong.map(({ o, mau }) => ({ o, mau })),
      },
    ],
  }
}

function soTong(duAn: DuAnDong[]): KhoiSoLieu['so'] {
  const tongMuc = duAn.reduce((t, d) => t + d.tongMuc, 0)
  const daGiai = duAn.reduce((t, d) => t + d.daGiaiNgan, 0)
  const dem = (s: SucKhoe) => duAn.filter((d) => tinhTrang(d) === s).length
  return [
    { nhan: 'Tổng dự án', giaTri: so(duAn.length), phu: 'đang theo dõi' },
    { nhan: 'Quá hạn', giaTri: so(dem('qua-han')), phu: 'cần đôn đốc ngay', mau: 'danger' },
    { nhan: 'Sắp đến hạn', giaTri: so(dem('sap-han')), phu: 'trong 10 ngày tới', mau: 'warn' },
    { nhan: 'Trong hạn', giaTri: so(dem('trong-han')), mau: 'brand' },
    { nhan: 'Hoàn thành', giaTri: so(dem('xong')), mau: 'ok' },
    { nhan: 'Giải ngân', giaTri: pt(daGiai, tongMuc), phu: `${so(daGiai)} / ${so(tongMuc)} tr.đ` },
  ]
}

function toanCanh(duAn: DuAnDong[]): KhoiSoLieu {
  // Ma trận giai đoạn × tình trạng (Điều 8 NĐ 45): mỗi dự án đứng ở giai đoạn của bước đang làm.
  const hang: (GiaiDoan | 'xong')[] = [...(Object.keys(GIAI_DOAN) as GiaiDoan[]), 'xong']
  const cot: SucKhoe[] = ['qua-han', 'sap-han', 'trong-han', 'xong']
  const maTran = hang.map((h) => {
    const trong = duAn.filter((d) => (d.thongKe.giaiDoan ?? 'xong') === h)
    return {
      o: [
        h === 'xong' ? 'Đã xong các bước' : `${h} — ${GIAI_DOAN[h]}`,
        ...cot.map((c) => trong.filter((d) => tinhTrang(d) === c).length),
        trong.length,
      ],
    }
  })
  const quaHan = duAn
    .filter((d) => tinhTrang(d) === 'qua-han')
    .sort((a, b) => b.thongKe.treNhat - a.thongKe.treNhat)
    .slice(0, 10)
  const vuong = duAn
    .filter((d) => d.vuongMacMo > 0)
    .sort((a, b) => b.vuongMacMo - a.vuongMacMo)
    .slice(0, 10)
  return {
    nguon: NGUON,
    nghiepVu: TEN,
    so: soTong(duAn),
    bang: [
      {
        tieuDe: 'Giai đoạn × tình trạng',
        ghiChu: 'Mỗi dự án tính ở giai đoạn của bước đang làm (Điều 8 NĐ 45).',
        cot: [
          { nhan: 'Giai đoạn' },
          { nhan: 'Quá hạn', so: true },
          { nhan: 'Sắp hạn', so: true },
          { nhan: 'Trong hạn', so: true },
          { nhan: 'Xong', so: true },
          { nhan: 'Tổng', so: true },
        ],
        dong: maTran,
      },
      {
        tieuDe: 'Dự án quá hạn nhiều nhất',
        cot: [
          { nhan: 'Dự án' },
          { nhan: 'Đơn vị' },
          { nhan: 'Đang tắc ở' },
          { nhan: 'Trễ (ngày)', so: true },
        ],
        dong: quaHan.map((d) => ({
          o: [
            d.ten,
            d.donViTen,
            d.thongKe.buocHienTai ? `${d.thongKe.buocHienTai.stt}. ${d.thongKe.buocHienTai.ten}` : '—',
            d.thongKe.treNhat,
          ],
          lienKet: lienKet(d, 'checklist'),
          mau: 'danger' as const,
        })),
      },
      {
        tieuDe: 'Vướng mắc chưa giải quyết',
        cot: [{ nhan: 'Dự án' }, { nhan: 'Đơn vị' }, { nhan: 'Vướng mắc', so: true }],
        dong: vuong.map((d) => ({ o: [d.ten, d.donViTen, d.vuongMacMo], lienKet: lienKet(d, 'vuong-mac') })),
      },
    ],
  }
}

// ── Bộ chỉ số ───────────────────────────────────────────────────────────────

export function chiSoDuAn(
  ds: DuAnTongHop[],
  loai: LoaiChiSo,
  nhaThau: { duAnId: string; tenDonVi: string }[],
): KhoiSoLieu {
  const coBuoc = ds.filter((x) => x.d.thongKe.tong > 0 && x.d.trangThai !== 'huy')
  const bq = (xs: DuAnTongHop[]) =>
    xs.length ? Math.round(xs.reduce((t, x) => t + x.kpi.diem, 0) / xs.length) : 0
  const loaiCua = (diem: number) => (diem >= 85 ? 'A' : diem >= 70 ? 'B' : diem >= 50 ? 'C' : 'D')
  const soChung: KhoiSoLieu['so'] = [
    {
      nhan: 'KPI bình quân',
      giaTri: coBuoc.length ? String(bq(coBuoc)) : '—',
      phu: coBuoc.length ? `loại ${loaiCua(bq(coBuoc))}` : undefined,
    },
    ...(['A', 'B', 'C', 'D'] as const).map((l) => ({
      nhan: `Loại ${l}`,
      giaTri: String(coBuoc.filter((x) => x.kpi.xepLoai === l).length),
      mau: l === 'A' ? ('ok' as const) : l === 'D' ? ('danger' as const) : undefined,
    })),
  ]
  const ghiChu =
    'KPI 100 điểm: đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20. A ≥ 85 · B ≥ 70 · C ≥ 50.'

  if (loai === 'tat-ca')
    return {
      nguon: NGUON,
      nghiepVu: TEN,
      so: soChung,
      bang: [
        {
          tieuDe: 'KPI từng dự án',
          ghiChu,
          cot: [
            { nhan: 'Dự án' },
            { nhan: 'Đơn vị' },
            { nhan: 'Điểm', so: true },
            { nhan: 'Loại', so: true },
            { nhan: 'Đúng hạn', so: true },
            { nhan: 'Trễ BQ (ngày)', so: true },
            { nhan: 'Điều chỉnh KH', so: true },
            { nhan: 'Giải ngân', so: true },
          ],
          dong: [...coBuoc]
            .sort((a, b) => b.kpi.diem - a.kpi.diem)
            .map((x) => ({
              o: [
                x.d.ten,
                x.d.donViTen,
                x.kpi.diem,
                x.kpi.xepLoai,
                `${x.kpi.dungHan}%`,
                x.kpi.treBinhQuan,
                x.kpi.dieuChinh,
                `${x.kpi.giaiNgan}%`,
              ],
              lienKet: lienKet(x.d),
              mau:
                x.kpi.xepLoai === 'D'
                  ? ('danger' as const)
                  : x.kpi.xepLoai === 'A'
                    ? ('ok' as const)
                    : undefined,
            })),
        },
      ],
    }

  const xepHang = (nhom: Map<string, DuAnTongHop[]>) =>
    [...nhom.entries()]
      .map(([ten, xs]) => ({ ten, n: xs.length, diem: bq(xs) }))
      .sort((a, b) => b.diem - a.diem)
      .map((r, i) => ({
        o: [i + 1, r.ten, r.n, r.diem, loaiCua(r.diem)],
        mau: r.diem < 50 ? ('danger' as const) : undefined,
      }))

  const theoChuDauTu = new Map<string, DuAnTongHop[]>()
  for (const x of coBuoc) theoChuDauTu.set(x.d.donViTen, [...(theoChuDauTu.get(x.d.donViTen) ?? []), x])
  const theoNhaThau = new Map<string, DuAnTongHop[]>()
  for (const nt of nhaThau) {
    const x = coBuoc.find((c) => c.d.id === nt.duAnId)
    if (x)
      theoNhaThau.set(nt.tenDonVi, [
        ...(theoNhaThau.get(nt.tenDonVi) ?? []).filter((y) => y.d.id !== x.d.id),
        x,
      ])
  }
  const cot = [
    { nhan: 'Hạng', so: true },
    { nhan: 'Đơn vị' },
    { nhan: 'Dự án', so: true },
    { nhan: 'KPI BQ', so: true },
    { nhan: 'Loại', so: true },
  ]
  return {
    nguon: NGUON,
    nghiepVu: TEN,
    so: soChung,
    bang: [
      { tieuDe: 'Xếp hạng chủ đầu tư', ghiChu, cot, dong: xepHang(theoChuDauTu) },
      {
        tieuDe: 'Xếp hạng nhà thầu',
        ghiChu: 'Theo các dự án nhà thầu là thành viên.',
        cot,
        dong: xepHang(theoNhaThau),
      },
    ],
  }
}
