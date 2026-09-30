/**
 * Trình soạn THÂN mẫu văn bản — `contentEditable`, trường thông tin là "chip" không sửa
 * được chữ (`<span data-truong>`), bấm hoặc kéo để chèn tại con trỏ.
 *
 * Chỉ phần thân lưu vào `body_template`. Phần đầu (quốc hiệu, cơ quan, số…) và phần ký
 * dựng từ thể thức, hiện để xem — Native tự ghép lại khung đó mỗi lần soạn văn bản thật,
 * lưu khung vào thân là in ra quốc hiệu hai lần.
 */
import { useEffect, useRef } from 'react'
import { ganHtmlSach } from '@/lib/html-sach'
import type { TruongMau } from '@/lib/native-vb'
import {
  goKhungCu,
  htmlPhanDau,
  htmlPhanKy,
  htmlThanMacDinh,
  mauSangHtml,
  type TheThucDung,
  GOI_Y_THAN,
} from '@/lib/the-thuc-nd30'
import { HtmlSach } from '@/ui/html-sach'
import { MatBan, ThanhDinhDang } from './soan-giay'

/** Vị trí con trỏ tại điểm thả (API chuẩn + API cũ của WebKit). */
function caretTaiDiem(x: number, y: number): Range | null {
  const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }
  if (typeof doc.caretPositionFromPoint === 'function') {
    const vt = doc.caretPositionFromPoint(x, y)
    if (!vt) return null
    const r = document.createRange()
    r.setStart(vt.offsetNode, vt.offset)
    r.collapse(true)
    return r
  }
  return doc.caretRangeFromPoint?.(x, y) ?? null
}

/** Chèn chip tại range: [cách?][chip][cách] rồi đặt con trỏ sau chip. */
function chenChip(t: TruongMau, r: Range) {
  const chip = document.createElement('span')
  chip.className = 'chip-truong'
  chip.dataset.truong = t.key
  chip.contentEditable = 'false'
  chip.textContent = t.label
  const truoc =
    r.startContainer.nodeType === Node.TEXT_NODE
      ? (r.startContainer.textContent ?? '').charAt(r.startOffset - 1)
      : ''
  r.deleteContents()
  const sau = document.createTextNode('\u00a0')
  r.insertNode(sau)
  r.insertNode(chip)
  // Đoạn vừa bỏ câu gợi ý chỉ còn <br> giữ chỗ — có chữ rồi thì bỏ.
  if (chip.previousSibling?.nodeName === 'BR' && !chip.previousSibling.previousSibling)
    chip.previousSibling.remove()
  if (truoc && !/[\s\u00a0]/.test(truoc)) r.insertNode(document.createTextNode('\u00a0'))
  const chon = window.getSelection()
  if (chon) {
    const moi = document.createRange()
    moi.setStartAfter(sau)
    moi.collapse(true)
    chon.removeAllRanges()
    chon.addRange(moi)
  }
}

export function SoanThanMau({
  tenMau,
  kyHieu,
  tho,
  truong,
  thanBanDau,
  khoaNap,
  doiThan,
  khoa,
}: {
  tenMau: string
  kyHieu: string
  tho: TheThucDung
  /** Trường đã có nhãn — mới chèn được. */
  truong: TruongMau[]
  /** `body_template` lúc mở; sau đó vùng soạn tự giữ nội dung (uncontrolled). */
  thanBanDau: string
  /** Đổi giá trị là nạp lại thân — mở biểu mẫu hoặc đổi mẫu. */
  khoaNap: string
  doiThan: (html: string) => void
  khoa?: boolean
}) {
  const thanRef = useRef<HTMLDivElement>(null)
  const rangeCuoi = useRef<Range | null>(null)

  const bao = () => thanRef.current && doiThan(thanRef.current.innerHTML)

  // Nạp thân khi mở / đổi mẫu. Gán lại innerHTML mỗi lần gõ sẽ đẩy con trỏ về đầu.
  useEffect(() => {
    const el = thanRef.current
    if (!el) return
    const than = goKhungCu(thanBanDau)
    ganHtmlSach(el, than === '' ? htmlThanMacDinh(truong) : mauSangHtml(than, truong))
    // Bộ lọc bỏ contenteditable — đặt lại cho chip để chữ trên chip không sửa được.
    for (const chip of Array.from(el.querySelectorAll<HTMLElement>('[data-truong]')))
      chip.contentEditable = 'false'
    doiThan(el.innerHTML)
    // Chỉ khi mở hoặc đổi mẫu — thêm deps khác là xóa mất nội dung đang soạn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaNap])

  // Đổi nhãn trường đã chèn: mã giữ nguyên, chữ trên chip đổi theo.
  useEffect(() => {
    const el = thanRef.current
    if (!el) return
    const nhan = new Map(truong.map((x) => [x.key, x.label]))
    for (const chip of Array.from(el.querySelectorAll<HTMLElement>('[data-truong]'))) {
      const n = nhan.get(chip.dataset.truong ?? '')
      if (n !== undefined && chip.textContent !== n) chip.textContent = n
    }
  }, [truong])

  // Nhớ con trỏ cuối trong thân: bấm nút chèn làm mất vùng chọn tức thời.
  useEffect(() => {
    const nghe = () => {
      const chon = window.getSelection()
      if (!chon?.rangeCount || !thanRef.current) return
      const r = chon.getRangeAt(0)
      if (thanRef.current.contains(r.startContainer)) rangeCuoi.current = r.cloneRange()
    }
    document.addEventListener('selectionchange', nghe)
    return () => document.removeEventListener('selectionchange', nghe)
  }, [])

  /**
   * Còn nguyên câu gợi ý (thân trống) → xóa câu đó, đặt con trỏ vào đoạn trống. Gọi khi
   * bắt đầu gõ hoặc chèn trường, để câu gợi ý không lẫn vào nội dung mẫu.
   */
  const boGoiY = (): Range | null => {
    const ph = thanRef.current?.querySelector<HTMLElement>('[data-ph]')
    if (!ph || (ph.textContent ?? '').replace(/\s+/g, ' ').trim() !== GOI_Y_THAN) return null
    ph.removeAttribute('data-ph')
    ph.replaceChildren(document.createElement('br'))
    const r = document.createRange()
    r.setStart(ph, 0)
    r.collapse(true)
    const chon = window.getSelection()
    chon?.removeAllRanges()
    chon?.addRange(r)
    return r
  }

  const cuoiThan = (): Range | null => {
    const el = thanRef.current
    if (!el) return null
    el.focus()
    const r = document.createRange()
    r.selectNodeContents(el.lastElementChild ?? el)
    r.collapse(false)
    return r
  }

  const chen = (t: TruongMau) => {
    const el = thanRef.current
    el?.focus()
    const r =
      boGoiY() ??
      (rangeCuoi.current && el?.contains(rangeCuoi.current.startContainer) ? rangeCuoi.current : cuoiThan())
    if (!r) return
    chenChip(t, r)
    bao()
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-line">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-nen-2 px-3 py-2">
        <span className="text-[12px] font-semibold text-body">Chèn trường:</span>
        {truong.length === 0 ? (
          <span className="text-[12px] text-faint">
            khai báo trường ở cột trái rồi bấm để chèn vào văn bản.
          </span>
        ) : (
          truong.map((t) => (
            <button
              key={t.key}
              type="button"
              disabled={khoa}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', t.key)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => chen(t)}
              title="Bấm để chèn tại con trỏ, hoặc kéo thả vào văn bản"
              className="cursor-grab rounded-md border border-brand/30 bg-tint-brand px-2 py-0.5 text-[12px] font-semibold text-brand hover:opacity-80 disabled:opacity-40"
            >
              ⋮⋮ {t.label}
            </button>
          ))
        )}
      </div>
      <ThanhDinhDang khoa={khoa} sauLenh={bao} />
      <MatBan>
        <div className="giay-a4">
          <HtmlSach
            className="pointer-events-none opacity-80 select-none"
            title="Dựng từ thể thức ở cột trái"
            html={htmlPhanDau(tenMau, kyHieu, tho)}
          />
          <div
            ref={thanRef}
            contentEditable={!khoa}
            suppressContentEditableWarning
            spellCheck={false}
            role="textbox"
            tabIndex={0}
            aria-multiline="true"
            aria-label="Thân văn bản mẫu"
            onInput={bao}
            onBlur={bao}
            onFocus={() => void boGoiY()}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('text/plain')) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }
            }}
            onDrop={(e) => {
              const t = truong.find((x) => x.key === e.dataTransfer.getData('text/plain').trim())
              if (!t) return
              e.preventDefault()
              const r = caretTaiDiem(e.clientX, e.clientY)
              const dich = r && thanRef.current?.contains(r.startContainer) ? r : cuoiThan()
              if (!dich) return
              chenChip(t, dich)
              bao()
            }}
            className="my-2 min-h-[120px] rounded outline-2 outline-offset-4 outline-transparent focus:outline-dashed focus:outline-brand/40"
          />
          <HtmlSach className="pointer-events-none opacity-80 select-none" html={htmlPhanKy(tho)} />
        </div>
      </MatBan>
      <p className="m-0 border-t border-line bg-nen px-3 py-2 text-[11.5px] text-faint">
        Chỉ <b className="text-body">phần thân</b> được lưu vào mẫu. Phần đầu và phần ký dựng lại từ thể thức
        mỗi lần soạn văn bản thật.
      </p>
    </div>
  )
}
