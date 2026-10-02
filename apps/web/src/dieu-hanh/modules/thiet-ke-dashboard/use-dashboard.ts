import { useCallback, useState } from 'react'
import { toast } from '@/dieu-hanh/store/toast'
import {
  BO_MAU,
  TEN_WIDGET,
  WIDGET_MAC_DINH,
  cotSoDau,
  docCsv,
  type BoDuLieu,
  type LoaiWidget,
  type Widget,
} from './du-lieu'

const boMau = (id: number): BoDuLieu => ({
  id,
  name: BO_MAU.name,
  headers: [...BO_MAU.headers],
  rows: BO_MAU.rows.map((r) => [...r]),
})

/** Gom toàn bộ trạng thái của trình thiết kế — port khối `DB` và các hàm quanh nó. */
export function useDashboard() {
  const [boDl, datBoDl] = useState<BoDuLieu[]>(() => [boMau(1)])
  const [dangDung, datDangDung] = useState(0)
  const [widget, datWidget] = useState<Widget[]>(() => WIDGET_MAC_DINH.map((w) => ({ ...w })))
  const [seq, datSeq] = useState(WIDGET_MAC_DINH.length + 1)
  const [dseq, datDseq] = useState(2)

  const bo = boDl[dangDung] ?? boDl[0]!

  /** Port addW(). */
  const themWidget = useCallback(
    (type: LoaiWidget) => {
      datWidget((ws) => [...ws, { id: seq, type, title: TEN_WIDGET[type], lbl: 0, val: cotSoDau(bo) }])
      datSeq(seq + 1)
      toast(`Đã thêm ${TEN_WIDGET[type]} — bấm ⚙ trên widget để chọn cột dữ liệu`)
    },
    [bo, seq],
  )

  /** Port delW(). */
  const xoaWidget = useCallback((id: number) => {
    datWidget((ws) => ws.filter((w) => w.id !== id))
  }, [])

  /**
   * Port moveW() — chuyển widget `id` tới trước `truocId`;
   * `truocId === null` nghĩa là thả vào cuối khung.
   */
  const chuyenWidget = useCallback((id: number, truocId: number | null) => {
    if (id === truocId) return
    datWidget((ws) => {
      const i = ws.findIndex((w) => w.id === id)
      if (i < 0) return ws
      const conLai = [...ws]
      const w = conLai.splice(i, 1)[0]!
      if (truocId == null) {
        conLai.push(w)
      } else {
        const j = conLai.findIndex((x) => x.id === truocId)
        conLai.splice(j < 0 ? conLai.length : j, 0, w)
      }
      return conLai
    })
  }, [])

  /** Port saveW(). */
  const luuWidget = useCallback((id: number, title: string, lbl: number, val: number) => {
    datWidget((ws) => ws.map((w) => (w.id === id ? { ...w, title, lbl, val } : w)))
    toast('Đã cập nhật widget theo cột dữ liệu mới')
  }, [])

  /** Port dbClear(). */
  const xoaBoCuc = useCallback(() => {
    datWidget([])
    toast('Đã xóa bố cục — kéo widget mới vào khung')
  }, [])

  /** Port applyDs() — mỗi lần nhập tạo một bộ mới và chuyển sang dùng ngay. */
  const napBo = useCallback(
    (name: string, headers: string[], rows: (string | number)[][]) => {
      datBoDl((ds) => {
        const moi = [...ds, { id: dseq, name, headers, rows }]
        datDangDung(moi.length - 1)
        toast(`Đã nhập bộ #${moi.length} "${name}" (${rows.length} dòng) — bấm ✎ nếu cần chỉnh số`)
        return moi
      })
      datDseq(dseq + 1)
    },
    [dseq],
  )

  /** Port parseCsv() — kiểm tra tối thiểu 1 dòng tiêu đề + 1 dòng số liệu. */
  const napCsv = useCallback(
    (name: string, text: string) => {
      const rows = docCsv(text)
      if (rows.length < 2) {
        toast('Dữ liệu cần tối thiểu 1 dòng tiêu đề + 1 dòng số liệu')
        return
      }
      napBo(name, rows[0]!, rows.slice(1))
    },
    [napBo],
  )

  /** Port dbSample(). */
  const napBoMau = useCallback(() => {
    napBo(
      BO_MAU.name,
      [...BO_MAU.headers],
      BO_MAU.rows.map((r) => [...r]),
    )
  }, [napBo])

  /** Port dsUse(). */
  const chonBo = useCallback(
    (i: number) => {
      if (i === dangDung) return
      datDangDung(i)
      toast(`Đang dùng bộ #${i + 1} — toàn bộ widget đã vẽ lại`)
    },
    [dangDung],
  )

  /** Port delDs() — luôn giữ lại ít nhất một bộ. */
  const xoaBo = useCallback(
    (i: number) => {
      if (boDl.length <= 1) return
      datBoDl((ds) => ds.filter((_, k) => k !== i))
      datDangDung((cur) => {
        if (cur >= boDl.length - 1) return boDl.length - 2
        return i < cur ? cur - 1 : cur
      })
      toast('Đã xóa bộ dữ liệu')
    },
    [boDl.length],
  )

  /** Port saveDs(). */
  const luuBo = useCallback(
    (i: number, headers: string[], rows: string[][]) => {
      datBoDl((ds) => ds.map((d, k) => (k === i ? { ...d, headers, rows } : d)))
      toast(`Đã cập nhật số liệu bộ #${i + 1}${i === dangDung ? ' — biểu đồ đã vẽ lại theo số mới' : ''}`)
    },
    [dangDung],
  )

  return {
    boDl,
    dangDung,
    bo,
    widget,
    themWidget,
    xoaWidget,
    chuyenWidget,
    luuWidget,
    xoaBoCuc,
    napCsv,
    napBoMau,
    chonBo,
    xoaBo,
    luuBo,
  }
}
