import type { AskDisplay, AskResult } from '@/dieu-hanh/lib/api-tro-ly'

/**
 * Gói số liệu của một lượt để lưu vào `payload` tin nhắn — đủ để lượt đọc lại
 * vẽ được biểu đồ và bảng. Lượt không đòi liệt kê chỉ giữ các cột trục (một
 * danh sách 200 dòng × 16 cột 90 KB còn ~6 KB); lượt đòi liệt kê mới lưu trọn
 * cột, có trần theo BYTE chứ không theo dòng.
 */
export const TRAN_BYTE_BANG = 128 * 1024

export interface SoLieuDaLuu {
  rows: Record<string, unknown>[]
  columns: string[]
  display?: AskDisplay
  hoiDanhSach?: boolean
  /** Vắng = lưu trọn; có = đã cắt còn bao nhiêu dòng. */
  rowsLuu?: number
  /** Tóm tắt các nguồn — bảng lưu lại chỉ là của nguồn đầu, im lặng về hai nguồn kia thì tệ hơn. */
  nguon?: { ten: string; soDong: number; loi: string }[]
}

function cotBieuDo(d: AskDisplay | undefined): string[] {
  if (!d) return []
  const ra = new Set<string>()
  const them = (...c: (string | null | undefined)[]) => {
    for (const x of c) if (x) ra.add(x)
  }
  them(d.x, d.y, d.loat, d.kich_thuoc, ...(d.chi_tieu ?? []))
  for (const t of Object.values(d.truc ?? {})) them(t.x, t.y, t.loat)
  return [...ra]
}

const co = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length

export function goiSoLieu(r: AskResult | undefined): SoLieuDaLuu | null {
  const goc = r?.rows
  if (!r || !goc?.length) return null
  const nguon =
    (r.nguon?.length ?? 0) > 1
      ? r.nguon?.map((n) => ({ ten: n.ten, soDong: n.rowCount, loi: n.loi }))
      : undefined

  if (!r.hoiDanhSach) {
    const cot = cotBieuDo(r.display)
    if (!cot.length) return null
    const rows = goc.map((h) => Object.fromEntries(cot.map((c) => [c, h[c]])))
    return { rows, columns: cot, display: r.display, hoiDanhSach: false, nguon }
  }

  const columns = r.columns ?? Object.keys(goc[0] ?? {})
  const chung = { columns, display: r.display, hoiDanhSach: true, nguon }
  if (co({ ...chung, rows: goc }) <= TRAN_BYTE_BANG) return { ...chung, rows: goc }

  // Ước số dòng vừa trần rồi lùi dần — nhanh hơn cắt từng dòng trên kết quả nghìn dòng.
  let n = Math.max(1, Math.floor((TRAN_BYTE_BANG / co({ ...chung, rows: goc })) * goc.length))
  while (n > 1 && co({ ...chung, rows: goc.slice(0, n) }) > TRAN_BYTE_BANG) n = Math.floor(n * 0.9)
  return { ...chung, rows: goc.slice(0, n), rowsLuu: n }
}
