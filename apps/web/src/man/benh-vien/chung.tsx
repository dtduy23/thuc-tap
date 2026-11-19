import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { goiApi, taiVeTep } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { ThongBao } from '@/ui/co-ban'

const KHOA = ['benh-vien-thu'] as const

export const useQuyenThu = () => useSuspenseQuery(truyVanToi).data.quyen

export function useThu<T>(duongDan: string) {
  return useSuspenseQuery({
    queryKey: [...KHOA, duongDan],
    queryFn: () => goiApi<T>(`/benh-vien${duongDan}`),
  }).data
}

export function useGhiThu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ duongDan, body }: { duongDan: string; body?: unknown }) =>
      goiApi(`/benh-vien${duongDan}`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KHOA }),
  })
}

export function useTaiLieuThu() {
  return useMutation({
    mutationFn: (ma: string) => taiVeTep(`/benh-vien/nghien-cuu/${ma}/excel`, `${ma}-gia-lap.xlsx`),
  })
}

export function NhacGiaLap({ children }: { children?: string }) {
  return (
    <ThongBao>
      <strong>Dữ liệu giả lập.</strong> {children ?? 'Dùng trong buổi diễn tập.'}
    </ThongBao>
  )
}
