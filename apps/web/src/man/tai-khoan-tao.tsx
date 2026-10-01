import { CAP_DON_VI, kiemTenDangNhap, type KetQuaCapMatKhau, type PhanCong } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { KHOA_TAI_KHOAN, taoTaiKhoan, truyVanDonVi } from '@/lib/quan-tri'
import { Nut, OChon, ODanhDau, ONhap, The, ThongBao } from '@/ui/co-ban'
import { BoPhanCong, loiPhanCong } from './bo-phan-cong'
import { HopMatKhauTam } from './mat-khau-tam'

/**
 * Tạo tài khoản. Không có ô mật khẩu: API sinh mật khẩu tạm, trả một lần,
 * người dùng phải đổi khi đăng nhập lần đầu — quản trị viên không bao giờ biết
 * mật khẩu thật của ai.
 */
export default function TaiKhoanTao() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: dsDonVi } = useSuspenseQuery(truyVanDonVi)

  const [tenDangNhap, datTen] = useState('')
  const [hoTen, datHoTen] = useState('')
  const [donViId, datDonViId] = useState(toi.donVi.id)
  const [nativeUserId, datNative] = useState('')
  const [laQuanTri, datLaQuanTri] = useState(false)
  const [phanCong, datPhanCong] = useState<PhanCong[]>([])
  const [loi, datLoi] = useState<string>()
  const [kq, datKq] = useState<KetQuaCapMatKhau>()

  const tao = useMutation({
    mutationFn: () =>
      taoTaiKhoan({
        tenDangNhap: tenDangNhap.trim(),
        hoTen: hoTen.trim(),
        donViId,
        nativeUserId: nativeUserId.trim(),
        laQuanTri,
        phanCong,
      }),
    onSuccess: async (moi) => {
      datKq(moi)
      datLoi(undefined)
      await qc.invalidateQueries({ queryKey: KHOA_TAI_KHOAN })
    },
    onError: (e) => datLoi(e instanceof LoiApi ? e.message : 'Không tạo được tài khoản.'),
  })

  const loiTen = tenDangNhap.trim() ? kiemTenDangNhap(tenDangNhap.trim()) : null
  const loiPc = loiPhanCong(phanCong)

  const gui = (e: FormEvent) => {
    e.preventDefault()
    if (loiTen || loiPc.length) return
    tao.mutate()
  }

  if (kq) {
    return (
      <div className="max-w-[640px]">
        <HopMatKhauTam ten={kq.taiKhoan.tenDangNhap} matKhau={kq.matKhauTam} />
        <div className="flex flex-wrap gap-2">
          <Nut
            kieu="chinh"
            onClick={() => {
              datKq(undefined)
              datTen('')
              datHoTen('')
              datNative('')
              datLaQuanTri(false)
              datPhanCong([])
            }}
          >
            Tạo tài khoản khác
          </Nut>
          <Link
            to="/$chucNang"
            params={{ chucNang: 'tk-ds' }}
            className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-body hover:bg-nav-hover"
          >
            Về danh sách tài khoản
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={gui} className="grid max-w-[1000px] gap-4 lg:grid-cols-2">
      <div>
        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        <The tieuDe="Thông tin">
          <ONhap
            id="tao-ten"
            nhan="Tên đăng nhập"
            required
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            goiY={loiTen ?? 'Không phân biệt hoa thường. Không đổi được sau khi tạo.'}
            aria-invalid={!!loiTen}
            value={tenDangNhap}
            onChange={(e) => datTen(e.target.value)}
          />
          <ONhap
            id="tao-ho-ten"
            nhan="Họ tên"
            required
            maxLength={150}
            value={hoTen}
            onChange={(e) => datHoTen(e.target.value)}
          />
          <OChon id="tao-don-vi" nhan="Đơn vị" value={donViId} onChange={(e) => datDonViId(e.target.value)}>
            {dsDonVi.map((d) => (
              <option key={d.id} value={d.id}>
                {CAP_DON_VI[d.cap]} · {d.ten}
              </option>
            ))}
          </OChon>
          <ONhap
            id="tao-native"
            nhan="Mã tài khoản FOXAI Native (không bắt buộc)"
            maxLength={100}
            value={nativeUserId}
            onChange={(e) => datNative(e.target.value)}
          />
          <ODanhDau
            id="tao-quan-tri"
            nhan="Cờ quản trị hệ thống"
            mo="Vào được phần Quản trị: tài khoản, đơn vị, phân quyền. Không tự động đọc hồ sơ nghiệp vụ."
            checked={laQuanTri}
            onChange={(e) => datLaQuanTri(e.target.checked)}
          />
        </The>
      </div>
      <div>
        <The tieuDe="Phân công" phu="Vai quyết định làm gì · phân hệ quyết định làm ở đâu">
          <BoPhanCong tienTo="tao-pc" giaTri={phanCong} doi={datPhanCong} />
          {phanCong.length === 0 && !laQuanTri && (
            <p className="mt-2 mb-0 text-[12px] text-faint">
              Chưa giao vai nào: tài khoản đăng nhập được nhưng không thấy phân hệ nào.
            </p>
          )}
        </The>
        <Nut type="submit" kieu="chinh" disabled={tao.isPending || !!loiTen || loiPc.length > 0}>
          {tao.isPending ? 'Đang tạo…' : 'Tạo tài khoản'}
        </Nut>
      </div>
    </form>
  )
}
