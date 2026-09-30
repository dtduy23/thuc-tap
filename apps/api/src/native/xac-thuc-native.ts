/**
 * ĐĂNG NHẬP FOXAI NATIVE thay mặt một người (ADR-0009) — đúng cách GDOS cũ ở
 * gdos.fox.ai.vn: mỗi người dùng tài khoản Native của chính mình. Cổng v3 nhận
 * `/api/auth/*` (không phải `/api/v2`). Mật khẩu chỉ đi qua đúng một lần, không lưu.
 */
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

export interface PhienNative {
  accessToken: string
  refreshToken: string
  /** Số giây access token còn hiệu lực. */
  hetHanGiay: number
  nguoiDung: { id: string; ten: string }
}

export interface XacThucNative {
  dangNhap(tenDangNhap: string, matKhau: string): Promise<PhienNative>
  lamMoi(refreshToken: string): Promise<PhienNative>
  dangXuat(refreshToken: string): Promise<void>
}

export const XAC_THUC_NATIVE = Symbol('XAC_THUC_NATIVE')

/** Refresh token hết hạn / bị thu hồi — người dùng phải liên kết lại. */
export class HetLienKet extends Error {}

interface DtoPhien {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  user?: { id?: string; email?: string; fullName?: string }
}

const tuDto = (d: DtoPhien): PhienNative => {
  if (!d.accessToken || !d.refreshToken || !d.user?.id)
    throw new ServiceUnavailableException('FOXAI Native trả phiên đăng nhập thiếu trường — báo đội Native')
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    hetHanGiay: d.expiresIn ?? 900,
    nguoiDung: { id: d.user.id, ten: d.user.fullName || d.user.email || d.user.id },
  }
}

export class XacThucNativeHttp implements XacThucNative {
  constructor(
    private readonly diaChi: string,
    private readonly goi: typeof fetch = fetch,
  ) {}

  private post(duongDan: string, than: object) {
    return this.goi(`${this.diaChi}/api/auth${duongDan}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(than),
      signal: AbortSignal.timeout(15_000),
    }).catch((e: unknown) => {
      throw new ServiceUnavailableException(
        `Không tới được FOXAI Native: ${e instanceof Error ? e.message : String(e)}`,
      )
    })
  }

  async dangNhap(tenDangNhap: string, matKhau: string) {
    const res = await this.post('/login', { username: tenDangNhap, password: matKhau, rememberMe: true })
    if (res.status === 400 || res.status === 401)
      throw new BadRequestException('Sai tên đăng nhập hoặc mật khẩu FOXAI Native')
    if (res.status === 423 || res.status === 403)
      throw new BadRequestException('Tài khoản FOXAI Native đang bị khóa')
    if (!res.ok) throw new ServiceUnavailableException(`FOXAI Native trả lỗi ${res.status} khi đăng nhập`)
    return tuDto((await res.json()) as DtoPhien)
  }

  async lamMoi(refreshToken: string) {
    const res = await this.post('/refresh', { refreshToken })
    if (res.status === 400 || res.status === 401 || res.status === 403) throw new HetLienKet()
    if (!res.ok) throw new ServiceUnavailableException(`FOXAI Native trả lỗi ${res.status} khi làm mới phiên`)
    return tuDto((await res.json()) as DtoPhien)
  }

  async dangXuat(refreshToken: string) {
    await this.post('/logout', { refreshToken })
  }
}

/** Bản giả (máy dev): nhận mọi tài khoản, không có máy chủ Native. */
export class XacThucNativeGia implements XacThucNative {
  dangNhap(tenDangNhap: string, matKhau: string) {
    if (!tenDangNhap || !matKhau) throw new BadRequestException('Nhập tên đăng nhập và mật khẩu')
    return Promise.resolve(this.phien(tenDangNhap))
  }
  lamMoi(refreshToken: string) {
    return Promise.resolve(this.phien(refreshToken.replace(/^gia-r-/, '')))
  }
  dangXuat() {
    return Promise.resolve()
  }
  private phien(ten: string): PhienNative {
    return {
      accessToken: `gia-a-${ten}`,
      refreshToken: `gia-r-${ten}`,
      hetHanGiay: 3600,
      nguoiDung: { id: `gia-${ten}`, ten: `${ten} (bản giả)` },
    }
  }
}

/**
 * Mã hóa refresh token bằng AES-256-GCM; khóa suy ra từ AUTH_SECRET (HKDF) — lộ
 * database mà không có biến môi trường của máy chủ thì không dùng được token.
 */
export class MaHoaBiMat {
  private readonly khoa: Buffer

  constructor(biMat: string) {
    this.khoa = Buffer.from(hkdfSync('sha256', biMat, 'gdos', 'lien-ket-native', 32))
  }

  ma(ro: string): string {
    const iv = randomBytes(12)
    const c = createCipheriv('aes-256-gcm', this.khoa, iv)
    const than = Buffer.concat([c.update(ro, 'utf8'), c.final()])
    return Buffer.concat([iv, c.getAuthTag(), than]).toString('base64')
  }

  /** null: không giải được (đổi AUTH_SECRET, dữ liệu hỏng) — coi như chưa liên kết. */
  giai(ma: string): string | null {
    try {
      const b = Buffer.from(ma, 'base64')
      const d = createDecipheriv('aes-256-gcm', this.khoa, b.subarray(0, 12))
      d.setAuthTag(b.subarray(12, 28))
      return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
    } catch {
      return null
    }
  }
}
