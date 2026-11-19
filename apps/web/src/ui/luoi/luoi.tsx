/**
 * LƯỚI DANH SÁCH dùng chung — theo "Chuẩn lưới danh sách" (docs/tieu-chuan-luoi.md,
 * lấy từ PRM). Mọi lưới danh sách của GDOS dùng component này, không tự dựng bảng lọc.
 *
 *   ô lọc dưới MỖI cột (chữ 6 toán tử · số 5 toán tử · ngày từ–đến · danh mục chọn nhiều)
 *   tìm tổng · Xóa lọc (n) · ẩn/hiện + kéo–thả thứ tự + ghim cột · giãn dòng
 *   kéo đổi bề rộng · xuất Excel đúng phần đang lọc và cột đang hiện · phân trang
 *   dòng tổng · nhớ thiết lập theo máy · rỗng nói rõ vì sao rỗng
 *
 * Lọc ở máy người dùng (danh sách GDOS vài trăm dòng). Danh sách lớn hơn thì lọc ở
 * máy chủ — xem mục 5 của chuẩn.
 */
import { useEffect, useState, type PointerEvent as SuKienTro, type ReactNode } from 'react'
import { LoiApi, taiVeTep } from '@/lib/http'
import { ngayVn } from '@/lib/ngay'
import { docTam, ghiTam } from '@/lib/luu-tam'
import { Nut } from '@/ui/co-ban'
import { NutNoiLen } from '@/ui/noi-len'
import { ChonCot } from './chon-cot'
import {
  apThuTu,
  chuCua,
  dangBat,
  docSo,
  locRong,
  locVaSap,
  type CotLuoi,
  type LocCot,
  type SapXep,
} from './loc'
import { OLoc } from './o-loc'

export type { CotLuoi } from './loc'

interface ThietLap {
  an: string[]
  thuTu: string[]
  ghim: string[]
  rong: Record<string, number>
  gian: boolean
  soDong: number
}

const RONG_MAC_DINH = { chu: 200, so: 120, ngay: 118, 'danh-muc': 150 } as const
const SO_DONG = [25, 50, 100, 200] as const
const RONG_CHON = 40

export interface LuoiProps<T> {
  /** Khóa nhớ thiết lập theo máy — đổi bộ cột lớn thì tăng hậu tố (…-v2). */
  ma: string
  /** Tên lưới — tiêu đề tệp Excel. */
  tieuDe: string
  cot: CotLuoi<T>[]
  dong: readonly T[]
  khoa: (d: T) => string
  moDong?: (d: T) => void
  /** Tô chữ cả dòng (vd dòng quá hạn). */
  mauDong?: (d: T) => 'danger' | 'warn' | undefined
  /** Nút riêng của màn (vd "+ Tạo dự án") — nằm cuối thanh công cụ. */
  congCu?: ReactNode
  /** Nói gì khi CHƯA có dữ liệu (khác với lọc không ra). */
  rong?: ReactNode
  /** Khi dữ liệu đã phân trang ở máy chủ, lọc cột và xuất Excel áp dụng trên trang đang mở. */
  phanTrangMayChu?: ReactNode
  /** Cột chọn dòng (vd chọn dự án để đôn đốc). */
  chon?: {
    ds: ReadonlySet<string>
    doi: (ids: string[], chon: boolean) => void
    duocChon?: (d: T) => boolean
  }
}

function macDinh<T>(cot: CotLuoi<T>[]): ThietLap {
  return {
    an: cot.filter((c) => c.an).map((c) => c.id),
    thuTu: [],
    ghim: cot[0] ? [cot[0].id] : [],
    rong: {},
    gian: false,
    soDong: 25,
  }
}

/** Đọc thiết lập đã lưu và LÀM SẠCH theo bộ cột hiện có (bỏ id lạ, không ẩn cột bắt buộc). */
function docThietLap<T>(ma: string, cot: CotLuoi<T>[]): ThietLap {
  const md = macDinh(cot)
  const t = docTam<Partial<ThietLap>>(`gdos-luoi:${ma}`, {})
  const co = new Set(cot.map((c) => c.id))
  const batBuoc = new Set(cot.filter((c) => c.batBuoc).map((c) => c.id))
  const mang = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && co.has(x)) : null
  return {
    an: (mang(t.an) ?? md.an).filter((x) => !batBuoc.has(x)),
    thuTu: mang(t.thuTu) ?? [],
    ghim: mang(t.ghim) ?? md.ghim,
    rong:
      t.rong && typeof t.rong === 'object'
        ? Object.fromEntries(
            Object.entries(t.rong).filter(
              ([k, v]) => co.has(k) && typeof v === 'number' && v >= 60 && v <= 900,
            ),
          )
        : {},
    gian: t.gian === true,
    soDong: SO_DONG.includes(t.soDong as (typeof SO_DONG)[number]) ? t.soDong! : md.soDong,
  }
}

export function Luoi<T>({
  ma,
  tieuDe,
  cot,
  dong,
  khoa,
  moDong,
  mauDong,
  congCu,
  rong,
  chon,
  phanTrangMayChu,
}: LuoiProps<T>) {
  const [tl, datTl] = useState(() => docThietLap(ma, cot))
  const [loc, datLoc] = useState<Record<string, LocCot>>({})
  const [tim, datTim] = useState('')
  const [sap, datSap] = useState<SapXep | null>(null)
  const [trang, datTrang] = useState(0)
  const [dangXuat, datDangXuat] = useState(false)
  const [loiXuat, datLoiXuat] = useState<string>()

  useEffect(() => ghiTam(`gdos-luoi:${ma}`, tl), [ma, tl])

  const rongCua = (c: CotLuoi<T>) => tl.rong[c.id] ?? c.rong ?? RONG_MAC_DINH[c.kieu]
  const thuTu = apThuTu(
    cot.map((c) => c.id),
    tl.thuTu,
  )
  const hien = thuTu
    .map((id) => cot.find((c) => c.id === id)!)
    .filter((c) => c.batBuoc || !tl.an.includes(c.id))
  // Cột ghim đứng đầu, giữ thứ tự người dùng đã chọn.
  const cotHien = [
    ...hien.filter((c) => tl.ghim.includes(c.id)),
    ...hien.filter((c) => !tl.ghim.includes(c.id)),
  ]
  const soGhim = cotHien.filter((c) => tl.ghim.includes(c.id)).length
  const trai: number[] = []
  cotHien.reduce((x, c, i) => ((trai[i] = x), x + rongCua(c)), chon ? RONG_CHON : 0)
  const tongRong = cotHien.reduce((t, c) => t + rongCua(c), chon ? RONG_CHON : 0)

  const cotDuLieu = cotHien.filter((c) => !c.khongLoc)
  const ketQua = locVaSap(dong, cotDuLieu, loc, tim, sap)
  const soLoc = cotHien.filter((c) => dangBat(loc[c.id])).length + (tim.trim() ? 1 : 0)
  const soTrang = Math.max(1, Math.ceil(ketQua.length / tl.soDong))
  const tr = Math.min(trang, soTrang - 1)
  const trangNay = phanTrangMayChu ? ketQua : ketQua.slice(tr * tl.soDong, (tr + 1) * tl.soDong)

  const doiLoc = (id: string, l: LocCot) => {
    datLoc((c) => ({ ...c, [id]: l }))
    datTrang(0)
  }
  const xoaLoc = () => {
    datLoc({})
    datTim('')
    datTrang(0)
  }
  const doiSap = (id: string) => {
    datSap((s) => (s?.id !== id ? { id, tang: true } : s.tang ? { id, tang: false } : null))
  }

  const keoRong = (e: SuKienTro, c: CotLuoi<T>) => {
    e.preventDefault()
    e.stopPropagation()
    const x0 = e.clientX
    const w0 = rongCua(c)
    const di = (ev: PointerEvent) =>
      datTl((t) => ({
        ...t,
        rong: { ...t.rong, [c.id]: Math.min(900, Math.max(60, Math.round(w0 + ev.clientX - x0))) },
      }))
    const tha = () => {
      window.removeEventListener('pointermove', di)
      window.removeEventListener('pointerup', tha)
    }
    window.addEventListener('pointermove', di)
    window.addEventListener('pointerup', tha)
  }

  const xuatExcel = async () => {
    datLoiXuat(undefined)
    datDangXuat(true)
    try {
      await taiVeTep('/xuat-bang', `${tieuDe}.xlsx`, {
        tieuDe,
        ghiChu: soLoc ? 'theo bộ lọc đang áp' : '',
        cot: cotDuLieu.map((c) => ({
          nhan: c.nhan,
          kieu: c.kieu === 'so' ? 'so' : c.kieu === 'ngay' ? 'ngay' : 'chu',
          cong: !!c.cong,
        })),
        dong: ketQua.map((d) =>
          cotDuLieu.map((c) => {
            const v = c.giaTri(d)
            if (c.kieu === 'so') return typeof v === 'number' ? v : docSo(String(v ?? ''))
            return c.kieu === 'danh-muc' ? chuCua(c, d) : v === null ? null : String(v)
          }),
        ),
      })
    } catch (e) {
      datLoiXuat(e instanceof LoiApi ? e.message : 'Không xuất được tệp.')
    } finally {
      datDangXuat(false)
    }
  }

  const oChon = chon ? ketQua.filter((d) => chon.duocChon?.(d) ?? true).map(khoa) : []
  const daChonHet = oChon.length > 0 && oChon.every((id) => chon!.ds.has(id))
  const coChon = oChon.some((id) => chon!.ds.has(id))

  const dinhDang = (c: CotLuoi<T>, d: T, stt: number): ReactNode => {
    if (c.hien) return c.hien(d, stt)
    const v = c.giaTri(d)
    if (v === null || v === '') return <span className="text-faint">—</span>
    if (c.kieu === 'so') return typeof v === 'number' ? v.toLocaleString('vi-VN') : v
    if (c.kieu === 'ngay') return ngayVn(String(v))
    return chuCua(c, d)
  }
  const oGhim = (i: number, nen: string) =>
    i < soGhim
      ? {
          style: { position: 'sticky' as const, left: trai[i] },
          lop: `${nen} ${i === soGhim - 1 ? 'shadow-[inset_-2px_0_0_var(--line)]' : ''}`,
        }
      : { style: undefined, lop: '' }
  const th = 'border-b border-line bg-nen-2 px-2.5 text-left align-middle'
  const td = 'border-b border-line-2 px-2.5 py-2 align-top'
  const catChu = tl.gian ? 'whitespace-normal break-words' : 'truncate'

  return (
    <div>
      {/* Thanh công cụ */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[300px]">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            type="search"
            aria-label={phanTrangMayChu ? 'Tìm trong trang hiện tại' : 'Tìm trong danh sách'}
            placeholder={phanTrangMayChu ? 'Tìm trong trang này…' : 'Tìm trong mọi cột…'}
            value={tim}
            onChange={(e) => {
              datTim(e.target.value)
              datTrang(0)
            }}
            className="w-full rounded-lg border border-line bg-nen py-[7px] pr-3 pl-8 text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--tint-brand)]"
          />
        </div>
        <Nut onClick={xoaLoc} disabled={!soLoc} title="Xóa mọi bộ lọc và ô tìm">
          Xóa lọc{soLoc ? ` (${soLoc})` : ''}
        </Nut>
        <span className="text-[12.5px] text-faint tabular-nums">
          {ketQua.length === dong.length
            ? `${dong.length} bản ghi`
            : `${ketQua.length} / ${dong.length} bản ghi`}
        </span>
        <span className="flex-1" />
        <Nut
          aria-pressed={tl.gian}
          title={tl.gian ? 'Gọn dòng: mỗi ô một dòng' : 'Giãn dòng: chữ dài xuống dòng'}
          onClick={() => datTl((t) => ({ ...t, gian: !t.gian }))}
        >
          {tl.gian ? 'Gọn dòng' : 'Giãn dòng'}
        </Nut>
        <NutNoiLen
          tieuDe="Chọn cột hiển thị"
          canPhai
          nhan={`Cột ${hien.length}/${cot.length}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-nen px-3.5 py-[7px] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          {() => (
            <ChonCot
              cot={cot}
              thuTu={thuTu}
              an={tl.an}
              ghim={tl.ghim}
              doi={(g) => datTl((t) => ({ ...t, ...g }))}
              macDinh={() => datTl((t) => ({ ...macDinh(cot), gian: t.gian, soDong: t.soDong }))}
            />
          )}
        </NutNoiLen>
        <Nut
          onClick={() => void xuatExcel()}
          disabled={dangXuat || ketQua.length === 0}
          title="Xuất phần đang lọc, đúng các cột đang hiện"
        >
          {dangXuat ? 'Đang xuất…' : '⬇ Xuất Excel'}
        </Nut>
        {congCu}
      </div>
      {loiXuat && <p className="mt-0 mb-2 text-[12.5px] text-danger">{loiXuat}</p>}

      <div className="max-h-[calc(100vh-250px)] min-h-[160px] overflow-auto rounded-[10px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,34,54,.05)]">
        <table
          aria-label={tieuDe}
          style={{ minWidth: tongRong }}
          className="w-full table-fixed border-separate border-spacing-0 text-left text-[13px]"
        >
          <colgroup>
            {chon && <col style={{ width: RONG_CHON }} />}
            {cotHien.map((c) => (
              <col key={c.id} style={{ width: rongCua(c) }} />
            ))}
            <col />
          </colgroup>
          <thead>
            <tr>
              {chon && (
                <th className={`${th} sticky top-0 left-0 z-30 h-[34px] text-center`}>
                  <input
                    type="checkbox"
                    aria-label="Chọn mọi dòng đang lọc"
                    className="accent-brand"
                    checked={daChonHet}
                    ref={(el) => {
                      if (el) el.indeterminate = coChon && !daChonHet
                    }}
                    onChange={() => chon.doi(oChon, !daChonHet)}
                  />
                </th>
              )}
              {cotHien.map((c, i) => {
                const g = oGhim(i, 'bg-nen-2')
                const s = sap?.id === c.id ? (sap.tang ? 'ascending' : 'descending') : undefined
                return (
                  <th
                    key={c.id}
                    aria-sort={s}
                    style={g.style}
                    className={`${th} ${g.lop} sticky top-0 h-[34px] ${i < soGhim ? 'z-30' : 'z-20'}`}
                  >
                    {c.khongLoc ? (
                      <span className="block truncate text-[11px] font-bold tracking-[.06em] text-faint uppercase">
                        {c.nhan}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => doiSap(c.id)}
                        title="Bấm để sắp xếp"
                        className={`flex w-full items-center gap-1 truncate pr-2 text-[11px] font-bold tracking-[.06em] uppercase ${c.kieu === 'so' ? 'justify-end' : ''} ${s ? 'text-brand' : 'text-faint hover:text-ink'}`}
                      >
                        <span className="truncate">{c.nhan}</span>
                        <span aria-hidden="true" className="flex-none text-[10px]">
                          {s === 'ascending' ? '▲' : s === 'descending' ? '▼' : ''}
                        </span>
                      </button>
                    )}
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Kéo để đổi bề rộng cột ${c.nhan}`}
                      onPointerDown={(e) => keoRong(e, c)}
                      className="absolute top-1.5 right-0 bottom-1.5 w-2 cursor-col-resize border-r-2 border-transparent hover:border-brand"
                    />
                  </th>
                )
              })}
              <th className={`${th} sticky top-0 z-20`} />
            </tr>
            <tr>
              {chon && <th className={`${th} sticky top-[34px] left-0 z-30 py-1`} />}
              {cotHien.map((c, i) => {
                const g = oGhim(i, 'bg-nen-2')
                return (
                  <th
                    key={c.id}
                    style={g.style}
                    className={`${th} ${g.lop} sticky top-[34px] border-b-[1.5px] py-1.5 font-normal ${i < soGhim ? 'z-30' : 'z-20'}`}
                  >
                    {!c.khongLoc && (
                      <OLoc
                        cot={c}
                        dong={dong}
                        loc={loc[c.id] ?? locRong(c.kieu)}
                        doi={(l) => doiLoc(c.id, l)}
                      />
                    )}
                  </th>
                )
              })}
              <th className={`${th} sticky top-[34px] z-20 border-b-[1.5px]`} />
            </tr>
          </thead>
          <tbody>
            {trangNay.map((d, k) => {
              const id = khoa(d)
              const mau = mauDong?.(d)
              return (
                <tr
                  key={id}
                  tabIndex={moDong ? 0 : undefined}
                  onClick={moDong ? () => moDong(d) : undefined}
                  onKeyDown={moDong ? (e) => e.key === 'Enter' && moDong(d) : undefined}
                  className={`group ${moDong ? 'cursor-pointer' : ''} ${mau === 'danger' ? 'text-danger' : mau === 'warn' ? 'text-warn' : ''}`}
                >
                  {chon && (
                    <td
                      className={`${td} sticky left-0 z-10 bg-nen text-center group-hover:bg-nav-hover`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(chon.duocChon?.(d) ?? true) && (
                        <input
                          type="checkbox"
                          aria-label="Chọn dòng"
                          className="accent-brand"
                          checked={chon.ds.has(id)}
                          onChange={(e) => chon.doi([id], e.target.checked)}
                        />
                      )}
                    </td>
                  )}
                  {cotHien.map((c, i) => {
                    const g = oGhim(i, 'bg-nen')
                    return (
                      <td
                        key={c.id}
                        style={g.style}
                        className={`${td} ${g.lop} ${i < soGhim ? 'z-10' : ''} group-hover:bg-nav-hover ${c.kieu === 'so' ? 'text-right tabular-nums' : ''} ${catChu}`}
                      >
                        {dinhDang(c, d, tr * tl.soDong + k + 1)}
                      </td>
                    )
                  })}
                  <td className={`${td} group-hover:bg-nav-hover`} />
                </tr>
              )
            })}
            {ketQua.length === 0 && (
              <tr>
                <td
                  colSpan={cotHien.length + (chon ? 2 : 1)}
                  className="px-4 py-10 text-center text-[13px] text-faint"
                >
                  {dong.length === 0 ? (
                    (rong ?? 'Chưa có dữ liệu.')
                  ) : (
                    <>
                      Không có bản ghi nào khớp bộ lọc.{' '}
                      <button type="button" onClick={xoaLoc} className="font-semibold text-brand underline">
                        Xóa lọc
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
          {ketQua.length > 0 && (
            <tfoot>
              <tr className="font-bold">
                {chon && <td className="sticky bottom-0 left-0 z-20 border-t-[1.5px] border-line bg-nen-2" />}
                {cotHien.map((c, i) => {
                  const g = oGhim(i, 'bg-nen-2')
                  return (
                    <td
                      key={c.id}
                      style={g.style}
                      className={`${g.lop} sticky bottom-0 border-t-[1.5px] border-line bg-nen-2 px-2.5 py-2 ${i < soGhim ? 'z-20' : 'z-10'} ${c.kieu === 'so' ? 'text-right tabular-nums' : ''} truncate`}
                    >
                      {i === 0
                        ? `Tổng: ${ketQua.length} bản ghi`
                        : c.cong
                          ? ketQua.reduce((t, d) => t + (Number(c.giaTri(d)) || 0), 0).toLocaleString('vi-VN')
                          : ''}
                    </td>
                  )
                })}
                <td className="sticky bottom-0 z-10 border-t-[1.5px] border-line bg-nen-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Phân trang */}
      {phanTrangMayChu ??
        (ketQua.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
            <span className="tabular-nums">
              {tr * tl.soDong + 1}–{Math.min((tr + 1) * tl.soDong, ketQua.length)} / {ketQua.length} bản ghi
            </span>
            <span className="flex-1" />
            <label className="flex items-center gap-1.5">
              Mỗi trang
              <select
                value={tl.soDong}
                onChange={(e) => {
                  datTl((t) => ({ ...t, soDong: Number(e.target.value) }))
                  datTrang(0)
                }}
                className="rounded-md border border-line bg-nen px-1.5 py-1 text-[12.5px] text-ink"
              >
                {SO_DONG.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <Nut aria-label="Trang trước" disabled={tr === 0} onClick={() => datTrang(tr - 1)}>
              ‹
            </Nut>
            <span className="tabular-nums">
              Trang {tr + 1}/{soTrang}
            </span>
            <Nut aria-label="Trang sau" disabled={tr >= soTrang - 1} onClick={() => datTrang(tr + 1)}>
              ›
            </Nut>
          </div>
        ))}
    </div>
  )
}
