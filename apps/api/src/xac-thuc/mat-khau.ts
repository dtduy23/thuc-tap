/**
 * Băm và kiểm mật khẩu bằng argon2id — dùng `crypto.argon2` có sẵn trong Node 24,
 * không cần gói biên dịch C++.
 *
 * Kết quả lưu dạng chuẩn PHC: `$argon2id$v=19$m=…,t=…,p=…$<muối>$<băm>`. Tham số
 * nằm ngay trong chuỗi, nên đổi tham số về sau vẫn kiểm được mật khẩu cũ.
 */
import { CHINH_SACH_MAC_DINH } from '@gdos/shared'
import { argon2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const argon2Async = promisify(argon2)

/** Mức tối thiểu OWASP khuyến nghị cho argon2id: 19 MiB bộ nhớ, 2 vòng, 1 luồng. ~50 ms một lần. */
const THAM_SO = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 } as const

const b64 = (b: Buffer) => b.toString('base64').replace(/=+$/, '')

async function bam(
  matKhau: string,
  muoi: Buffer,
  ts: { memory: number; passes: number; parallelism: number },
) {
  return argon2Async('argon2id', { message: matKhau, nonce: muoi, tagLength: THAM_SO.tagLength, ...ts })
}

export async function bamMatKhau(matKhau: string): Promise<string> {
  const muoi = randomBytes(16)
  const kq = await bam(matKhau, muoi, THAM_SO)
  return `$argon2id$v=19$m=${THAM_SO.memory},t=${THAM_SO.passes},p=${THAM_SO.parallelism}$${b64(muoi)}$${b64(kq)}`
}

const PHC = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/

/** Chuỗi băm hỏng hoặc sai dạng thì trả false — không ném lỗi, để luồng đăng nhập không lộ chi tiết. */
export async function kiemMatKhau(matKhau: string, chuoiBam: string): Promise<boolean> {
  const m = PHC.exec(chuoiBam)
  if (!m) return false
  const [, memory, passes, parallelism, muoi, bamLuu] = m
  const mongDoi = Buffer.from(bamLuu!, 'base64')
  const kq = await bam(matKhau, Buffer.from(muoi!, 'base64'), {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
  })
  return kq.length === mongDoi.length && timingSafeEqual(kq, mongDoi)
}

/**
 * Bản băm "giả" để kiểm khi tên đăng nhập KHÔNG tồn tại. Không kiểm thì phản hồi
 * nhanh hẳn đi (~0 ms so với ~50 ms), kẻ dò đo thời gian là biết tên nào có thật.
 */
let bamGia: Promise<string> | undefined
export const layBamGia = () => (bamGia ??= bamMatKhau(randomBytes(24).toString('base64')))

/**
 * Luật mật khẩu mới. Chỉ đòi ĐỘ DÀI — theo NIST SP 800-63B, độ dài chống dò tốt hơn
 * luật "phải có chữ hoa, số, ký tự đặc biệt" (người dùng sẽ viết `Abc@1234`).
 * Độ dài tối thiểu do quản trị đặt (Cấu hình hệ thống). Trả câu lỗi tiếng Việt,
 * hoặc null nếu hợp lệ.
 */
export function kiemTraMatKhauMoi(
  matKhau: string,
  tenDangNhap: string,
  toiThieu: number = CHINH_SACH_MAC_DINH.matKhauToiThieu,
): string | null {
  if (matKhau.length < toiThieu) return `Mật khẩu phải dài ít nhất ${toiThieu} ký tự`
  if (matKhau.length > 256) return 'Mật khẩu quá dài'
  if (matKhau.toLowerCase().includes(tenDangNhap.toLowerCase()))
    return 'Mật khẩu không được chứa tên đăng nhập'
  return null
}
