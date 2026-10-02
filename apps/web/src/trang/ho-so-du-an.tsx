import { HINH_THUC, LOAI_CHI, homNay, tinhKpi, type HoSoDuAn } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { truyVanHoSo } from '@/lib/du-an'
import { truyVanToi } from '@/lib/phien'
import { ChipSucKhoe, ChipTrangThai } from '@/man/du-an/chung'

const TongQuan = lazy(() => import('@/man/du-an/ho-so/tong-quan'))
const Checklist = lazy(() => import('@/man/du-an/ho-so/checklist'))
const ThanhVien = lazy(() => import('@/man/du-an/ho-so/thanh-vien'))
const KeHoach = lazy(() => import('@/man/du-an/ho-so/ke-hoach'))
const Gantt = lazy(() => import('@/man/du-an/ho-so/gantt'))
const VanBan = lazy(() => import('@/man/du-an/ho-so/van-ban'))
const KinhPhi = lazy(() => import('@/man/du-an/ho-so/kinh-phi'))
const VuongMac = lazy(() => import('@/man/du-an/ho-so/vuong-mac'))
const NhatKy = lazy(() => import('@/man/du-an/ho-so/nhat-ky'))

/**
 * KHÔNG GIAN MỘT DỰ ÁN (tổ chức như PMS). Các mục là trục PHẠM VI của hồ sơ — không lên cây
 * phân hệ, không phải cấp 5 (ADR-0002). Trên màn rộng chúng nằm ở cột trái ("Không gian dự
 * án", khung/khong-gian-du-an.tsx); màn hẹp hiện thành dải thẻ ngang ở đây.
 */
export const THE_HO_SO = [
  { id: 'tong-quan', nhan: 'Tổng quan dự án', ManHinh: TongQuan },
  { id: 'checklist', nhan: 'Checklist & timeline', ManHinh: Checklist },
  { id: 'gantt', nhan: 'Biểu đồ Gantt', ManHinh: Gantt },
  { id: 'ke-hoach', nhan: 'Kế hoạch & điều chỉnh', ManHinh: KeHoach },
  { id: 'van-ban', nhan: 'Văn bản dự án', ManHinh: VanBan },
  { id: 'kinh-phi', nhan: 'Kinh phí & giải ngân', ManHinh: KinhPhi },
  { id: 'vuong-mac', nhan: 'Vướng mắc & giải pháp', ManHinh: VuongMac },
  { id: 'thanh-vien', nhan: 'Thành viên', ManHinh: ThanhVien },
  { id: 'nhat-ky', nhan: 'Nhật ký', ManHinh: NhatKy, quyen: 'NHAT_KY.READ' },
] as const

export type MaThe = (typeof THE_HO_SO)[number]['id']

/** Các thẻ người này mở được — thẻ có quyền riêng (Nhật ký) chỉ hiện khi có quyền đó. */
export const theMoDuoc = (quyen: readonly string[]) =>
  THE_HO_SO.filter((t) => !('quyen' in t) || quyen.includes(t.quyen))

/** Dải đầu hồ sơ kiểu PMS: tên, mã, trạng thái, chủ đầu tư… bên phải là % tiến độ, KPI, số ngày chậm. */
function DaiDuAn({ hs }: { hs: HoSoDuAn }) {
  const tk = hs.thongKe
  const kpi = tinhKpi(
    hs.buoc,
    hs.phienBan.length,
    hs.taiChinh.daGiaiNgan,
    hs.taiChinh.keHoachDenNay,
    homNay(),
  )
  return (
    <div className="be-mat-dam mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[12px] px-5 py-4">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-[18px] leading-snug font-extrabold text-white">{hs.ten}</h1>
        <p className="mt-1.5 mb-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-body">
          <span>
            Mã: <b className="text-white">{hs.ma}</b>
          </span>
          <span className="be-mat-sang rounded-full">
            {hs.trangThai === 'dang-thuc-hien' ? (
              <ChipSucKhoe sk={tk.sucKhoe} />
            ) : (
              <ChipTrangThai tt={hs.trangThai} />
            )}
          </span>
          <span>
            Chủ đầu tư: <b className="text-white">{hs.donViTen}</b>
          </span>
        </p>
        <p className="mt-1 mb-0 text-[12px] text-faint">
          Cán bộ phụ trách: <b className="text-body">{hs.canBo?.hoTen ?? '—'}</b> · {HINH_THUC[hs.hinhThuc]} ·{' '}
          {LOAI_CHI[hs.loaiChi]}
          {hs.nhomDuAn ? ` · nhóm ${hs.nhomDuAn}` : ''}
          {hs.linhVucTen ? ` · ${hs.linhVucTen}` : ''}
          {hs.canCu ? ` · ${hs.canCu}` : ''}
        </p>
        {!hs.quyen.sua && hs.quyen.gui && (
          <p className="mt-1.5 mb-0 text-[12px] font-semibold text-vang">
            Bạn là nhà thầu / tư vấn — gửi cập nhật để chủ đầu tư xác nhận
          </p>
        )}
      </div>
      <div className="flex flex-none items-end gap-5 text-right">
        <div title="Đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20">
          <p className="m-0 text-[22px] leading-none font-extrabold text-vang tabular-nums">
            {kpi.diem}
            <span className="ml-1 text-[13px]">{kpi.xepLoai}</span>
          </p>
          <p className="m-0 mt-1 text-[11px] text-faint">điểm KPI</p>
        </div>
        {tk.quaHan > 0 && (
          <div>
            <p className="m-0 text-[22px] leading-none font-extrabold text-[#ff9b93] tabular-nums">
              {tk.treNhat}
            </p>
            <p className="m-0 mt-1 text-[11px] text-faint">ngày chậm</p>
          </div>
        )}
        <div>
          <p className="m-0 text-[30px] leading-none font-extrabold text-white tabular-nums">
            {tk.phanTram}%
          </p>
          <p className="m-0 mt-1 text-[11px] text-faint">tiến độ bước</p>
        </div>
      </div>
    </div>
  )
}

export function TrangHoSoDuAn({ id, the }: { id: string; the: MaThe }) {
  const { data: hs } = useSuspenseQuery(truyVanHoSo(id))
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const cacThe = theMoDuoc(toi.quyen)
  const dangXem = cacThe.find((t) => t.id === the) ?? cacThe[0]!
  const ManHinh = dangXem.ManHinh

  return (
    <>
      <nav aria-label="Vị trí" className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-faint">
        <Link to="/$chucNang" params={{ chucNang: 'da-tat-ca' }} className="font-semibold hover:text-brand">
          ← Danh mục dự án
        </Link>
        <span>/</span>
        <b className="text-body">{hs.ma}</b>
      </nav>
      <h2 className="mt-0 mb-3 text-[20px] leading-snug font-extrabold tracking-[-.01em] text-ink">
        {dangXem.nhan}
      </h2>

      {/* Màn hẹp: cột trái là ngăn kéo nên các mục của không gian dự án hiện thành dải thẻ. */}
      <div
        role="tablist"
        aria-label="Các phần của hồ sơ"
        className="mb-3 flex gap-0.5 overflow-x-auto border-b border-line md:hidden"
      >
        {cacThe.map((t) => (
          <Link
            key={t.id}
            to="/du-an/$id"
            params={{ id }}
            search={{ the: t.id }}
            role="tab"
            aria-selected={t.id === dangXem.id}
            className={`-mb-px border-b-[2.5px] px-3 py-2 text-[13px] whitespace-nowrap ${t.id === dangXem.id ? 'border-vang font-bold text-brand' : 'border-transparent font-medium text-faint hover:text-ink'}`}
          >
            {t.nhan}
          </Link>
        ))}
      </div>

      <DaiDuAn hs={hs} />

      <Suspense fallback={<p className="text-faint">Đang tải…</p>}>
        <ManHinh hs={hs} />
      </Suspense>
    </>
  )
}
