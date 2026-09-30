import type { KhoiSoLieu } from '@gdos/shared'
import { useNavigate } from '@tanstack/react-router'
import { KhungBang, LOP_TD, LOP_TH } from '@/ui/co-ban'

const MAU_SO = { danger: 'text-danger', warn: 'text-warn', ok: 'text-ok', brand: 'text-brand' } as const

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
      {nhieu && <h2 className="mt-0 mb-3 text-[15px] font-semibold">{k.nghiepVu}</h2>}
      {k.so.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {k.so.map((s) => (
            <div key={s.nhan} className="rounded-[10px] border border-line bg-nen px-4 py-3">
              <div className="text-[11.5px] font-semibold text-faint">{s.nhan}</div>
              <div className={`text-[24px] font-bold tabular-nums ${s.mau ? MAU_SO[s.mau] : 'text-ink'}`}>
                {s.giaTri}
              </div>
              {s.phu && <div className="text-[11.5px] text-faint">{s.phu}</div>}
            </div>
          ))}
        </div>
      )}
      {k.bang.map((b) => (
        <div key={b.tieuDe} className="mb-4">
          <h3 className="mt-0 mb-1 text-[13.5px] font-semibold">{b.tieuDe}</h3>
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
