import { DANH_SACH_MODULE, locTheoQuyen, VAI } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { moTaVai } from '@/khung/thanh-tren'
import { truyVanToi } from '@/lib/phien'
import { The } from '@/ui/co-ban'
import { ViecCuaToi } from './viec-cua-toi'

/**
 * Trang chủ: "Việc của tôi" (gom việc từ mọi module — ADR-0007) rồi tới phạm vi và các chức năng dùng được.
 */
export function TrangChu() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const cay = locTheoQuyen(DANH_SACH_MODULE, new Set(toi.quyen))

  return (
    <>
      <h1 className="mt-0 mb-1 text-[21px] font-bold">Xin chào, {toi.hoTen}</h1>
      <p className="mt-0 mb-5 text-[12.5px] text-faint">
        {toi.donVi.ten} · {moTaVai(toi)}
      </p>

      <ViecCuaToi />

      <The tieuDe="Phạm vi của bạn">
        <ul className="m-0 list-none space-y-1.5 p-0 text-[13px]">
          {toi.phanCong.map((p, i) => (
            <li key={i}>
              <b>{VAI[p.vai].ten}</b> —{' '}
              {p.phamVi === 'tat-ca'
                ? 'mọi phân hệ'
                : p.phamVi.map((id) => DANH_SACH_MODULE.find((m) => m.id === id)?.nhan ?? id).join(', ')}
              <span className="text-faint"> · {VAI[p.vai].mo}</span>
            </li>
          ))}
          {toi.laQuanTri && (
            <li>
              <b>Quản trị hệ thống</b>: tài khoản, đơn vị, phân quyền
            </li>
          )}
          {toi.phanCong.length === 0 && !toi.laQuanTri && (
            <li className="text-faint">Chưa được phân công. Liên hệ quản trị hệ thống.</li>
          )}
        </ul>
      </The>

      {cay.length > 0 && (
        <The tieuDe="Chức năng bạn dùng được">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cay.flatMap((t) =>
              t.nhom.flatMap((n) =>
                n.modules.map(({ module: m, con }) => (
                  <div key={m.id} className="rounded-[9px] border border-line p-3">
                    <p className="m-0 text-[10.5px] font-bold tracking-[.4px] text-faint uppercase">
                      Tầng {t.so} · {n.nhan}
                    </p>
                    <h3 className="mt-0.5 mb-1 text-[14px] font-semibold">{m.nhan}</h3>
                    <p className="mt-0 mb-2 text-[11.5px] leading-snug text-faint">{m.mo}</p>
                    {con.map((c) => (
                      <Link
                        key={c.id}
                        to="/$chucNang"
                        params={{ chucNang: c.id }}
                        className="block border-l border-line py-0.5 pl-2.5 text-[12.5px] text-body hover:text-brand"
                      >
                        {c.nhan}
                      </Link>
                    ))}
                  </div>
                )),
              ),
            )}
          </div>
        </The>
      )}
    </>
  )
}
