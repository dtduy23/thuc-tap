/**
 * Chỉ nhận đường dẫn NỘI BỘ để quay lại sau đăng nhập (`?tiep=`).
 * Không kiểm thì `?tiep=https://trang-gia.vn` biến màn đăng nhập thật thành bàn
 * đạp lừa đảo: đăng nhập xong, người dùng bị đưa sang trang giả mạo.
 */
export function duongDanNoiBo(x: unknown): string | undefined {
  if (typeof x !== 'string') return undefined
  // Bắt đầu bằng đúng một "/" — "//trang-gia.vn" là URL tuyệt đối không có giao thức.
  if (!x.startsWith('/') || x.startsWith('//') || x.startsWith('/\\')) return undefined
  if (x.startsWith('/dang-nhap')) return undefined
  return x
}
