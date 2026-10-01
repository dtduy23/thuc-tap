import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { huyLienKetNative, KHOA_VAN_BAN, lienKetNative, truyVanLienKetNative } from '@/lib/van-ban'
import { Chip, Nut, ONhap, The, ThongBao } from '@/ui/co-ban'

/**
 * Cài đặt cá nhân › Liên kết FOXAI Native (ADR-0009). Người dùng đăng nhập tài khoản
 * Native CỦA MÌNH một lần — như đăng nhập gdos.fox.ai.vn. GDOS không lưu mật khẩu.
 */
export function LienKetNative() {
  const qc = useQueryClient()
  const { data: lk } = useSuspenseQuery(truyVanLienKetNative)
  const [ten, datTen] = useState('')
  const [mk, datMk] = useState('')
  const [loi, datLoi] = useState<string>()
  const [ban, datBan] = useState(false)

  const lam = async (viec: () => Promise<unknown>) => {
    datLoi(undefined)
    datBan(true)
    try {
      qc.setQueryData(truyVanLienKetNative.queryKey, (await viec()) as typeof lk)
      await qc.invalidateQueries({ queryKey: KHOA_VAN_BAN })
      datMk('')
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không thực hiện được.')
    } finally {
      datBan(false)
    }
  }
  const gui = (e: FormEvent) => {
    e.preventDefault()
    void lam(() => lienKetNative(ten.trim(), mk))
  }

  return (
    <The tieuDe="Liên kết FOXAI Native" phu="tóm tắt, soạn thảo văn bản, hỏi đáp AI">
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {!lk.coTheLienKet ? (
        <p className="m-0 text-[13px] text-faint">
          Hệ thống chưa kết nối FOXAI Native — quản trị kiểm tra ở Quản trị › Kết nối › Dịch vụ nền tảng.
        </p>
      ) : lk.daLienKet ? (
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <Chip mau="ok">Đã liên kết</Chip>
          <span>
            <b className="text-ink">{lk.nativeTen}</b>
            {lk.lienKetLuc && <span className="text-faint"> · từ {ngayGio(lk.lienKetLuc)}</span>}
          </span>
          <Nut kieu="nguy-hiem" disabled={ban} onClick={() => void lam(huyLienKetNative)}>
            Hủy liên kết
          </Nut>
        </div>
      ) : (
        <form onSubmit={gui} className="max-w-[420px]">
          <p className="mt-0 mb-3 text-[12.5px] text-faint">
            Đăng nhập tài khoản FOXAI Native của bạn (tài khoản dùng ở gdos.fox.ai.vn). GDOS không lưu mật
            khẩu — chỉ giữ phiên đăng nhập đã mã hóa để gọi Native thay bạn; hủy liên kết lúc nào cũng được.
          </p>
          <ONhap
            id="nv-ten"
            nhan="Tên đăng nhập hoặc email Native"
            autoComplete="off"
            required
            maxLength={200}
            value={ten}
            onChange={(e) => datTen(e.target.value)}
          />
          <ONhap
            id="nv-mk"
            nhan="Mật khẩu Native"
            type="password"
            autoComplete="off"
            required
            maxLength={200}
            value={mk}
            onChange={(e) => datMk(e.target.value)}
          />
          <Nut type="submit" kieu="chinh" disabled={ban || !ten.trim() || !mk}>
            {ban ? 'Đang liên kết…' : 'Liên kết'}
          </Nut>
        </form>
      )}
    </The>
  )
}
