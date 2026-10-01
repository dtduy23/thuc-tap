import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import type { DiTich } from '@/dieu-hanh/mocks/types'

interface Props {
  state: UseOverlayStateReturn
  diTich: DiTich | null
}

/**
 * Port từ videoDt(). Bản gốc có nhánh dự phòng khi mở portal bằng giao thức
 * `file:` (YouTube chặn nhúng); bản React luôn chạy qua máy chủ nên chỉ giữ
 * nhánh nhúng iframe.
 */
export function VideoDiTich({ state, diTich: p }: Props) {
  if (!p?.yt) return null

  return (
    <ModalKhung
      state={state}
      tieuDe={`Video giới thiệu — ${p.ten}`}
      phu="Nguồn video cộng đồng trên YouTube · khi triển khai thay bằng video chính thức của địa phương"
      nhanDong="Đóng video giới thiệu di tích"
    >
      <iframe
        src={`https://www.youtube.com/embed/${p.yt}?rel=0`}
        className="h-[430px] w-full rounded-[10px] border-0 bg-black"
        title={`Video ${p.ten}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[0.72rem] text-chu-phu">
          Nếu video không phát trong khung (chủ kênh chặn nhúng), bấm nút bên để xem trực tiếp.
        </div>
        <a
          href={`https://youtu.be/${p.yt}`}
          target="_blank"
          rel="noopener"
          className="rounded-3xl border border-line px-4 py-2 text-[0.78rem] font-semibold text-ink no-underline hover:bg-row-hover"
        >
          ▶ Mở trên YouTube
        </a>
      </div>
    </ModalKhung>
  )
}
