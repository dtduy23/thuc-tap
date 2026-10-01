/**
 * SỐ LIỆU MINH HỌA cho các chỉ tiêu CHƯA có phân hệ nguồn (TTHC, PAKN, dân cư, kinh tế,
 * ANTT, hạ tầng, y tế – giáo dục). Đây KHÔNG phải số của đơn vị nào: một xã giả định
 * ~28.500 dân, dựng cho khớp nhau (đúng hạn ≤ đã giải quyết ≤ tiếp nhận…) để lãnh đạo xem
 * trước bố cục bảng điều hành. Web luôn gắn nhãn "Minh họa" cho các số này.
 *
 * Khi một phân hệ nguồn được xây (hoặc nối hệ thống Một cửa, dân cư…), chỉ tiêu tương ứng
 * chuyển sang tính thật ở chi-tieu.service.ts và bỏ khỏi bảng này.
 */

/** Kỳ số liệu minh họa. */
export const KY_MINH_HOA = 'T9/2026'

/** mã → [giá trị, độ dao động tương đối của chuỗi 10 kỳ, xu hướng mỗi kỳ (tương đối)] */
export const SO_LIEU_MINH_HOA: Record<string, [number, number?, number?]> = {
  // TTHC – Một cửa
  'TTHC-01': [1248, 0.08, 0.01],
  'TTHC-02': [1196, 0.08, 0.01],
  'TTHC-03': [1171, 0.08, 0.01],
  'TTHC-04': [52, 0.2],
  'TTHC-05': [3, 0.5],
  'TTHC-06': [97.91, 0.012, 0.002],
  'TTHC-07': [84.6, 0.03, 0.012],
  'TTHC-08': [96.2, 0.015, 0.004],
  'TTHC-09': [436, 0.1],
  'TTHC-10': [287, 0.1],
  'TTHC-11': [118, 0.15],
  'TTHC-12': [64, 0.2],
  'TTHC-13': [142, 0.15],
  'TTHC-14': [201, 0.12],
  'TTHC-17': [93.4, 0.015, 0.003],
  // Phản ánh – Kiến nghị
  'PAKN-01': [46, 0.2],
  'PAKN-02': [39, 0.2],
  'PAKN-03': [6, 0.4],
  'PAKN-04': [1, 0.8],
  'PAKN-05': [88.5, 0.04, 0.006],
  'PAKN-06': [3.4, 0.1, -0.02],
  // Dân cư – Xã hội
  'DC-01': [28500, 0.002, 0.002],
  'DC-02': [14390, 0.002, 0.002],
  'DC-03': [17240, 0.003, 0.001],
  'DC-04': [6120, 0.004],
  'DC-05': [4310, 0.004, 0.003],
  'DC-06': [7920, 0.003, 0.002],
  'DC-07': [86, 0.05, -0.02],
  'DC-08': [214, 0.04, -0.01],
  'DC-09': [93.8, 0.006, 0.003],
  'DC-10': [15130, 0.006, 0.002],
  'DC-11': [24, 0.3],
  'DC-12': [91.5, 0.01, 0.006],
  // Kinh tế – Ngân sách (KT-04 lấy từ phân hệ Dự án nếu có)
  'KT-01': [42.6, 0.06, 0.02],
  'KT-02': [38.9, 0.06, 0.02],
  'KT-03': [71.4, 0.03, 0.07],
  'KT-04': [58.2, 0.05, 0.08],
  'KT-05': [612, 0.01, 0.006],
  'KT-06': [18, 0.3],
  'KT-07': [47, 0.02, 0.01],
  'KT-08': [3, 0],
  'KT-09': [1840, 0.002, -0.001],
  'KT-10': [5, 0],
  'KT-11': [4, 0],
  'KT-12': [62.5, 0.03, 0.02],
  // An ninh – Trật tự
  'ANTT-01': [7, 0.35],
  'ANTT-02': [7, 0.35],
  'ANTT-03': [148, 0.1],
  'ANTT-04': [72, 0.01, 0.03],
  'ANTT-05': [56, 0.2],
  // Hạ tầng – Đô thị (HT-06 lấy từ phân hệ Dự án nếu có)
  'HT-01': [9, 0],
  'HT-02': [96.5, 0.004, 0.003],
  'HT-03': [68, 0.01, 0.015],
  'HT-04': [88.4, 0.006, 0.005],
  'HT-05': [92, 0.008, 0.003],
  'HT-06': [11, 0.15],
  // Y tế – Giáo dục
  'YTGD-01': [2, 0],
  'YTGD-02': [2260, 0.1],
  'YTGD-03': [96.3, 0.008, 0.002],
  'YTGD-04': [6, 0],
  'YTGD-05': [4870, 0.005, 0.002],
  'YTGD-06': [83, 0, 0],
}

/** Sinh số giả ngẫu nhiên ổn định theo mã chỉ tiêu — cùng mã luôn ra cùng chuỗi. */
function ngauNhien(hat: string): () => number {
  let s = 2166136261
  for (const ch of hat) s = Math.imul(s ^ ch.charCodeAt(0), 16777619)
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507)
    s = Math.imul(s ^ (s >>> 13), 3266489909)
    return ((s ^= s >>> 16) >>> 0) / 4294967296
  }
}

/** Chuỗi 10 kỳ minh họa, kỳ cuối đúng bằng giá trị hiện tại. */
export function chuoiMinhHoa(ma: string, giaTri: number, daoDong = 0.05, xuHuong = 0): number[] {
  const rnd = ngauNhien(ma)
  const tron = Number.isInteger(giaTri) ? 0 : 2
  const ra: number[] = []
  for (let i = 9; i >= 0; i--) {
    const nen = giaTri * (1 - xuHuong * i)
    const v = i === 0 ? giaTri : nen * (1 + (rnd() * 2 - 1) * daoDong)
    ra.push(Math.max(0, Number(v.toFixed(tron))))
  }
  return ra
}
