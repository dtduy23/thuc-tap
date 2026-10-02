import { lazy, Suspense, type ComponentProps } from 'react'

const Ban = lazy(() => import('./BanDoDiaGioiInner'))

type Props = ComponentProps<typeof Ban>

export function BanDoDiaGioi(props: Props) {
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
      <Ban {...props} />
    </Suspense>
  )
}
