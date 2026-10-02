import type { ReactNode } from 'react'

/** Trạng thái tải — khung xám nhấp nháy trong lúc lazy-load module. */
export function ModuleSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Đang tải nội dung">
      <div className="h-4 w-40 rounded bg-line-2" />
      <div className="h-8 w-72 rounded bg-line-2" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[118px] rounded-card bg-line-2" />
        ))}
      </div>
      <div className="h-[280px] rounded-card bg-line-2" />
    </div>
  )
}

/** Trạng thái rỗng — dùng khi bộ lọc không còn dòng nào. */
export function EmptyState({ noiDung = 'Không có dữ liệu phù hợp' }: { noiDung?: string }) {
  return <div className="py-14 text-center text-[0.82rem] text-faint">{noiDung}</div>
}

/** Trạng thái lỗi — hiện khi module ném lỗi lúc render. */
export function ErrorState({ loi, thuLai }: { loi: unknown; thuLai?: () => void }) {
  const moTa = loi instanceof Error ? loi.message : String(loi)
  return (
    <div className="rounded-card bg-nen p-8 text-center shadow-card" role="alert">
      <div className="text-[0.95rem] font-bold text-ink">Không tải được nội dung</div>
      <p className="mx-auto mt-2 max-w-lg text-[0.78rem] text-chu-phu">{moTa}</p>
      {thuLai && (
        <button
          type="button"
          onClick={thuLai}
          className="mt-4 inline-flex h-9 items-center rounded-[9px] bg-brand px-4 text-[0.78rem] font-semibold text-white"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

export function CardRong({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-[0.78rem] text-faint">{children}</div>
}
