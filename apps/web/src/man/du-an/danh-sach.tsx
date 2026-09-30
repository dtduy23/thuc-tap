import { GIAI_DOAN, HINH_THUC, LOAI_CHI, NHOM_DU_AN, type DuAnDong, type LocDuAn } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { truyVanDanhSachDuAn } from '@/lib/du-an'
import { truyVanToi } from '@/lib/phien'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { ChipSucKhoe, ChipTrangThai, ThanhTienDo } from './chung'

const TRONG: Record<LocDuAn, string> = {
  'tat-ca': 'Chưa có dự án nào trong phạm vi của bạn.',
  'cua-toi': 'Bạn chưa phụ trách hay tham gia dự án nào.',
  'cho-xac-nhan': 'Không có cập nhật nào đang chờ xác nhận.',
}

/** Tình trạng một dự án: đang làm thì theo sức khỏe tiến độ, còn lại theo trạng thái. */
const TINH_TRANG = [
  { giaTri: 'qua-han', nhan: 'Quá hạn' },
  { giaTri: 'sap-han', nhan: 'Sắp đến hạn' },
  { giaTri: 'trong-han', nhan: 'Trong hạn' },
  { giaTri: 'xong', nhan: 'Xong các bước' },
  { giaTri: 'hoan-thanh', nhan: 'Hoàn thành' },
  { giaTri: 'tam-dung', nhan: 'Tạm dừng' },
  { giaTri: 'huy', nhan: 'Hủy' },
] as const
const tinhTrang = (d: DuAnDong) => (d.trangThai === 'dang-thuc-hien' ? d.thongKe.sucKhoe : d.trangThai)

const COT: CotLuoi<DuAnDong>[] = [
  {
    id: 'ten',
    nhan: 'Tên dự án',
    kieu: 'chu',
    rong: 300,
    batBuoc: true,
    giaTri: (d) => d.ten,
    hien: (d) => (
      <Link
        to="/du-an/$id"
        params={{ id: d.id }}
        onClick={(e) => e.stopPropagation()}
        className="font-semibold text-ink hover:text-brand"
      >
        {d.ten}
      </Link>
    ),
  },
  {
    id: 'ma',
    nhan: 'Mã',
    kieu: 'chu',
    rong: 130,
    giaTri: (d) => d.ma,
    hien: (d) => <code className="text-[12px]">{d.ma}</code>,
  },
  { id: 'cdt', nhan: 'Chủ đầu tư', kieu: 'danh-muc', rong: 170, giaTri: (d) => d.donViTen },
  { id: 'linhVuc', nhan: 'Lĩnh vực', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.linhVucTen },
  {
    id: 'hinhThuc',
    nhan: 'Hình thức',
    kieu: 'danh-muc',
    rong: 140,
    an: true,
    giaTri: (d) => d.hinhThuc,
    luaChon: Object.entries(HINH_THUC).map(([giaTri, nhan]) => ({ giaTri, nhan })),
  },
  {
    id: 'loaiChi',
    nhan: 'Loại chi',
    kieu: 'danh-muc',
    rong: 150,
    an: true,
    giaTri: (d) => d.loaiChi,
    luaChon: Object.entries(LOAI_CHI).map(([giaTri, nhan]) => ({ giaTri, nhan })),
  },
  {
    id: 'nhom',
    nhan: 'Nhóm',
    kieu: 'danh-muc',
    rong: 90,
    an: true,
    giaTri: (d) => d.nhomDuAn,
    luaChon: NHOM_DU_AN.map((n) => ({ giaTri: n, nhan: `Nhóm ${n}` })),
  },
  {
    id: 'giaiDoan',
    nhan: 'Giai đoạn',
    kieu: 'danh-muc',
    rong: 170,
    giaTri: (d) => d.thongKe.giaiDoan ?? 'xong',
    luaChon: [
      ...Object.entries(GIAI_DOAN).map(([g, n]) => ({ giaTri: g, nhan: `${g} — ${n}` })),
      { giaTri: 'xong', nhan: 'Đã xong các bước' },
    ],
  },
  {
    id: 'buoc',
    nhan: 'Đang ở bước',
    kieu: 'chu',
    rong: 240,
    giaTri: (d) =>
      d.thongKe.buocHienTai ? `${d.thongKe.buocHienTai.stt}. ${d.thongKe.buocHienTai.ten}` : null,
  },
  {
    id: 'tienDo',
    nhan: 'Tiến độ (%)',
    kieu: 'so',
    rong: 130,
    giaTri: (d) => d.thongKe.phanTram,
    hien: (d) => (
      <span className="block text-left">
        <ThanhTienDo phanTram={d.thongKe.phanTram} nho />
        <span className="text-[11px] text-faint">
          {d.thongKe.xong}/{d.thongKe.tong} bước
        </span>
      </span>
    ),
  },
  {
    id: 'tinhTrang',
    nhan: 'Tình trạng',
    kieu: 'danh-muc',
    rong: 140,
    giaTri: tinhTrang,
    luaChon: TINH_TRANG,
    hien: (d) => (
      <span className="block text-left">
        {d.trangThai === 'dang-thuc-hien' ? (
          <ChipSucKhoe sk={d.thongKe.sucKhoe} />
        ) : (
          <ChipTrangThai tt={d.trangThai} />
        )}
      </span>
    ),
  },
  {
    id: 'tre',
    nhan: 'Trễ (ngày)',
    kieu: 'so',
    rong: 100,
    giaTri: (d) => (d.thongKe.quaHan > 0 ? d.thongKe.treNhat : null),
    hien: (d) =>
      d.thongKe.quaHan > 0 ? <span className="font-semibold text-danger">{d.thongKe.treNhat}</span> : '',
  },
  {
    id: 'choXacNhan',
    nhan: 'Chờ xác nhận',
    kieu: 'so',
    rong: 110,
    an: true,
    giaTri: (d) => d.thongKe.choXacNhan,
  },
  { id: 'vuongMac', nhan: 'Vướng mắc mở', kieu: 'so', rong: 110, giaTri: (d) => d.vuongMacMo || null },
  {
    id: 'canBo',
    nhan: 'Cán bộ phụ trách',
    kieu: 'danh-muc',
    rong: 170,
    giaTri: (d) => d.canBo?.hoTen ?? null,
  },
  { id: 'tongMuc', nhan: 'Tổng mức (tr.đ)', kieu: 'so', rong: 130, cong: true, giaTri: (d) => d.tongMuc },
  {
    id: 'giaiNgan',
    nhan: 'Đã giải ngân (tr.đ)',
    kieu: 'so',
    rong: 140,
    cong: true,
    giaTri: (d) => d.daGiaiNgan,
  },
  { id: 'batDau', nhan: 'Ngày bắt đầu', kieu: 'ngay', an: true, giaTri: (d) => d.ngayBatDau },
  { id: 'capNhat', nhan: 'Cập nhật', kieu: 'ngay', giaTri: (d) => d.capNhatNgay },
]

/**
 * Danh sách dự án — MỘT màn cho ba cấp 4 (Tất cả · Tôi phụ trách · Chờ xác nhận),
 * khác nhau ở bộ lọc do API áp. Lọc chi tiết là ô lọc dưới từng cột (chuẩn lưới).
 */
export function DanhSachDuAn({ loc }: { loc: LocDuAn }) {
  const { data: ds } = useSuspenseQuery(truyVanDanhSachDuAn(loc))
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const di = useNavigate()
  return (
    <Luoi
      ma={`du-an-${loc}`}
      tieuDe="Danh sách dự án"
      cot={COT}
      dong={ds}
      khoa={(d) => d.id}
      moDong={(d) => void di({ to: '/du-an/$id', params: { id: d.id } })}
      rong={TRONG[loc]}
      congCu={
        toi.quyen.includes('DU_AN.CREATE') && (
          <Link
            to="/$chucNang"
            params={{ chucNang: 'da-tao' }}
            className="rounded-lg border border-brand bg-brand px-3.5 py-[7px] text-[13px] font-semibold text-white hover:bg-brand-dim"
          >
            + Tạo dự án
          </Link>
        )
      }
    />
  )
}

export const TatCaDuAn = () => <DanhSachDuAn loc="tat-ca" />
export const DuAnCuaToi = () => <DanhSachDuAn loc="cua-toi" />
export const DuAnChoXacNhan = () => <DanhSachDuAn loc="cho-xac-nhan" />
