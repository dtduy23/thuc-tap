/**
 * Đọc/ghi `localStorage` an toàn cho những công tắc phải NHỚ qua các lần tải.
 * Safari riêng tư ném ngay ở lượt ĐỌC, nên cả hai chiều đều phải bọc.
 */
export function nho(khoa: string, macDinh = ''): string {
  try {
    return localStorage.getItem(khoa) ?? macDinh
  } catch {
    return macDinh
  }
}

export function ghiNho(khoa: string, giaTri: string): void {
  try {
    localStorage.setItem(khoa, giaTri)
  } catch {
    // Chế độ riêng tư chặn ghi — mất phần ghi nhớ, KHÔNG được mất tính năng.
  }
}

/** Danh sách, kèm đường nâng cấp từ khoá cũ một-chuỗi — không bao giờ ghi ngược vào khoá cũ. */
export function nhoDs(khoa: string, khoaCu = ''): string[] {
  try {
    const raw = localStorage.getItem(khoa)
    if (raw) {
      const v: unknown = JSON.parse(raw)
      // `localStorage` người dùng sửa được — lọc kỹ trước khi đưa vào URL.
      if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && !!x)
    }
    const cu = khoaCu ? localStorage.getItem(khoaCu) : null
    return cu ? [cu] : []
  } catch {
    return []
  }
}

export function ghiNhoDs(khoa: string, ds: string[]): void {
  try {
    localStorage.setItem(khoa, JSON.stringify(ds))
  } catch {
    // Mất phần ghi nhớ, không mất tính năng.
  }
}
