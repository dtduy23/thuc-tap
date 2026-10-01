/**
 * Tổng quan dự án — bố cục theo PMS (mẫu báo cáo tiến độ cho lãnh đạo):
 *   I.  Tiến độ đã thực hiện đến hôm nay (dòng thời gian các bước đã xong)
 *       ba thẻ giai đoạn
 *   II. Các bước tiếp theo (theo tháng, có số ngày và lũy kế)
 *       Kinh phí & giải ngân · Lịch sử điều chỉnh kế hoạch
 *       Vướng mắc & khó khăn
 * "Sửa thông tin" mở hộp thoại thay vì nằm thẳng trên trang.
 */
import {
  GIAI_DOAN,
  HINH_THUC,
  LOAI_CHI,
  NHOM_DU_AN,
  NHOM_NGUYEN_NHAN,
  TRANG_THAI_DU_AN,
  homNay,
  luyKeNgay,
  soNgayGiua,
  tinhTienDo,
  trangThaiBuoc,
  type BuocDuAn,
  type GiaiDoan,
  type HoSoDuAn,
} from '@gdos/shared'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import { suaDuAn, truyVanDanhMuc } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { HopThoai } from '@/man/van-ban/chung'
import { ChonTaiKhoan } from '@/ui/chon-tai-khoan'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { ChipBuoc, trieuDong } from '../chung'
import { ChiTietBuoc } from './chi-tiet-buoc'
import { OLuyKe } from './checklist'
import { BangGiaHan } from './gia-han'
import { useGhiHoSo } from './ghi-ho-so'

const thang = (ngay: string) => `Tháng ${Number(ngay.slice(5, 7))}/${ngay.slice(0, 4)}`

export default function TongQuan({ hs }: { hs: HoSoDuAn }) {
  const [sua, datSua] = useState(false)
  const [mo, datMo] = useState<string>()
  const hn = homNay()
  const { nguong } = useSuspenseQuery(truyVanCongKhai).data
  const lk = luyKeNgay(hs.buoc, hs.ngayBatDau)
  const luyKe = new Map(hs.buoc.map((b, i) => [b.id, lk[i]!]))
  const cha = (b: BuocDuAn) => (b.chaId ? hs.buoc.find((x) => x.id === b.chaId) : undefined)
  const thuoc = (b: BuocDuAn) => {
    const c = cha(b)
    return [
      c ? `Thuộc: ${c.stt}. ${c.ten}` : null,
      `Giai đoạn ${b.giaiDoan}: ${GIAI_DOAN[b.giaiDoan]}`,
      b.donViThucHien,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  const that = hs.buoc.filter(tinhTienDo)
  const hienTq = that.filter((b) => !b.anTongQuan)
  const daLam = hienTq
    .filter((b) => b.ngayHoanThanh)
    .sort((a, b) => a.ngayHoanThanh!.localeCompare(b.ngayHoanThanh!))
  const tiepTheo = hienTq
    .filter((b) => !b.ngayHoanThanh)
    .sort((a, b) => (a.han ?? '9999').localeCompare(b.han ?? '9999'))
  const cuoi = hs.phienBan[0]
  const tc = hs.taiChinh
  const moVuong = hs.vuongMac.filter((v) => !v.ngayGiaiQuyet)

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="m-0 min-w-0 flex-1 text-[12.5px] text-faint">
          Giai đoạn hiện tại:{' '}
          <b className="text-body">
            {hs.thongKe.giaiDoan
              ? `${hs.thongKe.giaiDoan} — ${GIAI_DOAN[hs.thongKe.giaiDoan]}`
              : 'Đã xong mọi bước'}
          </b>
          {hs.tienDoMoTa && (
            <span className="block whitespace-pre-line">Tình hình thực hiện: {hs.tienDoMoTa}</span>
          )}
        </p>
        {hs.quyen.sua ? (
          <Nut onClick={() => datSua(true)}>✎ Sửa thông tin</Nut>
        ) : (
          <span className="rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-semibold text-faint">
            Chỉ xem
          </span>
        )}
        <Link
          to="/du-an/$id"
          params={{ id: hs.id }}
          search={{ the: 'checklist' }}
          className="inline-flex items-center rounded-lg border border-brand bg-brand px-3.5 py-[7px] text-[13px] font-semibold text-white hover:bg-brand-dim"
        >
          Mở checklist
        </Link>
      </div>

      <The
        tieuDe={`I. Tiến độ đã thực hiện đến ngày ${ngayVn(hn)}`}
        phu={`${daLam.length} việc đã hoàn thành`}
      >
        {daLam.length === 0 ? (
          <p className="m-0 text-[13px] text-faint">Chưa có bước nào hoàn thành.</p>
        ) : (
          <ol className="m-0 max-h-[300px] list-none overflow-y-auto p-0">
            {daLam.map((b) => {
              const l = luyKe.get(b.id)
              return (
                <li key={b.id} className="grid grid-cols-[86px_14px_1fr] gap-x-2 pb-3">
                  <span className="pt-0.5 text-right text-[12.5px] font-bold tabular-nums text-brand">
                    {ngayVn(b.ngayHoanThanh)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2.5 justify-self-center rounded-full bg-ok"
                  />
                  <span className="min-w-0 text-[13px]">
                    <button
                      type="button"
                      onClick={() => datMo(b.id)}
                      className="text-left text-ink hover:underline"
                    >
                      {b.stt}. {b.ten}
                    </button>
                    {b.soVanBan && <span className="text-faint"> ({b.soVanBan})</span>}
                    {l?.chenh != null && l.chenh !== 0 && (
                      <span
                        className={`ml-1.5 text-[11.5px] font-semibold ${l.chenh > 0 ? 'text-danger' : 'text-ok'}`}
                      >
                        {l.chenh > 0 ? `chậm ${l.chenh} ngày` : `sớm ${-l.chenh} ngày`}
                      </span>
                    )}
                    <span className="block text-[11.5px] text-faint">{thuoc(b)}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </The>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {(Object.keys(GIAI_DOAN) as GiaiDoan[]).map((g) => {
          const trong = that.filter((b) => b.giaiDoan === g)
          const xong = trong.filter((b) => b.ngayHoanThanh).length
          const pt = trong.length ? Math.round((xong / trong.length) * 100) : 0
          return (
            <div
              key={g}
              className="flex items-center gap-3 rounded-[10px] border border-line bg-nen px-3.5 py-3"
            >
              <span
                className={`grid size-9 flex-none place-items-center rounded-full border-2 text-[12px] font-extrabold ${hs.thongKe.giaiDoan === g ? 'border-vang text-vang' : pt === 100 && trong.length ? 'border-ok text-ok' : 'border-line text-faint'}`}
              >
                {g}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[13px] text-ink">{GIAI_DOAN[g]}</b>
                <span className="block text-[11.5px] text-faint">
                  {xong}/{trong.length} bước · {pt}%
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${pt}%` }} />
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <The
          tieuDe="II. Các bước tiếp theo"
          phu={`còn ${tiepTheo.length} công việc · kế hoạch hiện hành v${cuoi?.so ?? 1}`}
        >
          {tiepTheo.length === 0 ? (
            <p className="m-0 text-[13px] text-faint">Không còn bước nào chờ thực hiện.</p>
          ) : (
            <div className="max-h-[440px] overflow-y-auto">
              <KhungBang nhan="Các bước tiếp theo">
                <thead>
                  <tr>
                    <th className={LOP_TH}>STT</th>
                    <th className={LOP_TH}>Nội dung công việc</th>
                    <th className={`${LOP_TH} text-right`}>Số ngày</th>
                    <th className={`${LOP_TH} text-right`} title="Số ngày cộng dồn từ ngày bắt đầu dự án">
                      Lũy kế
                    </th>
                    <th className={LOP_TH}>Ngày dự kiến</th>
                    <th className={LOP_TH}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {tiepTheo.map((b, i) => {
                    const dauThang =
                      b.han && (i === 0 || tiepTheo[i - 1]!.han?.slice(0, 7) !== b.han.slice(0, 7))
                    const tt = trangThaiBuoc(b, hn, nguong.sapHanNgay)
                    return [
                      dauThang && (
                        <tr key={`t-${b.han}`}>
                          <td colSpan={6} className="bg-nen-2 px-3 py-1.5 text-[12px] font-bold text-brand">
                            {thang(b.han!)}
                          </td>
                        </tr>
                      ),
                      <tr key={b.id}>
                        <td className={`${LOP_TD} text-faint tabular-nums`}>{i + 1}</td>
                        <td className={`${LOP_TD} min-w-[220px]`}>
                          <button
                            type="button"
                            onClick={() => datMo(b.id)}
                            className="text-left font-semibold text-ink hover:underline"
                          >
                            {b.stt}. {b.ten}
                          </button>
                          <span className="block text-[11.5px] text-faint">{thuoc(b)}</span>
                        </td>
                        <td className={`${LOP_TD} text-right tabular-nums`}>{b.soNgay}</td>
                        <td className={`${LOP_TD} text-right tabular-nums`}>
                          <OLuyKe lk={luyKe.get(b.id)} />
                        </td>
                        <td className={`${LOP_TD} font-semibold whitespace-nowrap tabular-nums`}>
                          {ngayVn(b.han)}
                        </td>
                        <td className={`${LOP_TD} text-[12px]`}>
                          {(tt === 'qua-han' || tt === 'sap-han' || tt === 'cho-xac-nhan') && (
                            <ChipBuoc tt={tt} />
                          )}
                          {tt === 'qua-han' && b.han && (
                            <span className="block text-danger">chậm {soNgayGiua(b.han, hn)} ngày</span>
                          )}
                          {b.ghiChu && <span className="line-clamp-2 block text-faint">{b.ghiChu}</span>}
                        </td>
                      </tr>,
                    ]
                  })}
                </tbody>
              </KhungBang>
            </div>
          )}
        </The>

        <div>
          <The tieuDe="Kinh phí & giải ngân">
            <p className="m-0 text-[24px] leading-tight font-bold text-ink tabular-nums">
              {hs.tongMuc.toLocaleString('vi-VN')}{' '}
              <span className="text-[13px] font-medium text-faint">triệu đồng</span>
            </p>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-ok"
                style={{ width: `${Math.min(100, tc.phanTramTongMuc)}%` }}
              />
            </span>
            <p className="mt-2 mb-0 text-[12.5px] text-faint">
              Giải ngân <b className="text-body">{tc.phanTramTongMuc}%</b> tổng mức (
              {trieuDong(tc.daGiaiNgan)}) · <b className="text-body">{tc.phanTramKeHoach}%</b> kế hoạch vốn
              tới nay
            </p>
            <Link
              to="/du-an/$id"
              params={{ id: hs.id }}
              search={{ the: 'kinh-phi' }}
              className="mt-1 inline-block text-[12.5px] font-semibold text-brand hover:underline"
            >
              Xem chi tiết →
            </Link>
          </The>
          <The tieuDe="Lịch sử điều chỉnh kế hoạch">
            {hs.phienBan.length <= 1 ? (
              <p className="m-0 text-[13px] text-faint">Chưa điều chỉnh — đang theo kế hoạch gốc v1.</p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0 text-[13px]">
                {hs.phienBan
                  .filter((p) => p.so > 1)
                  .map((p) => (
                    <li key={p.id}>
                      <b>v{p.so}</b> · {ngayVn(p.ngay)}
                      {p.soNgayLui > 0 && <span className="text-danger"> · lùi {p.soNgayLui} ngày</span>}
                      <span className="block text-[12px] text-faint">{p.lyDo}</span>
                    </li>
                  ))}
              </ul>
            )}
            <Link
              to="/du-an/$id"
              params={{ id: hs.id }}
              search={{ the: 'ke-hoach' }}
              className="mt-1.5 inline-block text-[12.5px] font-semibold text-brand hover:underline"
            >
              Xem chi tiết →
            </Link>
          </The>
        </div>
      </div>

      <BangGiaHan hs={hs} chiCho />

      <The
        tieuDe="Vướng mắc & khó khăn"
        phu={moVuong.length ? `${moVuong.length} đang xử lý` : 'không có vướng mắc đang mở'}
      >
        {hs.vuongMac.length === 0 ? (
          <p className="m-0 text-[13px] text-faint">Chưa ghi nhận vướng mắc nào.</p>
        ) : (
          <ul className="m-0 list-none space-y-2.5 p-0">
            {hs.vuongMac.slice(0, 6).map((v) => {
              const xong = !!v.ngayGiaiQuyet
              const soNgay = soNgayGiua(v.ngayNeu, v.ngayGiaiQuyet ?? hn)
              return (
                <li key={v.id} className="flex items-start gap-3 text-[13px]">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-6 flex-none place-items-center rounded-md text-[12px] ${xong ? 'bg-tint-ok text-ok' : 'bg-tint-warn text-warn'}`}
                  >
                    {xong ? '✓' : '!'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="text-ink">{v.noiDung}</b>
                    <span className="block text-[11.5px] text-faint">
                      Nêu: {ngayVn(v.ngayNeu)} ·{' '}
                      {xong ? (
                        <span className="text-ok">
                          Xử lý: {ngayVn(v.ngayGiaiQuyet)} · đã xử lý sau {soNgay} ngày
                        </span>
                      ) : (
                        <span className="font-semibold text-danger">đang mở {soNgay} ngày</span>
                      )}
                      {v.nhomNguyenNhan && ` · Nguyên nhân: ${NHOM_NGUYEN_NHAN[v.nhomNguyenNhan]}`}
                    </span>
                    {v.giaiPhap && !xong && (
                      <span className="block text-[12px] text-body">Giải pháp: {v.giaiPhap}</span>
                    )}
                  </span>
                  {!xong && !v.giaiPhap && <Chip mau="warn">Chưa có giải pháp</Chip>}
                </li>
              )
            })}
          </ul>
        )}
        <Link
          to="/du-an/$id"
          params={{ id: hs.id }}
          search={{ the: 'vuong-mac' }}
          className="mt-3 inline-flex items-center rounded-lg border border-brand bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-dim"
        >
          {hs.quyen.sua ? '+ Nêu vướng mắc · phân tích nguyên nhân' : 'Xem phân tích nguyên nhân, giải pháp'}
        </Link>
      </The>

      {sua && <SuaThongTin hs={hs} dong={() => datSua(false)} />}
      {mo && <ChiTietBuoc hs={hs} buocId={mo} dong={() => datMo(undefined)} />}
    </>
  )
}

function SuaThongTin({ hs, dong }: { hs: HoSoDuAn; dong: () => void }) {
  const { data: dsLv = [] } = useQuery(truyVanDanhMuc('linh-vuc'))
  const ghi = useGhiHoSo()
  const [f, datF] = useState({
    ten: hs.ten,
    trangThai: hs.trangThai,
    loaiChi: hs.loaiChi,
    nhomDuAn: hs.nhomDuAn ?? '',
    linhVucId: hs.linhVucId ?? '',
    tongMuc: String(hs.tongMuc),
    ngayBatDau: hs.ngayBatDau,
    canCu: hs.canCu ?? '',
    diaDiem: hs.diaDiem ?? '',
    tienDoMoTa: hs.tienDoMoTa ?? '',
  })
  const [canBo, datCanBo] = useState(hs.canBo)
  const doi = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    datF((c) => ({ ...c, [k]: e.target.value }))

  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () =>
        suaDuAn(hs.id, {
          ten: f.ten.trim(),
          trangThai: f.trangThai,
          loaiChi: f.loaiChi,
          ...(f.nhomDuAn ? { nhomDuAn: f.nhomDuAn } : {}),
          linhVucId: f.linhVucId || null,
          tongMuc: Math.round(Number(f.tongMuc) || 0),
          ngayBatDau: f.ngayBatDau,
          canCu: f.canCu,
          diaDiem: f.diaDiem,
          tienDoMoTa: f.tienDoMoTa,
          canBoId: canBo?.id ?? null,
        }),
      dong,
    )
  }

  return (
    <HopThoai
      tieuDe="Sửa thông tin dự án"
      phu={`${hs.ma} · ${HINH_THUC[hs.hinhThuc]}`}
      dong={dong}
      khoa={ghi.dangChay}
      rong="max-w-[760px]"
    >
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <form onSubmit={gui}>
        <ONhap id="tt-ten" nhan="Tên dự án" required maxLength={500} value={f.ten} onChange={doi('ten')} />
        <div className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-3">
          <OChon id="tt-trang-thai" nhan="Trạng thái" value={f.trangThai} onChange={doi('trangThai')}>
            {Object.entries(TRANG_THAI_DU_AN).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </OChon>
          <OChon id="tt-lv" nhan="Lĩnh vực" value={f.linhVucId} onChange={doi('linhVucId')}>
            <option value="">— Chưa chọn —</option>
            {dsLv.map((l) => (
              <option key={l.id} value={l.id}>
                {l.ten}
              </option>
            ))}
          </OChon>
          <OChon id="tt-nhom" nhan="Nhóm dự án" value={f.nhomDuAn} onChange={doi('nhomDuAn')}>
            <option value="">—</option>
            {NHOM_DU_AN.map((n) => (
              <option key={n} value={n}>
                Nhóm {n}
              </option>
            ))}
          </OChon>
          <OChon id="tt-loai-chi" nhan="Loại chi" value={f.loaiChi} onChange={doi('loaiChi')}>
            {Object.entries(LOAI_CHI).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </OChon>
          <ONhap
            id="tt-tong-muc"
            nhan="Tổng mức (triệu đồng)"
            type="number"
            min={0}
            value={f.tongMuc}
            onChange={doi('tongMuc')}
          />
          <ONhap
            id="tt-bat-dau"
            nhan="Ngày bắt đầu"
            type="date"
            required
            goiY="Đổi ngày này thì hạn mọi bước dời theo."
            value={f.ngayBatDau}
            onChange={doi('ngayBatDau')}
          />
        </div>
        <ONhap id="tt-can-cu" nhan="Căn cứ pháp lý" maxLength={500} value={f.canCu} onChange={doi('canCu')} />
        <ONhap
          id="tt-dia-diem"
          nhan="Địa điểm đầu tư"
          maxLength={300}
          value={f.diaDiem}
          onChange={doi('diaDiem')}
        />
        <ChonTaiKhoan nhan="Cán bộ phụ trách" gt={canBo} doi={datCanBo} khoa={false} />
        <div className="mb-3.5">
          <label htmlFor="tt-tien-do" className="mb-1.5 block text-[12.5px] font-semibold text-body">
            Tình hình thực hiện
          </label>
          <textarea
            id="tt-tien-do"
            rows={3}
            maxLength={4000}
            value={f.tienDoMoTa}
            onChange={doi('tienDoMoTa')}
            className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Nut onClick={dong} disabled={ghi.dangChay}>
            Hủy
          </Nut>
          <Nut type="submit" kieu="chinh" disabled={ghi.dangChay}>
            {ghi.dangChay ? 'Đang lưu…' : 'Lưu thông tin'}
          </Nut>
        </div>
      </form>
    </HopThoai>
  )
}
