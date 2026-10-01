import { useRef } from 'react'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { toast } from '@/dieu-hanh/store/toast'
import type { BoDuLieu } from '../du-lieu'

interface Props {
  boDl: BoDuLieu[]
  dangDung: number
  bo: BoDuLieu
  chonBo: (i: number) => void
  xoaBo: (i: number) => void
  suaBo: (i: number) => void
  napCsv: (name: string, text: string) => void
  napBoMau: () => void
  moDanCsv: () => void
}

/** Cột trái, khối "Dữ liệu đầu vào" — port từ #dsList + #dsPrev. */
export function BangDuLieu({ boDl, dangDung, bo, chonBo, xoaBo, suaBo, napCsv, napBoMau, moDanCsv }: Props) {
  const oFile = useRef<HTMLInputElement>(null)

  /**
   * Port dbFile(). Bản gốc đọc .xlsx bằng SheetJS nạp từ CDN và đã có sẵn
   * nhánh thông báo khi thư viện không tải được — bản React chưa thêm thư viện
   * đó vào package.json (§10: không tự đổi dependency), nên dùng đúng nhánh đó.
   */
  const chonFile = (f: File | undefined) => {
    if (!f) return
    if (/\.csv$/i.test(f.name)) {
      const r = new FileReader()
      r.onload = () => napCsv(f.name, typeof r.result === 'string' ? r.result : '')
      r.readAsText(f)
      return
    }
    toast('Không tải được thư viện đọc Excel (offline) — hãy dùng nút "Dán CSV"')
  }

  return (
    <SectionCard tieuDe="Dữ liệu đầu vào" phu={<StatusChip trangThai={[`#${dangDung + 1}`, 'blue']} />}>
      <div className="grid gap-[9px]">
        <NutPhu onPress={() => oFile.current?.click()} className="w-full justify-center">
          + Nhập Excel (.xlsx / .csv)
        </NutPhu>
        <input
          ref={oFile}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            chonFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <div className="flex gap-2">
          <NutPhu onPress={moDanCsv} className="flex-1 justify-center">
            Dán CSV
          </NutPhu>
          <NutPhu onPress={napBoMau} className="flex-1 justify-center">
            + Bộ mẫu
          </NutPhu>
        </div>

        <div className="text-[0.68rem] text-faint">
          Mỗi lần nhập tạo <b>một bộ dữ liệu riêng</b> — bấm chọn bộ để áp dụng, bấm ✎ để chỉnh từng số.
        </div>

        <div className="grid gap-1.5">
          {boDl.map((d, i) => (
            <div
              key={d.id}
              className={`flex items-center gap-[5px] rounded-[9px] border-[1.5px] px-[9px] py-[7px] transition-all ${
                i === dangDung ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-2'
              }`}
            >
              <button type="button" onClick={() => chonBo(i)} className="min-w-0 flex-1 text-left">
                <b className="block truncate text-[0.73rem] text-ink">
                  {i + 1}. {d.name.length > 24 ? `${d.name.slice(0, 24)}…` : d.name}
                </b>
                <small className="block text-[0.66rem] text-faint">
                  {d.rows.length} dòng · {d.headers.length} cột
                  {i === dangDung ? ' · đang dùng' : ''}
                </small>
              </button>
              <button
                type="button"
                onClick={() => suaBo(i)}
                aria-label={`Chỉnh sửa số liệu bộ ${i + 1}`}
                title="Chỉnh sửa số liệu bộ này"
                className="grid size-6 place-items-center rounded-md text-[0.72rem] text-faint hover:bg-nav-hover hover:text-brand"
              >
                ✎
              </button>
              {boDl.length > 1 && (
                <button
                  type="button"
                  onClick={() => xoaBo(i)}
                  aria-label={`Xóa bộ dữ liệu ${i + 1}`}
                  title="Xóa bộ dữ liệu"
                  className="grid size-6 place-items-center rounded-md text-[0.72rem] text-faint hover:bg-nav-hover hover:text-brand"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* #dsPrev — xem trước 4 dòng đầu của bộ đang dùng */}
        <div className="max-h-[150px] overflow-auto text-[0.7rem] text-chu-phu">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {bo.headers.map((h, i) => (
                  <th key={`${h}-${i}`} className="whitespace-nowrap px-2 py-[5px] font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bo.rows.slice(0, 4).map((r, i) => (
                <tr key={i}>
                  {r.map((c, k) => (
                    <td key={k} className="tnum whitespace-nowrap px-2 py-1 text-[0.68rem]">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  )
}
