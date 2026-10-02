import { InputGroup, Label, TextArea, TextField } from '@heroui/react'

/** Một ô chữ có nhãn; `dong` > 0 thì là ô nhiều dòng. */
export function OChu({
  nhan,
  giaTri,
  doi,
  khoa,
  goiY,
  dong = 0,
  anNhan,
  onBlur,
  kieu,
  ghi,
  className,
  lopO,
}: {
  nhan: string
  giaTri: string
  doi: (v: string) => void
  khoa?: boolean
  goiY?: string
  dong?: number
  /** Nhãn chỉ cho trình đọc màn hình — khi tiêu đề mục đã nói thay. */
  anNhan?: boolean
  onBlur?: () => void
  kieu?: 'number' | 'text' | 'password'
  /** Dòng ghi chú dưới nhãn. */
  ghi?: string
  className?: string
  /** Class thêm cho ô nhập (ví dụ `font-mono`). */
  lopO?: string
}) {
  return (
    <TextField
      value={giaTri}
      onChange={doi}
      isDisabled={khoa}
      aria-label={anNhan ? nhan : undefined}
      onBlur={onBlur}
      className={className}
    >
      {!anNhan && <Label className="text-[0.74rem] font-medium text-body">{nhan}</Label>}
      {ghi && <span className="text-[0.72rem] leading-relaxed text-faint">{ghi}</span>}
      {dong > 0 ? (
        <TextArea rows={dong} placeholder={goiY} className={lopO} />
      ) : (
        <InputGroup>
          <InputGroup.Input
            placeholder={goiY}
            type={kieu}
            className={lopO}
            autoComplete={kieu === 'password' ? 'new-password' : undefined}
          />
        </InputGroup>
      )}
    </TextField>
  )
}
