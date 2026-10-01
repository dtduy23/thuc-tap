import { useEffect, useRef, useState } from 'react'
import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { anhMinhHoa } from '@/dieu-hanh/lib/anh'
import { toast } from '@/dieu-hanh/store/toast'
import type { DiTich } from '@/dieu-hanh/mocks/types'
import { CANH_360, KW_360 } from '../du-lieu'

/** Nền dự phòng của .pano360 bản gốc. */
const NEN = 'linear-gradient(120deg,#25301F,#3B4A33)'

interface Props {
  state: UseOverlayStateReturn
  diTich: DiTich | null
}

/**
 * Port từ tour360() + initP360() — trình xem 360° nội bộ: kéo để xoay,
 * thả tay thì tự xoay chậm. Bản gốc không có tour thật (EMBED360 toàn null).
 */
export function Pano360({ state, diTich: p }: Props) {
  const [canh, datCanh] = useState(0)
  const hop = useRef<HTMLDivElement>(null)
  const lech = useRef(0)
  const keo = useRef<{ x: number; px: number } | null>(null)
  const [dangKeo, datDangKeo] = useState(false)
  const [anGoiY, datAnGoiY] = useState(false)

  // Tự xoay chậm khi không kéo — §6 yêu cầu bỏ animation lặp nếu người dùng
  // bật giảm chuyển động, nên kiểm tra trước khi chạy vòng lặp rAF
  useEffect(() => {
    if (!state.isOpen) return
    const giamChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (giamChuyenDong) return

    let raf = 0
    const xoay = () => {
      const b = hop.current
      if (b && !keo.current) {
        lech.current -= 0.35
        b.style.backgroundPositionX = `${lech.current}px`
      }
      raf = requestAnimationFrame(xoay)
    }
    raf = requestAnimationFrame(xoay)
    return () => cancelAnimationFrame(raf)
  }, [state.isOpen])

  // Mỗi lần mở lại thì về cảnh 1 như bản gốc (panoScene = 0)
  const [moTruoc, datMoTruoc] = useState(false)
  if (moTruoc !== state.isOpen) {
    datMoTruoc(state.isOpen)
    if (state.isOpen) {
      datCanh(0)
      datAnGoiY(false)
    }
  }

  if (!p) return null

  const anh =
    p.imgs && p.imgs.length
      ? p.imgs[canh % p.imgs.length]
      : anhMinhHoa(canh === 0 && p.kw ? p.kw : KW_360[canh]!, p.seed * 3 + canh + 1, 1600, 500)

  const doiCanh = (k: number) => {
    datCanh(k)
    toast(`Đã chuyển tới: ${CANH_360[k]}`)
  }

  return (
    <ModalKhung
      state={state}
      tieuDe={`Tour ảo 360° — ${p.ten}`}
      phu="Giữ chuột và kéo sang trái/phải để xoay toàn cảnh · thả tay sẽ tự xoay chậm"
      nhanDong="Đóng tour ảo 360 độ"
    >
      <div
        ref={hop}
        className={`relative h-[300px] overflow-hidden rounded-[10px] bg-[length:auto_100%] bg-repeat-x ${
          dangKeo ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ backgroundImage: `url('${anh}'), ${NEN}` }}
        role="img"
        aria-label={`Ảnh toàn cảnh 360 độ — ${CANH_360[canh]}, ${p.ten}`}
        onPointerDown={(e) => {
          keo.current = { x: e.clientX, px: lech.current }
          e.currentTarget.setPointerCapture(e.pointerId)
          datDangKeo(true)
          datAnGoiY(true)
        }}
        onPointerMove={(e) => {
          if (!keo.current) return
          lech.current = keo.current.px + (e.clientX - keo.current.x)
          e.currentTarget.style.backgroundPositionX = `${lech.current}px`
        }}
        onPointerUp={() => {
          keo.current = null
          datDangKeo(false)
        }}
        onPointerCancel={() => {
          keo.current = null
          datDangKeo(false)
        }}
      >
        <div className="absolute left-3 top-3 rounded-[20px] bg-black/55 px-2.5 py-1 text-[0.68rem] font-bold text-white">
          ● 360° đang phát · kéo để xoay
        </div>
        {!anGoiY && (
          <div className="absolute inset-0 grid place-items-center text-[1.1rem] font-bold text-white drop-shadow">
            ⟲ Kéo để xoay
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <b className="text-[0.84rem] text-ink">
          Cảnh {canh + 1}/3 — {CANH_360[canh]}
        </b>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((k) => (
            <NutPhu key={k} onPress={() => doiCanh(k)}>
              Cảnh {k + 1}
            </NutPhu>
          ))}
        </div>
      </div>

      <div className="mt-2 text-[0.72rem] text-chu-phu">
        Ảnh minh họa nguồn mở đúng chủ đề — khi triển khai thay bằng ảnh 360 chụp tại chính di tích, hoặc dán
        link Street View của di tích vào cấu hình EMBED360 (hệ thống tự ưu tiên).
      </div>
    </ModalKhung>
  )
}
