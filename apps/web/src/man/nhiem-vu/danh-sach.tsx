/**
 * Tác nghiệp › Nhiệm vụ — cây việc nhiều cấp của FOXAI Native (`/tasks`), như màn "Quản lý
 * nhiệm vụ" ở GDOS cũ: lọc theo phạm vi / vai / thời gian, thẻ số liệu bấm để lọc,
 * ngăn chi tiết có dòng thời gian, giao việc, AI phân rã việc con, chuông thông báo.
 *
 * Ba chức năng trên cây là BA PHẠM VI của cùng một màn: việc được giao cho tôi, việc tôi đã
 * giao, theo dõi chung. Dữ liệu là của Native — GDOS gọi qua cổng chuyển tiếp bằng tài khoản
 * Native của chính người dùng (ADR-0009). Danh sách là CÂY phân trang phía Native nên dùng
 * ô lọc riêng, không dùng lưới chuẩn (lưới chuẩn lọc tại chỗ trên dữ liệu phẳng).
 */
import { keepPreviousData, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NHIEM_VU,
  LOC_TRANG_THAI,
  NHAN_TRANG_THAI,
  NHAN_VAI_TRO,
  SAC_THAI,
  SO_NGAY_SAP_HAN,
  VAI_TRO,
  danhDauDaDoc,
  demViecCon,
  doiTrangThaiNV,
  ngayGio,
  phanTram,
  timNut,
  tomTatHoatDong,
  trangThaiHien,
  truyVanCayNV,
  truyVanDonViDanhBa,
  truyVanNutNV,
  truyVanThongBaoNV,
  truyVanTongQuanNV,
  xoaNhiemVu,
  ymd,
  type LocTrangThai,
  type LocVaiTro,
  type NutNhiemVu,
  type TongQuanNV,
  type VaiTroThamGia,
} from '@/lib/nhiem-vu'
import { truyVanToi } from '@/lib/phien'
import { Nut, ThongBao } from '@/ui/co-ban'
import { NutNoiLen } from '@/ui/noi-len'
import { BieuTuong, useSanSangNative, type TenBieuTuong } from '../van-ban/chung'
import { FormNhiemVu, PhanRaAi, type CheDoForm } from './bieu-mau'
import { ChiTietNhiemVu, type ThaoTacNV } from './chi-tiet'
import { AnhDaiDien, HanXuLy, LOP_KHUNG, MenuTrangThai } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const MOI_TRANG = 20
const LOP_CHON =
  'rounded-lg border border-line bg-nen-2 px-3 py-[7px] text-[13px] text-ink outline-none focus:border-brand'

type PhamVi = 'cua-toi' | 'da-giao' | 'chung'
const CHUC_NANG: Record<PhamVi, string> = {
  'cua-toi': 'nv-cua-toi',
  'da-giao': 'nv-da-giao',
  chung: 'nv-theo-doi',
}
const MO_TA: Record<PhamVi, string> = {
  'cua-toi': 'Việc bạn được giao chủ trì, phối hợp hoặc xem để biết.',
  'da-giao': 'Việc do bạn giao — theo dõi tiến độ, đôn đốc, phân rã việc con.',
  chung: 'Toàn bộ nhiệm vụ bạn được xem trên FOXAI Native — giám sát tiến độ theo đơn vị chủ trì.',
}

export const ViecCuaToi = () => <ManNhiemVu phamVi="cua-toi" />
export const ViecDaGiao = () => <ManNhiemVu phamVi="da-giao" />
export const TheoDoiChung = () => <ManNhiemVu phamVi="chung" />

const dauNam = () => new Date(new Date().getFullYear(), 0, 1)
const KHOANG_NHANH: { nhan: string; tu: () => Date }[] = [
  { nhan: 'Tháng này', tu: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
  {
    nhan: 'Quý này',
    tu: () => {
      const n = new Date()
      return new Date(n.getFullYear(), n.getMonth() - (n.getMonth() % 3), 1)
    },
  },
  { nhan: 'Năm nay', tu: dauNam },
]

function ManNhiemVu({ phamVi }: { phamVi: PhamVi }) {
  const qc = useQueryClient()
  const di = useNavigate()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { san, canhBao } = useSanSangNative()
  // Ngăn chi tiết gắn với URL (?ma=) để thông báo và đường dẫn chia sẻ mở thẳng đúng việc.
  const tvUrl: { ma?: string } = useSearch({ strict: false })
  const moId = tvUrl.ma ?? null
  const datMoId = (id: string | null) =>
    void di({
      to: '/$chucNang',
      params: { chucNang: CHUC_NANG[phamVi] },
      search: id ? { ma: id } : {},
      replace: true,
    })

  const coGiao = ['NHIEM_VU.ASSIGN', 'NHIEM_VU.CREATE'].some((q) => toi.quyen.includes(q))
  const [vaiTroCon, datVaiTroCon] = useState<VaiTroThamGia | ''>('')
  const [tuNgay, datTuNgay] = useState(() => ymd(dauNam()))
  const [denNgay, datDenNgay] = useState(() => ymd(new Date()))
  const [nhapTim, datNhapTim] = useState('')
  const [tuKhoa, datTuKhoa] = useState('')
  const [trangThai, datTrangThai] = useState<LocTrangThai | ''>('')
  const [maDonVi, datMaDonVi] = useState('')
  const [trang, datTrang] = useState(1)
  const [moThongKe, datMoThongKe] = useState(phamVi === 'chung')
  const [form, datForm] = useState<CheDoForm>()
  const [chaPhanRa, datChaPhanRa] = useState<NutNhiemVu>()
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()

  useEffect(() => {
    const t = setTimeout(() => {
      datTuKhoa(nhapTim.trim())
      datTrang(1)
    }, 300)
    return () => clearTimeout(t)
  }, [nhapTim])
  /** Đổi bộ lọc thì về trang 1. */
  const loc =
    <T,>(dat: (v: T) => void) =>
    (v: T) => {
      dat(v)
      datTrang(1)
    }

  const role: LocVaiTro | undefined =
    phamVi === 'da-giao' ? 'GIAO_VIEC' : phamVi === 'cua-toi' ? vaiTroCon || 'THAM_GIA' : undefined
  const locGoc = { date_from: tuNgay || undefined, date_to: denNgay || undefined, role }
  const tongQuan = useQuery({ ...truyVanTongQuanNV(locGoc), enabled: san })
  const cay = useQuery({
    ...truyVanCayNV({
      ...locGoc,
      page: trang,
      page_size: MOI_TRANG,
      search: tuKhoa || undefined,
      task_status: trangThai || undefined,
      lead_org_id: maDonVi || undefined,
    }),
    enabled: san,
    placeholderData: keepPreviousData,
  })
  const qDonVi = useQuery({ ...truyVanDonViDanhBa, enabled: san })
  const donVi = qDonVi.data ?? []

  const ds = cay.data?.data ?? []
  const thay = moId ? timNut(ds, moId) : null
  // Việc mở từ thông báo có thể không nằm trong trang / bộ lọc hiện tại — tải riêng nó.
  const nutRieng = useQuery({
    ...truyVanNutNV(moId ?? ''),
    enabled: san && moId !== null && !cay.isPending && thay === null,
  })
  const dangMo = thay ?? (nutRieng.data ? { nut: nutRieng.data, cha: null } : null)

  const lam = (viec: () => Promise<unknown>, cau: string) => {
    datTb(undefined)
    viec()
      .then(async () => {
        datTb({ ok: true, cau })
        await qc.invalidateQueries({ queryKey: KHOA_NHIEM_VU })
      })
      .catch((e: unknown) => datTb({ ok: false, cau: loiCua(e, 'Không thực hiện được.') }))
  }

  const tt: ThaoTacNV = {
    mo: (n) => datMoId(n.id),
    themCon: (cha) => datForm({ kind: 'con', cha }),
    phanRa: datChaPhanRa,
    sua: (n) => datForm({ kind: 'sua', nut: n }),
    xoa: (n) => {
      const soCon = demViecCon(n)
      if (
        !confirm(
          soCon > 0
            ? `Xóa “${n.title}” cùng ${soCon} nhiệm vụ con? Thao tác không hoàn tác được.`
            : `Xóa “${n.title}”? Thao tác không hoàn tác được.`,
        )
      )
        return
      if (moId === n.id) datMoId(null)
      lam(() => xoaNhiemVu(n.id), 'Đã xóa nhiệm vụ.')
    },
    doiTrangThai: (n, s) => lam(() => doiTrangThaiNV(n.id, s), `Đã chuyển sang “${NHAN_TRANG_THAI[s]}”.`),
  }

  const coLoc = !!(tuKhoa || trangThai || maDonVi || vaiTroCon)
  const xoaLoc = () => {
    datNhapTim('')
    datTrangThai('')
    datMaDonVi('')
    datVaiTroCon('')
    datTrang(1)
  }
  const canLam = ds.filter((n) => n.status !== 'HOAN_THANH')
  const daXong = ds.filter((n) => n.status === 'HOAN_THANH')

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="m-0 min-w-0 flex-1 text-[13px] text-faint">{MO_TA[phamVi]}</p>
        {san && <ChuongThongBao moViec={datMoId} />}
        {san && coGiao && (
          <Nut kieu="chinh" onClick={() => datForm({ kind: 'tao' })}>
            <BieuTuong ten="cong" co={16} /> Giao nhiệm vụ mới
          </Nut>
        )}
      </div>
      {canhBao}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <div className={`${LOP_KHUNG} mb-4 flex flex-wrap items-center gap-2.5 px-4 py-3`}>
        {phamVi === 'cua-toi' && (
          <select
            aria-label="Vai trò của tôi"
            value={vaiTroCon}
            onChange={(e) => loc(datVaiTroCon)(e.target.value as VaiTroThamGia | '')}
            className={LOP_CHON}
          >
            <option value="">Mọi vai trò của tôi</option>
            {VAI_TRO.map((r) => (
              <option key={r} value={r}>
                {NHAN_VAI_TRO[r]}
              </option>
            ))}
          </select>
        )}
        <span className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="text-[12px] text-faint">Thời gian giao</span>
          <input
            type="date"
            aria-label="Từ ngày"
            value={tuNgay}
            max={denNgay || undefined}
            onChange={(e) => loc(datTuNgay)(e.target.value)}
            className={LOP_CHON}
          />
          <span aria-hidden="true" className="text-faint">
            →
          </span>
          <input
            type="date"
            aria-label="Đến ngày"
            value={denNgay}
            min={tuNgay || undefined}
            onChange={(e) => loc(datDenNgay)(e.target.value)}
            className={LOP_CHON}
          />
          {KHOANG_NHANH.map((k) => (
            <button
              key={k.nhan}
              type="button"
              onClick={() => {
                datTuNgay(ymd(k.tu()))
                datDenNgay(ymd(new Date()))
                datTrang(1)
              }}
              className="rounded-md px-2 py-1 text-[12px] font-semibold text-brand hover:bg-tint-brand"
            >
              {k.nhan}
            </button>
          ))}
        </span>
      </div>

      <DaiKpi d={tongQuan.data} loi={!!tongQuan.error} dangLoc={trangThai} chon={loc(datTrangThai)} />
      <ThongKe d={tongQuan.data} mo={moThongKe} doiMo={() => datMoThongKe((v) => !v)} />

      <div className={`${LOP_KHUNG} mt-4 mb-3 flex flex-wrap items-center gap-2.5 px-4 py-3`}>
        <b className="text-[13.5px] text-ink">Danh sách nhiệm vụ</b>
        {cay.data && (
          <span className="rounded-md bg-tint-brand px-2 py-0.5 text-[12px] font-semibold text-brand">
            {cay.data.total.toLocaleString('vi-VN')} nhiệm vụ chính
          </span>
        )}
        <input
          type="search"
          aria-label="Tìm theo nội dung, văn bản, người thực hiện"
          placeholder="Tìm theo nội dung, văn bản, người thực hiện…"
          value={nhapTim}
          onChange={(e) => datNhapTim(e.target.value)}
          className={`${LOP_CHON} min-w-[220px] flex-1`}
        />
        <select
          aria-label="Lọc trạng thái"
          value={trangThai}
          onChange={(e) => loc(datTrangThai)(e.target.value as LocTrangThai | '')}
          className={LOP_CHON}
        >
          <option value="">Tất cả trạng thái</option>
          {LOC_TRANG_THAI.map((s) => (
            <option key={s} value={s}>
              {NHAN_TRANG_THAI[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc đơn vị chủ trì"
          value={maDonVi}
          onChange={(e) => loc(datMaDonVi)(e.target.value)}
          className={`${LOP_CHON} max-w-[240px]`}
        >
          <option value="">Tất cả đơn vị chủ trì</option>
          {donVi.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {coLoc && <Nut onClick={xoaLoc}>Xóa lọc</Nut>}
      </div>

      {!san ? null : cay.error ? (
        <ThongBao kieu="loi">{loiCua(cay.error, 'Không tải được danh sách nhiệm vụ.')}</ThongBao>
      ) : cay.isPending ? (
        <p className={`${LOP_KHUNG} m-0 p-6 text-center text-[13px] text-faint`}>Đang tải nhiệm vụ…</p>
      ) : ds.length === 0 ? (
        <div className={`${LOP_KHUNG} px-6 py-12 text-center`}>
          <p className="m-0 text-[14px] font-bold text-ink">
            {coLoc
              ? 'Không có nhiệm vụ khớp bộ lọc'
              : phamVi === 'cua-toi'
                ? 'Bạn chưa có nhiệm vụ nào'
                : 'Chưa có nhiệm vụ nào'}
          </p>
          <p className="mx-auto mt-1 mb-0 max-w-sm text-[12.5px] text-faint">
            {coLoc
              ? 'Thử nới khoảng thời gian hoặc xóa bộ lọc.'
              : phamVi === 'cua-toi'
                ? 'Nhiệm vụ bạn được giao chủ trì, phối hợp hoặc xem để biết sẽ hiện ở đây.'
                : 'Bấm “Giao nhiệm vụ mới” để phân công việc đầu tiên.'}
          </p>
        </div>
      ) : (
        <>
          <div className={`${LOP_KHUNG} overflow-hidden`}>
            <div
              aria-hidden="true"
              className={`hidden gap-4 border-b border-line bg-nen-2 px-4 py-2 text-[11px] font-bold tracking-[.06em] text-faint uppercase xl:grid ${LUOI}`}
            >
              <span>Nhiệm vụ</span>
              <span>Hạn xử lý</span>
              <span>Chủ trì · người thực hiện</span>
              <span>Trạng thái</span>
              <span />
            </div>
            {canLam.length > 0 && <Nhom nhan="Cần làm" ds={canLam} tt={tt} coGiao={coGiao} />}
            {daXong.length > 0 && (
              <Nhom nhan="Đã hoàn thành" ds={daXong} tt={tt} coGiao={coGiao} moSan={canLam.length === 0} />
            )}
          </div>
          {cay.data.total_pages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-[13px] text-body">
              <Nut disabled={trang <= 1} onClick={() => datTrang((t) => t - 1)}>
                ‹ Trước
              </Nut>
              <span className="tabular-nums">
                Trang {trang}/{cay.data.total_pages}
              </span>
              <Nut disabled={trang >= cay.data.total_pages} onClick={() => datTrang((t) => t + 1)}>
                Sau ›
              </Nut>
            </div>
          )}
        </>
      )}

      {moId && (
        <ChiTietNhiemVu
          nut={dangMo?.nut ?? null}
          tieuDeCha={dangMo?.cha?.title ?? null}
          coGiao={coGiao}
          dangTai={cay.isPending || nutRieng.isFetching}
          dong={() => datMoId(null)}
          tt={tt}
        />
      )}
      {form && (
        <FormNhiemVu
          cheDo={form}
          donVi={donVi}
          dong={() => datForm(undefined)}
          xong={(cau) => {
            datForm(undefined)
            datTb({ ok: true, cau })
          }}
        />
      )}
      {chaPhanRa && (
        <PhanRaAi
          cha={chaPhanRa}
          donVi={donVi}
          dong={() => datChaPhanRa(undefined)}
          xong={(cau) => {
            datChaPhanRa(undefined)
            datTb({ ok: true, cau })
          }}
        />
      )}
    </>
  )
}

/* ── Thẻ số liệu — mỗi thẻ đồng thời là nút lọc theo trạng thái ───────────── */

const KPI: { loc: LocTrangThai | ''; so: (d: TongQuanNV) => number; bieuTuong: TenBieuTuong }[] = [
  { loc: '', so: (d) => d.total, bieuTuong: 'viec' },
  { loc: 'MOI_PHAN_CONG', so: (d) => d.moi_phan_cong, bieuTuong: 'van' },
  { loc: 'DANG_THUC_HIEN', so: (d) => d.dang_thuc_hien, bieuTuong: 'moi' },
  { loc: 'SAP_DEN_HAN', so: (d) => d.sap_den_han, bieuTuong: 'cho' },
  { loc: 'QUA_HAN', so: (d) => d.qua_han, bieuTuong: 'cho' },
  { loc: 'HOAN_THANH', so: (d) => d.hoan_thanh, bieuTuong: 'xong' },
]

function DaiKpi({
  d,
  loi,
  dangLoc,
  chon,
}: {
  d: TongQuanNV | undefined
  loi: boolean
  dangLoc: LocTrangThai | ''
  chon: (v: LocTrangThai | '') => void
}) {
  if (loi) return <ThongBao kieu="loi">Không tải được số liệu thống kê nhiệm vụ.</ThongBao>
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-6">
      {KPI.map((k) => {
        const dangChon = k.loc === dangLoc
        const so = d ? k.so(d) : null
        const canhBao = (k.loc === 'QUA_HAN' || k.loc === 'SAP_DEN_HAN') && !!so
        const goiY = !d
          ? ''
          : k.loc === ''
            ? 'Gồm cả nhiệm vụ con'
            : k.loc === 'SAP_DEN_HAN'
              ? `Hạn trong ${SO_NGAY_SAP_HAN} ngày tới`
              : `${phanTram(so ?? 0, d.total)}% tổng`
        return (
          <li key={k.loc || 'tong'}>
            <button
              type="button"
              aria-pressed={dangChon}
              title="Bấm để lọc danh sách, bấm lại để bỏ lọc"
              onClick={() => chon(dangChon ? '' : k.loc)}
              className={`${LOP_KHUNG} flex w-full items-center gap-3 px-4 py-3 text-left hover:border-brand ${dangChon ? 'border-brand shadow-[0_0_0_3px_var(--tint-brand)]' : ''}`}
            >
              <span
                className={`grid size-9 flex-none place-items-center rounded-lg ${k.loc ? SAC_THAI[k.loc].nhan : 'bg-tint-brand text-brand'}`}
              >
                <BieuTuong ten={k.bieuTuong} co={17} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-body">
                  {k.loc ? NHAN_TRANG_THAI[k.loc] : 'Tổng nhiệm vụ'}
                </span>
                <span
                  className={`block text-[20px] leading-tight font-extrabold tabular-nums ${canhBao && k.loc ? SAC_THAI[k.loc].nhan.split(' ')[1] : 'text-ink'}`}
                >
                  {so === null ? '—' : so.toLocaleString('vi-VN')}
                </span>
                <span className="block truncate text-[11px] text-faint">{goiY}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** Bốn nhóm không chồng nhau nên cộng lại đúng bằng tổng — vẽ được thành một thanh. */
const DOAN = [
  { khoa: 'moi_phan_cong', tt: 'MOI_PHAN_CONG' },
  { khoa: 'dang_thuc_hien', tt: 'DANG_THUC_HIEN' },
  { khoa: 'qua_han', tt: 'QUA_HAN' },
  { khoa: 'hoan_thanh', tt: 'HOAN_THANH' },
] as const

function ThongKe({ d, mo, doiMo }: { d: TongQuanNV | undefined; mo: boolean; doiMo: () => void }) {
  const tong = d?.total ?? 0
  const dong = d?.by_org ?? []
  return (
    <section className={`${LOP_KHUNG} mt-4`}>
      <button
        type="button"
        aria-expanded={mo}
        onClick={doiMo}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold text-ink">Thống kê tiến độ</span>
          <span className="block text-[12px] text-faint">
            Tỷ lệ trạng thái và phân bổ theo đơn vị chủ trì
          </span>
        </span>
        <span aria-hidden="true" className="text-faint">
          {mo ? '▾' : '▸'}
        </span>
      </button>
      {mo && (
        <div className="grid gap-6 border-t border-line p-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h3 className="m-0 mb-3 text-[11px] font-bold tracking-[.06em] text-faint uppercase">
              Tỷ lệ trạng thái
            </h3>
            <div
              role="img"
              aria-label="Thanh tỷ lệ trạng thái nhiệm vụ"
              className="flex h-3 overflow-hidden rounded-full bg-line-2"
            >
              {d &&
                tong > 0 &&
                DOAN.map((s) =>
                  d[s.khoa] > 0 ? (
                    <div
                      key={s.khoa}
                      className={SAC_THAI[s.tt].cham}
                      style={{ width: `${(d[s.khoa] / tong) * 100}%` }}
                    />
                  ) : null,
                )}
            </div>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0">
              {DOAN.map((s) => (
                <li key={s.khoa} className="flex items-center gap-2 text-[12.5px]">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 flex-none rounded-full ${SAC_THAI[s.tt].cham}`}
                  />
                  <span className="flex-1 text-body">{NHAN_TRANG_THAI[s.tt]}</span>
                  <b className="text-ink tabular-nums">{d?.[s.khoa] ?? 0}</b>
                  <span className="w-10 text-right text-faint tabular-nums">
                    {phanTram(d?.[s.khoa] ?? 0, tong)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <h3 className="m-0 mb-3 text-[11px] font-bold tracking-[.06em] text-faint uppercase">
              Theo đơn vị chủ trì
            </h3>
            {dong.length === 0 ? (
              <p className="m-0 py-6 text-center text-[12.5px] text-faint">
                Chưa có nhiệm vụ trong phạm vi này
              </p>
            ) : (
              <ul className="m-0 grid max-h-52 list-none gap-2.5 overflow-y-auto p-0 pr-1">
                {dong.map((r) => (
                  <li
                    key={r.org_name}
                    className="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-3 text-[12.5px]"
                  >
                    <span className="truncate font-semibold text-ink" title={r.org_name}>
                      {r.org_name}
                    </span>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-line-2">
                      {DOAN.map((s) =>
                        r[s.khoa] > 0 ? (
                          <div
                            key={s.khoa}
                            className={SAC_THAI[s.tt].cham}
                            style={{ width: `${(r[s.khoa] / r.total) * 100}%` }}
                            title={`${NHAN_TRANG_THAI[s.tt]}: ${r[s.khoa]}`}
                          />
                        ) : null,
                      )}
                    </div>
                    <b className="text-right text-ink tabular-nums">{r.total}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ── Cây nhiệm vụ ─────────────────────────────────────────────────────────── */

const LUOI = 'xl:grid-cols-[minmax(0,1fr)_8.5rem_13rem_10.5rem_2.5rem]'

function Nhom({
  nhan,
  ds,
  tt,
  coGiao,
  moSan = true,
}: {
  nhan: string
  ds: NutNhiemVu[]
  tt: ThaoTacNV
  coGiao: boolean
  moSan?: boolean
}) {
  const [mo, datMo] = useState(moSan)
  return (
    <section>
      <button
        type="button"
        aria-expanded={mo}
        onClick={() => datMo((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-line-2 px-4 py-2.5 text-left text-[13.5px] font-bold text-ink hover:bg-nav-hover"
      >
        <span aria-hidden="true" className="w-3 text-faint">
          {mo ? '▾' : '▸'}
        </span>
        {nhan}
        <span className="rounded-md bg-line-2 px-1.5 text-[12px] font-semibold text-body tabular-nums">
          {ds.length}
        </span>
      </button>
      {mo && (
        <ul className="m-0 list-none p-0">
          {ds.map((n) => (
            <Dong key={n.id} nut={n} cap={0} tt={tt} coGiao={coGiao} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Dong({ nut, cap, tt, coGiao }: { nut: NutNhiemVu; cap: number; tt: ThaoTacNV; coGiao: boolean }) {
  // Việc đã xong thì thu gọn sẵn — việc con của nó không còn cần theo dõi.
  const [moCon, datMoCon] = useState(nut.status !== 'HOAN_THANH')
  const coCon = nut.children.length > 0
  const xong = nut.status === 'HOAN_THANH'
  const hien = nut.participants.slice(0, 3)
  const an = nut.participants.length - hien.length

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Xem chi tiết: ${nut.title}`}
        onClick={() => tt.mo(nut)}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            tt.mo(nut)
          }
        }}
        className={`grid cursor-pointer grid-cols-1 gap-2 border-b border-line-2 px-4 py-3 hover:bg-nav-hover xl:items-center xl:gap-4 ${LUOI} ${cap ? 'bg-nen-2' : ''}`}
      >
        <div className="flex min-w-0 gap-2" style={{ paddingLeft: `${cap * 1.5}rem` }}>
          {coCon ? (
            <button
              type="button"
              aria-expanded={moCon}
              aria-label={moCon ? 'Thu gọn nhiệm vụ con' : 'Mở nhiệm vụ con'}
              onClick={(e) => {
                e.stopPropagation()
                datMoCon((v) => !v)
              }}
              className="mt-0.5 grid size-5 flex-none place-items-center self-start rounded text-[11px] text-faint hover:bg-line-2"
            >
              {moCon ? '▾' : '▸'}
            </button>
          ) : (
            <span aria-hidden="true" className="mt-0.5 grid size-5 flex-none place-items-center self-start">
              {xong ? (
                <span className="text-ok">
                  <BieuTuong ten="tich" co={14} />
                </span>
              ) : (
                <span className={`size-2 rounded-full ${SAC_THAI[trangThaiHien(nut)].cham}`} />
              )}
            </span>
          )}
          <div className="min-w-0">
            <p
              className={`m-0 line-clamp-2 text-[13.5px] leading-snug ${cap === 0 ? 'font-bold text-ink' : xong ? 'text-faint line-through' : 'text-ink'}`}
            >
              {nut.title}
            </p>
            {(nut.description || nut.attachment_filename) && (
              <p className="m-0 mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-faint">
                {nut.attachment_filename && <BieuTuong ten="kep" co={12} />}
                {nut.description && <span className="truncate">{nut.description}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Dưới xl: các ô phụ gom thành một hàng dưới tiêu đề; từ xl `contents` trả chúng về lưới bảng. */}
        <div
          className="flex flex-wrap items-start gap-x-6 gap-y-2 xl:contents"
          style={{ paddingLeft: `calc(${cap * 1.5}rem + 1.75rem)` }}
        >
          <HanXuLy nut={nut} />
          <div className="min-w-0">
            <span
              className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-[12px] ${nut.lead_org_name ? 'bg-tint-brand text-brand' : 'bg-line-2 text-faint'}`}
            >
              <BieuTuong ten="nhom" co={12} />
              <span className="truncate">{nut.lead_org_name ?? 'Chưa có đơn vị'}</span>
            </span>
            <div className="mt-1.5 flex -space-x-1">
              {hien.map((p) => (
                <AnhDaiDien key={p.user_id} ten={p.user_name} />
              ))}
              {an > 0 && (
                <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-nen bg-line-2 text-[10px] font-bold text-body">
                  +{an}
                </span>
              )}
            </div>
          </div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- chỉ chặn nổi bọt để bấm ô này không mở chi tiết */}
          <div className="grid gap-1.5" onClick={(e) => e.stopPropagation()}>
            <MenuTrangThai nut={nut} doi={tt.doiTrangThai} />
            {nut.child_total === 0 && nut.progress > 0 && !xong && (
              <ThanhTienDo nhan={`${nut.progress}%`} phanTram={nut.progress} mau="bg-brand" />
            )}
            {nut.child_total > 0 && (
              <ThanhTienDo
                nhan={`${nut.child_done}/${nut.child_total} việc con`}
                phanTram={phanTram(nut.child_done, nut.child_total)}
                mau="bg-ok"
              />
            )}
          </div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- như trên */}
          <div className="ml-auto flex justify-end xl:ml-0" onClick={(e) => e.stopPropagation()}>
            {coGiao && (
              <NutNoiLen
                tieuDe="Thao tác"
                canPhai
                className="grid size-8 place-items-center rounded-md text-[16px] text-faint hover:bg-line-2 hover:text-ink"
                nhan="⋮"
              >
                {(dong) => (
                  <ul className="m-0 min-w-[190px] list-none p-0">
                    {(
                      [
                        ['ai', 'AI phân rã', () => tt.phanRa(nut)],
                        ['cong', 'Giao nhiệm vụ con', () => tt.themCon(nut)],
                        ['sua', 'Sửa', () => tt.sua(nut)],
                        ['xoa', 'Xóa', () => tt.xoa(nut)],
                      ] as const
                    ).map(([bt, nhan, chay]) => (
                      <li key={nhan}>
                        <button
                          type="button"
                          onClick={() => {
                            dong()
                            chay()
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-nav-hover ${bt === 'xoa' ? 'text-danger' : ''}`}
                        >
                          <BieuTuong ten={bt} co={15} /> {nhan}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </NutNoiLen>
            )}
          </div>
        </div>
      </div>

      {coCon && moCon && (
        <ul className="m-0 list-none p-0">
          {nut.children.map((c) => (
            <Dong key={c.id} nut={c} cap={cap + 1} tt={tt} coGiao={coGiao} />
          ))}
        </ul>
      )}
    </li>
  )
}

const ThanhTienDo = ({ nhan, phanTram: pt, mau }: { nhan: string; phanTram: number; mau: string }) => (
  <div className="w-24">
    <p className="m-0 text-[11px] text-faint tabular-nums">{nhan}</p>
    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-line-2">
      <div className={`h-full rounded-full ${mau}`} style={{ width: `${pt}%` }} />
    </div>
  </div>
)

/* ── Chuông thông báo ─────────────────────────────────────────────────────── */

function ChuongThongBao({ moViec }: { moViec: (id: string) => void }) {
  const qc = useQueryClient()
  const q = useQuery(truyVanThongBaoNV)
  const chuaDoc = q.data?.unread_count ?? 0
  // Đánh dấu đã đọc khi bấm vào một thông báo — còn đang xem thì vẫn thấy dòng nào mới.
  const daDoc = () =>
    chuaDoc > 0 &&
    void danhDauDaDoc()
      .then(() => qc.invalidateQueries({ queryKey: truyVanThongBaoNV.queryKey }))
      .catch(() => undefined)

  return (
    <NutNoiLen
      tieuDe={`Thông báo nhiệm vụ (${chuaDoc} chưa đọc)`}
      canPhai
      className="relative grid size-9 place-items-center rounded-lg border border-line bg-nen text-body hover:border-brand hover:text-brand"
      nhan={
        <>
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {chuaDoc > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] leading-[18px] font-bold text-nen">
              {chuaDoc > 99 ? '99+' : chuaDoc}
            </span>
          )}
        </>
      }
    >
      {(dong) => (
        <div className="w-[22rem] max-w-[calc(100vw-2rem)]">
          <p className="m-0 border-b border-line px-2 pb-2 text-[13.5px] font-bold text-ink">
            Thông báo nhiệm vụ
          </p>
          {q.isPending ? (
            <p className="m-0 p-4 text-[13px] text-faint">Đang tải…</p>
          ) : q.error ? (
            <p className="m-0 p-4 text-[13px] text-danger">Không tải được thông báo</p>
          ) : q.data.items.length === 0 ? (
            <p className="m-0 p-5 text-center text-[12.5px] text-faint">
              Chưa có thông báo nào. Cập nhật trên việc bạn tham gia hoặc bạn giao sẽ hiện ở đây.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-line-2 p-0">
              {q.data.items.map((n) => {
                const nguoi = n.actor_name ?? 'Hệ thống'
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        dong()
                        daDoc()
                        moViec(n.task_id)
                      }}
                      className={`flex w-full gap-2.5 rounded-md px-2 py-2.5 text-left hover:bg-nav-hover ${n.unread ? 'bg-tint-brand' : ''}`}
                    >
                      <AnhDaiDien ten={nguoi} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-body">
                          <b className="font-semibold text-ink">{nguoi}</b> {tomTatHoatDong(n)}
                        </span>
                        <span className="block truncate text-[12px] text-ink">{n.task_title}</span>
                        <span className="block text-[11px] text-faint tabular-nums">
                          {ngayGio(n.created_at)}
                        </span>
                      </span>
                      {n.unread && (
                        <span aria-hidden="true" className="mt-2 size-2 flex-none rounded-full bg-brand" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </NutNoiLen>
  )
}
