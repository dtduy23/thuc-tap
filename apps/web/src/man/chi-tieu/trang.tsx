/**
 * Điều hành › Chỉ tiêu điều hành — tám trang theo bộ chỉ tiêu cấp xã/phường đã thông qua
 * (bố cục theo "Dashboard GDOS Xã/Phường" của GDOS cũ). Danh mục chỉ tiêu ở @gdos/shared;
 * giá trị do API trả, mỗi số mang NGUỒN: "Số thật" (từ phân hệ đã xây, bấm để mở phân hệ),
 * "Minh họa" (chưa có phân hệ nguồn) hoặc "Chưa có".
 */
import {
  BO_CHI_TIEU,
  LINH_VUC_CHI_TIEU,
  chamChiTieu,
  timChiTieu,
  type BangChiTieu,
  type GiaTriChiTieu,
  type LinhVucChiTieu,
} from '@gdos/shared'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { goiApi } from '@/lib/http'
import { ThongBao } from '@/ui/co-ban'
import {
  BangKv,
  Donut,
  DuongKy,
  DuongNho,
  Luoi12,
  MAU,
  ThanhNgang,
  The,
  Vong,
  so,
  type Thanh,
} from './bieu-do'

const truyVanChiTieu = queryOptions({
  queryKey: ['chi-tieu'],
  queryFn: () => goiApi<BangChiTieu>('/chi-tieu'),
  staleTime: 60_000,
})

const TRONG: GiaTriChiTieu = { giaTri: null, nguon: 'chua-co', chuoi: [] }

/** Tiện ích đọc bảng: g = bản ghi, v = số (0 khi chưa có), hien = chuỗi kèm đơn vị. */
function doc(b: BangChiTieu) {
  const g = (ma: string) => b.giaTri[ma] ?? TRONG
  const v = (ma: string) => g(ma).giaTri ?? 0
  const hien = (ma: string) => {
    const d = timChiTieu(ma)
    const x = g(ma).giaTri
    return x === null ? '—' : `${so(x, d?.soLe ?? 0)}${d?.donVi === '%' ? '%' : ''}`
  }
  return { g, v, hien }
}

/* ── Mảnh dùng chung ──────────────────────────────────────────────────────── */

/** Nhãn nguồn của một số — để người điều hành không nhầm số minh họa với số thật. */
function NhanNguon({ g }: { g: GiaTriChiTieu }) {
  if (g.nguon === 'that')
    return g.lienKet ? (
      <Link
        to="/$chucNang"
        params={{ chucNang: g.lienKet }}
        className="flex-none rounded bg-tint-ok px-1.5 py-px whitespace-nowrap text-[10.5px] font-bold text-ok hover:underline"
        title={`Số thật từ phân hệ ${g.phanHe} — bấm để mở`}
      >
        Số thật · {g.phanHe}
      </Link>
    ) : (
      <span className="flex-none rounded bg-tint-ok px-1.5 py-px whitespace-nowrap text-[10.5px] font-bold text-ok">
        Số thật
      </span>
    )
  if (g.nguon === 'minh-hoa')
    return (
      <span
        className="flex-none rounded bg-line-2 px-1.5 py-px whitespace-nowrap text-[10.5px] font-bold text-faint"
        title="Chưa có phân hệ nguồn — số minh họa để xem trước bố cục"
      >
        Minh họa
      </span>
    )
  return (
    <span
      className="flex-none rounded bg-tint-warn px-1.5 py-px whitespace-nowrap text-[10.5px] font-bold text-warn"
      title={g.lyDo}
    >
      Chưa có số
    </span>
  )
}

/** Thẻ một chỉ tiêu: số lớn, so kỳ trước, đường xu hướng, nguồn. */
function TheChiSo({
  b,
  ma,
  mau = 1,
  chan,
  day,
}: {
  b: BangChiTieu
  ma: string
  mau?: number
  chan?: string
  day?: boolean
}) {
  const d = timChiTieu(ma)!
  const g = b.giaTri[ma] ?? TRONG
  const truoc = g.chuoi.length > 1 ? g.chuoi.at(-2)! : null
  const lech = g.giaTri !== null && truoc !== null ? g.giaTri - truoc : null
  // Chỉ tiêu %: so bằng điểm %; còn lại so bằng % thay đổi.
  const chuLech =
    lech === null || !truoc
      ? null
      : d.donVi === '%'
        ? `${lech >= 0 ? '+' : '−'}${so(Math.abs(lech), 1)} điểm %`
        : `${lech >= 0 ? '+' : '−'}${so(Math.abs((lech / truoc) * 100), 1)}%`
  // Chỉ tô tốt / xấu khi chỉ tiêu có chiều đánh giá (có mục tiêu hoặc "càng thấp càng tốt"); số đếm thuần thì để trung tính.
  const coChieu = d.mucTieu !== undefined || d.thapTot !== undefined
  const tot = !coChieu || lech === null || lech === 0 ? null : d.thapTot ? lech < 0 : lech > 0
  const cham = chamChiTieu(d, g.giaTri)
  return (
    <div className="col-span-12 min-w-0 rounded-[12px] border border-line bg-nen px-4 py-3 shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)] sm:col-span-6 xl:col-span-3">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-[12px] font-semibold text-body" title={d.ten}>
          {day ? d.ten : (d.ngan ?? d.ten)}
        </span>
        <NhanNguon g={g} />
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className="min-w-0">
          <span className="text-[26px] leading-tight font-extrabold text-ink tabular-nums">
            {g.giaTri === null ? '—' : so(g.giaTri, d.soLe ?? 0)}
          </span>
          <span className="ml-1 text-[12px] text-faint">{d.donVi}</span>
        </span>
        <DuongNho chuoi={g.chuoi} mau={MAU(mau)} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-faint">
        <code className="text-[10.5px]">{ma}</code>
        {chuLech && (
          <span className={tot === null ? '' : tot ? 'font-semibold text-ok' : 'font-semibold text-danger'}>
            {chuLech} so kỳ trước
          </span>
        )}
        {cham !== 'khong-cham' && (
          <span className={`font-bold ${cham === 'dat' ? 'text-ok' : 'text-danger'}`}>
            {cham === 'dat' ? '✓ Đạt' : '✕ Chưa đạt'} mục tiêu {d.thapTot ? '≤' : '≥'} {d.mucTieu}
          </span>
        )}
        {g.nguon === 'chua-co' && g.lyDo && <span>{g.lyDo}</span>}
        {chan && <span>{chan}</span>}
      </div>
    </div>
  )
}

/** Vòng % của một chỉ tiêu trong danh mục. */
function VongChiTieu({ b, ma, mau }: { b: BangChiTieu; ma: string; mau: number }) {
  const d = timChiTieu(ma)!
  return (
    <Vong
      giaTri={b.giaTri[ma]?.giaTri ?? null}
      mucTieu={d.mucTieu}
      nhan={d.ngan ?? d.ten}
      phu={ma}
      mau={MAU(mau)}
      soLe={d.soLe ?? 1}
    />
  )
}

function Khung({ children }: { children: (b: BangChiTieu) => ReactNode }) {
  const { data: b } = useSuspenseQuery(truyVanChiTieu)
  const dem = Object.values(b.giaTri)
  const soThat = dem.filter((g) => g.nguon === 'that').length
  return (
    <>
      <ThongBao>
        Kỳ số liệu <b>{b.ky}</b>. Số gắn nhãn <b>Minh họa</b> là dữ liệu mẫu để xem trước bố cục — chưa có
        phân hệ nguồn, không dùng để báo cáo. Hiện có <b>{soThat}</b> chỉ tiêu lấy <b>số thật</b> từ các phân
        hệ GDOS đã xây; số thật tính theo đúng quyền và phạm vi của tài khoản đang xem.
      </ThongBao>
      {children(b)}
    </>
  )
}

const TRANG_LINH_VUC: Record<Exclude<LinhVucChiTieu, 'kpi' | 'dan-cu' | 'kinh-te'> | 'ktxh', string> = {
  tthc: 'ct-tthc',
  ktxh: 'ct-ktxh',
  antt: 'ct-antt',
  'ha-tang': 'ct-ha-tang',
  'yt-gd': 'ct-yt-gd',
  pakn: 'ct-pakn',
}

/* ── 1. Tổng quan lĩnh vực ────────────────────────────────────────────────── */

export function TongQuanLinhVuc() {
  return (
    <Khung>
      {(b) => {
        const { hien } = doc(b)
        const kpi = BO_CHI_TIEU.filter((c) => c.linhVuc === 'kpi')
        const linhVuc: { trang: string; ten: string; kv: [string, string][] }[] = [
          {
            trang: TRANG_LINH_VUC.tthc,
            ten: 'TTHC – Một cửa',
            kv: [
              ['Đúng hạn', hien('TTHC-06')],
              ['Toàn trình', hien('TTHC-07')],
              ['Hài lòng', hien('TTHC-17')],
            ],
          },
          {
            trang: TRANG_LINH_VUC.ktxh,
            ten: 'Kinh tế – Dân cư – Xã hội',
            kv: [
              ['Hộ nghèo / cận nghèo', `${hien('DC-07')} / ${hien('DC-08')}`],
              ['Doanh nghiệp · HKD', `${hien('KT-07')} · ${hien('KT-05')}`],
              ['Giải ngân đầu tư công', hien('KT-04')],
            ],
          },
          {
            trang: TRANG_LINH_VUC.antt,
            ten: 'An ninh – Trật tự',
            kv: [
              ['Vụ việc (đã xử lý)', `${hien('ANTT-01')} (${hien('ANTT-02')})`],
              ['Vi phạm TTĐT/ATGT', hien('ANTT-05')],
              ['Camera', hien('ANTT-04')],
            ],
          },
          {
            trang: TRANG_LINH_VUC['ha-tang'],
            ten: 'Hạ tầng – Đô thị',
            kv: [
              ['Đường cứng hóa', hien('HT-02')],
              ['Chiếu sáng hẻm', hien('HT-03')],
              ['Công trình đang thi công', hien('HT-06')],
            ],
          },
          {
            trang: TRANG_LINH_VUC['yt-gd'],
            ten: 'Y tế – Giáo dục',
            kv: [
              ['Trạm y tế · Trường', `${hien('YTGD-01')} · ${hien('YTGD-04')}`],
              ['Lượt khám / tháng', hien('YTGD-02')],
              ['Trường chuẩn quốc gia', hien('YTGD-06')],
            ],
          },
          {
            trang: TRANG_LINH_VUC.pakn,
            ten: 'Phản ánh – Kiến nghị',
            kv: [
              ['Tiếp nhận', hien('PAKN-01')],
              ['Trong 3 ngày', hien('PAKN-05')],
              ['Quá hạn', hien('PAKN-04')],
            ],
          },
        ]
        // Mức sẵn sàng số liệu theo lĩnh vực: bao nhiêu chỉ tiêu đã có số thật.
        const sanSang = (Object.keys(LINH_VUC_CHI_TIEU) as LinhVucChiTieu[]).map((lv) => {
          const ds = BO_CHI_TIEU.filter((c) => c.linhVuc === lv)
          const that = ds.filter((c) => b.giaTri[c.ma]?.nguon === 'that').length
          return { nhan: LINH_VUC_CHI_TIEU[lv], giaTri: that, hien: `${that}/${ds.length}`, tong: ds.length }
        })
        return (
          <>
            <h2 className="tieu-de-phan mt-0">Số thật từ các phân hệ GDOS</h2>
            <Luoi12>
              {b.phanHe.map((p) => (
                <The
                  key={p.phanHe}
                  tieuDe={p.phanHe}
                  rong={4}
                  phu={
                    <Link
                      to="/$chucNang"
                      params={{ chucNang: p.lienKet }}
                      className="font-semibold text-brand underline"
                    >
                      Mở phân hệ →
                    </Link>
                  }
                >
                  {p.so ? (
                    <div className="grid grid-cols-2 gap-3">
                      {p.so.map((s) => (
                        <div key={s.nhan}>
                          <div className="text-[11.5px] text-faint">{s.nhan}</div>
                          <div
                            className={`text-[22px] leading-tight font-extrabold tabular-nums ${s.mau === 'danger' ? 'text-danger' : s.mau === 'warn' ? 'text-warn' : s.mau === 'ok' ? 'text-ok' : 'text-ink'}`}
                          >
                            {so(s.giaTri, Number.isInteger(s.giaTri) ? 0 : 1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-[12.5px] text-faint">{p.lyDo ?? 'Chưa có số liệu.'}</p>
                  )}
                </The>
              ))}
            </Luoi12>

            <h2 className="tieu-de-phan">Chỉ tiêu chính</h2>
            <Luoi12>
              <TheChiSo b={b} ma="DC-01" mau={1} />
              <TheChiSo b={b} ma="TTHC-01" mau={3} day />
              <TheChiSo b={b} ma="PAKN-01" mau={7} day />
              <TheChiSo b={b} ma="ANTT-01" mau={2} />
            </Luoi12>

            <Luoi12>
              <The
                tieuDe="KPI điều hành cấp trên giao"
                rong={12}
                phu={
                  <Link
                    to="/$chucNang"
                    params={{ chucNang: 'ct-kpi' }}
                    className="font-semibold text-brand underline"
                  >
                    Xem chi tiết KPI →
                  </Link>
                }
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
                  {kpi.map((c, i) => (
                    <VongChiTieu key={c.ma} b={b} ma={c.ma} mau={i + 1} />
                  ))}
                </div>
              </The>
            </Luoi12>

            <h2 className="tieu-de-phan">Theo lĩnh vực</h2>
            <Luoi12>
              {linhVuc.map((l) => (
                <The
                  key={l.ten}
                  tieuDe={l.ten}
                  rong={4}
                  phu={
                    <Link
                      to="/$chucNang"
                      params={{ chucNang: l.trang }}
                      className="font-semibold text-brand underline"
                    >
                      Mở bảng lĩnh vực →
                    </Link>
                  }
                >
                  <BangKv ds={l.kv} />
                </The>
              ))}
            </Luoi12>

            <Luoi12>
              <The
                tieuDe="Mức sẵn sàng số liệu"
                phu="Số chỉ tiêu đã lấy được số thật trên tổng số chỉ tiêu của từng lĩnh vực"
                rong={12}
              >
                <ThanhNgang
                  ds={sanSang.map((s) => ({
                    nhan: s.nhan,
                    giaTri: s.tong ? (s.giaTri / s.tong) * 100 : 0,
                    hien: s.hien,
                  }))}
                  toiDa={100}
                />
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 2. KPI điều hành ─────────────────────────────────────────────────────── */

export function KpiDieuHanh() {
  return (
    <Khung>
      {(b) => {
        const kpi = BO_CHI_TIEU.filter((c) => c.linhVuc === 'kpi')
        const dat = kpi.filter((c) => chamChiTieu(c, b.giaTri[c.ma]?.giaTri ?? null) === 'dat').length
        const coSo = kpi.filter((c) => b.giaTri[c.ma]?.giaTri != null).length
        return (
          <>
            <p className="mt-0 mb-4 text-[13px] text-body">
              <b className="text-ink">
                {dat}/{coSo}
              </b>{' '}
              KPI có số liệu đang đạt mục tiêu
              {coSo < kpi.length && ` · ${kpi.length - coSo} KPI chưa có số`}.
            </p>
            <Luoi12>
              {kpi.map((c, i) => (
                <TheChiSo key={c.ma} b={b} ma={c.ma} mau={i + 1} />
              ))}
            </Luoi12>
            <Luoi12>
              <The tieuDe="Diễn biến KPI 10 kỳ" phu="Chỉ vẽ KPI có chuỗi số liệu theo kỳ" rong={7}>
                <DuongKy
                  ky={b.ky}
                  donVi="%"
                  chuoi={kpi.map((c, i) => ({
                    ten: c.ngan ?? c.ten,
                    mau: MAU(i + 1),
                    du: b.giaTri[c.ma]?.chuoi ?? [],
                  }))}
                />
              </The>
              <The tieuDe="So với mục tiêu" phu="Vạch đậm trên vòng là mục tiêu" rong={5}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
                  {kpi.map((c, i) => (
                    <VongChiTieu key={c.ma} b={b} ma={c.ma} mau={i + 1} />
                  ))}
                </div>
              </The>
            </Luoi12>
            <Luoi12>
              <The tieuDe="Cách tính và đầu mối" rong={12}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[12.5px]">
                    <thead>
                      <tr className="text-[11px] tracking-[.06em] text-faint uppercase">
                        {[
                          'Mã',
                          'KPI',
                          'Hiện trạng',
                          'Mục tiêu',
                          'Kết quả',
                          'Cách tính',
                          'Đầu mối',
                          'Nguồn',
                        ].map((c) => (
                          <th key={c} className="border-b border-line px-2 py-2 font-bold whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.map((c) => {
                        const g = b.giaTri[c.ma] ?? TRONG
                        const cham = chamChiTieu(c, g.giaTri)
                        return (
                          <tr key={c.ma} className="border-b border-line-2">
                            <td className="px-2 py-2">
                              <code>{c.ma}</code>
                            </td>
                            <td className="px-2 py-2 text-ink">{c.ten}</td>
                            <td className="px-2 py-2 font-bold text-ink tabular-nums">
                              {g.giaTri === null ? '—' : `${so(g.giaTri, c.soLe ?? 1)}%`}
                            </td>
                            <td className="px-2 py-2 tabular-nums">≥ {c.mucTieu}%</td>
                            <td
                              className={`px-2 py-2 font-bold ${cham === 'dat' ? 'text-ok' : cham === 'chua-dat' ? 'text-danger' : 'text-faint'}`}
                            >
                              {cham === 'dat'
                                ? '✓ Đạt'
                                : cham === 'chua-dat'
                                  ? '✕ Chưa đạt'
                                  : (g.lyDo ?? 'Chưa có số')}
                            </td>
                            <td className="px-2 py-2 text-body">{c.cachTinh}</td>
                            <td className="px-2 py-2 text-body">{c.dauMoi}</td>
                            <td className="px-2 py-2">
                              <NhanNguon g={g} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 3. TTHC – Một cửa ────────────────────────────────────────────────────── */

export function ChiTieuTthc() {
  return (
    <Khung>
      {(b) => {
        const { g, v } = doc(b)
        const linhVuc: Thanh[] = ['TTHC-09', 'TTHC-10', 'TTHC-11', 'TTHC-12', 'TTHC-13', 'TTHC-14'].map(
          (ma) => ({
            nhan: timChiTieu(ma)!.ten.replace('Hồ sơ ', ''),
            giaTri: v(ma),
          }),
        )
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="TTHC-01" mau={1} chan="trực tiếp + trực tuyến" />
              <TheChiSo b={b} ma="TTHC-02" mau={3} />
              <TheChiSo b={b} ma="TTHC-04" mau={4} />
              <TheChiSo b={b} ma="TTHC-05" mau={8} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Tình trạng giải quyết hồ sơ" phu="TTHC-02 → TTHC-05" rong={5}>
                <Donut
                  donVi="hồ sơ"
                  giua={so(v('TTHC-01'))}
                  phan={[
                    { nhan: 'Giải quyết đúng hạn', giaTri: v('TTHC-03'), mau: MAU(1) },
                    {
                      nhan: 'Giải quyết quá hạn',
                      giaTri: Math.max(0, v('TTHC-02') - v('TTHC-03')),
                      mau: MAU(2),
                    },
                    { nhan: 'Đang xử lý trong hạn', giaTri: v('TTHC-04'), mau: MAU(3) },
                    { nhan: 'Quá hạn chưa trả', giaTri: v('TTHC-05'), mau: MAU(4) },
                  ]}
                />
              </The>
              <The tieuDe="Tiếp nhận và giải quyết 10 kỳ" phu="TTHC-01, TTHC-02" rong={7}>
                <DuongKy
                  ky={b.ky}
                  donVi=" hồ sơ"
                  chuoi={[
                    { ten: 'Tiếp nhận', mau: MAU(1), du: g('TTHC-01').chuoi },
                    { ten: 'Đã giải quyết', mau: MAU(2), du: g('TTHC-02').chuoi },
                  ]}
                />
              </The>
            </Luoi12>
            <Luoi12>
              <The tieuDe="Chất lượng phục vụ so với mục tiêu" phu="TTHC-06, 07, 08, 17" rong={7}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
                  <VongChiTieu b={b} ma="TTHC-06" mau={1} />
                  <VongChiTieu b={b} ma="TTHC-07" mau={2} />
                  <VongChiTieu b={b} ma="TTHC-08" mau={3} />
                  <VongChiTieu b={b} ma="TTHC-17" mau={4} />
                </div>
              </The>
              <The tieuDe="Hồ sơ tiếp nhận theo lĩnh vực" phu="TTHC-09 → TTHC-14" rong={5}>
                <ThanhNgang ds={linhVuc} />
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 4. Kinh tế – Dân cư – Xã hội ─────────────────────────────────────────── */

export function ChiTieuKtxh() {
  return (
    <Khung>
      {(b) => {
        const { g, v, hien } = doc(b)
        const ho = v('DC-06') || 1
        const danSo = v('DC-01')
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="DC-01" mau={1} />
              <TheChiSo b={b} ma="DC-06" mau={7} />
              <TheChiSo b={b} ma="DC-09" mau={3} />
              <TheChiSo b={b} ma="KT-04" mau={2} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Cơ cấu giới tính" phu="DC-01, DC-02" rong={4}>
                <Donut
                  donVi="người"
                  phan={[
                    { nhan: 'Nam', giaTri: v('DC-02'), mau: MAU(1) },
                    { nhan: 'Nữ', giaTri: Math.max(0, danSo - v('DC-02')), mau: MAU(2) },
                  ]}
                />
              </The>
              <The tieuDe="Cơ cấu nhóm tuổi" phu="DC-03, DC-04, DC-05" rong={4}>
                <Donut
                  donVi="người"
                  phan={[
                    { nhan: 'Trẻ em 0–14 tuổi', giaTri: v('DC-04'), mau: MAU(1) },
                    { nhan: 'Trong độ tuổi lao động', giaTri: v('DC-03'), mau: MAU(2) },
                    { nhan: 'Cao tuổi 60+', giaTri: v('DC-05'), mau: MAU(3) },
                    {
                      nhan: 'Nhóm khác',
                      giaTri: Math.max(0, danSo - v('DC-04') - v('DC-03') - v('DC-05')),
                      mau: 'var(--line)',
                    },
                  ]}
                />
              </The>
              <The tieuDe="An sinh — hộ nghèo, cận nghèo" phu={`DC-07, DC-08 · trên ${so(ho)} hộ`} rong={4}>
                <ThanhNgang
                  toiDa={Math.max(5, ((v('DC-07') + v('DC-08')) / ho) * 100 * 1.2)}
                  ds={[
                    {
                      nhan: 'Hộ nghèo',
                      giaTri: (v('DC-07') / ho) * 100,
                      hien: `${so(v('DC-07'))} hộ · ${so((v('DC-07') / ho) * 100, 1)}%`,
                    },
                    {
                      nhan: 'Hộ cận nghèo',
                      giaTri: (v('DC-08') / ho) * 100,
                      hien: `${so(v('DC-08'))} hộ · ${so((v('DC-08') / ho) * 100, 1)}%`,
                    },
                  ]}
                />
              </The>
            </Luoi12>
            <Luoi12>
              <The tieuDe="Lao động, việc làm và số hóa dân cư" phu="DC-03, DC-10, DC-11, DC-12" rong={6}>
                <BangKv
                  ds={[
                    ['Người trong độ tuổi lao động', hien('DC-03')],
                    ['Lao động có việc làm ổn định', hien('DC-10')],
                    ['Hộ mới phát sinh trong kỳ', hien('DC-11')],
                    ['Đồng bộ CSDL quốc gia về dân cư', hien('DC-12')],
                  ]}
                />
              </The>
              <The tieuDe="Chủ thể kinh tế đang hoạt động" phu="KT-05, KT-07, KT-08" rong={6}>
                <ThanhNgang
                  ds={[
                    { nhan: 'Hộ kinh doanh cá thể', giaTri: v('KT-05') },
                    { nhan: 'Doanh nghiệp', giaTri: v('KT-07') },
                    { nhan: 'Hợp tác xã', giaTri: v('KT-08') },
                  ]}
                />
                <p className="mt-3 mb-0 text-[12px] text-faint">
                  Hộ kinh doanh đăng ký mới trong kỳ: <b className="text-ink">{hien('KT-06')}</b> · Sản phẩm
                  chủ lực / OCOP: <b className="text-ink">{hien('KT-11')}</b> · Mã số vùng trồng:{' '}
                  <b className="text-ink">{hien('KT-10')}</b>
                </p>
              </The>
            </Luoi12>
            <Luoi12>
              <The tieuDe="Ngân sách và thanh toán" phu="KT-01 → KT-04, KT-12" rong={12}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {['KT-01', 'KT-02', 'KT-03', 'KT-04', 'KT-12'].map((ma) => {
                    const d = timChiTieu(ma)!
                    return (
                      <div key={ma} className="rounded-[10px] border border-line-2 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] text-body">{d.ten}</span>
                          <NhanNguon g={g(ma)} />
                        </div>
                        <div className="mt-1 text-[20px] font-extrabold text-ink tabular-nums">
                          {g(ma).giaTri === null ? '—' : so(g(ma).giaTri!, d.soLe ?? 0)}
                          <span className="ml-1 text-[11.5px] font-normal text-faint">{d.donVi}</span>
                        </div>
                        <code className="text-[10.5px] text-faint">{ma}</code>
                      </div>
                    )
                  })}
                </div>
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 5. An ninh – Trật tự ─────────────────────────────────────────────────── */

export function ChiTieuAntt() {
  return (
    <Khung>
      {(b) => {
        const { g, v } = doc(b)
        const dan = v('DC-01') || 1
        const vu = v('ANTT-01')
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="ANTT-01" mau={2} />
              <TheChiSo b={b} ma="ANTT-03" mau={1} />
              <TheChiSo b={b} ma="ANTT-05" mau={8} />
              <TheChiSo b={b} ma="ANTT-04" mau={3} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Vi phạm TTĐT / ATGT đã xử lý 10 kỳ" phu="ANTT-05" rong={7}>
                <DuongKy
                  ky={b.ky}
                  donVi=" vụ"
                  chuoi={[{ ten: 'Vi phạm đã xử lý', mau: MAU(1), du: g('ANTT-05').chuoi }]}
                />
              </The>
              <The tieuDe="Kết quả xử lý vụ việc" phu="ANTT-02 ÷ ANTT-01" rong={5}>
                <div className="flex flex-wrap items-center justify-around gap-4">
                  <Vong
                    giaTri={vu ? (v('ANTT-02') / vu) * 100 : null}
                    nhan="Vụ việc đã xử lý / điều tra"
                    phu={`${so(v('ANTT-02'))} / ${so(vu)} vụ`}
                    mau={MAU(1)}
                    soLe={0}
                  />
                  <div className="min-w-[200px] flex-1">
                    <BangKv
                      ds={[
                        ['Dân số / 1 camera', v('ANTT-04') ? `${so(dan / v('ANTT-04'))} người` : '—'],
                        ['Lượt tuần tra / 1.000 dân', so((v('ANTT-03') / dan) * 1000, 1)],
                        ['Vi phạm / 1.000 dân', so((v('ANTT-05') / dan) * 1000, 1)],
                        ['Lượt tuần tra / vụ việc', vu ? so(v('ANTT-03') / vu, 1) : '—'],
                      ]}
                    />
                  </div>
                </div>
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 6. Hạ tầng – Đô thị ──────────────────────────────────────────────────── */

export function ChiTieuHaTang() {
  return (
    <Khung>
      {(b) => {
        const { v } = doc(b)
        const pt = ['HT-02', 'HT-05', 'HT-04', 'HT-03']
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="HT-01" mau={1} />
              <TheChiSo b={b} ma="HT-06" mau={2} />
              <TheChiSo b={b} ma="HT-04" mau={3} />
              <TheChiSo b={b} ma="HT-03" mau={4} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Mức độ bao phủ hạ tầng" phu="HT-02 → HT-05 · mục tiêu 100%" rong={7}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
                  {pt.map((ma, i) => (
                    <VongChiTieu key={ma} b={b} ma={ma} mau={i + 1} />
                  ))}
                </div>
              </The>
              <The
                tieuDe="Khoảng trống cần đầu tư"
                phu="Điểm % còn thiếu để đạt 100% — xếp từ thiếu nhiều nhất"
                rong={5}
              >
                <ThanhNgang
                  toiDa={Math.max(10, ...pt.map((ma) => 100 - v(ma)))}
                  hauTo=" điểm %"
                  ds={pt
                    .map((ma) => ({
                      nhan: timChiTieu(ma)!.ten,
                      giaTri: Math.max(0, Number((100 - v(ma)).toFixed(1))),
                    }))
                    .sort((a, c) => c.giaTri - a.giaTri)}
                />
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 7. Y tế – Giáo dục ───────────────────────────────────────────────────── */

export function ChiTieuYtGd() {
  return (
    <Khung>
      {(b) => {
        const { g, v } = doc(b)
        const dan = v('DC-01') || 1
        const tram = v('YTGD-01') || 1
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="YTGD-01" mau={8} />
              <TheChiSo b={b} ma="YTGD-02" mau={1} />
              <TheChiSo b={b} ma="YTGD-04" mau={7} />
              <TheChiSo b={b} ma="YTGD-05" mau={3} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Lượt khám chữa bệnh 10 kỳ" phu="YTGD-02" rong={7}>
                <DuongKy
                  ky={b.ky}
                  donVi=" lượt"
                  chuoi={[{ ten: 'Lượt khám', mau: MAU(1), du: g('YTGD-02').chuoi }]}
                />
              </The>
              <The tieuDe="Bao phủ y tế và chuẩn trường học" phu="DC-09, YTGD-03, YTGD-06" rong={5}>
                <div className="grid grid-cols-3 gap-x-3">
                  <VongChiTieu b={b} ma="DC-09" mau={1} />
                  <VongChiTieu b={b} ma="YTGD-03" mau={2} />
                  <VongChiTieu b={b} ma="YTGD-06" mau={3} />
                </div>
              </The>
            </Luoi12>
            <Luoi12>
              <The tieuDe="Tải khám chữa bệnh" phu="Tính từ YTGD-01, YTGD-02 và dân số" rong={6}>
                <BangKv
                  ds={[
                    ['Dân số / trạm y tế', `${so(dan / tram)} người`],
                    ['Lượt khám / trạm / tháng', so(v('YTGD-02') / tram)],
                    ['Lượt khám / 1.000 dân / tháng', so((v('YTGD-02') / dan) * 1000, 1)],
                    ['Lượt khám / trạm / ngày làm việc (22 ngày)', so(v('YTGD-02') / tram / 22, 1)],
                  ]}
                />
              </The>
              <The tieuDe="Quy mô giáo dục" phu="DC-04, YTGD-04, YTGD-05" rong={6}>
                <ThanhNgang
                  ds={[
                    { nhan: 'Trẻ em 0–14 tuổi', giaTri: v('DC-04') },
                    { nhan: 'Học sinh (MN / TH / THCS)', giaTri: v('YTGD-05') },
                  ]}
                />
                <p className="mt-3 mb-0 text-[12px] text-faint">
                  Bình quân <b className="text-ink">{so(v('YTGD-05') / (v('YTGD-04') || 1))}</b> học sinh /
                  trường.
                </p>
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}

/* ── 8. Phản ánh – Kiến nghị ──────────────────────────────────────────────── */

export function ChiTieuPakn() {
  return (
    <Khung>
      {(b) => {
        const { g, v } = doc(b)
        return (
          <>
            <Luoi12>
              <TheChiSo b={b} ma="PAKN-01" mau={7} />
              <TheChiSo b={b} ma="PAKN-02" mau={3} />
              <TheChiSo b={b} ma="PAKN-04" mau={8} />
              <TheChiSo b={b} ma="PAKN-06" mau={1} />
            </Luoi12>
            <Luoi12>
              <The tieuDe="Tình trạng xử lý" phu="PAKN-02 → PAKN-04" rong={5}>
                <Donut
                  donVi="lượt"
                  giua={so(v('PAKN-01'))}
                  phan={[
                    { nhan: 'Đã xử lý xong', giaTri: v('PAKN-02'), mau: MAU(1) },
                    { nhan: 'Đang xử lý (trong hạn)', giaTri: v('PAKN-03'), mau: MAU(2) },
                    { nhan: 'Quá hạn chưa xử lý', giaTri: v('PAKN-04'), mau: MAU(3) },
                  ]}
                />
              </The>
              <The tieuDe="Phản hồi trong 3 ngày" phu="PAKN-05 · KPI-03" rong={3}>
                <VongChiTieu b={b} ma="PAKN-05" mau={1} />
              </The>
              <The tieuDe="Tiếp nhận 10 kỳ" phu="PAKN-01" rong={4}>
                <DuongKy
                  ky={b.ky}
                  donVi=" lượt"
                  chuoi={[{ ten: 'Tiếp nhận', mau: MAU(1), du: g('PAKN-01').chuoi }]}
                />
              </The>
            </Luoi12>
          </>
        )
      }}
    </Khung>
  )
}
