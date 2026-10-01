import { lazy, Suspense } from 'react'
import type { DiTich } from '@/dieu-hanh/mocks/types'

const BanDo = lazy(() => import('./MapPanelInner'))

interface Props {
  diTich: ReadonlyArray<DiTich>
  chieuCao: number
  chon?: (i: number) => void
  zoom?: number
}

/** Bản đồ nặng nên tách bundle riêng; trong lúc tải hiện khung xám. */
export function MapPanel(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          className="grid animate-pulse place-items-center rounded-[10px] bg-line-2 text-[0.76rem] text-faint"
          style={{ height: props.chieuCao }}
          role="status"
        >
          Đang tải bản đồ…
        </div>
      }
    >
      <BanDo {...props} />
    </Suspense>
  )
}
