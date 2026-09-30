import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { truyVanHoSo } from '@/lib/du-an'
import { ChipSucKhoe, ChipTrangThai } from '@/man/du-an/chung'

const TongQuan = lazy(() => import('@/man/du-an/ho-so/tong-quan'))
const Checklist = lazy(() => import('@/man/du-an/ho-so/checklist'))
const ThanhVien = lazy(() => import('@/man/du-an/ho-so/thanh-vien'))

/**
 * Hồ sơ MỘT dự án. Các thẻ là trục PHẠM VI của hồ sơ — không lên cây, không phải
 * cấp 5 (ADR-0002). Thẻ chưa xây vẫn hiện (mờ) để thấy trọn khung hồ sơ.
 */
export const THE_HO_SO = [
  { id: 'tong-quan', nhan: 'Tổng quan', ManHinh: TongQuan },
  { id: 'checklist', nhan: 'Checklist & tiến độ', ManHinh: Checklist },
  { id: 'gantt', nhan: 'Gantt' },
  { id: 'ke-hoach', nhan: 'Kế hoạch & điều chỉnh' },
  { id: 'van-ban', nhan: 'Văn bản' },
  { id: 'kinh-phi', nhan: 'Kinh phí & giải ngân' },
  { id: 'vuong-mac', nhan: 'Vướng mắc' },
  { id: 'thanh-vien', nhan: 'Thành viên', ManHinh: ThanhVien },
  { id: 'nhat-ky', nhan: 'Nhật ký' },
] as const

export type MaThe = (typeof THE_HO_SO)[number]['id']

export function TrangHoSoDuAn({ id, the }: { id: string; the: MaThe }) {
  const { data: hs } = useSuspenseQuery(truyVanHoSo(id))
  const dangXem = THE_HO_SO.find((t) => t.id === the) ?? THE_HO_SO[0]
  const ManHinh = 'ManHinh' in dangXem ? dangXem.ManHinh : null

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">
        <span>Tầng 1 — Nghiệp vụ ›</span>
        <span>Tác nghiệp ›</span>
        <Link to="/$chucNang" params={{ chucNang: 'da-tat-ca' }} className="hover:text-brand">
          Dự án
        </Link>
        <span>›</span>
        <b className="text-body">{hs.ma}</b>
      </nav>
      <h1 className="mt-0 mb-1 text-[21px] leading-snug font-bold">{hs.ten}</h1>
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
        {THE_HO_SO.map((t) =>
          'ManHinh' in t ? (
            <Link
              key={t.id}
              to="/du-an/$id"
              params={{ id }}
              search={{ the: t.id }}
              role="tab"
              aria-selected={t.id === dangXem.id}
              className={`border-b-2 px-3 py-2 text-[13px] whitespace-nowrap ${t.id === dangXem.id ? 'border-brand font-semibold text-brand' : 'border-transparent text-body hover:text-brand'}`}
            >
              {t.nhan}
            </Link>
          ) : (
            <span
              key={t.id}
              role="tab"
              aria-disabled="true"
              aria-selected={false}
              title="Sắp có"
              className="cursor-default border-b-2 border-transparent px-3 py-2 text-[13px] whitespace-nowrap text-faint opacity-60"
            >
              {t.nhan}
            </span>
          ),
        )}
      </div>

      <Suspense fallback={<p className="text-faint">Đang tải…</p>}>{ManHinh && <ManHinh hs={hs} />}</Suspense>
    </>
  )
}
