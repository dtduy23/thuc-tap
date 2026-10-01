import { useEffect, useState } from 'react'

/**
 * Người dùng bật giảm chuyển động thì animation viết bằng JS (đếm số KPI)
 * phải tự bỏ qua — CSS đã xử lý phần còn lại trong globals.css.
 */
export function useGiamChuyenDong(): boolean {
  const [giam, setGiam] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setGiam(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return giam
}
