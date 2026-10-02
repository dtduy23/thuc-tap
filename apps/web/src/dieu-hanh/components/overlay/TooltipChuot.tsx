import { useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'

/**
 * Tooltip bám chuột của Dashboard Xã/Phường — port từ .tt + showTip()/hideTip().
 * Mọi biểu đồ SVG gắn cùng một hộp nên trạng thái giữ ở module thay vì context:
 * phần tử con chỉ cần gọi `goiY()`, không phải bọc provider.
 */

export interface NoiDungGoiY {
  tieuDe: ReactNode
  than?: ReactNode
}

interface TrangThai {
  nd: NoiDungGoiY | null
  x: number
  y: number
}

let trangThai: TrangThai = { nd: null, x: 0, y: 0 }
const nguoiNghe = new Set<() => void>()
const phat = () => nguoiNghe.forEach((f) => f())

export function hienGoiY(e: MouseEvent, nd: NoiDungGoiY) {
  trangThai = { nd, x: e.clientX, y: e.clientY }
  phat()
}

export function anGoiY() {
  if (!trangThai.nd) return
  trangThai = { ...trangThai, nd: null }
  phat()
}

/** Gắn vào phần tử SVG/HTML: `<rect {...goiY({ tieuDe, than })} />`. */
export const goiY = (nd: NoiDungGoiY) => ({
  onMouseMove: (e: MouseEvent) => hienGoiY(e, nd),
  onMouseLeave: anGoiY,
})

const dangKy = (f: () => void) => {
  nguoiNghe.add(f)
  return () => {
    nguoiNghe.delete(f)
  }
}

/** Đặt một lần trong khung trang. */
export function TooltipChuot() {
  const tt = useSyncExternalStore(dangKy, () => trangThai)
  const ref = useRef<HTMLDivElement>(null)

  // Kẹp trong màn hình như bản gốc: cần kích thước thật của hộp nên đo sau render.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !tt.nd) return
    el.style.left = `${Math.min(tt.x + 14, innerWidth - el.offsetWidth - 8)}px`
    el.style.top = `${Math.min(tt.y + 14, innerHeight - el.offsetHeight - 8)}px`
  }, [tt])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none fixed z-[60] max-w-[280px] rounded-md bg-bd-tip-nen px-[9px] py-1.5 text-[12px] leading-normal text-bd-tip-chu transition-opacity duration-100 ${
        tt.nd ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {tt.nd && (
        <>
          <b className="block">{tt.nd.tieuDe}</b>
          {tt.nd.than}
        </>
      )}
    </div>
  )
}
