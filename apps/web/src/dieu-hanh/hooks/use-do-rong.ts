import { useEffect, useRef, useState } from 'react'

/**
 * Bề rộng thực của một phần tử, cập nhật khi khung đổi cỡ. Biểu đồ đường của
 * Dashboard Xã/Phường tính tọa độ theo pixel thật (bản gốc đọc clientWidth và
 * vẽ lại khi resize) — mở/đóng sidebar cũng làm đổi cỡ nên phải nghe phần tử,
 * không nghe window.
 */
export function useDoRong<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [rong, setRong] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setRong(el.clientWidth)
    const ro = new ResizeObserver(() => setRong(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, rong] as const
}
