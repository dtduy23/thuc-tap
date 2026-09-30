import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { doiMatKhau, truyVanToi } from '@/lib/phien'
import { Nut, ONhap, The, ThongBao } from '@/ui/co-ban'

/** Khớp luật ở API (mat-khau.ts). Kiểm trước ở đây chỉ để báo sớm — API mới là chốt chặn. */
const DO_DAI_TOI_THIEU = 10

export function TrangDoiMatKhau() {
  const qc = useQueryClient()
  const dieuHuong = useNavigate()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const batBuoc = toi.phaiDoiMatKhau
  const [cu, datCu] = useState('')
  const [moi, datMoi] = useState('')
  const [nhapLai, datNhapLai] = useState('')
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    if (moi.length < DO_DAI_TOI_THIEU)
      return datKq({ ok: false, cau: `Mật khẩu mới phải dài ít nhất ${DO_DAI_TOI_THIEU} ký tự.` })
    if (moi === cu) return datKq({ ok: false, cau: 'Mật khẩu mới phải khác mật khẩu hiện tại.' })
    if (moi !== nhapLai) return datKq({ ok: false, cau: 'Hai lần nhập mật khẩu mới không khớp.' })
    datDangGui(true)
    try {
      await doiMatKhau(qc, cu, moi)
      if (batBuoc) {
        await dieuHuong({ to: '/' })
        return
      }
      datKq({ ok: true, cau: 'Đã đổi mật khẩu. Các phiên đăng nhập ở máy khác đã bị đăng xuất.' })
      datCu('')
      datMoi('')
      datNhapLai('')
    } catch (err) {
      datKq({ ok: false, cau: err instanceof LoiApi ? err.message : 'Không đổi được mật khẩu.' })
    } finally {
      datDangGui(false)
    }
  }

  return (
    <>
      <h1 className="mt-0 mb-4 text-[21px] font-bold">Đổi mật khẩu</h1>
      <div className="max-w-[440px]">
        {batBuoc && !kq && (
          <ThongBao>
            Mật khẩu hiện tại do quản trị hệ thống cấp. Hãy đặt mật khẩu của riêng bạn trước khi bắt đầu làm
            việc.
          </ThongBao>
        )}
        {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
        <The>
          <form onSubmit={(e) => void gui(e)}>
            <ONhap
              id="mk-cu"
              nhan={batBuoc ? 'Mật khẩu được cấp' : 'Mật khẩu hiện tại'}
              type="password"
              autoComplete="current-password"
              required
              value={cu}
              onChange={(e) => datCu(e.target.value)}
            />
            <ONhap
              id="mk-moi"
              nhan="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              required
              goiY={`Ít nhất ${DO_DAI_TOI_THIEU} ký tự, không chứa tên đăng nhập. Câu dài dễ nhớ tốt hơn chuỗi ngắn phức tạp.`}
              value={moi}
              onChange={(e) => datMoi(e.target.value)}
            />
            <ONhap
              id="mk-nhap-lai"
              nhan="Nhập lại mật khẩu mới"
              type="password"
              autoComplete="new-password"
              required
              value={nhapLai}
              onChange={(e) => datNhapLai(e.target.value)}
            />
            <Nut type="submit" kieu="chinh" disabled={dangGui}>
              {dangGui ? 'Đang lưu…' : 'Đổi mật khẩu'}
            </Nut>
          </form>
        </The>
      </div>
    </>
  )
}
