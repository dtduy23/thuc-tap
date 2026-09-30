import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { docGiaoDien, luuGiaoDien, TONG_MAU, type CheDo, type GiaoDien } from '@/lib/giao-dien'
import { truyVanToi } from '@/lib/phien'
import { The } from '@/ui/co-ban'

const CHE_DO: { ma: CheDo; ten: string; mo: string }[] = [
  { ma: 'theo-may', ten: 'Theo máy', mo: 'Tự đổi theo cài đặt sáng/tối của máy tính, điện thoại' },
  { ma: 'sang', ten: 'Sáng', mo: 'Nền trắng — hợp làm việc ban ngày, in ấn' },
  { ma: 'toi', ten: 'Tối', mo: 'Nền tối — dịu mắt buổi tối' },
]

/**
 * Cài đặt RIÊNG của người đang đăng nhập — không ảnh hưởng người khác. Lưu trên
 * máy này, theo từng tài khoản.
 */
export function TrangCaiDat() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const [gd, datGd] = useState<GiaoDien>(() => docGiaoDien(toi.id))

  const doi = (moi: Partial<GiaoDien>) => {
    const g = { ...gd, ...moi }
    datGd(g)
    luuGiaoDien(toi.id, g) // áp dụng ngay, không cần nút Lưu
  }

  return (
    <>
      <h1 className="mt-0 mb-1 text-[21px] font-bold">Cài đặt cá nhân</h1>
      <p className="mt-0 mb-4 text-[12.5px] text-faint">
        Chỉ áp dụng cho tài khoản của bạn, trên máy này. Đổi là thấy ngay.
      </p>

      <The tieuDe="Tông màu">
        <div role="radiogroup" aria-label="Tông màu" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TONG_MAU.map((t) => {
            const chon = gd.tong === t.ma
            return (
              <button
                key={t.ma}
                type="button"
                role="radio"
                aria-checked={chon}
                onClick={() => doi({ tong: t.ma })}
                className={`flex items-center gap-3 rounded-[10px] border-2 p-3 text-left transition-colors ${chon ? 'border-brand bg-tint-brand' : 'border-line hover:bg-nav-hover'}`}
              >
                <span
                  aria-hidden="true"
                  className="relative h-11 w-16 flex-none overflow-hidden rounded-md shadow-sm"
                  style={{ background: t.mau[0] }}
                >
                  <span className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: t.mau[1] }} />
                </span>
                <span className="min-w-0">
                  <b className="block text-[13.5px] text-ink">{t.ten}</b>
                  <span className="block text-[11.5px] text-faint">{t.mo}</span>
                </span>
              </button>
            )
          })}
        </div>
      </The>

      <The tieuDe="Sáng / tối">
        <div role="radiogroup" aria-label="Sáng hoặc tối" className="grid gap-3 sm:grid-cols-3">
          {CHE_DO.map((c) => {
            const chon = gd.cheDo === c.ma
            return (
              <button
                key={c.ma}
                type="button"
                role="radio"
                aria-checked={chon}
                onClick={() => doi({ cheDo: c.ma })}
                className={`rounded-[10px] border-2 p-3 text-left transition-colors ${chon ? 'border-brand bg-tint-brand' : 'border-line hover:bg-nav-hover'}`}
              >
                <b className="block text-[13.5px] text-ink">{c.ten}</b>
                <span className="block text-[11.5px] text-faint">{c.mo}</span>
              </button>
            )
          })}
        </div>
      </The>

      <The tieuDe="Tài khoản">
        <p className="m-0 text-[13px]">
          {toi.hoTen} · <span className="text-faint">{toi.tenDangNhap}</span> ·{' '}
          <Link to="/doi-mat-khau" className="font-semibold text-brand">
            Đổi mật khẩu
          </Link>
        </p>
      </The>
    </>
  )
}
