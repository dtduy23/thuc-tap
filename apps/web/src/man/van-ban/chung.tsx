/**
 * Thành phần dùng chung của nhóm Xử lý văn bản — bố cục theo màn cũ ở gdos.fox.ai.vn:
 * thẻ số liệu có biểu tượng tròn, nút biểu tượng từng dòng, hộp thoại, trang giấy A4.
 */
import { TRANG_THAI_VAN_BAN, type TrangThaiVanBan } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useId, type ReactNode } from 'react'
import { truyVanTrangThaiVanBan } from '@/lib/van-ban'
import { Chip, ThongBao } from '@/ui/co-ban'

const DUONG = {
  van: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M8 13h8 M8 17h6',
  xong: 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4 12 14l-3-3',
  cho: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20 M12 6v6l4 2',
  gon: 'm7 20 5-5 5 5 M7 4l5 5 5-5',
  xem: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  sua: 'M12 20h9 M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z',
  tai: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  xoa: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
  them: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M12 12v6 M9 15h6',
  cong: 'M12 5v14 M5 12h14',
  ai: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z',
  mau: 'M4 4h16v16H4Z M4 9h16 M9 9v11',
  tich: 'M20 6 9 17l-5-5',
  nhom: 'M3 21h18 M5 21V7l7-4 7 4v14 M9 9h1 M14 9h1 M9 13h1 M14 13h1 M9 17h1 M14 17h1',
  nguoi: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  viec: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  kep: 'm21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  chep: 'M9 9h11v11H9Z M5 15H4V4h11v1',
  den: 'M22 12h-6l-2 3h-4l-2-3H2 M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z',
  moi: 'M21 12a9 9 0 1 1-2.6-6.4 M21 3v6h-6',
  dong: 'M18 6 6 18 M6 6l12 12',
} as const
export type TenBieuTuong = keyof typeof DUONG

export const BieuTuong = ({
  ten,
  co = 18,
  className,
}: {
  ten: TenBieuTuong
  co?: number
  className?: string
}) => (
  <svg
    aria-hidden="true"
    width={co}
    height={co}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={DUONG[ten]} />
  </svg>
)

const MAU_TRANG_THAI: Record<TrangThaiVanBan, 'xam' | 'brand' | 'warn' | 'ok' | 'danger'> = {
  'chua-gui': 'xam',
  cho: 'warn',
  'dang-xu-ly': 'brand',
  xong: 'ok',
  loi: 'danger',
}
/** Trạng thái tóm tắt của một văn bản. */
export const ChipVanBan = ({ tt }: { tt: TrangThaiVanBan }) => (
  <Chip mau={MAU_TRANG_THAI[tt]}>{TRANG_THAI_VAN_BAN[tt]}</Chip>
)

const MAU_KPI = {
  brand: 'bg-tint-brand text-brand',
  ok: 'bg-tint-ok text-ok',
  warn: 'bg-tint-warn text-warn',
  tim: 'bg-tint-tim text-tim',
} as const

export function TheKpi({
  nhan,
  giaTri,
  bieuTuong,
  mau,
}: {
  nhan: string
  giaTri: ReactNode
  bieuTuong: TenBieuTuong
  mau: keyof typeof MAU_KPI
}) {
  const lop = MAU_KPI[mau]
  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-line bg-nen px-5 py-4 shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)]">
      <span className={`grid size-11 flex-none place-items-center rounded-full ${lop}`}>
        <BieuTuong ten={bieuTuong} co={20} />
      </span>
      <span>
        <span className="block text-[11px] font-bold tracking-[.08em] text-faint uppercase">{nhan}</span>
        <span className={`block text-[28px] leading-tight font-extrabold tabular-nums ${lop.split(' ')[1]}`}>
          {giaTri}
        </span>
      </span>
    </div>
  )
}

export const LuoiKpi = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
)

export const NutIcon = ({
  nhan,
  ten,
  onClick,
  nguyHiem,
  disabled,
}: {
  nhan: string
  ten: TenBieuTuong
  onClick: () => void
  nguyHiem?: boolean
  disabled?: boolean
}) => (
  <button
    type="button"
    title={nhan}
    aria-label={nhan}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
    className={`grid size-8 place-items-center rounded-lg disabled:opacity-40 ${nguyHiem ? 'text-danger hover:bg-tint-danger' : 'text-faint hover:bg-nav-hover hover:text-brand'}`}
  >
    <BieuTuong ten={ten} co={17} />
  </button>
)

/** Hộp thoại giữa màn — Esc hoặc bấm nền để đóng (trừ lúc đang gửi). */
export function HopThoai({
  tieuDe,
  phu,
  dong,
  khoa,
  rong = 'max-w-[520px]',
  chan,
  children,
}: {
  tieuDe: ReactNode
  phu?: ReactNode
  dong: () => void
  /** Đang gửi — không cho đóng giữa chừng. */
  khoa?: boolean
  rong?: string
  chan?: ReactNode
  children: ReactNode
}) {
  const id = useId()
  useEffect(() => {
    const nghe = (e: KeyboardEvent) => e.key === 'Escape' && !khoa && dong()
    document.addEventListener('keydown', nghe)
    return () => document.removeEventListener('keydown', nghe)
  }, [dong, khoa])
  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !khoa && dong()}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,22,44,.45)] p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`hien-dan flex max-h-[92vh] w-full flex-col rounded-[12px] bg-nen shadow-[0_18px_44px_rgba(4,14,33,.3)] ${rong}`}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 id={id} className="m-0 text-[16px] font-extrabold text-ink">
              {tieuDe}
            </h2>
            {phu && <p className="mt-0.5 mb-0 text-[12.5px] text-faint">{phu}</p>}
          </div>
          <NutIcon nhan="Đóng" ten="dong" onClick={dong} disabled={khoa} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {chan && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{chan}</div>
        )}
      </div>
    </div>
  )
}

/** Tiêu đề nhỏ của một khối trong biểu mẫu. */
export const TieuDeKhoi = ({ children, phu }: { children: ReactNode; phu?: ReactNode }) => (
  <div className="mb-2.5">
    <h3 className="m-0 text-[11px] font-bold tracking-[.1em] text-faint uppercase">{children}</h3>
    {phu && <p className="mt-1 mb-0 text-[12px] text-faint">{phu}</p>}
  </div>
)

/**
 * Công cụ Native (mẫu, soạn thảo, phân công) cần: Native THẬT + tài khoản đã liên kết.
 * Trả `san` để màn chỉ gọi Native khi được; `canhBao` là thông báo hiện thay khi chưa.
 */
export function useSanSangNative() {
  const q = useQuery(truyVanTrangThaiVanBan)
  const tt = q.data
  const san = !!tt && tt.cheDo === 'that' && tt.daLienKet
  const canhBao = !tt ? null : tt.cheDo !== 'that' ? (
    <ThongBao kieu="loi">
      <b>Chưa nối FOXAI Native thật.</b> Chức năng này dùng công cụ của Native (mẫu văn bản, soạn thảo, phân
      công) — máy chủ cần cấu hình <code>NATIVE_URL</code>. {tt.moTa}
    </ThongBao>
  ) : !tt.daLienKet ? (
    <ThongBao kieu="loi">
      Tài khoản của bạn chưa liên kết FOXAI Native —{' '}
      <Link to="/cai-dat" className="font-semibold underline">
        liên kết ở Cài đặt cá nhân
      </Link>{' '}
      để dùng chức năng này.
    </ThongBao>
  ) : null
  return { san, canhBao, dangTai: q.isPending }
}

/** Nút chọn dạng "viên" (tab nhỏ) — chọn một trong vài chế độ. */
export function ChonCheDo<T extends string>({
  giaTri,
  doi,
  muc,
}: {
  giaTri: T
  doi: (v: T) => void
  muc: readonly { id: T; nhan: ReactNode }[]
}) {
  return (
    <div className="flex gap-1 rounded-[9px] bg-nen-2 p-1" role="group">
      {muc.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={giaTri === m.id}
          onClick={() => doi(m.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[12.5px] font-semibold ${
            giaTri === m.id
              ? 'bg-nen text-brand shadow-[0_1px_3px_rgba(16,30,54,.12)]'
              : 'text-faint hover:text-ink'
          }`}
        >
          {m.nhan}
        </button>
      ))}
    </div>
  )
}

export const LOP_O_NHO =
  'w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-brand focus:bg-nen focus:shadow-[0_0_0_3px_var(--tint-brand)] disabled:opacity-60'
export const LOP_NHAN = 'mb-1.5 block text-[12.5px] font-semibold text-body'
