import { useState } from 'react'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import { nice } from '@/dieu-hanh/lib/format'
import { duLieuWidget, type BoDuLieu, type LoaiWidget, type Widget } from '../du-lieu'

interface Props {
  widget: Widget[]
  bo: BoDuLieu
  them: (t: LoaiWidget) => void
  xoa: (id: number) => void
  chuyen: (id: number, truocId: number | null) => void
  cauHinh: (id: number) => void
}

/** Thân widget theo loại — port nhánh if/else trong renderDb(). */
function ThanWidget({ w, bo }: { w: Widget; bo: BoDuLieu }) {
  const d = duLieuWidget(w, bo)

  if (w.type === 'kpi') {
    const tot = d.reduce((a, b) => a + b[1], 0)
    return (
      <>
        <div className="tnum text-[2rem] font-extrabold text-brand">{nice(tot)}</div>
        <div className="text-[0.7rem] text-chu-phu">
          {bo.headers[w.val] ?? ''} · tổng {d.length} kỳ · TB {nice(tot / (d.length || 1))}/kỳ
        </div>
      </>
    )
  }

  if (w.type === 'bar') {
    return <Bar items={d.slice(0, 8)} h={150} />
  }

  if (w.type === 'pie') {
    const it = d.slice(0, 6) as MucChart[]
    return (
      <div className="flex items-center gap-3">
        <Donut items={it} size={128} thick={21} />
        <div className="flex-1">
          <DonutLegend items={it} />
        </div>
      </div>
    )
  }

  if (w.type === 'line') {
    return <Line vals={d.map((x) => x[1])} labels={d.map((x) => String(x[0]).slice(0, 4))} h={150} />
  }

  // table
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {bo.headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                className="whitespace-nowrap bg-row-head px-2.5 py-[7px] text-[0.68rem] font-bold text-chu-phu"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bo.rows.slice(0, 5).map((r, i) => (
            <tr key={i} className="border-b border-line-2 last:border-0">
              {r.map((c, k) => (
                <td key={k} className="tnum whitespace-nowrap px-2.5 py-[7px] text-[0.76rem]">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Khung thả widget — port từ .db-canvas + .dbw. */
export function KhungWidget({ widget, bo, them, xoa, chuyen, cauHinh }: Props) {
  const [dangThaVao, datDangThaVao] = useState(false)
  const [dangKeo, datDangKeo] = useState<number | null>(null)

  /** Xử lý thả: ưu tiên widget mới từ bảng, sau đó là sắp xếp lại. */
  const tha = (e: React.DragEvent, truocId: number | null) => {
    e.preventDefault()
    e.stopPropagation()
    datDangThaVao(false)
    const t = e.dataTransfer.getData('pal')
    if (t) {
      them(t as LoaiWidget)
      return
    }
    const id = Number(e.dataTransfer.getData('wid'))
    if (id) chuyen(id, truocId)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        datDangThaVao(true)
      }}
      onDragLeave={() => datDangThaVao(false)}
      onDrop={(e) => tha(e, null)}
      className={`grid min-h-[440px] content-start gap-3.5 rounded-xl border-2 border-dashed p-3.5 transition-all sm:grid-cols-2 ${
        dangThaVao ? 'border-brand bg-brand-soft' : 'border-vien-khung bg-nen-khung'
      }`}
    >
      {!widget.length ? (
        <div className="col-span-full py-[70px] text-center text-[0.82rem] text-faint">
          Kéo widget từ bảng bên trái thả vào đây để bắt đầu thiết kế dashboard
        </div>
      ) : (
        widget.map((w) => (
          <div
            key={w.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('wid', String(w.id))
              datDangKeo(w.id)
            }}
            onDragEnd={() => datDangKeo(null)}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => tha(e, w.id)}
            className={`cursor-grab rounded-[10px] border border-line bg-nen px-3.5 py-3 shadow-card active:cursor-grabbing ${
              dangKeo === w.id ? 'opacity-35' : ''
            } ${w.type === 'table' ? 'col-span-full' : ''}`}
          >
            <h5 className="mb-2 flex items-center gap-2 text-[0.78rem] font-bold text-ink">
              {w.title}
              <span className="ml-auto flex gap-0.5">
                <button
                  type="button"
                  onClick={() => cauHinh(w.id)}
                  aria-label={`Cấu hình cột dữ liệu cho ${w.title}`}
                  title="Cấu hình cột dữ liệu"
                  className="grid size-6 place-items-center rounded-md text-[0.72rem] text-faint hover:bg-nav-hover hover:text-brand"
                >
                  ⚙
                </button>
                <button
                  type="button"
                  onClick={() => xoa(w.id)}
                  aria-label={`Xóa widget ${w.title}`}
                  title="Xóa widget"
                  className="grid size-6 place-items-center rounded-md text-[0.72rem] text-faint hover:bg-nav-hover hover:text-brand"
                >
                  ✕
                </button>
              </span>
            </h5>
            <ThanWidget w={w} bo={bo} />
          </div>
        ))
      )}
    </div>
  )
}
