/**
 * Checklist & timeline — bố cục theo PMS: bảng phân cấp (giai đoạn → nhóm → bước), lọc theo
 * giai đoạn và trạng thái, dải báo tình trạng kế hoạch. Bấm một bước mở HỘP CHI TIẾT BƯỚC
 * (ghi nhận kết quả, xin gia hạn, vướng mắc, sửa bước).
 *
 * Cột "Số ngày" và "Lũy kế" là phần cộng dồn ngày của PMS: số ngày chuẩn của bước, cộng dồn
 * của nhóm, và lũy kế từ ngày bắt đầu dự án (kế hoạch / thực tế, lệch bao nhiêu ngày).
 */
import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  congDonNhom,
  homNay,
  luyKeNgay,
  tinhTienDo,
  trangThaiBuoc,
  type BuocDuAn,
  type GiaiDoan,
  type HoSoDuAn,
  type LuyKeBuoc,
  type TrangThaiBuoc,
} from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Fragment, useMemo, useState } from 'react'
import { taiExcelChecklist } from '@/lib/bao-cao'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import { suaBuoc } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { ngayVn } from '@/lib/ngay'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, ThongBao } from '@/ui/co-ban'
import { ChipBuoc } from '../chung'
import { ChiTietBuoc } from './chi-tiet-buoc'
import { useGhiHoSo } from './ghi-ho-so'

type Loc = 'tat-ca' | 'chua-xong' | TrangThaiBuoc

const CAC_LOC: [Loc, string][] = [
  ['tat-ca', 'Tất cả trạng thái'],
  ['chua-xong', 'Chưa xong'],
  ['xong', 'Hoàn thành'],
  ['trong-han', 'Trong hạn'],
  ['sap-han', 'Sắp đến hạn'],
  ['qua-han', 'Quá hạn'],
  ['cho-xac-nhan', 'Chờ xác nhận'],
]

const LOP_CHON = 'rounded-lg border border-line bg-nen px-2.5 py-1.5 text-[13px] text-ink'
const SO_COT = 10

/** Ô lũy kế: kế hoạch; bước đã xong thì thêm thực tế và số ngày lệch. */
export function OLuyKe({ lk }: { lk: LuyKeBuoc | undefined }) {
  if (!lk || lk.keHoach === null) return null
  return (
    <>
      {lk.keHoach}
      {lk.thucTe !== null && lk.chenh !== null && (
        <span
          className={`block text-[10.5px] ${lk.chenh > 0 ? 'text-danger' : lk.chenh < 0 ? 'text-ok' : 'text-faint'}`}
          title="Lũy kế thực tế tới ngày hoàn thành"
        >
          thực tế {lk.thucTe}
          {lk.chenh !== 0 && ` (${lk.chenh > 0 ? '+' : ''}${lk.chenh})`}
        </span>
      )}
    </>
  )
}

export default function Checklist({ hs }: { hs: HoSoDuAn }) {
  const [gd, datGd] = useState<'' | GiaiDoan>('')
  const [loc, datLoc] = useState<Loc>('tat-ca')
  const [mo, datMo] = useState<string>()
  const [loiTai, datLoiTai] = useState<string>()
  const ghi = useGhiHoSo()
  const hn = homNay()
  const { nguong } = useSuspenseQuery(truyVanCongKhai).data

  const doSau = useMemo(() => {
    const cha = new Map(hs.buoc.map((b) => [b.id, b.chaId]))
    const tinh = (id: string | null, n = 0): number => (id && cha.get(id) ? tinh(cha.get(id)!, n + 1) : n)
    return new Map(hs.buoc.map((b) => [b.id, tinh(b.id)]))
  }, [hs.buoc])
  const luyKe = useMemo(() => {
    const lk = luyKeNgay(hs.buoc, hs.ngayBatDau)
    return new Map(hs.buoc.map((b, i) => [b.id, lk[i]!]))
  }, [hs.buoc, hs.ngayBatDau])
  const congDon = useMemo(() => congDonNhom(hs.buoc), [hs.buoc])

  const tt = (b: BuocDuAn) => trangThaiBuoc(b, hn, nguong.sapHanNgay)
  const hien = (b: BuocDuAn) => {
    if (loc === 'tat-ca') return true
    if (b.laNhom || b.laNhap) return false
    const k = tt(b)
    return loc === 'chua-xong' ? k !== 'xong' && k !== 'bo-qua' : k === loc
  }
  const giaiDoan = (Object.keys(GIAI_DOAN) as GiaiDoan[]).filter((g) => !gd || g === gd)

  // Tình trạng kế hoạch (như dải báo của PMS).
  const cuoi = hs.phienBan[0]
  const soNhap = hs.buoc.filter((b) => b.laNhap).length
  const soLech = hs.buoc.filter(
    (b) => !b.laNhom && !b.laNhap && b.id in hs.hanDaChot && hs.hanDaChot[b.id] !== b.han,
  ).length
  const coThayDoi = soNhap + soLech > 0
  const choGiaHan = new Set(hs.giaHan.filter((y) => y.trangThai === 'cho-duyet').map((y) => y.buocId))
  const soTep = (id: string) => hs.vanBan.filter((v) => v.buocId === id).length
  const tongNgay = Math.max(0, ...[...luyKe.values()].map((l) => l.keHoach ?? 0))

  return (
    <>
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <p className="m-0 min-w-0 flex-1 text-[12.5px] text-faint">
          Đổi mốc = sửa <b className="text-body">số ngày</b> từng bước, chuỗi phía sau tự đếm lại (kiểu
          Excel). Mọi thay đổi là <b className="text-body">nháp</b> cho tới khi bấm{' '}
          <b className="text-body">Chốt kế hoạch</b> tạo phiên bản mới.
        </p>
        <span className="flex flex-wrap gap-2">
          {hs.quyen.sua && (
            <Link
              to="/du-an/$id"
              params={{ id: hs.id }}
              search={{ the: 'ke-hoach' }}
              className="inline-flex items-center rounded-lg border border-brand bg-brand px-3.5 py-[7px] text-[13px] font-semibold text-white hover:bg-brand-dim"
            >
              + Thêm bước
            </Link>
          )}
          <Nut
            onClick={() => {
              datLoiTai(undefined)
              taiExcelChecklist(hs.id).catch((e: unknown) =>
                datLoiTai(e instanceof LoiApi ? e.message : 'Không tải được tệp.'),
              )
            }}
          >
            ⬇ Xuất Excel
          </Nut>
        </span>
      </div>

      {loiTai && <ThongBao kieu="loi">{loiTai}</ThongBao>}
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <div
        className={`mb-3 rounded-lg border px-3.5 py-2 text-[12.8px] ${coThayDoi ? 'border-warn bg-tint-warn text-warn' : 'border-ok bg-tint-ok text-ok'}`}
      >
        {coThayDoi ? (
          <>
            📝 Đang lưu nháp — <b>{soNhap + soLech}</b> thay đổi chưa chốt ({soLech} bước đổi hạn, {soNhap}{' '}
            bước thêm).{' '}
            <Link
              to="/du-an/$id"
              params={{ id: hs.id }}
              search={{ the: 'ke-hoach' }}
              className="font-bold underline"
            >
              Chốt kế hoạch v{(cuoi?.so ?? 1) + 1}
            </Link>
          </>
        ) : (
          <>
            ✓ Đang theo <b>kế hoạch đã chốt v{cuoi?.so ?? 1}</b> — chưa có thay đổi nháp.
          </>
        )}
        {choGiaHan.size > 0 && (
          <span className="ml-2 font-semibold text-warn">· {choGiaHan.size} yêu cầu gia hạn chờ duyệt</span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          aria-label="Lọc theo giai đoạn"
          value={gd}
          onChange={(e) => datGd(e.target.value as '' | GiaiDoan)}
          className={LOP_CHON}
        >
          <option value="">Tất cả giai đoạn</option>
          {(Object.keys(GIAI_DOAN) as GiaiDoan[]).map((g) => (
            <option key={g} value={g}>
              {g} — {GIAI_DOAN[g]}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          value={loc}
          onChange={(e) => datLoc(e.target.value as Loc)}
          className={LOP_CHON}
        >
          {CAC_LOC.map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12px] text-faint">
          Tổng thời gian kế hoạch: <b className="text-body tabular-nums">{tongNgay}</b> ngày từ{' '}
          {ngayVn(hs.ngayBatDau)}
        </span>
      </div>

      <KhungBang nhan="Checklist các bước">
        <thead>
          <tr>
            <th className={LOP_TH}>STT</th>
            <th className={LOP_TH}>Nội dung công việc</th>
            <th className={`${LOP_TH} text-right`}>Số ngày</th>
            <th className={`${LOP_TH} text-right`} title="Số ngày cộng dồn từ ngày bắt đầu dự án">
              Lũy kế
            </th>
            <th className={LOP_TH}>Văn bản</th>
            <th className={LOP_TH}>Ngày kế hoạch</th>
            <th className={LOP_TH}>Ngày hoàn thành</th>
            <th className={LOP_TH}>Đơn vị</th>
            <th className={LOP_TH}>Trạng thái</th>
            <th className={`${LOP_TH} text-center`} title="Bước có hiện ở thẻ Tổng quan không">
              Hiển thị tổng quan
            </th>
          </tr>
        </thead>
        <tbody>
          {giaiDoan.map((g) => {
            const trongGd = hs.buoc.filter((b) => b.giaiDoan === g)
            const hienGd = trongGd.filter(hien)
            if (!hienGd.length) return null
            const that = trongGd.filter(tinhTienDo)
            return (
              <Fragment key={g}>
                <tr>
                  <td colSpan={SO_COT} className="be-mat-dam px-3 py-2 text-[12.5px] font-bold text-white">
                    <span className="mr-2 inline-grid size-[22px] place-items-center rounded-full border border-vang text-[11px] text-vang">
                      {g}
                    </span>
                    {GIAI_DOAN[g]}
                    <span className="float-right font-normal opacity-85">
                      {that.length} bước · {that.filter((b) => b.ngayHoanThanh).length}/{that.length} hoàn
                      thành · {that.reduce((t, b) => t + b.soNgay, 0)} ngày
                    </span>
                  </td>
                </tr>
                {hienGd.map((b) => {
                  const trangThai = tt(b)
                  const thut = { paddingLeft: `${12 + (doSau.get(b.id) ?? 0) * 18}px` }
                  if (b.laNhom)
                    return (
                      <tr key={b.id} className="bg-nen-2">
                        <td className={`${LOP_TD} font-semibold whitespace-nowrap tabular-nums`}>{b.stt}</td>
                        <td className={`${LOP_TD} font-semibold text-ink`} style={thut}>
                          <span aria-hidden="true">📁 </span>
                          {b.ten}
                        </td>
                        <td
                          className={`${LOP_TD} text-right text-faint italic tabular-nums`}
                          title="Cộng dồn số ngày các bước con"
                        >
                          {congDon.get(b.id) ?? 0}
                        </td>
                        <td colSpan={SO_COT - 3} className={LOP_TD} />
                      </tr>
                    )
                  const tep = soTep(b.id)
                  return (
                    <tr key={b.id} className={b.laNhap ? 'opacity-70' : undefined}>
                      <td className={`${LOP_TD} whitespace-nowrap text-faint tabular-nums`}>{b.stt}</td>
                      <td className={`${LOP_TD} min-w-[260px]`} style={thut}>
                        <button
                          type="button"
                          onClick={() => datMo(b.id)}
                          className={`text-left hover:underline ${b.boQua ? 'text-faint line-through' : trangThai === 'xong' ? 'text-ok' : 'text-ink'} ${b.laNhap ? 'italic' : ''}`}
                        >
                          {b.ten}
                        </button>
                        {b.ghiChu && (
                          <span className="line-clamp-2 block text-[11.5px] text-faint">{b.ghiChu}</span>
                        )}
                        {choGiaHan.has(b.id) && (
                          <span className="mt-0.5 inline-block rounded bg-tint-warn px-1.5 py-px text-[10.5px] font-bold text-warn">
                            Chờ duyệt gia hạn
                          </span>
                        )}
                      </td>
                      <td className={`${LOP_TD} text-right tabular-nums`}>{b.soNgay}</td>
                      <td className={`${LOP_TD} text-right tabular-nums`}>
                        <OLuyKe lk={luyKe.get(b.id)} />
                      </td>
                      <td className={`${LOP_TD} max-w-[170px] text-[12px]`}>
                        {b.soVanBan && (
                          <span className="inline-block rounded border-l-2 border-vang bg-nen-2 px-1.5 py-0.5 font-serif">
                            {b.soVanBan}
                          </span>
                        )}
                        {tep > 0 && <span className="ml-1 text-faint">📎 {tep}</span>}
                      </td>
                      <td className={`${LOP_TD} font-semibold whitespace-nowrap tabular-nums`}>
                        {ngayVn(b.han)}
                        {b.hanGhiDe && (
                          <span className="block text-[10.5px] font-normal text-faint">đặt ngày cụ thể</span>
                        )}
                      </td>
                      <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>
                        {b.ngayHoanThanh ? ngayVn(b.ngayHoanThanh) : ''}
                      </td>
                      <td className={`${LOP_TD} text-[12px]`}>
                        {b.donViThucHien ?? BEN_THUC_HIEN[b.benThucHien]}
                      </td>
                      <td className={LOP_TD}>
                        {b.laNhap ? <Chip mau="tim">Nháp</Chip> : <ChipBuoc tt={trangThai} />}
                      </td>
                      <td className={`${LOP_TD} text-center`}>
                        <input
                          type="checkbox"
                          aria-label={`Hiện bước ${b.stt} ở Tổng quan`}
                          checked={!b.anTongQuan}
                          disabled={!hs.quyen.sua || ghi.dangChay}
                          onChange={(e) =>
                            ghi.chay(() => suaBuoc(hs.id, b.id, { anTongQuan: !e.target.checked }))
                          }
                          className="size-4 accent-brand"
                        />
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            )
          })}
          {!hs.buoc.some((b) => (!gd || b.giaiDoan === gd) && hien(b)) && (
            <tr>
              <td colSpan={SO_COT} className={`${LOP_TD} text-center text-faint`}>
                {hs.buoc.length
                  ? 'Không có bước nào khớp bộ lọc.'
                  : 'Dự án chưa có bước nào (quy trình trắng).'}
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>

      {mo && <ChiTietBuoc hs={hs} buocId={mo} dong={() => datMo(undefined)} />}
    </>
  )
}
