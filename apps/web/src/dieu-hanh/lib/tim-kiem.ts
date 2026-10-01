/**
 * Port từ normQ() — chuẩn hóa chuỗi để tìm kiếm không phụ thuộc dấu tiếng Việt.
 * Bản gốc còn đổi 'đ' thành 'd' vì NFD không tách được dấu gạch của chữ đ.
 */
export const chuanHoa = (t: string): string =>
  (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
