/** Ô lọc dưới một cột — kiểu ô theo kiểu cột (chuẩn lưới §2). */
import { ngayVn } from '@/lib/ngay'
import { NutNoiLen } from '@/ui/noi-len'
import { dangBat, TOAN_TU_CHU, TOAN_TU_SO, type CotLuoi, type LocCot } from './loc'

const O =
  'h-7 w-full min-w-0 rounded-md border border-line bg-nen px-2 text-[12px] font-normal text-ink outline-none focus:border-brand'
const NUT_O = `${O} flex items-center justify-between gap-1 text-left`

export function OLoc<T>({
  cot: c,
  dong,
  loc,
  doi,
}: {
  cot: CotLuoi<T>
  dong: readonly T[]
  loc: LocCot
  doi: (l: LocCot) => void
}) {
  if (loc.kieu === 'chu' || loc.kieu === 'so') {
    const ds = loc.kieu === 'chu' ? TOAN_TU_CHU : TOAN_TU_SO
    const nhanTt = ds.find((x) => x.gt === loc.tt)!.nhan
    return (
      <div className="flex items-center gap-1">
        <NutNoiLen
          tieuDe={`Cách so của cột ${c.nhan}: ${nhanTt}`}
          nhan={
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          }
          className={`flex size-7 flex-none items-center justify-center rounded-md border ${loc.tt !== ds[0]!.gt ? 'border-brand text-brand' : 'border-line text-faint'} hover:border-brand hover:text-brand`}
        >
          {(dong) => (
            <ul className="m-0 min-w-[190px] list-none p-0">
              {ds.map((x) => (
                <li key={x.gt}>
                  <button
                    type="button"
                    onClick={() => {
                      doi({ ...loc, tt: x.gt } as LocCot)
                      dong()
                    }}
                    className={`w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] hover:bg-nav-hover ${x.gt === loc.tt ? 'font-bold text-brand' : ''}`}
                  >
                    {x.nhan}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </NutNoiLen>
        <input
          aria-label={`Lọc cột ${c.nhan}`}
          placeholder="Lọc…"
          inputMode={loc.kieu === 'so' ? 'decimal' : undefined}
          value={loc.gt}
          onChange={(e) => doi({ ...loc, gt: e.target.value })}
          className={`${O} ${loc.kieu === 'so' ? 'text-right' : ''}`}
        />
      </div>
    )
  }

  if (loc.kieu === 'ngay') {
    const nhan = dangBat(loc)
      ? `${loc.tu ? ngayVn(loc.tu).slice(0, 5) : '…'} – ${loc.den ? ngayVn(loc.den).slice(0, 5) : '…'}`
      : 'Từ – đến'
    return (
      <NutNoiLen
        tieuDe={`Lọc cột ${c.nhan} theo khoảng ngày`}
        nhan={
          <>
            <span className={`truncate ${dangBat(loc) ? 'text-brand' : 'text-faint'}`}>{nhan}</span>
            <span aria-hidden="true" className="text-faint">
              ▾
            </span>
          </>
        }
        className={NUT_O}
      >
        {(dong) => (
          <div className="grid w-[230px] gap-2 p-1">
            <label className="text-[12px] font-semibold text-faint">
              Từ ngày
              <input
                type="date"
                value={loc.tu}
                onChange={(e) => doi({ ...loc, tu: e.target.value })}
                className={`${O} mt-1 h-8`}
              />
            </label>
            <label className="text-[12px] font-semibold text-faint">
              Đến ngày
              <input
                type="date"
                value={loc.den}
                onChange={(e) => doi({ ...loc, den: e.target.value })}
                className={`${O} mt-1 h-8`}
              />
            </label>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => doi({ kieu: 'ngay', tu: '', den: '' })}
                className="text-[12px] font-semibold text-faint hover:text-danger"
              >
                Bỏ lọc
              </button>
              <button type="button" onClick={dong} className="text-[12px] font-semibold text-brand">
                Xong
              </button>
            </div>
          </div>
        )}
      </NutNoiLen>
    )
  }

  // Danh mục / trạng thái: chọn nhiều (lọc IN).
  const luaChon =
    c.luaChon ??
    [
      ...new Set(
        dong
          .map((d) => c.giaTri(d))
          .filter((v) => v !== null && v !== '')
          .map(String),
      ),
    ]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((v) => ({ giaTri: v, nhan: v }))
  const nhan =
    loc.chon.length === 0
      ? 'Tất cả'
      : loc.chon.length === 1
        ? (luaChon.find((x) => x.giaTri === loc.chon[0])?.nhan ?? loc.chon[0])
        : `${loc.chon.length} mục`
  return (
    <NutNoiLen
      tieuDe={`Lọc cột ${c.nhan}`}
      nhan={
        <>
          <span className={`truncate ${loc.chon.length ? 'font-semibold text-brand' : 'text-faint'}`}>
            {nhan}
          </span>
          <span aria-hidden="true" className="text-faint">
            ▾
          </span>
        </>
      }
      className={NUT_O}
    >
      {() => (
        <div className="w-[230px]">
          <div className="mb-1 flex justify-between px-1">
            <button
              type="button"
              onClick={() => doi({ kieu: 'danh-muc', chon: luaChon.map((x) => x.giaTri) })}
              className="text-[12px] font-semibold text-brand"
            >
              Chọn hết
            </button>
            <button
              type="button"
              onClick={() => doi({ kieu: 'danh-muc', chon: [] })}
              className="text-[12px] font-semibold text-faint hover:text-danger"
            >
              Bỏ chọn
            </button>
          </div>
          {luaChon.map((x) => (
            <label
              key={x.giaTri}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] hover:bg-nav-hover"
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={loc.chon.includes(x.giaTri)}
                onChange={(e) =>
                  doi({
                    kieu: 'danh-muc',
                    chon: e.target.checked ? [...loc.chon, x.giaTri] : loc.chon.filter((v) => v !== x.giaTri),
                  })
                }
              />
              {x.nhan}
            </label>
          ))}
          {luaChon.length === 0 && <p className="m-1 text-[12px] text-faint">Chưa có giá trị nào.</p>}
        </div>
      )}
    </NutNoiLen>
  )
}
