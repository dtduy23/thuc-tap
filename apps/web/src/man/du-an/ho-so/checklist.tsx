import { useSuspenseQuery } from '@tanstack/react-query'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  homNay,
  tinhTienDo,
  trangThaiBuoc,
  type BuocDuAn,
  type GiaiDoan,
  type HoSoDuAn,
  type TrangThaiBuoc,
} from '@gdos/shared'
import { Fragment, useMemo, useState } from 'react'
import { taiExcelChecklist } from '@/lib/bao-cao'
import { suaBuoc, thaoTacBuoc, xoaBuoc } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, ThongBao } from '@/ui/co-ban'
import { ChipBuoc } from '../chung'
import { useGhiHoSo } from './ghi-ho-so'

type Loc = 'tat-ca' | 'chua-xong' | TrangThaiBuoc

const CAC_LOC: [Loc, string][] = [
  ['tat-ca', 'Tất cả'],
  ['chua-xong', 'Chưa xong'],
  ['qua-han', 'Quá hạn'],
  ['sap-han', 'Sắp đến hạn'],
  ['cho-xac-nhan', 'Chờ xác nhận'],
  ['xong', 'Đã xong'],
]

/**
 * Checklist & tiến độ — các bước theo 3 giai đoạn, mẹ-con nhiều cấp (như PMS).
 * Bấm "Xử lý" mở ngay dưới dòng: ghi nhận, bỏ qua, sửa hạn (chủ đầu tư); gửi cập
 * nhật (nhà thầu); xác nhận / trả lại (chủ đầu tư, lãnh đạo).
 */
export default function Checklist({ hs }: { hs: HoSoDuAn }) {
  const [loc, datLoc] = useState<Loc>('tat-ca')
  const [mo, datMo] = useState<string>()
  const [loiTai, datLoiTai] = useState<string>()
  const hn = homNay()
  const { nguong } = useSuspenseQuery(truyVanCongKhai).data

  const doSau = useMemo(() => {
    const cha = new Map(hs.buoc.map((b) => [b.id, b.chaId]))
    const tinh = (id: string | null, n = 0): number => (id && cha.get(id) ? tinh(cha.get(id)!, n + 1) : n)
    return new Map(hs.buoc.map((b) => [b.id, tinh(b.id)]))
  }, [hs.buoc])

  const tt = (b: BuocDuAn) => trangThaiBuoc(b, hn, nguong.sapHanNgay)
  const dem = useMemo(() => {
    const d: Partial<Record<Loc, number>> = {}
    for (const b of hs.buoc.filter(tinhTienDo)) {
      const k = tt(b)
      d[k] = (d[k] ?? 0) + 1
      if (k !== 'xong') d['chua-xong'] = (d['chua-xong'] ?? 0) + 1
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `hn` đổi theo ngày, tính lại khi hồ sơ đổi là đủ
  }, [hs.buoc])

  const hien = (b: BuocDuAn) => {
    if (loc === 'tat-ca') return true
    if (b.laNhom || b.laNhap) return false
    const k = tt(b)
    return loc === 'chua-xong' ? k !== 'xong' && k !== 'bo-qua' : k === loc
  }
  const giaiDoan = Object.keys(GIAI_DOAN) as GiaiDoan[]

  return (
    <>
      {loiTai && <ThongBao kieu="loi">{loiTai}</ThongBao>}
      <div role="group" aria-label="Lọc bước" className="mb-3 flex flex-wrap items-center gap-1">
        {CAC_LOC.map(([k, n]) => (
          <button
            key={k}
            type="button"
            aria-pressed={loc === k}
            onClick={() => datLoc(k)}
            className={`rounded-full border px-2.5 py-0.5 text-[12px] ${loc === k ? 'border-brand bg-tint-brand font-semibold text-brand' : 'border-line text-body hover:bg-nav-hover'}`}
          >
            {n}
            {k !== 'tat-ca' && <span className="ml-1 text-faint tabular-nums">{dem[k] ?? 0}</span>}
          </button>
        ))}
        <span className="ml-auto">
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

      <KhungBang nhan="Checklist các bước">
        <thead>
          <tr>
            <th className={LOP_TH}>STT</th>
            <th className={LOP_TH}>Công việc</th>
            <th className={LOP_TH}>Bên</th>
            <th className={`${LOP_TH} text-right`}>Ngày</th>
            <th className={LOP_TH}>Hạn</th>
            <th className={LOP_TH}>Hoàn thành</th>
            <th className={LOP_TH}>Trạng thái</th>
            <th className={LOP_TH}>
              <span className="sr-only">Xử lý</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {giaiDoan.map((gd) => {
            const trongGd = hs.buoc.filter((b) => b.giaiDoan === gd)
            const hienGd = trongGd.filter(hien)
            if (!hienGd.length) return null
            const that = trongGd.filter(tinhTienDo)
            return (
              <Fragment key={gd}>
                <tr>
                  <td colSpan={8} className="be-mat-dam px-3 py-1.5 text-[12px] font-bold text-white">
                    <span className="mr-2 text-vang">{gd}</span>
                    {GIAI_DOAN[gd]}
                    <span className="ml-2 font-normal opacity-80">
                      {that.filter((b) => b.ngayHoanThanh).length}/{that.length} bước
                    </span>
                  </td>
                </tr>
                {hienGd.map((b) => {
                  const trangThai = tt(b)
                  const dangMo = mo === b.id
                  return (
                    <Fragment key={b.id}>
                      <tr className={b.laNhom ? 'bg-nen-2' : dangMo ? 'bg-tint-brand' : undefined}>
                        <td className={`${LOP_TD} whitespace-nowrap tabular-nums text-faint`}>{b.stt}</td>
                        <td
                          className={LOP_TD}
                          style={{ paddingLeft: `${12 + (doSau.get(b.id) ?? 0) * 16}px` }}
                        >
                          <span
                            className={
                              b.laNhom
                                ? 'font-semibold text-ink'
                                : b.boQua
                                  ? 'text-faint line-through'
                                  : b.laNhap
                                    ? 'italic'
                                    : ''
                            }
                          >
                            {b.ten}
                          </span>
                          {b.soVanBan && <span className="block text-[11.5px] text-faint">{b.soVanBan}</span>}
                        </td>
                        <td className={`${LOP_TD} whitespace-nowrap text-[12px]`}>
                          {b.laNhom ? '' : BEN_THUC_HIEN[b.benThucHien]}
                        </td>
                        <td className={`${LOP_TD} text-right tabular-nums`}>{b.laNhom ? '' : b.soNgay}</td>
                        <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>
                          {b.laNhom ? '' : ngayVn(b.han)}
                          {b.hanGhiDe && <span className="block text-[10.5px] text-faint">đã ghi đè</span>}
                        </td>
                        <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>
                          {b.ngayHoanThanh ? ngayVn(b.ngayHoanThanh) : ''}
                        </td>
                        <td className={LOP_TD}>
                          {b.laNhap ? <Chip mau="tim">Nháp</Chip> : !b.laNhom && <ChipBuoc tt={trangThai} />}
                        </td>
                        <td className={`${LOP_TD} text-right`}>
                          {!b.laNhom && (
                            <Nut
                              onClick={() => datMo(dangMo ? undefined : b.id)}
                              aria-expanded={dangMo}
                              className="!py-0.5"
                            >
                              {dangMo ? 'Đóng' : 'Xử lý'}
                            </Nut>
                          )}
                        </td>
                      </tr>
                      {dangMo && (
                        <tr>
                          <td colSpan={8} className={`${LOP_TD} bg-nen-2`}>
                            <XuLyBuoc hs={hs} b={b} tt={trangThai} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </Fragment>
            )
          })}
          {!hs.buoc.some(hien) && (
            <tr>
              <td colSpan={8} className={`${LOP_TD} text-center text-faint`}>
                {hs.buoc.length
                  ? 'Không có bước nào khớp bộ lọc.'
                  : 'Dự án chưa có bước nào (quy trình trắng).'}
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>
    </>
  )
}

const LOP_O = 'rounded-md border border-line bg-nen px-2 py-1 text-[13px] text-ink'

function XuLyBuoc({ hs, b, tt }: { hs: HoSoDuAn; b: BuocDuAn; tt: TrangThaiBuoc }) {
  const ghi = useGhiHoSo()
  const hn = homNay()
  const [ngay, datNgay] = useState(b.choXacNhan?.ngay ?? hn)
  const [soVanBan, datSoVanBan] = useState(b.soVanBan ?? '')
  const [ghiChu, datGhiChu] = useState('')
  const [lyDo, datLyDo] = useState('')
  const [soNgay, datSoNgay] = useState(String(b.soNgay))
  const [hanGhiDe, datHanGhiDe] = useState(b.hanGhiDe ?? '')
  const [ten, datTen] = useState(b.ten)
  const q = hs.quyen
  const tac = (loai: Parameters<typeof thaoTacBuoc>[2], body?: Record<string, unknown>) =>
    ghi.chay(() => thaoTacBuoc(hs.id, b.id, loai, body))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <dl className="m-0 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1 text-[12.5px]">
        <dt className="text-faint">Đơn vị thực hiện</dt>
        <dd className="m-0">{b.donViThucHien ?? '—'}</dd>
        <dt className="text-faint">Ghi chú</dt>
        <dd className="m-0 whitespace-pre-line">{b.ghiChu ?? '—'}</dd>
        {b.sanPham && (
          <>
            <dt className="text-faint">Sản phẩm</dt>
            <dd className="m-0">{b.sanPham}</dd>
          </>
        )}
        {b.boQua && (
          <>
            <dt className="text-faint">Lý do bỏ qua</dt>
            <dd className="m-0">{b.lyDoBoQua}</dd>
          </>
        )}
        {b.choXacNhan && (
          <>
            <dt className="text-faint">Chờ xác nhận</dt>
            <dd className="m-0">
              <b>{b.choXacNhan.nguoiGuiTen ?? 'Nhà thầu'}</b> báo xong ngày {ngayVn(b.choXacNhan.ngay)}
              {b.choXacNhan.ghiChu && ` — “${b.choXacNhan.ghiChu}”`}
              <span className="block text-faint">gửi lúc {ngayGio(b.choXacNhan.luc)}</span>
            </dd>
          </>
        )}
      </dl>

      <div className="space-y-3">
        {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
        {b.laNhap && (
          <ThongBao>
            Bước nháp — chưa tính hạn, chưa vào tiến độ. Chốt ở thẻ “Kế hoạch & điều chỉnh” để bước thành
            chính thức.
          </ThongBao>
        )}

        {q.sua && !b.batBuoc && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[220px] flex-1 text-[12px] text-faint">
              Tên bước (bước tự thêm)
              <input
                value={ten}
                maxLength={500}
                onChange={(e) => datTen(e.target.value)}
                className={`${LOP_O} block w-full`}
              />
            </label>
            <Nut
              disabled={ghi.dangChay || !ten.trim() || ten === b.ten}
              onClick={() => ghi.chay(() => suaBuoc(hs.id, b.id, { ten: ten.trim() }))}
            >
              Lưu tên
            </Nut>
            <Nut
              kieu="nguy-hiem"
              disabled={ghi.dangChay}
              onClick={() => {
                if (confirm(`Xóa bước “${b.ten}”?`)) ghi.chay(() => xoaBuoc(hs.id, b.id))
              }}
            >
              Xóa bước
            </Nut>
          </div>
        )}

        {q.xacNhan && b.choXacNhan && (
          <div className="flex flex-wrap gap-2">
            <Nut kieu="chinh" disabled={ghi.dangChay} onClick={() => tac('xac-nhan', { dongY: true })}>
              Xác nhận hoàn thành
            </Nut>
            <Nut disabled={ghi.dangChay} onClick={() => tac('xac-nhan', { dongY: false })}>
              Trả lại
            </Nut>
          </div>
        )}

        {q.sua && !b.boQua && !b.laNhap && tt !== 'xong' && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[12px] text-faint">
              Ngày hoàn thành
              <input
                type="date"
                value={ngay}
                onChange={(e) => datNgay(e.target.value)}
                className={`${LOP_O} block`}
              />
            </label>
            <label className="min-w-[180px] flex-1 text-[12px] text-faint">
              Số văn bản
              <input
                value={soVanBan}
                maxLength={300}
                placeholder="VD: Quyết định số …"
                onChange={(e) => datSoVanBan(e.target.value)}
                className={`${LOP_O} block w-full`}
              />
            </label>
            <Nut
              kieu="chinh"
              disabled={ghi.dangChay || !ngay}
              onClick={() => tac('hoan-thanh', { ngay, soVanBan: soVanBan.trim() || null })}
            >
              Ghi nhận hoàn thành
            </Nut>
          </div>
        )}

        {q.sua && tt === 'xong' && (
          <Nut disabled={ghi.dangChay} onClick={() => tac('bo-hoan-thanh')}>
            Bỏ hoàn thành (ghi nhận nhầm)
          </Nut>
        )}

        {q.gui && !b.boQua && !b.laNhap && tt !== 'xong' && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[12px] text-faint">
              Ngày hoàn thành
              <input
                type="date"
                value={ngay}
                onChange={(e) => datNgay(e.target.value)}
                className={`${LOP_O} block`}
              />
            </label>
            <label className="min-w-[180px] flex-1 text-[12px] text-faint">
              Ghi chú cho chủ đầu tư
              <input
                value={ghiChu}
                maxLength={2000}
                onChange={(e) => datGhiChu(e.target.value)}
                className={`${LOP_O} block w-full`}
              />
            </label>
            <Nut kieu="chinh" disabled={ghi.dangChay || !ngay} onClick={() => tac('gui', { ngay, ghiChu })}>
              {b.choXacNhan ? 'Gửi lại cập nhật' : 'Gửi cập nhật'}
            </Nut>
          </div>
        )}

        {q.sua && (
          <details className="text-[12.5px]">
            <summary className="cursor-pointer text-faint hover:text-body">
              Sửa số ngày, hạn · bỏ qua bước
            </summary>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-[12px] text-faint">
                Số ngày chuẩn
                <input
                  type="number"
                  min={0}
                  value={soNgay}
                  onChange={(e) => datSoNgay(e.target.value)}
                  className={`${LOP_O} block w-20`}
                />
              </label>
              <label className="text-[12px] text-faint">
                Hạn ghi đè
                <input
                  type="date"
                  value={hanGhiDe}
                  onChange={(e) => datHanGhiDe(e.target.value)}
                  className={`${LOP_O} block`}
                />
              </label>
              <Nut
                disabled={ghi.dangChay}
                onClick={() =>
                  ghi.chay(() =>
                    suaBuoc(hs.id, b.id, {
                      soNgay: Math.max(0, Math.round(Number(soNgay) || 0)),
                      hanGhiDe: hanGhiDe || null,
                    }),
                  )
                }
              >
                Lưu hạn
              </Nut>
            </div>
            <p className="mt-1 mb-0 text-[11.5px] text-faint">
              Đổi số ngày hay hạn thì hạn các bước sau dời theo. Hạn ghi đè để trống = tính theo số ngày.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              {b.boQua ? (
                <Nut disabled={ghi.dangChay} onClick={() => tac('khoi-phuc')}>
                  Khôi phục bước
                </Nut>
              ) : (
                <>
                  <label className="min-w-[220px] flex-1 text-[12px] text-faint">
                    Lý do / căn cứ bỏ qua
                    <input
                      value={lyDo}
                      maxLength={1000}
                      onChange={(e) => datLyDo(e.target.value)}
                      className={`${LOP_O} block w-full`}
                    />
                  </label>
                  <Nut
                    kieu="nguy-hiem"
                    disabled={ghi.dangChay || !lyDo.trim()}
                    onClick={() => tac('bo-qua', { lyDo })}
                  >
                    Bỏ qua bước
                  </Nut>
                </>
              )}
            </div>
          </details>
        )}

        {!q.sua && !q.gui && !(q.xacNhan && b.choXacNhan) && (
          <p className="m-0 text-[12.5px] text-faint">Bạn chỉ xem bước này.</p>
        )}
      </div>
    </div>
  )
}
