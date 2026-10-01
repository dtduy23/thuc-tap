import { SearchField } from '@heroui/react'

interface Props {
  giaTri: string
  doiGiaTri: (v: string) => void
  goiY: string
  nhan: string
}

/** Ô lọc trong card-h của bảng — dùng SearchField của HeroUI v3. */
export function FilterBar({ giaTri, doiGiaTri, goiY, nhan }: Props) {
  return (
    <SearchField value={giaTri} onChange={doiGiaTri} aria-label={nhan} className="w-full sm:w-[260px]">
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={goiY} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
}
