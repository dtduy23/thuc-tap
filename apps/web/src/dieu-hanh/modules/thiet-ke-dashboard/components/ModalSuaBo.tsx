import { useState } from 'react'
import type { UseOverlayStateReturn } from '@heroui/react'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import type { BoDuLieu } from '../du-lieu'

interface Props {
  state: UseOverlayStateReturn
  bo: BoDuLieu | null
  chiSo: number
  luu: (i: number, headers: string[], rows: string[][]) => void
}

/** Port từ editDs() + edAddRow() + saveDs() — sửa trực tiếp từng ô. */
export function ModalSuaBo({ state, bo, chiSo, luu }: Props) {
  const [headers, datHeaders] = useState<string[]>([])
  const [rows, datRows] = useState<string[][]>([])

  const [truoc, datTruoc] = useState<{ bo: BoDuLieu | null; mo: boolean }>({ bo: null, mo: false })
  if (truoc.bo !== bo || truoc.mo !== state.isOpen) {
    datTruoc({ bo, mo: state.isOpen })
    if (bo && state.isOpen) {
      datHeaders(bo.headers.map(String))
      datRows(bo.rows.map((r) => r.map(String)))
    }
  }

  if (!bo) return null

  const oNhap =
    'w-full min-w-[90px] border-0 bg-transparent px-2 py-1.5 text-[0.76rem] text-ink outline-none focus-visible:bg-brand-soft'

  return (
    <ModalKhung
      state={state}
      tieuDe={`Chỉnh sửa số liệu — bộ #${chiSo + 1}`}
      phu={`${bo.name} · sửa trực tiếp từng ô, thêm/xóa dòng`}
      nhanDong="Đóng chỉnh sửa số liệu"
      chanTrang={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <NutPhu onPress={() => datRows([...rows, Array.from({ length: headers.length }, () => '')])}>
            + Thêm dòng
          </NutPhu>
          <div className="flex gap-2">
            <NutPhu onPress={() => state.close()}>Hủy</NutPhu>
            <NutChinh
              onPress={() => {
                // Bản gốc: tiêu đề trống thành "Cột", dòng toàn trống thì bỏ
                const h = headers.map((x) => x.trim() || 'Cột')
                const r = rows
                  .map((row) => row.map((c) => c.trim()))
                  .filter((row) => row.some((c) => c !== ''))
                luu(chiSo, h, r)
                state.close()
              }}
            >
              Áp dụng số liệu
            </NutChinh>
          </div>
        </div>
      }
    >
      <div className="max-h-[380px] overflow-auto rounded-[10px] border border-line">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headers.map((h, c) => (
                <th key={c} className="border-b border-line-2 bg-row-head p-0">
                  <input
                    value={h}
                    onChange={(e) => datHeaders(headers.map((x, k) => (k === c ? e.target.value : x)))}
                    aria-label={`Tên cột ${c + 1}`}
                    className={`${oNhap} font-bold`}
                  />
                </th>
              ))}
              <th className="w-9 border-b border-line-2 bg-row-head" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-line-2 last:border-0">
                {row.map((v, c) => (
                  <td key={c} className="p-0">
                    <input
                      value={v}
                      onChange={(e) =>
                        datRows(
                          rows.map((rr, k) =>
                            k === r ? rr.map((cc, kc) => (kc === c ? e.target.value : cc)) : rr,
                          ),
                        )
                      }
                      aria-label={`Dòng ${r + 1}, cột ${headers[c] ?? c + 1}`}
                      className={`tnum ${oNhap}`}
                    />
                  </td>
                ))}
                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => datRows(rows.filter((_, k) => k !== r))}
                    aria-label={`Xóa dòng ${r + 1}`}
                    title="Xóa dòng"
                    className="grid size-[26px] place-items-center rounded-md text-[0.72rem] text-faint hover:bg-nav-hover hover:text-brand"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[0.7rem] text-chu-phu">
        Bấm <b>Áp dụng số liệu</b> — nếu là bộ đang dùng, toàn bộ biểu đồ vẽ lại ngay theo số mới.
      </div>
    </ModalKhung>
  )
}
