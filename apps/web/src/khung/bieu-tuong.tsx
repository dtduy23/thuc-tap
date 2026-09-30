import type { MaNhom } from '@gdos/shared'

const DUONG: Partial<Record<MaNhom, string>> = {
  'dieu-hanh': 'M3 3v18h18 M7 15l4-5 3 3 5-7',
  'tac-nghiep': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6',
  'danh-muc': 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M3 10h18 M9 4v16',
  'giam-sat': 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 7v5l3 2',
}
const QUAN_TRI =
  'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6 M12 2v3 M12 19v3 M4.2 4.2l2.1 2.1 M17.7 17.7l2.1 2.1 M2 12h3 M19 12h3 M4.2 19.8l2.1-2.1 M17.7 6.3l2.1-2.1'

/** Biểu tượng theo NHÓM — một nhóm một hình, nhìn là biết đang ở phần nào của khung. */
export function BieuTuongNhom({ nhom, tang }: { nhom: MaNhom; tang: number }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d={tang === 2 ? QUAN_TRI : (DUONG[nhom] ?? 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18')} />
    </svg>
  )
}

export function MuiTen({ mo }: { mo: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      aria-hidden="true"
      className={`flex-none opacity-65 transition-transform ${mo ? '' : '-rotate-90'}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function BieuTuong({ ten }: { ten: 'tim' | 'menu' | 'thoat' | 'khoa' | 'mat-troi' | 'cai-dat' }) {
  const d = {
    tim: 'M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14 M20 20l-3.5-3.5',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    thoat: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
    khoa: 'M5 11h14v10H5Z M8 11V7a4 4 0 0 1 8 0v4',
    'mat-troi': 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
    'cai-dat': QUAN_TRI,
  }[ten]
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
