import type { HoSoDuAn } from '@gdos/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { capNhatHoSo } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'

/**
 * Một lối ghi cho mọi thao tác trong hồ sơ: gọi API → nhận hồ sơ mới → ghi vào bộ
 * nhớ đệm (màn tự vẽ lại) → báo lỗi bằng câu của máy chủ.
 */
export function useGhiHoSo() {
  const qc = useQueryClient()
  const [loi, datLoi] = useState<string>()
  const m = useMutation({
    mutationFn: (viec: () => Promise<HoSoDuAn>) => viec(),
    onSuccess: (hs) => {
      capNhatHoSo(qc, hs)
      datLoi(undefined)
    },
    onError: (e) => datLoi(e instanceof LoiApi ? e.message : 'Không thực hiện được. Thử lại.'),
  })
  return {
    chay: (viec: () => Promise<HoSoDuAn>, xong?: () => void) => m.mutate(viec, { onSuccess: () => xong?.() }),
    dangChay: m.isPending,
    loi,
    xoaLoi: () => datLoi(undefined),
  }
}
