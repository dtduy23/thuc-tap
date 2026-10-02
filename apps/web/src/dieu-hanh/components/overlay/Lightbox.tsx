import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface Props {
  anh: ReadonlyArray<string>
  viTri: number
  doiViTri: (i: number) => void
  dong: () => void
}

/**
 * Port từ lbShow/lbNav/lbHide. Bổ sung theo CLAUDE.md §8: trap focus,
 * trả focus về chỗ cũ khi đóng, và có aria-label tiếng Việt cho nút icon.
 */
export function Lightbox({ anh, viTri, doiViTri, dong }: Props) {
  const mo = anh.length > 0
  const hop = useRef<HTMLDivElement>(null)
  const truocDo = useRef<HTMLElement | null>(null)

  const chuyen = useCallback(
    (d: number) => doiViTri((viTri + d + anh.length) % anh.length),
    [viTri, anh.length, doiViTri],
  )

  // Nhớ phần tử đang focus để trả lại khi đóng
  useEffect(() => {
    if (!mo) return
    truocDo.current = document.activeElement as HTMLElement
    hop.current?.focus()
    return () => truocDo.current?.focus()
  }, [mo])

  useEffect(() => {
    if (!mo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
      if (e.key === 'ArrowLeft') chuyen(-1)
      if (e.key === 'ArrowRight') chuyen(1)
      // Trap focus: Tab luôn quay vòng trong hộp
      if (e.key === 'Tab') {
        const nut = hop.current?.querySelectorAll<HTMLElement>('button')
        if (!nut?.length) return
        const dau = nut[0]!
        const cuoi = nut[nut.length - 1]!
        if (e.shiftKey && document.activeElement === dau) {
          e.preventDefault()
          cuoi.focus()
        } else if (!e.shiftKey && document.activeElement === cuoi) {
          e.preventDefault()
          dau.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mo, chuyen, dong])

  const mot = anh.length < 2

  return (
    <AnimatePresence>
      {mo && (
        <motion.div
          ref={hop}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh hiện trường"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) dong()
          }}
          className="fixed inset-0 z-300 flex items-center justify-center bg-[rgb(6_18_32/0.88)]"
        >
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng xem ảnh"
            className="absolute right-[22px] top-[18px] grid size-[42px] place-items-center rounded-full bg-white/15 text-[1.05rem] text-white hover:bg-white/25"
          >
            ✕
          </button>

          {!mot && (
            <button
              type="button"
              onClick={() => chuyen(-1)}
              aria-label="Ảnh trước"
              className="absolute left-[22px] top-1/2 grid size-[50px] -translate-y-1/2 place-items-center rounded-full bg-white/15 text-[1.6rem] leading-none text-white hover:bg-white/25"
            >
              ‹
            </button>
          )}

          <img
            src={anh[viTri]}
            alt={`Ảnh hiện trường ${viTri + 1} trên ${anh.length}`}
            className="max-h-[86vh] max-w-[90vw] rounded-[10px] bg-lightbox-anh shadow-[0_20px_70px_rgb(0_0_0/0.6)]"
          />

          {!mot && (
            <button
              type="button"
              onClick={() => chuyen(1)}
              aria-label="Ảnh kế tiếp"
              className="absolute right-[22px] top-1/2 grid size-[50px] -translate-y-1/2 place-items-center rounded-full bg-white/15 text-[1.6rem] leading-none text-white hover:bg-white/25"
            >
              ›
            </button>
          )}

          {!mot && (
            <div className="tnum absolute bottom-5 left-1/2 -translate-x-1/2 rounded-[14px] bg-white/15 px-3.5 py-[5px] text-[0.8rem] font-bold text-white">
              {viTri + 1} / {anh.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
