/** Kết quả hỏi /api/health/deps, rút về thứ màn hình cần hiện. */
export type TinhTrang =
  | { loai: 'dang-hoi' }
  | { loai: 'ok' }
  | { loai: 'thieu'; phuThuoc: Record<string, string> }
  | { loai: 'khong-toi-api' }

/**
 * API trả 503 kèm thân JSON khi có phụ thuộc hỏng — đọc thân đó để nói ĐÚNG
 * cái nào hỏng, thay vì một câu "lỗi máy chủ" chung chung.
 */
export async function hoiPhuThuoc(goi: typeof fetch = fetch): Promise<TinhTrang> {
  let res: Response
  try {
    res = await goi('/api/health/deps')
  } catch {
    return { loai: 'khong-toi-api' }
  }
  if (res.ok) return { loai: 'ok' }
  try {
    const than = (await res.json()) as { phuThuoc?: Record<string, string> }
    if (than.phuThuoc) return { loai: 'thieu', phuThuoc: than.phuThuoc }
  } catch {
    // Thân không phải JSON — thường là proxy trả trang lỗi, API chưa lên.
  }
  return { loai: 'khong-toi-api' }
}
