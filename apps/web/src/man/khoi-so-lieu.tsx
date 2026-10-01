import type { KhoiSoLieu } from '@gdos/shared'
import { useNavigate } from '@tanstack/react-router'
import { KhungBang, LOP_TD, LOP_TH } from '@/ui/co-ban'

const MAU_SO = { danger: 'text-danger', warn: 'text-warn', ok: 'text-ok', brand: 'text-brand' } as const
const DAI_MAU = { danger: 'bg-danger', warn: 'bg-warn', ok: 'bg-ok', brand: 'bg-brand' } as const

/**
 * Vẽ các khối số liệu do module nghiệp vụ đóng góp (ADR-0007) — thẻ số + bảng.
 * Không biết nghiệp vụ nào: nghiệp vụ mới góp khối là tự hiện ở đây.
 */
export function CacKhoiSoLieu({ ds, trong }: { ds: KhoiSoLieu[]; trong: string }) {
  if (ds.length === 0) return <p className="text-[13px] text-faint">{trong}</p>
  return (
    <>
      {ds.map((k) => (
        <MotKhoi key={k.nguon} k={k} nhieu={ds.length > 1} />
      ))}
    </>
  )
}

function MotKhoi({ k, nhieu }: { k: KhoiSoLieu; nhieu: boolean }) {
  const di = useNavigate()
  return (
    <section className="mb-6">
      {nhieu && <h2 className="mt-0 mb-3 text-[16px] font-extrabold text-ink">{k.nghiepVu}</h2>}
      {k.so.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {k.so.map((s) => (
            <div
              key={s.nhan}
              className="relative overflow-hidden rounded-[10px] border border-line bg-nen py-2.5 pr-3 pl-4 shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)]"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1 ${DAI_MAU[s.mau ?? 'brand']}`}
              />
              <div className="text-[11px] font-bold tracking-[.08em] text-faint uppercase">{s.nhan}</div>
              <div
                className={`mt-1 text-[28px] leading-tight font-extrabold tabular-nums ${s.mau ? MAU_SO[s.mau] : 'text-ink'}`}
              >
                {s.giaTri}
              </div>
              {s.phu && <div className="mt-0.5 text-[11.5px] text-faint">{s.phu}</div>}
            </div>
          ))}
        </div>
      )}
      {k.bang.map((b) => (
        <div key={b.tieuDe} className="mb-4">
          <h3 className="tieu-de-phan mt-2">{b.tieuDe}</h3>
          {b.ghiChu && <p className="mt-0 mb-2 text-[12px] text-faint">{b.ghiChu}</p>}
          <KhungBang nhan={b.tieuDe}>
            <thead>
              <tr>
                {b.cot.map((c) => (
                  <th key={c.nhan} className={`${LOP_TH} ${c.so ? 'text-right' : ''}`}>
                    {c.nhan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.dong.map((d, i) => (
                <tr
                  key={i}
                  onClick={d.lienKet ? () => void di({ href: d.lienKet }) : undefined}
                  className={d.lienKet ? 'cursor-pointer hover:bg-nav-hover' : undefined}
                >
                  {d.o.map((o, j) => (
                    <td
                      key={j}
                      className={`${LOP_TD} ${b.cot[j]?.so ? 'text-right tabular-nums' : ''} ${j === 0 ? 'font-semibold text-ink' : ''} ${j === 0 && d.mau ? MAU_SO[d.mau] : ''}`}
                    >
                      {typeof o === 'number' ? o.toLocaleString('vi-VN') : o}
                    </td>
                  ))}
                </tr>
              ))}
              {b.dong.length === 0 && (
                <tr>
                  <td colSpan={b.cot.length} className={`${LOP_TD} text-center text-faint`}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </KhungBang>
        </div>
      ))}
    </section>
  )
}
