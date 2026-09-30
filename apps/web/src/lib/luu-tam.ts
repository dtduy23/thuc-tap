/**
 * localStorage cho các tiện ích NHỎ của từng máy (nhánh cây đang mở, giao diện
 * sáng/tối). Chế độ riêng tư hay trình duyệt chặn thì im lặng bỏ qua — trang
 * vẫn chạy đúng, chỉ không nhớ. KHÔNG BAO GIỜ lưu phiên hay dữ liệu nghiệp vụ ở đây.
 */
export function docTam<T>(khoa: string, macDinh: T): T {
  try {
    const s = window.localStorage.getItem(khoa)
    return s === null ? macDinh : (JSON.parse(s) as T)
  } catch {
    return macDinh
  }
}

export function ghiTam(khoa: string, giaTri: unknown): void {
  try {
    window.localStorage.setItem(khoa, JSON.stringify(giaTri))
  } catch {
    // bỏ qua — xem chú thích đầu tệp
  }
}
