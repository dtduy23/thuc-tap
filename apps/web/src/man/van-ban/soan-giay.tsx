/**
 * Mảnh dùng chung cho màn Mẫu văn bản và Soạn thảo văn bản: bộ ô thể thức NĐ30, thanh
 * định dạng kiểu Word cho vùng `contentEditable`, trang giấy A4.
 */
import type { ReactNode } from 'react'
import type { TheThucDung } from '@/lib/the-thuc-nd30'
import { LOP_NHAN, LOP_O_NHO } from './chung'

/** Thứ tự ô bám đúng thứ tự yếu tố thể thức trong Điều 8. */
const O: { khoa: Exclude<keyof TheThucDung, 'canGiua' | 'noinhan'>; nhan: string; goiY: string }[] = [
  { khoa: 'cqch', nhan: 'Cơ quan chủ quản (cấp trên)', goiY: 'VD: UBND TỈNH' },
  { khoa: 'cq', nhan: 'Tên cơ quan ban hành', goiY: 'VD: SỞ KHOA HỌC VÀ CÔNG NGHỆ' },
  { khoa: 'so', nhan: 'Số văn bản', goiY: 'VD: 125' },
  { khoa: 'kyhieu', nhan: 'Ký hiệu (viết tắt cơ quan)', goiY: 'VD: SKHCN' },
  { khoa: 'dd', nhan: 'Địa danh', goiY: 'VD: Lào Cai' },
  { khoa: 'cv', nhan: 'Chức vụ người ký', goiY: 'VD: GIÁM ĐỐC' },
  { khoa: 'ky', nhan: 'Họ và tên người ký', goiY: 'Họ tên người ký' },
]

/**
 * Bộ ô thể thức. Màn Mẫu: giá trị MẶC ĐỊNH lưu vào mẫu (`default_meta`). Màn Soạn thảo:
 * giá trị cho MỘT văn bản — bắt buộc khi mẫu để AI viết thân.
 */
export function KhoiTheThuc({
  tho,
  doi,
  khoa,
  batBuoc,
  tienTo,
}: {
  tho: TheThucDung
  doi: (k: keyof TheThucDung, v: string | boolean) => void
  khoa?: boolean
  batBuoc?: boolean
  tienTo: string
}) {
  return (
    <div>
      <label className="mb-3 flex items-start gap-2 rounded-lg border border-line px-3 py-2.5 text-[13px] text-body">
        <input
          type="checkbox"
          checked={tho.canGiua}
          disabled={khoa}
          onChange={(e) => doi('canGiua', e.target.checked)}
          className="mt-[3px] size-3.5 accent-brand"
        />
        <span>
          Quốc hiệu, Tiêu ngữ căn giữa
          <span className="block text-[11.5px] text-faint">
            Dùng cho đơn, tờ khai — không có cơ quan ban hành.
          </span>
        </span>
      </label>
      <div className="grid gap-x-3 sm:grid-cols-2">
        {O.map((o) => (
          <div key={o.khoa} className={`mb-3 ${o.khoa === 'ky' ? 'sm:col-span-2' : ''}`}>
            <label htmlFor={`${tienTo}-${o.khoa}`} className={LOP_NHAN}>
              {o.nhan}
              {batBuoc && <span className="text-danger"> *</span>}
            </label>
            <input
              id={`${tienTo}-${o.khoa}`}
              value={tho[o.khoa]}
              disabled={khoa}
              placeholder={o.goiY}
              onChange={(e) => doi(o.khoa, e.target.value)}
              className={LOP_O_NHO}
            />
          </div>
        ))}
        <div className="mb-1 sm:col-span-2">
          <label htmlFor={`${tienTo}-noinhan`} className={LOP_NHAN}>
            Nơi nhận
          </label>
          <textarea
            id={`${tienTo}-noinhan`}
            rows={3}
            value={tho.noinhan}
            disabled={khoa}
            placeholder={'Mỗi nơi nhận một dòng, VD:\nNhư trên;\nLưu: VT.'}
            onChange={(e) => doi('noinhan', e.target.value)}
            className={LOP_O_NHO}
          />
        </div>
      </div>
    </div>
  )
}

const CO_CHU = [
  { id: '2', nhan: 'Nhỏ' },
  { id: '3', nhan: 'Thường' },
  { id: '4', nhan: 'Lớn' },
  { id: '5', nhan: 'Rất lớn' },
] as const

/** Lệnh định dạng trên vùng đang soạn. execCommand đã cũ nhưng trình duyệt vẫn hỗ trợ — đủ cho nhu cầu này. */
export function lenhDinhDang(ten: string, giaTri?: string) {
  try {
    document.execCommand(ten, false, giaTri)
  } catch {
    // Không dùng được — bỏ qua, không chặn thao tác đang gõ.
  }
}

const NUT: { lenh: string; nhan: string; chu: ReactNode }[] = [
  { lenh: 'bold', nhan: 'Đậm', chu: <b>B</b> },
  { lenh: 'italic', nhan: 'Nghiêng', chu: <i className="font-serif">I</i> },
  { lenh: 'underline', nhan: 'Gạch chân', chu: <u>U</u> },
  { lenh: '|', nhan: '', chu: null },
  { lenh: 'justifyLeft', nhan: 'Canh trái', chu: <CanhLe kieu="trai" /> },
  { lenh: 'justifyCenter', nhan: 'Canh giữa', chu: <CanhLe kieu="giua" /> },
  { lenh: 'justifyRight', nhan: 'Canh phải', chu: <CanhLe kieu="phai" /> },
  { lenh: 'justifyFull', nhan: 'Canh đều', chu: <CanhLe kieu="deu" /> },
  { lenh: '|', nhan: '', chu: null },
  { lenh: 'insertUnorderedList', nhan: 'Danh sách chấm', chu: '•≡' },
  { lenh: 'insertOrderedList', nhan: 'Danh sách số', chu: '1≡' },
  { lenh: '|', nhan: '', chu: null },
  { lenh: 'undo', nhan: 'Hoàn tác', chu: '↶' },
  { lenh: 'redo', nhan: 'Làm lại', chu: '↷' },
  { lenh: 'removeFormat', nhan: 'Xóa định dạng', chu: <s>T</s> },
]

function CanhLe({ kieu }: { kieu: 'trai' | 'giua' | 'phai' | 'deu' }) {
  const dong = {
    trai: [16, 10, 16, 10],
    giua: [16, 10, 16, 10],
    phai: [16, 10, 16, 10],
    deu: [16, 16, 16, 16],
  }[kieu]
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
      {dong.map((r, i) => {
        const x = kieu === 'phai' ? 18 - r : kieu === 'giua' ? 10 - r / 2 : 2
        return <line key={i} x1={x} x2={x + r} y1={4 + i * 4} y2={4 + i * 4} />
      })}
    </svg>
  )
}

/** Thanh định dạng — mousedown chặn mặc định để vùng soạn không mất vùng chọn. */
export function ThanhDinhDang({ khoa, sauLenh }: { khoa?: boolean; sauLenh?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-nen px-2 py-1.5">
      {NUT.map((n, i) =>
        n.lenh === '|' ? (
          <span key={i} aria-hidden="true" className="mx-1 h-4 w-px bg-line" />
        ) : (
          <button
            key={n.lenh}
            type="button"
            title={n.nhan}
            aria-label={n.nhan}
            disabled={khoa}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              lenhDinhDang(n.lenh)
              sauLenh?.()
            }}
            className="grid h-7 min-w-7 place-items-center rounded-md px-1 text-[13px] text-body hover:bg-nav-hover disabled:opacity-40"
          >
            {n.chu}
          </button>
        ),
      )}
      <span aria-hidden="true" className="mx-1 h-4 w-px bg-line" />
      <select
        aria-label="Cỡ chữ"
        disabled={khoa}
        value=""
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.value) lenhDinhDang('fontSize', e.target.value)
          sauLenh?.()
        }}
        className="h-7 rounded-md border border-line bg-nen px-1.5 text-[12px] text-body"
      >
        <option value="">Cỡ chữ</option>
        {CO_CHU.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nhan}
          </option>
        ))}
      </select>
    </div>
  )
}

/** "Mặt bàn" xám, tờ giấy A4 trắng ở giữa — màu giấy cố định ở cả giao diện tối vì mô phỏng bản in. */
export const MatBan = ({ children }: { children: ReactNode }) => (
  <div className="min-h-0 flex-1 overflow-y-auto bg-bg p-4 sm:p-6">{children}</div>
)
