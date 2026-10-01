/** Port từ IMG() — ảnh minh họa loremflickr, khóa theo `lock` để ảnh ổn định. */
export const anhMinhHoa = (kw: string, lock: number, w = 400, h = 300) =>
  `https://loremflickr.com/${w}/${h}/${kw}?lock=${lock}`

/** Nền dự phòng của .thumb bản gốc khi ảnh chưa tải xong. */
export const NEN_THUMB = 'linear-gradient(160deg,#C9BFAE,#AFA492)'
