import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { dangNhap } from '@/lib/phien'
import { hoiPhuThuoc, type TinhTrang } from '@/suc-khoe'
import { Nut, ONhap, ThongBao } from '@/ui/co-ban'

export function TrangDangNhap({ tiep }: { tiep: string | undefined }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [ten, datTen] = useState('')
  const [matKhau, datMatKhau] = useState('')
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
      await dangNhap(qc, ten.trim(), matKhau)
      router.history.push(tiep ?? '/')
    } catch (err) {
      datLoi(err instanceof LoiApi ? err.message : 'Đăng nhập không thành công.')
      datMatKhau('')
    } finally {
      datDangGui(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-[radial-gradient(1100px_520px_at_12%_-10%,#24457a_0%,transparent_60%),radial-gradient(900px_520px_at_100%_110%,#123055_0%,transparent_58%),#0d1723] p-5">
      <form
        onSubmit={(e) => void gui(e)}
        className="w-full max-w-[400px] rounded-2xl bg-nen px-7 pt-7 pb-6 shadow-[0_24px_60px_rgba(0,0,0,.42)]"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-[9px] bg-brand text-[11px] font-extrabold text-white">
            GDOS
          </span>
          <div>
            <h1 className="m-0 text-[16px] leading-tight font-bold">Nền tảng điều hành số</h1>
            <p className="m-0 text-[11.5px] text-faint">Đăng nhập để tiếp tục</p>
          </div>
        </div>

        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        {heThong.loai === 'khong-toi-api' && (
          <ThongBao kieu="loi">Không kết nối được máy chủ. Liên hệ bộ phận kỹ thuật.</ThongBao>
        )}
        {heThong.loai === 'thieu' && (
          <ThongBao kieu="loi">Máy chủ chưa sẵn sàng (cơ sở dữ liệu). Liên hệ bộ phận kỹ thuật.</ThongBao>
        )}

        <ONhap
          id="ten-dang-nhap"
          nhan="Tên đăng nhập"
          autoComplete="username"
          required
          value={ten}
          onChange={(e) => datTen(e.target.value)}
        />
        <ONhap
          id="mat-khau"
          nhan="Mật khẩu"
          type="password"
          autoComplete="current-password"
          required
          value={matKhau}
          onChange={(e) => datMatKhau(e.target.value)}
        />
        <Nut type="submit" kieu="chinh" disabled={dangGui} className="mt-1 w-full py-2.5 text-[14px]">
          {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Nut>
        <p className="mt-4 text-center text-[11.5px] text-faint">
          Quên mật khẩu? Liên hệ quản trị hệ thống của đơn vị để đặt lại.
        </p>
      </form>
    </div>
  )
}
