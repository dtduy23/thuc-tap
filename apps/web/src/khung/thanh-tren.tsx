import { VAI, type NhanhTang, type ThongTinToi } from '@gdos/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import { doiSangToi } from '@/lib/giao-dien'
import { dangXuat } from '@/lib/phien'
import { CoDoSaoVang } from '@/ui/co-do-sao-vang'
import { BieuTuong } from './bieu-tuong'

const khongDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** "Lãnh đạo · Quản trị" — người dùng luôn biết mình đang cầm quyền gì. */
export function moTaVai(toi: ThongTinToi): string {
  const ds: string[] = [...new Set(toi.phanCong.map((p) => VAI[p.vai].ten))]
  if (toi.laQuanTri) ds.push('Quản trị')
  return ds.join(' · ') || 'Chưa phân công'
}

export function ThanhTren({ toi, cay, moMenu }: { toi: ThongTinToi; cay: NhanhTang[]; moMenu: () => void }) {
  const qc = useQueryClient()
  const di = useNavigate()
  const [tim, datTim] = useState('')
  const { data: cauHinh } = useQuery(truyVanCongKhai)

  // Tìm trong đúng những chức năng người này thấy — không lộ tên màn không có quyền.
  const chucNang = useMemo(
    () =>
      cay.flatMap((t) =>
        t.nhom.flatMap((n) =>
          n.modules.flatMap((m) => m.con.map((c) => ({ id: c.id, nhan: c.nhan, cha: m.module.nhan }))),
        ),
      ),
    [cay],
  )
  const kq = tim.trim()
    ? chucNang.filter((c) => khongDau(`${c.nhan} ${c.cha}`).includes(khongDau(tim.trim()))).slice(0, 8)
    : []

  const thoat = async () => {
    await dangXuat(qc)
    await di({ to: '/dang-nhap', search: {} })
  }

  return (
    <header className="flex h-[54px] flex-none items-center gap-3 border-b border-line bg-nen px-3.5">
      <button
        type="button"
        onClick={moMenu}
        aria-label="Mở cây phân hệ"
        className="rounded-lg p-1.5 text-body hover:bg-nav-hover md:hidden"
      >
        <BieuTuong ten="menu" />
      </button>

      {/* Khối logo nền đậm, liền với cây phân hệ bên dưới — như sidebar PMS. */}
      <Link
        to="/"
        title={cauHinh?.nhanDien.tenHeThong}
        className="flex min-w-0 flex-none items-center gap-2.5 md:-ml-3.5 md:w-[252px] md:self-stretch md:border-b-2 md:border-vang md:px-3.5 md:be-mat-dam"
      >
        <CoDoSaoVang rong={33} />
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block truncate text-[13px] font-bold text-ink">
            {cauHinh?.nhanDien.tenHeThong ?? 'Điều hành số'}
          </span>
          <span className="block truncate text-[10.5px] text-faint">{toi.donVi.ten}</span>
        </span>
      </Link>

      <div className="relative max-w-[480px] min-w-0 flex-1">
        <span className="pointer-events-none absolute top-[9px] left-2.5 text-faint">
          <BieuTuong ten="tim" />
        </span>
        <input
          value={tim}
          onChange={(e) => datTim(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && datTim('')}
          placeholder="Tìm chức năng…"
          aria-label="Tìm chức năng"
          className="w-full rounded-lg border border-line bg-nen-2 py-[7px] pr-3 pl-8 text-[13px]"
        />
        {kq.length > 0 && (
          <ul className="absolute top-[calc(100%+5px)] right-0 left-0 z-30 rounded-[10px] border border-line bg-nen p-1 shadow-lg">
            {kq.map((c) => (
              <li key={c.id}>
                <Link
                  to="/$chucNang"
                  params={{ chucNang: c.id }}
                  onClick={() => datTim('')}
                  className="block rounded-md px-2.5 py-2 text-[13px] hover:bg-nav-hover"
                >
                  <span className="text-faint">{c.cha} › </span>
                  {c.nhan}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => doiSangToi(toi.id)}
          aria-label="Đổi giao diện sáng / tối"
          title="Sáng / tối"
          className="rounded-lg p-2 text-body hover:bg-nav-hover"
        >
          <BieuTuong ten="mat-troi" />
        </button>
        <div className="flex items-center gap-2 border-l border-line pl-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-tint-brand text-[12px] font-bold text-brand">
            {toi.hoTen.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase() ?? '?'}
          </span>
          <span className="hidden leading-tight lg:block">
            <span className="block text-[12.5px] font-semibold">{toi.hoTen}</span>
            <span className="block text-[10.5px] text-faint">{moTaVai(toi)}</span>
          </span>
          <Link
            to="/cai-dat"
            aria-label="Cài đặt cá nhân"
            title="Cài đặt cá nhân: tông màu, giao diện"
            className="rounded-lg p-2 text-body hover:bg-nav-hover"
          >
            <BieuTuong ten="cai-dat" />
          </Link>
          <Link
            to="/doi-mat-khau"
            aria-label="Đổi mật khẩu"
            title="Đổi mật khẩu"
            className="rounded-lg p-2 text-body hover:bg-nav-hover"
          >
            <BieuTuong ten="khoa" />
          </Link>
          <button
            type="button"
            onClick={() => void thoat()}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="rounded-lg p-2 text-body hover:bg-nav-hover"
          >
            <BieuTuong ten="thoat" />
          </button>
        </div>
      </div>
    </header>
  )
}
