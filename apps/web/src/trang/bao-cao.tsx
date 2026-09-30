import {
  DANH_SACH_MODULE,
  homNay,
  THAM_SO_BAO_CAO,
  timBaoCao,
  type BaoCaoDef,
  type CotBaoCao,
  type KetQuaBaoCao,
} from '@gdos/shared'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Suspense, useState, type FormEvent } from 'react'
import { taiExcelBaoCao, truyVanBaoCao, type ThamSoUrl } from '@/lib/bao-cao'
import { truyVanDanhMuc } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { ngayVn } from '@/lib/ngay'
import { truyVanToi } from '@/lib/phien'
import { Nut, ThongBao } from '@/ui/co-ban'

/** Đọc tham số báo cáo từ URL — sai kiểu thì bỏ, API kiểm lần nữa. */
export function docThamSoUrl(s: Record<string, unknown>): ThamSoUrl {
  const so = (v: unknown) =>
    typeof v === 'number' || (typeof v === 'string' && /^\d{4}$/.test(v)) ? Number(v) : undefined
  const chu = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 200) : undefined)
  return {
    nam: so(s.nam),
    tuNam: so(s.tuNam),
    denNam: so(s.denNam),
    denNgay: chu(s.denNgay),
    linhVucId: chu(s.linhVucId),
    nhom: chu(s.nhom),
  }
}

/**
 * Một báo cáo — CÙNG màn dù mở từ Báo cáo điều hành hay từ module chủ (ADR-0007).
 * Màn không biết nghiệp vụ: ô tham số theo BaoCaoDef.thamSo, bảng theo KetQuaBaoCao.
 */
export function TrangBaoCao({ ma, ts }: { ma: string; ts: ThamSoUrl }) {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const router = useRouter()
  const tim = timBaoCao(DANH_SACH_MODULE, ma)
  if (!tim) return <ThongBao kieu="loi">Không có báo cáo này.</ThongBao>
  const { module: m, muc } = tim
  if (!toi.quyen.includes(`${m.maQuyen}.${muc.hanhDong ?? 'READ'}`))
    return <ThongBao kieu="loi">Tài khoản không có quyền xem báo cáo “{muc.ten}”.</ThongBao>

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 text-[11.5px] text-faint">
        <button type="button" onClick={() => router.history.back()} className="text-brand hover:underline">
          ‹ Quay lại
        </button>
        <span className="mx-1.5">·</span>
        Báo cáo của {m.nhan}
      </nav>
      <h1 className="mt-0 mb-1 text-[21px] font-bold">{muc.ten}</h1>
      <p className="mt-0 mb-4 max-w-[72ch] text-[12.5px] text-faint">{muc.mo}</p>
      <ThamSo key={JSON.stringify(ts)} ma={ma} muc={muc} ts={ts} />
      <Suspense fallback={<p className="text-faint">Đang lập báo cáo…</p>}>
        <KetQua ma={ma} ts={ts} />
      </Suspense>
    </>
  )
}

function ThamSo({ ma, muc, ts }: { ma: string; muc: BaoCaoDef; ts: ThamSoUrl }) {
  const di = useNavigate()
  const ds = muc.thamSo ?? []
  const nam = new Date().getFullYear()
  const [f, datF] = useState({
    nam: String(ts.nam ?? nam),
    tuNam: String(ts.tuNam ?? ts.nam ?? nam),
    denNam: String(ts.denNam ?? (ts.tuNam ?? ts.nam ?? nam) + 4),
    denNgay: ts.denNgay ?? homNay(),
    linhVucId: ts.linhVucId ?? '',
    nhom: (ts.nhom ?? '').split(',').filter(Boolean),
  })
  const { data: linhVuc = [] } = useQuery({ ...truyVanDanhMuc('linh-vuc'), enabled: ds.includes('linh-vuc') })
  const [loi, datLoi] = useState<string>()
  const [dangTai, datDangTai] = useState(false)

  const thamSoMoi = (): ThamSoUrl => ({
    ...(ds.includes('nam') ? { nam: Number(f.nam) } : {}),
    ...(ds.includes('giai-doan') ? { tuNam: Number(f.tuNam), denNam: Number(f.denNam) } : {}),
    ...(ds.includes('den-ngay') ? { denNgay: f.denNgay } : {}),
    ...(ds.includes('linh-vuc') && f.linhVucId ? { linhVucId: f.linhVucId } : {}),
    ...(f.nhom.length ? { nhom: f.nhom.join(',') } : {}),
  })
  const xem = (e: FormEvent) => {
    e.preventDefault()
    void di({ to: '/bao-cao/$ma', params: { ma }, search: thamSoMoi() })
  }
  const excel = async () => {
    datLoi(undefined)
    datDangTai(true)
    try {
      await taiExcelBaoCao(ma, thamSoMoi())
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không tải được tệp.')
    } finally {
      datDangTai(false)
    }
  }
  const datNhom = (cap: number, gt: string) =>
    datF((c) => {
      const moi = c.nhom.slice(0, cap)
      if (gt) moi.push(gt)
      return { ...c, nhom: moi }
    })

  const lop = 'rounded-lg border border-line bg-nen-2 px-2.5 py-1.5 text-[13px]'
  const nhan = (id: string, chu: string) => (
    <label htmlFor={id} className="mb-1 block text-[11.5px] font-semibold text-faint">
      {chu}
    </label>
  )
  return (
    <form
      onSubmit={xem}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-[10px] border border-line bg-nen px-4 py-3"
    >
      {ds.includes('nam') && (
        <div>
          {nhan('bc-nam', THAM_SO_BAO_CAO.nam)}
          <input
            id="bc-nam"
            type="number"
            min={2000}
            max={2100}
            value={f.nam}
            className={`${lop} w-24`}
            onChange={(e) => datF({ ...f, nam: e.target.value })}
          />
        </div>
      )}
      {ds.includes('giai-doan') && (
        <div>
          {nhan('bc-tu-nam', THAM_SO_BAO_CAO['giai-doan'])}
          <span className="flex items-center gap-1.5">
            <input
              id="bc-tu-nam"
              type="number"
              min={2000}
              max={2100}
              value={f.tuNam}
              className={`${lop} w-24`}
              onChange={(e) => datF({ ...f, tuNam: e.target.value })}
            />
            —
            <input
              aria-label="Đến năm"
              type="number"
              min={2000}
              max={2100}
              value={f.denNam}
              className={`${lop} w-24`}
              onChange={(e) => datF({ ...f, denNam: e.target.value })}
            />
          </span>
        </div>
      )}
      {ds.includes('den-ngay') && (
        <div>
          {nhan('bc-den-ngay', THAM_SO_BAO_CAO['den-ngay'])}
          <input
            id="bc-den-ngay"
            type="date"
            value={f.denNgay}
            className={lop}
            onChange={(e) => datF({ ...f, denNgay: e.target.value })}
          />
        </div>
      )}
      {ds.includes('linh-vuc') && (
        <div>
          {nhan('bc-linh-vuc', THAM_SO_BAO_CAO['linh-vuc'])}
          <select
            id="bc-linh-vuc"
            value={f.linhVucId}
            className={lop}
            onChange={(e) => datF({ ...f, linhVucId: e.target.value })}
          >
            <option value="">Tất cả lĩnh vực</option>
            {linhVuc.map((l) => (
              <option key={l.id} value={l.id}>
                {l.ten}
              </option>
            ))}
          </select>
        </div>
      )}
      {muc.nhomTheo?.length
        ? [0, 1, 2].map((cap) =>
            cap > f.nhom.length ? null : (
              <div key={cap}>
                {nhan(`bc-nhom-${cap}`, cap === 0 ? 'Phân nhóm cấp 1' : `Cấp ${cap + 1}`)}
                <select
                  id={`bc-nhom-${cap}`}
                  value={f.nhom[cap] ?? ''}
                  className={lop}
                  onChange={(e) => datNhom(cap, e.target.value)}
                >
                  <option value="">— Không nhóm —</option>
                  {muc
                    .nhomTheo!.filter((n) => n.id === f.nhom[cap] || !f.nhom.includes(n.id))
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nhan}
                      </option>
                    ))}
                </select>
              </div>
            ),
          )
        : null}
      <div className="flex gap-2">
        <Nut type="submit" kieu="chinh">
          Xem báo cáo
        </Nut>
        <Nut type="button" onClick={() => void excel()} disabled={dangTai}>
          {dangTai ? 'Đang tạo tệp…' : '⬇ Xuất Excel'}
        </Nut>
      </div>
      {loi && (
        <div className="basis-full">
          <ThongBao kieu="loi">{loi}</ThongBao>
        </div>
      )}
    </form>
  )
}

function KetQua({ ma, ts }: { ma: string; ts: ThamSoUrl }) {
  const { data: kq } = useSuspenseQuery(truyVanBaoCao(ma, ts))
  return <BangBaoCao kq={kq} />
}

const dinhDang = (c: CotBaoCao, v: string | number | null): string => {
  if (v === null || v === '') return ''
  if (c.kieu === 'ngay' && typeof v === 'string') return ngayVn(v)
  if (c.kieu === 'phan-tram' && typeof v === 'number') return `${v.toLocaleString('vi-VN')}%`
  return typeof v === 'number' ? v.toLocaleString('vi-VN') : v
}

const MAU_DONG = { danger: 'text-danger', warn: 'text-warn', ok: 'text-ok' } as const
const NEN_NHOM = ['bg-tint-brand', 'bg-nen-2', 'bg-nen-2'] as const

/** Bảng báo cáo chung: tiêu đề hai tầng, dòng tổng, dòng nhóm, gim cột STT và cột tên khi cuộn ngang. */
export function BangBaoCao({ kq }: { kq: KetQuaBaoCao }) {
  const di = useNavigate()
  const haiTang = !!kq.nhomCot?.length
  const trongNhom = new Set(
    (kq.nhomCot ?? []).flatMap((g) => Array.from({ length: g.so }, (_, k) => g.tu + k)),
  )
  const chiTiet = kq.dong.filter((d) => d.cap === 0)
  const la = (c: CotBaoCao) => c.kieu === 'so' && !c.khongCong
  const tong = kq.cot.map((c, i) =>
    i === 0
      ? `TỔNG SỐ (${chiTiet.length})`
      : la(c)
        ? chiTiet.reduce((t, d) => t + (Number(d.o[i]) || 0), 0)
        : null,
  )
  const th = 'border border-line bg-brand px-2 py-1.5 text-[11.5px] font-semibold text-white'
  const td = 'border border-line-2 px-2 py-1.5 align-top'
  const gim = (i: number) => (i === 0 ? 'sticky left-10 z-[1] min-w-[240px]' : '')
  let stt = 0

  return (
    <>
      <div className="mb-2 text-center">
        <div className="text-[15px] font-bold uppercase">{kq.tieuDe}</div>
        <div className="text-[12px] text-faint italic">{kq.phuDe}</div>
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-[10px] border border-line bg-nen">
        <table aria-label={kq.tieuDe} className="w-full border-collapse text-left text-[12.5px]">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th rowSpan={haiTang ? 2 : 1} className={`${th} sticky left-0 z-[1] w-10 text-center`}>
                STT
              </th>
              {kq.cot.map((c, i) => {
                const g = kq.nhomCot?.find((x) => x.tu === i)
                if (g)
                  return (
                    <th key={i} colSpan={g.so} className={`${th} text-center`}>
                      {g.nhan}
                    </th>
                  )
                if (trongNhom.has(i)) return null
                return (
                  <th
                    key={i}
                    rowSpan={haiTang ? 2 : 1}
                    className={`${th} ${gim(i)} ${c.kieu && c.kieu !== 'chu' ? 'text-right' : ''}`}
                  >
                    {c.nhan}
                  </th>
                )
              })}
            </tr>
            {haiTang && (
              <tr>
                {kq.cot.map((c, i) =>
                  trongNhom.has(i) ? (
                    <th key={i} className={`${th} text-right`}>
                      {c.nhan}
                    </th>
                  ) : null,
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {kq.coTong && (
              <tr className="bg-tint-brand font-bold">
                <td className={`${td} sticky left-0 bg-tint-brand`} />
                {kq.cot.map((c, i) => (
                  <td
                    key={i}
                    className={`${td} ${gim(i)} ${i === 0 ? 'bg-tint-brand' : ''} ${c.kieu && c.kieu !== 'chu' ? 'text-right tabular-nums' : ''}`}
                  >
                    {dinhDang(c, tong[i] ?? null)}
                  </td>
                ))}
              </tr>
            )}
            {kq.dong.map((d, k) => {
              const nhom = d.cap > 0
              const nen = nhom ? NEN_NHOM[Math.min(d.cap - 1, 2)] : 'bg-nen'
              return (
                <tr
                  key={k}
                  onClick={d.lienKet ? () => void di({ href: d.lienKet }) : undefined}
                  className={`${nhom ? `${nen} font-semibold text-brand` : ''} ${d.lienKet ? 'cursor-pointer hover:bg-nav-hover' : ''} ${d.mau ? MAU_DONG[d.mau] : ''}`}
                >
                  <td className={`${td} sticky left-0 text-center tabular-nums ${nen}`}>
                    {nhom ? '' : ++stt}
                  </td>
                  {kq.cot.map((c, i) => (
                    <td
                      key={i}
                      style={i === 0 && nhom ? { paddingLeft: 8 + (d.cap - 1) * 16 } : undefined}
                      className={`${td} ${gim(i)} ${i === 0 ? nen : ''} ${c.kieu && c.kieu !== 'chu' ? 'text-right whitespace-nowrap tabular-nums' : c.rong && c.rong <= 14 ? 'whitespace-nowrap' : ''}`}
                    >
                      {dinhDang(c, d.o[i] ?? null)}
                    </td>
                  ))}
                </tr>
              )
            })}
            {kq.dong.length === 0 && (
              <tr>
                <td colSpan={kq.cot.length + 1} className={`${td} text-center text-faint`}>
                  Không có dữ liệu trong phạm vi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {kq.ghiChu && <p className="mt-2 text-[12px] text-faint italic">{kq.ghiChu}</p>}
    </>
  )
}

/** Thẻ một báo cáo trong danh sách — dùng ở Báo cáo điều hành và ở module chủ. */
export function TheBaoCao({ muc, nghiepVu }: { muc: BaoCaoDef; nghiepVu?: string }) {
  return (
    <Link
      to="/bao-cao/$ma"
      params={{ ma: muc.id }}
      search={{}}
      className="block rounded-[10px] border border-line bg-nen px-4 py-3 hover:border-brand"
    >
      <div className="flex items-center gap-2">
        <b className="text-[13.5px] text-ink">{muc.ten}</b>
        {muc.loai === 'xuat' && <span className="text-[11px] text-faint">· xuất dữ liệu</span>}
      </div>
      <div className="mt-0.5 text-[12px] text-faint">
        {nghiepVu ? `${nghiepVu} · ` : ''}
        {muc.mo}
      </div>
    </Link>
  )
}
