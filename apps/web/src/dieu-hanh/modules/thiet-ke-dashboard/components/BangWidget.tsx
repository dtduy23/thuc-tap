import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { BANG_WIDGET, type LoaiWidget } from '../du-lieu'

interface Props {
  /** Bấm thay cho kéo — bàn phím và cảm ứng vẫn thêm được widget (§8). */
  them: (t: LoaiWidget) => void
}

/** Bảng widget bên trái — port từ .pal. */
export function BangWidget({ them }: Props) {
  return (
    <SectionCard tieuDe="Widget · kéo vào khung">
      <div className="grid gap-2">
        {BANG_WIDGET.map((w) => (
          <button
            key={w.type}
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('pal', w.type)}
            onClick={() => them(w.type)}
            aria-label={`Thêm ${w.nhan} vào dashboard`}
            className="flex cursor-grab items-center gap-[9px] rounded-[9px] border-[1.5px] border-dashed border-vien-keo bg-nen-keo px-[11px] py-[9px] text-[0.78rem] transition-colors hover:border-brand active:cursor-grabbing"
          >
            <span className="grid size-[26px] flex-none place-items-center rounded-[7px] bg-brand-soft text-[0.72rem] font-extrabold text-brand">
              {w.icon}
            </span>
            <b className="text-ink">{w.nhan}</b>
            <span className="ml-auto text-[0.68rem] text-faint">kéo ⠿</span>
          </button>
        ))}
        <div className="text-[0.7rem] text-chu-phu">Mẹo: kéo widget trong khung để sắp xếp lại thứ tự.</div>
      </div>
    </SectionCard>
  )
}
