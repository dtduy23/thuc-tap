/**
 * Bảng chọn cột DÙNG CHUNG — ẩn/hiện · ghim trái · kéo–thả đổi thứ tự (kèm nút ↑↓
 * cho ai không kéo). Danh sách luôn hiện ĐỦ cột, kể cả cột đang ẩn, để bật lại được.
 * Không tự lưu — lưới cha giữ thiết lập và tự nhớ theo máy.
 */
import { useState } from 'react'
import { keoTha, type CotLuoi } from './loc'

export function ChonCot<T>({
  cot,
  thuTu,
  an,
  ghim,
  doi,
  macDinh,
}: {
  cot: CotLuoi<T>[]
  thuTu: string[]
  an: string[]
  ghim: string[]
  doi: (g: { an?: string[]; thuTu?: string[]; ghim?: string[] }) => void
  macDinh: () => void
}) {
  const [keo, datKeo] = useState<string>()
  const [tren, datTren] = useState<string>()
  const theo = (id: string) => cot.find((c) => c.id === id)!
  const soHien = cot.filter((c) => c.batBuoc || !an.includes(c.id)).length
  const dichChuyen = (id: string, buoc: -1 | 1) => {
    const i = thuTu.indexOf(id)
    const j = i + buoc
    if (j < 0 || j >= thuTu.length) return
    const m = [...thuTu]
    ;[m[i], m[j]] = [m[j]!, m[i]!]
    doi({ thuTu: m })
  }

  return (
    <div className="w-[300px] max-w-[88vw]">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <b className="text-[12.5px]">Cột hiển thị</b>
        <span className="text-[11.5px] text-faint">
          {soHien}/{cot.length} cột
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => doi({ an: [] })}
          className="text-[12px] font-semibold text-brand"
        >
          Hiện hết
        </button>
        <button
          type="button"
          onClick={macDinh}
          className="text-[12px] font-semibold text-faint hover:text-ink"
        >
          Mặc định
        </button>
      </div>
      <p className="m-0 mb-1.5 px-1 text-[11.5px] text-faint">Kéo ⠿ để đổi thứ tự · 📌 ghim cột sang trái.</p>
      <ul className="m-0 list-none p-0">
        {thuTu.map((id, i) => {
          const c = theo(id)
          const dangHien = c.batBuoc || !an.includes(id)
          const dangGhim = ghim.includes(id)
          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                datKeo(id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id) // Firefox chỉ bắn drop khi có dữ liệu
              }}
              onDragOver={(e) => {
                if (!keo || keo === id) return
                e.preventDefault()
                datTren(id)
              }}
              onDragLeave={() => tren === id && datTren(undefined)}
              onDrop={(e) => {
                e.preventDefault()
                if (keo) doi({ thuTu: keoTha(thuTu, keo, id) })
                datKeo(undefined)
                datTren(undefined)
              }}
              onDragEnd={() => {
                datKeo(undefined)
                datTren(undefined)
              }}
              className={`flex items-center gap-1.5 rounded-md px-1 py-1 ${tren === id ? 'bg-tint-brand' : 'hover:bg-nav-hover'} ${keo === id ? 'opacity-50' : ''}`}
            >
              <span aria-hidden="true" className="cursor-grab px-0.5 text-faint select-none">
                ⠿
              </span>
              <label
                className={`flex min-w-0 flex-1 items-center gap-2 text-[12.5px] ${c.batBuoc ? 'text-faint' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={dangHien}
                  disabled={c.batBuoc}
                  onChange={() => doi({ an: dangHien ? [...an, id] : an.filter((x) => x !== id) })}
                />
                <span className="truncate">{c.nhan}</span>
                {c.batBuoc && <span className="text-[10.5px]">(bắt buộc)</span>}
              </label>
              <button
                type="button"
                aria-pressed={dangGhim}
                aria-label={`${dangGhim ? 'Bỏ ghim' : 'Ghim'} cột ${c.nhan}`}
                title={dangGhim ? 'Bỏ ghim' : 'Ghim sang trái'}
                onClick={() => doi({ ghim: dangGhim ? ghim.filter((x) => x !== id) : [...ghim, id] })}
                className={`rounded px-1 text-[12px] ${dangGhim ? '' : 'opacity-35 grayscale hover:opacity-80'}`}
              >
                📌
              </button>
              <button
                type="button"
                aria-label={`Đưa cột ${c.nhan} lên`}
                disabled={i === 0}
                onClick={() => dichChuyen(id, -1)}
                className="rounded px-1 text-faint hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Đưa cột ${c.nhan} xuống`}
                disabled={i === thuTu.length - 1}
                onClick={() => dichChuyen(id, 1)}
                className="rounded px-1 text-faint hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
