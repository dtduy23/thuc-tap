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
 * Hồ sơ MỘT dự án. Các thẻ là trục PHẠM VI của hồ sơ — không lên cây, không phải
 * cấp 5 (ADR-0002).
 */
export const THE_HO_SO = [
  { id: 'tong-quan', nhan: 'Tổng quan', ManHinh: TongQuan },
  { id: 'checklist', nhan: 'Checklist & tiến độ', ManHinh: Checklist },
  { id: 'gantt', nhan: 'Gantt', ManHinh: Gantt },
  { id: 'ke-hoach', nhan: 'Kế hoạch & điều chỉnh', ManHinh: KeHoach },
  { id: 'van-ban', nhan: 'Văn bản', ManHinh: VanBan },
  { id: 'kinh-phi', nhan: 'Kinh phí & giải ngân', ManHinh: KinhPhi },
  { id: 'vuong-mac', nhan: 'Vướng mắc', ManHinh: VuongMac },
  { id: 'thanh-vien', nhan: 'Thành viên', ManHinh: ThanhVien },
  { id: 'nhat-ky', nhan: 'Nhật ký', ManHinh: NhatKy, quyen: 'NHAT_KY.READ' },
] as const

export type MaThe = (typeof THE_HO_SO)[number]['id']

export function TrangHoSoDuAn({ id, the }: { id: string; the: MaThe }) {
  const { data: hs } = useSuspenseQuery(truyVanHoSo(id))
  const { data: toi } = useSuspenseQuery(truyVanToi)
  // Thẻ có quyền riêng (Nhật ký) chỉ hiện với người có quyền của chủ thẻ.
  const cacThe = THE_HO_SO.filter((t) => !('quyen' in t) || toi.quyen.includes(t.quyen))
  const dangXem = cacThe.find((t) => t.id === the) ?? cacThe[0]!
  const ManHinh = dangXem.ManHinh

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 flex flex-wrap items-center gap-1.5 text-[12px] text-faint">
        <span>Tác nghiệp ›</span>
        <Link to="/$chucNang" params={{ chucNang: 'da-tat-ca' }} className="hover:text-brand">
          Dự án
        </Link>
        <span>›</span>
        <b className="text-body">{hs.ma}</b>
      </nav>
      <h1 className="mt-0 mb-1 text-[20px] leading-snug font-extrabold tracking-[-.01em] text-ink">
        {hs.ten}
      </h1>
      <p className="mt-0 mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
        <span>
          <code>{hs.ma}</code> · Chủ đầu tư: <b className="text-body">{hs.donViTen}</b>
          {hs.linhVucTen ? ` · ${hs.linhVucTen}` : ''}
        </span>
        {hs.trangThai === 'dang-thuc-hien' ? (
          <ChipSucKhoe sk={hs.thongKe.sucKhoe} />
        ) : (
          <ChipTrangThai tt={hs.trangThai} />
        )}
        {!hs.quyen.sua && hs.quyen.gui && (
          <span className="rounded-full bg-tint-tim px-2 py-0.5 text-[11px] font-semibold text-tim">
            Bạn là nhà thầu / tư vấn — gửi cập nhật để chủ đầu tư xác nhận
          </span>
        )}
      </p>

      <div
        role="tablist"
        aria-label="Các phần của hồ sơ"
        className="mb-4 flex gap-0.5 overflow-x-auto border-b border-line"
      >
        {cacThe.map((t) => (
          <Link
            key={t.id}
            to="/du-an/$id"
            params={{ id }}
            search={{ the: t.id }}
            role="tab"
            aria-selected={t.id === dangXem.id}
            className={`-mb-px border-b-[2.5px] px-3.5 py-2 text-[13px] whitespace-nowrap ${t.id === dangXem.id ? 'border-vang font-bold text-brand' : 'border-transparent font-medium text-faint hover:text-ink'}`}
          >
            {t.nhan}
          </Link>
        ))}
      </div>

      <Suspense fallback={<p className="text-faint">Đang tải…</p>}>
        <ManHinh hs={hs} />
      </Suspense>
    </>
  )
}
