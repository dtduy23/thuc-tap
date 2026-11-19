import {
  BAO_CAO_BENH_VIEN,
  DANH_SACH_MODULE,
  MA_CONG_SUAT_GIUONG,
  NHAN_CHE_DO_SO_LIEU,
  baoCaoCua,
  dongChiTieuBenhVien,
  kyHien,
  kyHienTai,
  type BangDieuHanhBenhVien,
  type NguonBenhVien,
} from '@gdos/shared'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, BedDouble, ClipboardList, Hospital, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { goiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { truyVanToi } from '@/lib/phien'
import { Chip, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

type Dong = ReturnType<typeof dongChiTieuBenhVien>[number]
const SO = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
const hienSo = (v: number | null) => (v === null ? '—' : SO.format(v))
const KPI = [
  { ma: 'BV-01', BieuTuong: Activity },
  { ma: 'BV-02', BieuTuong: Hospital },
  { ma: MA_CONG_SUAT_GIUONG, BieuTuong: BedDouble },
  { ma: 'BV-08', BieuTuong: ClipboardList },
]
const COT: CotLuoi<Dong>[] = [
  { id: 'chi-tieu', nhan: 'Chỉ tiêu', kieu: 'chu', giaTri: (d) => d.ten, batBuoc: true, rong: 260 },
  { id: 'ma', nhan: 'Mã', kieu: 'chu', giaTri: (d) => d.ma },
  { id: 'gia-tri', nhan: 'Giá trị', kieu: 'so', giaTri: (d) => d.giaTri },
  { id: 'don-vi', nhan: 'Đơn vị', kieu: 'danh-muc', giaTri: (d) => d.donVi },
  { id: 'nguon', nhan: 'Nguồn số liệu', kieu: 'chu', giaTri: (d) => d.nguon ?? 'Chưa có số liệu', rong: 275 },
  {
    id: 'luc',
    nhan: 'Cập nhật lúc',
    kieu: 'chu',
    giaTri: (d) => (d.capNhatLuc ? ngayGio(d.capNhatLuc) : null),
    rong: 145,
  },
]

function SoSanh({ nay, truoc }: { nay: Dong; truoc: Dong | undefined }) {
  if (nay.giaTri === null || truoc?.giaTri == null) return <span>Chưa đủ số liệu để so sánh</span>
  if (nay.loaiNguon !== truoc.loaiNguon) return <span>Hai kỳ khác loại nguồn</span>
  const lech = nay.giaTri - truoc.giaTri
  const donVi = nay.donVi === '%' ? 'điểm %' : nay.donVi
  return (
    <span>
      {lech > 0 ? '+' : ''}
      {SO.format(lech)} {donVi} so với tháng trước
    </span>
  )
}

function BieuDo({ bang }: { bang: BangDieuHanhBenhVien }) {
  const [ma, datMa] = useState('BV-01')
  const cacKy = bang.cacKy.map((k) => ({
    ky: k.ky,
    chiTieu: dongChiTieuBenhVien(k).find((d) => d.ma === ma)!,
  }))
  const lonNhat = Math.max(1, ...cacKy.map(({ chiTieu }) => chiTieu.giaTri ?? 0))
  return (
    <The tieuDe="Xu hướng sáu tháng">
      <OChon id="bv-chi-tieu-xu-huong" nhan="Chỉ tiêu" value={ma} onChange={(e) => datMa(e.target.value)}>
        {dongChiTieuBenhVien(bang.cacKy[0]!).map((d) => (
          <option key={d.ma} value={d.ma}>
            {d.ten}
          </option>
        ))}
      </OChon>
      <ul aria-label={`Số liệu theo tháng, đơn vị ${cacKy[0]?.chiTieu.donVi}`} className="space-y-2.5 pt-1">
        {cacKy.map(({ ky, chiTieu: d }, i) => (
          <li key={ky} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs sm:gap-3">
            <span className={i === cacKy.length - 1 ? 'font-bold text-ink' : 'text-faint'}>{kyHien(ky)}</span>
            <div aria-hidden="true" className="h-2.5 min-w-0 rounded-full bg-nen-2">
              {d.giaTri !== null && (
                <div
                  className={`h-full rounded-full bg-brand ${i === cacKy.length - 1 ? '' : 'opacity-45'}`}
                  style={{ width: `${(d.giaTri / lonNhat) * 100}%` }}
                />
              )}
            </div>
            <span
              className="min-w-9 text-right font-semibold tabular-nums text-ink"
              aria-label={d.giaTri === null ? 'Chưa có số liệu' : undefined}
            >
              {hienSo(d.giaTri)}
              {bang.nguon === 'tu-dong' && d.loaiNguon === 'gia-lap' && (
                <small className="ml-1 text-warn">Mẫu</small>
              )}
            </span>
          </li>
        ))}
      </ul>
    </The>
  )
}

function NoiDung({ bang, quyen }: { bang: BangDieuHanhBenhVien; quyen: string[] }) {
  const hienTai = bang.cacKy.at(-1)!
  const dong = dongChiTieuBenhVien(hienTai)
  const kyTruoc = dongChiTieuBenhVien(bang.cacKy.at(-2)!)
  const [hienChiTiet, datHienChiTiet] = useState(false)
  const duocXem = new Set(baoCaoCua(DANH_SACH_MODULE, new Set(quyen)).map((b) => b.muc.id))
  const cacBieu = BAO_CAO_BENH_VIEN.filter((b) => duocXem.has(b.maBaoCao))
  const coSoLieu = hienTai.soLieu.length > 0
  return (
    <>
      {!coSoLieu && <ThongBao>Chưa có số liệu bệnh viện đã nạp cho {kyHien(hienTai.ky)}.</ThongBao>}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPI.map(({ ma, BieuTuong }) => {
          const d = dong.find((c) => c.ma === ma)!
          return (
            <article key={ma} className="rounded-xl border border-line bg-nen p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="pt-1 text-sm font-semibold text-body">{d.ten}</h3>
                <span className="rounded-lg bg-tint-brand p-2 text-brand">
                  <BieuTuong size={17} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 text-[28px] leading-tight font-bold tabular-nums text-ink">
                {hienSo(d.giaTri)}{' '}
                {d.giaTri !== null && <span className="text-xs font-medium text-faint">{d.donVi}</span>}
              </p>
              <p className="mt-2 text-xs text-faint">
                <SoSanh nay={d} truoc={kyTruoc.find((c) => c.ma === ma)} />
              </p>
              {d.nguon && <p className="mt-2 text-xs text-faint">{d.nguon}</p>}
            </article>
          )
        })}
      </div>
      <div className="grid gap-x-4 xl:grid-cols-2">
        <BieuDo bang={bang} />
        <The tieuDe="Báo cáo giao ban" phu={kyHien(hienTai.ky)}>
          <p className="mb-3 text-xs text-faint">
            Bản nháp tổng hợp để đối soát trước khi lập báo cáo chính thức.
          </p>
          {!cacBieu.length && (
            <p className="text-xs text-faint">Chưa có báo cáo trong phạm vi quyền của bạn.</p>
          )}
          <ul className="divide-y divide-line">
            {cacBieu.map((m) => {
              const coSo = dong.filter((d) => m.chiTieu.some((ma) => ma === d.ma) && d.giaTri !== null).length
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-ink">{m.ten}</p>
                    <p className="text-xs text-faint">
                      {m.mo} · {coSo}/{m.chiTieu.length} chỉ tiêu có số
                    </p>
                  </div>
                  <Link
                    to="/bao-cao/$ma"
                    params={{ ma: m.maBaoCao }}
                    search={{ ky: hienTai.ky, nguon: bang.nguon }}
                    aria-label={`Xem báo cáo ${m.ten}`}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-brand hover:underline"
                  >
                    Xem báo cáo
                  </Link>
                </li>
              )
            })}
          </ul>
        </The>
      </div>
      <Nut className="mb-3" aria-expanded={hienChiTiet} onClick={() => datHienChiTiet((v) => !v)}>
        {hienChiTiet ? 'Ẩn bảng chỉ tiêu' : 'Xem bảng chỉ tiêu và nguồn số liệu'}
      </Nut>
      {hienChiTiet && (
        <Luoi
          ma={`benh-vien-${bang.nguon}`}
          tieuDe={`Chỉ tiêu bệnh viện · ${kyHien(hienTai.ky)} · ${bang.nguon === 'gia-lap' ? 'Dữ liệu giả lập' : bang.donVi}`}
          cot={COT}
          dong={dong}
          khoa={(d) => d.ma}
        />
      )}
    </>
  )
}

export default function DieuHanhBenhVien() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const [ky, datKy] = useState(kyHienTai)
  const [nguon, datNguon] = useState<NguonBenhVien>('tu-dong')
  const thamSo = new URLSearchParams({ ky, nguon }).toString()
  const bang = useQuery({
    queryKey: ['dieu-hanh-benh-vien', ky, nguon],
    queryFn: () => goiApi<BangDieuHanhBenhVien>(`/chi-tieu/benh-vien?${thamSo}`),
  })
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-nen p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink">Điều hành bệnh viện</h2>
            <Chip mau={nguon === 'gia-lap' ? 'warn' : 'brand'}>{NHAN_CHE_DO_SO_LIEU[nguon]}</Chip>
          </div>
          <p className="mt-1 text-sm text-faint">
            {bang.data?.donVi ?? toi.donVi.ten} · {kyHien(ky)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 [&>div]:mb-0">
          <ONhap
            id="bv-ky"
            nhan="Kỳ báo cáo"
            type="month"
            min="2000-01"
            max="2100-12"
            value={ky}
            onChange={(e) => {
              if (e.target.value && e.target.validity.valid) datKy(e.target.value)
            }}
          />
          <OChon
            id="bv-nguon"
            nhan="Nguồn dữ liệu"
            value={nguon}
            onChange={(e) => datNguon(e.target.value as NguonBenhVien)}
          >
            {Object.entries(NHAN_CHE_DO_SO_LIEU).map(([ma, ten]) => (
              <option key={ma} value={ma}>
                {ten}
              </option>
            ))}
          </OChon>
          <Nut
            className="mt-5"
            aria-label="Làm mới số liệu"
            onClick={() => void bang.refetch()}
            disabled={bang.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </Nut>
        </div>
      </div>
      {nguon === 'da-nap' && toi.laQuanTri && (
        <p className="mb-4 text-sm text-faint">
          Cập nhật chỉ tiêu tại{' '}
          <Link
            to="/$chucNang"
            params={{ chucNang: 'nd-excel' }}
            className="font-semibold text-brand underline"
          >
            Nguồn dữ liệu vào
          </Link>
          .
        </p>
      )}
      {bang.isPending && (
        <p role="status" className="text-sm text-faint">
          Đang tải số liệu…
        </p>
      )}
      {bang.isError && <ThongBao kieu="loi">{bang.error.message}</ThongBao>}
      {bang.data && <NoiDung key={nguon} bang={bang.data} quyen={toi.quyen} />}
    </>
  )
}
