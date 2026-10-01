import { useState } from 'react'
import { Nut, ThongBao } from '@/ui/co-ban'

/**
 * Mật khẩu tạm — API trả ĐÚNG MỘT LẦN, không lưu ở đâu để xem lại. Đóng hộp
 * này là mất; quên thì đặt lại lần nữa.
 */
export function HopMatKhauTam({ ten, matKhau }: { ten: string; matKhau: string }) {
  const [daChep, datDaChep] = useState(false)
  const chep = () =>
    void navigator.clipboard.writeText(matKhau).then(
      () => datDaChep(true),
      () => datDaChep(false),
    )
  return (
    <ThongBao kieu="ok">
      Mật khẩu tạm của <b>{ten}</b>:{' '}
      <code className="rounded bg-nen px-1.5 py-0.5 font-mono text-[14px] text-ink select-all">
        {matKhau}
      </code>{' '}
      <Nut onClick={chep} className="ml-1 !py-0.5">
        {daChep ? 'Đã chép' : 'Chép'}
      </Nut>
      <span className="mt-1.5 block">
        Chỉ hiện <b>một lần</b>. Chuyển cho người dùng qua kênh an toàn (trực tiếp, điện thoại) — không gửi
        qua nhóm chat. Người dùng phải đổi mật khẩu ngay lần đăng nhập đầu.
      </span>
    </ThongBao>
  )
}
