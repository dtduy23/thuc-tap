import { useEffect, useState } from 'react'
import { useGiamChuyenDong } from '@/dieu-hanh/lib/motion'

/**
 * Port từ animate(): số KPI chạy từ 0 lên đích trong ~28 bước, mỗi bước 22ms.
 * Người dùng bật giảm chuyển động thì hiện thẳng số cuối.
 */
export function useDemSo(dich: number, chay = true): number {
  const giam = useGiamChuyenDong()
  const [gt, setGt] = useState(() => (giam || !chay ? dich : 0))

  useEffect(() => {
    if (giam || !chay) return
    let c = 0
    const step = Math.max(1, Math.round(dich / 28))
    const iv = setInterval(() => {
      c += step
      if (c >= dich) {
        c = dich
        clearInterval(iv)
      }
      setGt(c)
    }, 22)
    return () => clearInterval(iv)
  }, [dich, chay, giam])

  return giam || !chay ? dich : gt
}
