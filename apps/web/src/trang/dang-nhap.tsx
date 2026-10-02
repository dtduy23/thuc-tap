import { NHAN_DIEN_MAC_DINH, quyenCua, trangDauCua } from '@gdos/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { timViTri } from '@/lib/phan-he'
import { dangNhap } from '@/lib/phien'
import { hoiPhuThuoc, type TinhTrang } from '@/suc-khoe'
import { CoDoSaoVang } from '@/ui/co-do-sao-vang'
import { Nut, ThongBao } from '@/ui/co-ban'

const LOP_NHAN = 'mb-1 block text-[11px] font-bold tracking-[.06em] text-[#5f7189] uppercase'
const LOP_O =
  'w-full rounded-[7px] border border-[#e2e8f0] bg-[#fafbfd] px-3 py-2 text-[13.5px] text-[#1b2430] outline-none focus:border-[#1d4585] focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,98,179,.14)]'

/**
 * Màn đăng nhập — cùng phong cách PMS: nền tông đậm, cờ đỏ sao vàng, tên cơ quan
 * và tên hệ thống do quản trị đặt (Cấu hình hệ thống › Tên & nhận diện).
 * Thẻ đăng nhập luôn nền trắng, không đổi theo sáng/tối — trang trọng như văn bản hành chính.
 */
export function TrangDangNhap({ tiep }: { tiep: string | undefined }) {
  const qc = useQueryClient()
  const router = useRouter()
  const { data: cauHinh } = useQuery(truyVanCongKhai)
  const nd = cauHinh?.nhanDien ?? NHAN_DIEN_MAC_DINH
  const [ten, datTen] = useState('')
  const [matKhau, datMatKhau] = useState('')
  const [hienMatKhau, datHienMatKhau] = useState(false)
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)
  const [heThong, datHeThong] = useState<TinhTrang>({ loai: 'dang-hoi' })

  // Báo sớm "máy chủ chưa sẵn sàng" — đỡ người dùng gõ mật khẩu mãi mà không hiểu vì sao lỗi.
  useEffect(() => {
    void hoiPhuThuoc().then(datHeThong)
  }, [])

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    datLoi(undefined)
    datDangGui(true)
    try {
      const toi = await dangNhap(qc, ten.trim(), matKhau)
      // Không có đích cụ thể → mở trang mặc định theo vai (Hiển thị › Trang mặc định theo vai), nếu người
      // này có quyền mở chức năng đó; không thì về trang chủ.
      const dau = cauHinh
        ? trangDauCua(
            cauHinh.trangDau,
            toi.phanCong.map((p) => p.vai),
            toi.laQuanTri,
            (id) => {
              const vt = timViTri(id)
              return !!vt && toi.quyen.includes(quyenCua(vt.module, vt.chucNang))
            },
          )
        : ''
      router.history.push(tiep ?? (dau ? `/${dau}` : '/'))
    } catch (err) {
      datLoi(err instanceof LoiApi ? err.message : 'Đăng nhập không thành công.')
      datMatKhau('')
    } finally {
      datDangGui(false)
    }
  }

  return (
    <div className="relative grid min-h-full place-items-center overflow-auto bg-[linear-gradient(158deg,var(--dam-1)_0%,var(--dam-2)_55%,var(--t-600)_100%)] p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-size-[26px_26px] opacity-[.05]"
      />
      <div className="relative w-full max-w-[440px]">
        <header className="mb-5 text-center text-white">
          <CoDoSaoVang rong={66} className="mx-auto mb-3.5" />
          {nd.tenCoQuan && (
            <p className="m-0 text-[12px] font-semibold tracking-[.16em] text-[#c3d2ea] uppercase">
              {nd.tenCoQuan}
            </p>
          )}
          <h1 className="mt-1 mb-1 text-[22px] leading-snug font-extrabold tracking-[-.01em]">
            {nd.tenHeThong}
          </h1>
          {nd.moTa && <p className="m-0 font-serif text-[14px] text-[#cfdcf0] italic">{nd.moTa}</p>}
        </header>

        <form
          onSubmit={(e) => void gui(e)}
          className="be-mat-sang relative overflow-hidden rounded-[14px] bg-white px-6 pt-6 pb-5 text-[#1b2430] shadow-[0_10px_34px_rgba(4,14,33,.35)]"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[#c9a227]" />
          <h2 className="mt-0 mb-1 text-[16px] font-bold">Đăng nhập hệ thống</h2>
          <p className="mt-0 mb-4 border-b border-[#edf0f5] pb-3 text-[12.5px] text-[#5c6678]">
            Dùng tài khoản được cấp — hệ thống tự áp dụng vai trò và phạm vi dữ liệu của bạn.
          </p>

          {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
          {heThong.loai === 'khong-toi-api' && (
            <ThongBao kieu="loi">Không kết nối được máy chủ. Liên hệ bộ phận kỹ thuật.</ThongBao>
          )}
          {heThong.loai === 'thieu' && (
            <ThongBao kieu="loi">Máy chủ chưa sẵn sàng (cơ sở dữ liệu). Liên hệ bộ phận kỹ thuật.</ThongBao>
          )}

          <div className="mb-3">
            <label htmlFor="ten-dang-nhap" className={LOP_NHAN}>
              Tài khoản
            </label>
            <input
              id="ten-dang-nhap"
              className={LOP_O}
              placeholder="Nhập tên tài khoản"
              autoComplete="username"
              required
              value={ten}
              onChange={(e) => datTen(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mat-khau" className={LOP_NHAN}>
              Mật khẩu
            </label>
            <input
              id="mat-khau"
              className={LOP_O}
              type={hienMatKhau ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={matKhau}
              onChange={(e) => datMatKhau(e.target.value)}
            />
            <button
              type="button"
              onClick={() => datHienMatKhau((x) => !x)}
              aria-pressed={hienMatKhau}
              className="mt-1 text-[11.5px] text-[#5f7189] hover:text-[#1d4585]"
            >
              {hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            </button>
          </div>
          <Nut type="submit" kieu="chinh" disabled={dangGui} className="w-full py-2.5 text-[14px]">
            {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Nut>
          <p className="mt-4 mb-0 text-center text-[11.5px] text-[#5c6678]">
            Quên mật khẩu? Liên hệ quản trị hệ thống của đơn vị để đặt lại.
          </p>
        </form>
      </div>
    </div>
  )
}
