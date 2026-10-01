import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Nút + khung NỔI LÊN (popover) gắn dưới nút. Vẽ ra ngoài `body` để không bị khung
 * cuộn của bảng cắt mất. Đóng khi bấm ra ngoài, nhấn Esc, hoặc cuộn / đổi cỡ cửa sổ.
 */
export function NutNoiLen({
  nhan,
  tieuDe,
  className = '',
  canPhai = false,
  children,
}: {
  nhan: ReactNode
  /** Nhãn cho trình đọc màn hình + gợi ý khi rê chuột. */
  tieuDe: string
  className?: string
  /** Khung nổi căn mép phải theo nút (nút ở sát mép phải màn hình). */
  canPhai?: boolean
  children: (dong: () => void) => ReactNode
}) {
  const nut = useRef<HTMLButtonElement>(null)
  const khung = useRef<HTMLDivElement>(null)
  const [viTri, datViTri] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const dong = () => datViTri(null)

  useEffect(() => {
    if (!viTri) return
    const ngoai = (e: MouseEvent) => {
      const t = e.target as Node
      if (!khung.current?.contains(t) && !nut.current?.contains(t)) datViTri(null)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        datViTri(null)
        nut.current?.focus()
      }
    }
    const cuon = (e: Event) => {
      if (!khung.current?.contains(e.target as Node)) datViTri(null)
    }
    document.addEventListener('mousedown', ngoai)
    document.addEventListener('keydown', phim)
    window.addEventListener('scroll', cuon, true)
    window.addEventListener('resize', dong)
    return () => {
      document.removeEventListener('mousedown', ngoai)
      document.removeEventListener('keydown', phim)
      window.removeEventListener('scroll', cuon, true)
      window.removeEventListener('resize', dong)
    }
  }, [viTri])

  const bat = () => {
    if (viTri) return dong()
    const r = nut.current!.getBoundingClientRect()
    datViTri(
      canPhai
        ? { top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) }
        : { top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 300) },
    )
  }

  return (
    <>
      <button
        ref={nut}
        type="button"
        title={tieuDe}
        aria-label={tieuDe}
        aria-expanded={!!viTri}
        aria-haspopup="dialog"
        onClick={bat}
        className={className}
      >
        {nhan}
      </button>
      {viTri &&
        createPortal(
          <div
            ref={khung}
            role="dialog"
            aria-label={tieuDe}
            style={{ top: viTri.top, left: viTri.left, right: viTri.right }}
            className="hien-dan fixed z-50 max-h-[70vh] overflow-auto rounded-[10px] border border-line bg-nen p-2 text-[13px] text-ink shadow-[0_14px_38px_rgba(10,22,44,.18)]"
          >
            {children(dong)}
          </div>,
          document.body,
        )}
    </>
  )
}
