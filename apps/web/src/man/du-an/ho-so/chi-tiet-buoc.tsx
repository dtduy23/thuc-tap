/**
 * HỘP CHI TIẾT MỘT BƯỚC — theo hộp "ghi nhận kết quả" của PMS. Bốn phần:
 *   Ghi nhận kết quả · Xin gia hạn · Vướng mắc của bước · Sửa bước
 * Mở từ Checklist và từ Tổng quan. Ai được làm gì do `hs.quyen` (API tính) quyết định.
 */
import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  homNay,
  luyKeNgay,
  trangThaiBuoc,
  type BuocDuAn,
  type HoSoDuAn,
} from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { truyVanCongKhai } from '@/lib/cau-hinh'
import { duongDanTaiVe, neuVuongMac, suaBuoc, thaoTacBuoc, xoaBuoc } from '@/lib/du-an'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { ChonCheDo, HopThoai } from '@/man/van-ban/chung'
import { ChipBuoc } from '../chung'
import { FormXinGiaHan } from './gia-han'
import { useGhiHoSo } from './ghi-ho-so'

type Phan = 'ghi-nhan' | 'gia-han' | 'vuong-mac' | 'sua'

const LOP_O = 'rounded-md border border-line bg-nen px-2 py-1.5 text-[13px] text-ink'
const LOP_NHAN = 'block text-[11.5px] font-semibold tracking-[.04em] text-faint uppercase'

export function ChiTietBuoc({ hs, buocId, dong }: { hs: HoSoDuAn; buocId: string; dong: () => void }) {
  const b = hs.buoc.find((x) => x.id === buocId)
  const [phan, datPhan] = useState<Phan>('ghi-nhan')
  const { nguong } = useSuspenseQuery(truyVanCongKhai).data
  if (!b) return null

  const hn = homNay()
  const tt = trangThaiBuoc(b, hn, nguong.sapHanNgay)
  const cha = b.chaId ? hs.buoc.find((x) => x.id === b.chaId) : undefined
  const lk = luyKeNgay(hs.buoc, hs.ngayBatDau)[hs.buoc.indexOf(b)]
  const vuong = hs.vuongMac.filter((v) => v.buocId === b.id)
  const choGiaHan = hs.giaHan.some((y) => y.buocId === b.id && y.trangThai === 'cho-duyet')
  const duocGiaHan = !b.laNhap && !b.boQua && !b.ngayHoanThanh && (hs.quyen.xinGiaHan || choGiaHan)

  const muc: { id: Phan; nhan: string }[] = [
    { id: 'ghi-nhan', nhan: 'Ghi nhận kết quả' },
    ...(duocGiaHan
      ? [{ id: 'gia-han' as const, nhan: choGiaHan ? 'Gia hạn (chờ duyệt)' : 'Xin gia hạn' }]
      : []),
    { id: 'vuong-mac', nhan: `Vướng mắc (${vuong.filter((v) => !v.ngayGiaiQuyet).length})` },
    ...(hs.quyen.sua ? [{ id: 'sua' as const, nhan: 'Sửa bước' }] : []),
  ]
  const dangXem = muc.some((m) => m.id === phan) ? phan : 'ghi-nhan'

  return (
    <HopThoai
      tieuDe={`${b.stt}. ${b.ten}`}
      dong={dong}
      rong="max-w-[820px]"
      chan={<Nut onClick={dong}>Đóng</Nut>}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {b.laNhap ? <Chip mau="tim">Nháp</Chip> : <ChipBuoc tt={tt} />}
        {tt === 'qua-han' && b.han && (
          <b className="text-[12.5px] text-danger">
            chậm {Math.round((Date.parse(hn) - Date.parse(b.han)) / 864e5)} ngày so kế hoạch
          </b>
        )}
        {choGiaHan && <Chip mau="warn">Chờ duyệt gia hạn</Chip>}
      </div>
      <dl className="m-0 mb-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
        <dt className="text-faint">Giai đoạn</dt>
        <dd className="m-0 font-semibold">
          {b.giaiDoan} — {GIAI_DOAN[b.giaiDoan]}
        </dd>
        {cha && (
          <>
            <dt className="text-faint">Thuộc nhóm</dt>
            <dd className="m-0 font-semibold">
              {cha.stt}. {cha.ten}
            </dd>
          </>
        )}
        <dt className="text-faint">Đơn vị thực hiện</dt>
        <dd className="m-0">
          {b.donViThucHien ?? '—'} <span className="text-faint">({BEN_THUC_HIEN[b.benThucHien]})</span>
        </dd>
        {!b.laNhap && (
          <>
            <dt className="text-faint">Hạn dự kiến</dt>
            <dd className="m-0">
              <b>{ngayVn(b.han)}</b>{' '}
              <span className="text-faint">
                ({b.hanGhiDe ? 'đặt ngày cụ thể' : 'tự tính'} · {b.soNgay} ngày
                {lk?.keHoach != null && ` · lũy kế ${lk.keHoach} ngày từ khi bắt đầu`})
              </span>
            </dd>
          </>
        )}
        {b.ngayHoanThanh && (
          <>
            <dt className="text-faint">Hoàn thành</dt>
            <dd className="m-0">
              <b>{ngayVn(b.ngayHoanThanh)}</b>
              {lk?.chenh != null && lk.chenh !== 0 && (
                <span className={`ml-2 ${lk.chenh > 0 ? 'text-danger' : 'text-ok'}`}>
                  {lk.chenh > 0 ? `chậm ${lk.chenh} ngày` : `sớm ${-lk.chenh} ngày`}
                </span>
              )}
              {b.soVanBan && <span className="ml-2 text-faint">· {b.soVanBan}</span>}
            </dd>
          </>
        )}
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
      </dl>

      <div className="mb-3">
        <ChonCheDo giaTri={dangXem} doi={datPhan} muc={muc} />
      </div>
      {dangXem === 'ghi-nhan' && <GhiNhan key={b.id} hs={hs} b={b} daXong={tt === 'xong'} />}
      {dangXem === 'gia-han' && <FormXinGiaHan hs={hs} b={b} />}
      {dangXem === 'vuong-mac' && <VuongMacCuaBuoc hs={hs} b={b} />}
      {dangXem === 'sua' && <SuaBuoc key={b.id} hs={hs} b={b} dong={dong} />}
    </HopThoai>
  )
}

function GhiNhan({ hs, b, daXong }: { hs: HoSoDuAn; b: BuocDuAn; daXong: boolean }) {
  const ghi = useGhiHoSo()
  const [ngay, datNgay] = useState(b.choXacNhan?.ngay ?? homNay())
  const [soVanBan, datSoVanBan] = useState(b.soVanBan ?? '')
  const [ghiChu, datGhiChu] = useState(b.ghiChu ?? '')
  const [ghiChuGui, datGhiChuGui] = useState('')
  const q = hs.quyen
  const tep = hs.vanBan.filter((v) => v.buocId === b.id)
  const nhanDuoc = !b.boQua && !b.laNhap && !daXong

  const hoanThanh = async () => {
    // Kết quả / ghi chú triển khai lưu vào bước trước, rồi mới ghi nhận hoàn thành.
    if (ghiChu.trim() !== (b.ghiChu ?? '')) await suaBuoc(hs.id, b.id, { ghiChu: ghiChu.trim() })
    return thaoTacBuoc(hs.id, b.id, 'hoan-thanh', { ngay, soVanBan: soVanBan.trim() || null })
  }

  return (
    <div className="space-y-3">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {b.laNhap && (
        <ThongBao>
          Bước nháp — chưa tính hạn, chưa vào tiến độ. Chốt ở thẻ “Kế hoạch & điều chỉnh” để bước thành chính
          thức.
        </ThongBao>
      )}

      {b.choXacNhan && (
        <div className="rounded-lg border border-tim/40 bg-tint-tim p-3 text-[13px]">
          <b>{b.choXacNhan.nguoiGuiTen ?? 'Nhà thầu'}</b> báo xong ngày {ngayVn(b.choXacNhan.ngay)}
          {b.choXacNhan.ghiChu && ` — “${b.choXacNhan.ghiChu}”`}
          <span className="block text-[11.5px] text-faint">gửi lúc {ngayGio(b.choXacNhan.luc)}</span>
          {q.xacNhan && (
            <span className="mt-2 flex flex-wrap gap-2">
              <Nut
                kieu="chinh"
                disabled={ghi.dangChay}
                onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'xac-nhan', { dongY: true }))}
              >
                Xác nhận hoàn thành
              </Nut>
              <Nut
                disabled={ghi.dangChay}
                onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'xac-nhan', { dongY: false }))}
              >
                Trả lại
              </Nut>
            </span>
          )}
        </div>
      )}

      {q.sua && nhanDuoc && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LOP_NHAN}>
              Ngày hoàn thành / ngày văn bản *
              <input
                type="date"
                value={ngay}
                onChange={(e) => datNgay(e.target.value)}
                className={`${LOP_O} mt-1 block w-full normal-case`}
              />
            </label>
            <label className={LOP_NHAN}>
              Số / ký hiệu
              <input
                value={soVanBan}
                maxLength={300}
                placeholder="VD: Quyết định số 145/QĐ-UBND"
                onChange={(e) => datSoVanBan(e.target.value)}
                className={`${LOP_O} mt-1 block w-full normal-case`}
              />
            </label>
          </div>
          <label className={LOP_NHAN}>
            Kết quả / ghi chú triển khai
            <textarea
              rows={2}
              value={ghiChu}
              maxLength={2000}
              onChange={(e) => datGhiChu(e.target.value)}
              className={`${LOP_O} mt-1 block w-full normal-case`}
            />
          </label>
          <Nut kieu="chinh" disabled={ghi.dangChay || !ngay} onClick={() => ghi.chay(hoanThanh)}>
            ✓ Ghi nhận hoàn thành
          </Nut>
        </>
      )}

      {q.sua && daXong && (
        <Nut
          disabled={ghi.dangChay}
          onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'bo-hoan-thanh'))}
        >
          ↩ Bỏ đánh dấu hoàn thành (ghi nhận nhầm)
        </Nut>
      )}

      {q.gui && nhanDuoc && (
        <>
          <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
            <label className={LOP_NHAN}>
              Ngày hoàn thành
              <input
                type="date"
                value={ngay}
                onChange={(e) => datNgay(e.target.value)}
                className={`${LOP_O} mt-1 block w-full normal-case`}
              />
            </label>
            <label className={LOP_NHAN}>
              Ghi chú cho chủ đầu tư
              <input
                value={ghiChuGui}
                maxLength={2000}
                onChange={(e) => datGhiChuGui(e.target.value)}
                className={`${LOP_O} mt-1 block w-full normal-case`}
              />
            </label>
          </div>
          <Nut
            kieu="chinh"
            disabled={ghi.dangChay || !ngay}
            onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'gui', { ngay, ghiChu: ghiChuGui }))}
          >
            {b.choXacNhan ? 'Gửi lại cập nhật' : 'Gửi cập nhật tiến độ'}
          </Nut>
        </>
      )}

      {b.ghiChu && !(q.sua && nhanDuoc) && (
        <p className="m-0 text-[13px] whitespace-pre-line">
          <span className="text-faint">Kết quả / ghi chú: </span>
          {b.ghiChu}
        </p>
      )}

      <div>
        <span className={LOP_NHAN}>Văn bản đính kèm ({tep.length})</span>
        {tep.length === 0 ? (
          <p className="mt-1 mb-0 text-[12.5px] text-faint">Chưa có văn bản đính kèm cho bước này.</p>
        ) : (
          <ul className="mt-1 mb-0 list-none p-0 text-[13px]">
            {tep.map((v) => (
              <li key={v.id}>
                📎{' '}
                <a href={duongDanTaiVe(hs.id, v.id)} className="font-semibold text-brand hover:underline">
                  {v.tieuDe ?? v.tenTep}
                </a>
                {v.soKyHieu && <span className="text-faint"> · {v.soKyHieu}</span>}
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/du-an/$id"
          params={{ id: hs.id }}
          search={{ the: 'van-ban' }}
          className="mt-1 inline-block text-[12.5px] font-semibold text-brand hover:underline"
        >
          Đính kèm ở thẻ Văn bản dự án →
        </Link>
      </div>

      {!q.sua && !q.gui && !(q.xacNhan && b.choXacNhan) && (
        <p className="m-0 text-[12.5px] text-faint">Bạn chỉ xem bước này.</p>
      )}
    </div>
  )
}

function VuongMacCuaBuoc({ hs, b }: { hs: HoSoDuAn; b: BuocDuAn }) {
  const ghi = useGhiHoSo()
  const [noiDung, datNoiDung] = useState('')
  const ds = hs.vuongMac.filter((v) => v.buocId === b.id)
  return (
    <div>
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {ds.length === 0 ? (
        <p className="mt-0 mb-3 text-[13px] text-faint">Bước này chưa có vướng mắc nào.</p>
      ) : (
        <ul className="mt-0 mb-3 list-none space-y-2 p-0">
          {ds.map((v) => (
            <li
              key={v.id}
              className={`rounded-lg border p-2.5 text-[13px] ${v.ngayGiaiQuyet ? 'border-line' : 'border-danger/40 bg-tint-danger/40'}`}
            >
              {v.noiDung}
              <span className="block text-[11.5px] text-faint">
                Nêu {ngayVn(v.ngayNeu)}
                {v.ngayGiaiQuyet ? ` · đã giải quyết ${ngayVn(v.ngayGiaiQuyet)}` : ' · đang mở'}
                {v.giaiPhap ? ` · Giải pháp: ${v.giaiPhap}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hs.quyen.sua && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[240px] flex-1 text-[12px] text-faint">
            Nêu vướng mắc của bước này
            <input
              value={noiDung}
              maxLength={4000}
              onChange={(e) => datNoiDung(e.target.value)}
              className={`${LOP_O} mt-1 block w-full`}
            />
          </label>
          <Nut
            kieu="chinh"
            disabled={ghi.dangChay || !noiDung.trim()}
            onClick={() =>
              ghi.chay(
                () => neuVuongMac(hs.id, { noiDung: noiDung.trim(), buocId: b.id }),
                () => datNoiDung(''),
              )
            }
          >
            ⚠ Nêu vướng mắc
          </Nut>
        </div>
      )}
      <Link
        to="/du-an/$id"
        params={{ id: hs.id }}
        search={{ the: 'vuong-mac' }}
        className="mt-2 inline-block text-[12.5px] font-semibold text-brand hover:underline"
      >
        Phân tích nguyên nhân, giải pháp ở thẻ Vướng mắc →
      </Link>
    </div>
  )
}

function SuaBuoc({ hs, b, dong }: { hs: HoSoDuAn; b: BuocDuAn; dong: () => void }) {
  const ghi = useGhiHoSo()
  const [ten, datTen] = useState(b.ten)
  const [soNgay, datSoNgay] = useState(String(b.soNgay))
  const [hanGhiDe, datHanGhiDe] = useState(b.hanGhiDe ?? '')
  const [donVi, datDonVi] = useState(b.donViThucHien ?? '')
  const [lyDo, datLyDo] = useState('')

  return (
    <div className="space-y-3">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {!b.batBuoc && (
        <label className="block text-[12px] text-faint">
          Tên bước (bước tự thêm)
          <input
            value={ten}
            maxLength={500}
            onChange={(e) => datTen(e.target.value)}
            className={`${LOP_O} mt-1 block w-full`}
          />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-[120px_180px_1fr]">
        <label className="text-[12px] text-faint">
          Số ngày
          <input
            type="number"
            min={0}
            value={soNgay}
            onChange={(e) => datSoNgay(e.target.value)}
            className={`${LOP_O} mt-1 block w-full`}
          />
        </label>
        <label className="text-[12px] text-faint">
          Hạn cụ thể
          <input
            type="date"
            value={hanGhiDe}
            onChange={(e) => datHanGhiDe(e.target.value)}
            className={`${LOP_O} mt-1 block w-full`}
          />
        </label>
        <label className="text-[12px] text-faint">
          Đơn vị thực hiện
          <input
            value={donVi}
            maxLength={300}
            onChange={(e) => datDonVi(e.target.value)}
            className={`${LOP_O} mt-1 block w-full`}
          />
        </label>
      </div>
      <p className="m-0 text-[11.5px] text-faint">
        📌 Đặt ngày cụ thể sẽ <b>khóa hạn của bước này</b> đúng ngày chọn; các bước sau tự cộng dồn tiếp từ
        ngày đó. Bỏ trống = tự tính theo số ngày. Thay đổi là nháp cho tới khi chốt kế hoạch.
      </p>
      <Nut
        kieu="chinh"
        disabled={ghi.dangChay || (!b.batBuoc && !ten.trim())}
        onClick={() =>
          ghi.chay(() =>
            suaBuoc(hs.id, b.id, {
              soNgay: Math.max(0, Math.round(Number(soNgay) || 0)),
              hanGhiDe: hanGhiDe || null,
              donViThucHien: donVi.trim(),
              ...(!b.batBuoc && ten.trim() !== b.ten ? { ten: ten.trim() } : {}),
            }),
          )
        }
      >
        Lưu bước
      </Nut>

      <div className="border-t border-line pt-3">
        {b.boQua ? (
          <Nut disabled={ghi.dangChay} onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'khoi-phuc'))}>
            Khôi phục bước
          </Nut>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[220px] flex-1 text-[12px] text-faint">
              Lý do / căn cứ bỏ qua
              <input
                value={lyDo}
                maxLength={1000}
                onChange={(e) => datLyDo(e.target.value)}
                className={`${LOP_O} mt-1 block w-full`}
              />
            </label>
            <Nut
              kieu="nguy-hiem"
              disabled={ghi.dangChay || !lyDo.trim()}
              onClick={() => ghi.chay(() => thaoTacBuoc(hs.id, b.id, 'bo-qua', { lyDo }))}
            >
              Bỏ qua bước
            </Nut>
          </div>
        )}
        {!b.batBuoc && (
          <p className="mt-3 mb-0">
            <Nut
              kieu="nguy-hiem"
              disabled={ghi.dangChay}
              onClick={() => {
                if (confirm(`Xóa bước “${b.ten}”?`)) ghi.chay(() => xoaBuoc(hs.id, b.id), dong)
              }}
            >
              🗑 Xóa bước
            </Nut>
          </p>
        )}
      </div>
    </div>
  )
}
