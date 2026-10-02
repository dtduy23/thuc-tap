import { useState } from 'react'
import { soVN } from '@/dieu-hanh/lib/format'

const MOI_TRANG = 20

/** Ô rỗng hiện dấu gạch — `null` là chữ của lập trình viên. */
const dinhDang = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number') return soVN(v, 2)
  return typeof v === 'string' ? v : JSON.stringify(v)
}

/**
 * Bảng kết quả khi câu hỏi ĐÒI một danh sách. Lời văn bị cấm liệt kê, nên
 * không có bảng thì danh sách 200 dòng không có chỗ nào để hiện. Phân trang
 * để một truy vấn 5.000 dòng không dựng 5.000 hàng trong khung chat.
 */
export function BangKetQua({
  columns,
  rows,
  className = '',
}: {
  columns: string[]
  rows: Record<string, unknown>[]
  className?: string
}) {
  const [trang, setTrang] = useState(1)
  if (!rows?.length || !columns?.length) return null
  const soTrang = Math.ceil(rows.length / MOI_TRANG)
  const dau = (trang - 1) * MOI_TRANG
  const hien = rows.slice(dau, dau + MOI_TRANG)
  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-[9px] border border-line">
        <table className="tnum w-full text-[0.74rem]">
          <thead>
            <tr className="bg-row-head">
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-body">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hien.map((r, i) => (
              <tr key={dau + i} className="border-t border-line-2 hover:bg-row-hover">
                {columns.map((c) => (
                  <td key={c} className="max-w-[240px] truncate px-3 py-1.5 text-ink" title={dinhDang(r[c])}>
                    {dinhDang(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {soTrang > 1 && (
        <div className="mt-1.5 flex items-center justify-end gap-2 text-[0.72rem] text-chu-phu">
          <span className="tnum">
            {dau + 1}–{Math.min(dau + MOI_TRANG, rows.length)} / {soVN(rows.length)} dòng
          </span>
          <button
            type="button"
            disabled={trang === 1}
            onClick={() => setTrang((t) => t - 1)}
            className="rounded-md border border-line px-2 py-0.5 disabled:opacity-40"
            aria-label="Trang trước"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={trang === soTrang}
            onClick={() => setTrang((t) => t + 1)}
            className="rounded-md border border-line px-2 py-0.5 disabled:opacity-40"
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
