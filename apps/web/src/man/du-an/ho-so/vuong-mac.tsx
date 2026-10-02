/**
 * Vướng mắc & giải pháp. Mỗi vướng mắc được PHÂN TÍCH: nhóm nguyên nhân, nguyên nhân cụ thể,
 * giải pháp, đơn vị xử lý, hạn xử lý, mức độ. Đầu trang tổng hợp theo nhóm nguyên nhân để thấy
 * dự án tắc chủ yếu vì đâu và còn bao nhiêu việc chưa có giải pháp.
 */
import {
  MUC_DO_VUONG_MAC,
  NHOM_NGUYEN_NHAN,
  homNay,
  phanTichVuongMac,
  soNgayGiua,
  type HoSoDuAn,
  type MucDoVuongMac,
  type NhomNguyenNhan,
  type VuongMacDuAn,
} from '@gdos/shared'
import { useId, useState, type FormEvent } from 'react'
import {
  giaiQuyetVuongMac,
  moLaiVuongMac,
  neuVuongMac,
  phanTichVuongMac as luuPhanTich,
  xoaVuongMac,
} from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { HopThoai } from '@/man/van-ban/chung'
import { Chip, Nut, OChon, The, ThongBao } from '@/ui/co-ban'
import { useGhiHoSo } from './ghi-ho-so'

const MAU_MUC_DO: Record<MucDoVuongMac, 'xam' | 'warn' | 'danger'> = {
  thap: 'xam',
  'trung-binh': 'warn',
  cao: 'danger',
}
const LOP_O = 'w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink'
const LOP_NHAN = 'mb-1.5 block text-[12.5px] font-semibold text-body'

function O({ nhan, gt, mau }: { nhan: string; gt: string | number; mau?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-nen px-3.5 py-3">
      <p className="m-0 text-[11.5px] font-semibold text-faint">{nhan}</p>
      <p className={`m-0 mt-0.5 text-[22px] leading-tight font-bold tabular-nums ${mau ?? 'text-ink'}`}>
        {gt}
      </p>
    </div>
  )
}

export default function VuongMac({ hs }: { hs: HoSoDuAn }) {
  const hn = homNay()
  const pt = phanTichVuongMac(hs.vuongMac, hn)
  const mo = hs.vuongMac.filter((v) => !v.ngayGiaiQuyet)
  const xong = hs.vuongMac.filter((v) => v.ngayGiaiQuyet)
  const lonNhat = Math.max(1, ...pt.theoNhom.map((n) => n.tong))

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <O nhan="Tổng vướng mắc" gt={pt.tong} />
        <O nhan="Đang mở" gt={pt.dangMo} mau={pt.dangMo ? 'text-danger' : undefined} />
        <O nhan="Quá hạn xử lý" gt={pt.quaHanXuLy} mau={pt.quaHanXuLy ? 'text-danger' : undefined} />
        <O
          nhan="Chưa có nguyên nhân / giải pháp"
          gt={pt.chuaPhanTich}
          mau={pt.chuaPhanTich ? 'text-warn' : undefined}
        />
        <O
          nhan="Thời gian xử lý bình quân"
          gt={pt.ngayXuLyBinhQuan === null ? '—' : `${pt.ngayXuLyBinhQuan} ngày`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <div>
          <h2 className="mt-0 mb-2 text-[14px] font-semibold">
            Đang vướng <span className="text-faint">({mo.length})</span>
          </h2>
          {mo.length === 0 && <p className="mt-0 text-[13px] text-faint">Không có vướng mắc nào đang mở.</p>}
          {mo.map((v) => (
            <MotVuongMac key={v.id} hs={hs} v={v} />
          ))}
          {xong.length > 0 && (
            <>
              <h2 className="mt-5 mb-2 text-[14px] font-semibold">
                Đã giải quyết <span className="text-faint">({xong.length})</span>
              </h2>
              {xong.map((v) => (
                <MotVuongMac key={v.id} hs={hs} v={v} />
              ))}
            </>
          )}
        </div>

        <div>
          <The tieuDe="Phân tích theo nhóm nguyên nhân" phu={pt.tong ? `${pt.tong} vướng mắc` : undefined}>
            {pt.theoNhom.length === 0 ? (
              <p className="m-0 text-[13px] text-faint">Chưa có dữ liệu để phân tích.</p>
            ) : (
              <ul className="m-0 list-none space-y-2.5 p-0">
                {pt.theoNhom.map((n) => (
                  <li key={n.nhom ?? 'chua'} className="text-[12.5px]">
                    <span className="flex justify-between gap-2">
                      <span className={n.nhom ? 'text-ink' : 'text-faint italic'}>{n.ten}</span>
                      <span className="flex-none tabular-nums">
                        <b>{n.tong}</b>
                        {n.dangMo > 0 && <span className="text-danger"> · {n.dangMo} đang mở</span>}
                      </span>
                    </span>
                    <span className="mt-1 flex h-2 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full bg-danger"
                        style={{ width: `${(n.dangMo / lonNhat) * 100}%` }}
                      />
                      <span
                        className="block h-full bg-ok"
                        style={{ width: `${((n.tong - n.dangMo) / lonNhat) * 100}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 mb-0 text-[11.5px] text-faint">
              <span className="mr-1 inline-block size-2 rounded-full bg-danger" /> đang mở
              <span className="mr-1 ml-3 inline-block size-2 rounded-full bg-ok" /> đã giải quyết
            </p>
          </The>
          {hs.quyen.sua && <NeuVuongMac hs={hs} />}
        </div>
      </div>
    </>
  )
}

function MotVuongMac({ hs, v }: { hs: HoSoDuAn; v: VuongMacDuAn }) {
  const ghi = useGhiHoSo()
  const hn = homNay()
  const [ketQua, datKetQua] = useState('')
  const [ngay, datNgay] = useState(hn)
  const [phanTich, datPhanTich] = useState(false)
  const buoc = v.buocId ? hs.buoc.find((b) => b.id === v.buocId) : undefined
  const xong = !!v.ngayGiaiQuyet
  const quaHan = !xong && !!v.hanXuLy && v.hanXuLy < hn
  const soNgay = soNgayGiua(v.ngayNeu, v.ngayGiaiQuyet ?? hn)

  return (
    <div
      className={`mb-3 rounded-[10px] border p-3 ${xong ? 'border-line bg-nen' : 'border-danger/40 bg-tint-danger/40'}`}
    >
      <div className="flex flex-wrap items-start gap-2">
        <p className="m-0 min-w-0 flex-1 text-[13.5px] font-semibold whitespace-pre-line text-ink">
          {v.noiDung}
        </p>
        <Chip mau={MAU_MUC_DO[v.mucDo]}>Mức độ {MUC_DO_VUONG_MAC[v.mucDo].toLowerCase()}</Chip>
        {xong ? <Chip mau="ok">Đã giải quyết</Chip> : <Chip mau="danger">Đang vướng</Chip>}
      </div>
      <p className="mt-1 mb-0 text-[11.5px] text-faint">
        Nêu {ngayVn(v.ngayNeu)}
        {v.nguoiNeu ? ` · ${v.nguoiNeu}` : ''}
        {buoc ? ` · Bước ${buoc.stt}. ${buoc.ten}` : ''} ·{' '}
        {xong ? `xử lý sau ${soNgay} ngày` : <b className="text-danger">đang mở {soNgay} ngày</b>}
      </p>

      <dl className="m-0 mt-2 grid grid-cols-[112px_1fr] gap-x-3 gap-y-1 text-[12.8px]">
        <dt className="text-faint">Nhóm nguyên nhân</dt>
        <dd className="m-0">
          {v.nhomNguyenNhan ? (
            NHOM_NGUYEN_NHAN[v.nhomNguyenNhan]
          ) : (
            <i className="text-faint">chưa phân loại</i>
          )}
        </dd>
        <dt className="text-faint">Nguyên nhân</dt>
        <dd className="m-0 whitespace-pre-line">
          {v.nguyenNhan ?? <i className="text-faint">chưa phân tích</i>}
        </dd>
        <dt className="text-faint">Giải pháp</dt>
        <dd className="m-0 whitespace-pre-line">{v.giaiPhap ?? <i className="text-faint">chưa có</i>}</dd>
        {(v.donViXuLy || v.hanXuLy) && (
          <>
            <dt className="text-faint">Xử lý</dt>
            <dd className="m-0">
              {v.donViXuLy ?? '—'}
              {v.hanXuLy && (
                <span className={quaHan ? 'font-semibold text-danger' : ''}>
                  {' '}
                  · hạn {ngayVn(v.hanXuLy)}
                  {quaHan && ` (quá ${soNgayGiua(v.hanXuLy, hn)} ngày)`}
                </span>
              )}
            </dd>
          </>
        )}
        {xong && (
          <>
            <dt className="text-faint">Kết quả</dt>
            <dd className="m-0">
              <b>{ngayVn(v.ngayGiaiQuyet)}:</b> {v.ketQua}
            </dd>
          </>
        )}
      </dl>

      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {hs.quyen.sua && (
        <div className="mt-2.5 flex flex-wrap items-end gap-2">
          <Nut className="!py-1" onClick={() => datPhanTich(true)}>
            ✎ Phân tích nguyên nhân · giải pháp
          </Nut>
          {xong ? (
            <Nut
              className="!py-1"
              disabled={ghi.dangChay}
              onClick={() => ghi.chay(() => moLaiVuongMac(hs.id, v.id))}
            >
              Mở lại
            </Nut>
          ) : (
            <>
              <input
                aria-label="Kết quả giải quyết"
                placeholder="Kết quả giải quyết…"
                value={ketQua}
                maxLength={4000}
                onChange={(e) => datKetQua(e.target.value)}
                className="min-w-[180px] flex-1 rounded-md border border-line bg-nen px-2 py-1 text-[13px]"
              />
              <input
                aria-label="Ngày giải quyết"
                type="date"
                value={ngay}
                onChange={(e) => datNgay(e.target.value)}
                className="rounded-md border border-line bg-nen px-2 py-1 text-[13px]"
              />
              <Nut
                kieu="chinh"
                className="!py-1"
                disabled={ghi.dangChay || !ketQua.trim()}
                onClick={() => ghi.chay(() => giaiQuyetVuongMac(hs.id, v.id, ngay, ketQua.trim()))}
              >
                ✓ Đã xử lý
              </Nut>
            </>
          )}
          <Nut
            kieu="nguy-hiem"
            className="!py-1"
            disabled={ghi.dangChay}
            onClick={() => {
              if (confirm('Xóa vướng mắc này (nhập nhầm)?')) ghi.chay(() => xoaVuongMac(hs.id, v.id))
            }}
          >
            Xóa
          </Nut>
        </div>
      )}
      {phanTich && <HopPhanTich hs={hs} v={v} dong={() => datPhanTich(false)} />}
    </div>
  )
}

interface Phan {
  nhomNguyenNhan: NhomNguyenNhan | ''
  nguyenNhan: string
  giaiPhap: string
  donViXuLy: string
  hanXuLy: string
  mucDo: MucDoVuongMac
}

const PHAN_TRONG: Phan = {
  nhomNguyenNhan: '',
  nguyenNhan: '',
  giaiPhap: '',
  donViXuLy: '',
  hanXuLy: '',
  mucDo: 'trung-binh',
}

/** Các ô phân tích — dùng chung cho hộp phân tích và form nêu mới. */
function OPhanTich({ p, doi }: { p: Phan; doi: (moi: Partial<Phan>) => void }) {
  const id = useId()
  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-[1fr_150px]">
        <OChon
          id={`${id}-nhom`}
          nhan="Nhóm nguyên nhân"
          value={p.nhomNguyenNhan}
          onChange={(e) => doi({ nhomNguyenNhan: e.target.value as Phan['nhomNguyenNhan'] })}
        >
          <option value="">— Chưa phân loại —</option>
          {Object.entries(NHOM_NGUYEN_NHAN).map(([k, t]) => (
            <option key={k} value={k}>
              {t}
            </option>
          ))}
        </OChon>
        <OChon
          id={`${id}-muc-do`}
          nhan="Mức độ"
          value={p.mucDo}
          onChange={(e) => doi({ mucDo: e.target.value as MucDoVuongMac })}
        >
          {Object.entries(MUC_DO_VUONG_MAC).map(([k, t]) => (
            <option key={k} value={k}>
              {t}
            </option>
          ))}
        </OChon>
      </div>
      <label htmlFor={`${id}-nguyen-nhan`} className={LOP_NHAN}>
        Nguyên nhân cụ thể
      </label>
      <textarea
        id={`${id}-nguyen-nhan`}
        rows={2}
        maxLength={4000}
        value={p.nguyenNhan}
        onChange={(e) => doi({ nguyenNhan: e.target.value })}
        className={`${LOP_O} mb-3.5`}
      />
      <label htmlFor={`${id}-giai-phap`} className={LOP_NHAN}>
        Giải pháp
      </label>
      <textarea
        id={`${id}-giai-phap`}
        rows={2}
        maxLength={4000}
        value={p.giaiPhap}
        onChange={(e) => doi({ giaiPhap: e.target.value })}
        className={`${LOP_O} mb-3.5`}
      />
      <div className="grid gap-x-3 sm:grid-cols-[1fr_170px]">
        <div className="mb-3.5">
          <label htmlFor={`${id}-don-vi`} className={LOP_NHAN}>
            Đơn vị / người xử lý
          </label>
          <input
            id={`${id}-don-vi`}
            maxLength={300}
            value={p.donViXuLy}
            onChange={(e) => doi({ donViXuLy: e.target.value })}
            className={LOP_O}
          />
        </div>
        <div className="mb-3.5">
          <label htmlFor={`${id}-han`} className={LOP_NHAN}>
            Hạn xử lý
          </label>
          <input
            id={`${id}-han`}
            type="date"
            value={p.hanXuLy}
            onChange={(e) => doi({ hanXuLy: e.target.value })}
            className={LOP_O}
          />
        </div>
      </div>
    </>
  )
}

const deGui = (p: Phan) => ({
  nhomNguyenNhan: p.nhomNguyenNhan || null,
  nguyenNhan: p.nguyenNhan.trim(),
  giaiPhap: p.giaiPhap.trim(),
  donViXuLy: p.donViXuLy.trim(),
  hanXuLy: p.hanXuLy || null,
  mucDo: p.mucDo,
})

function HopPhanTich({ hs, v, dong }: { hs: HoSoDuAn; v: VuongMacDuAn; dong: () => void }) {
  const ghi = useGhiHoSo()
  const [p, datP] = useState<Phan>({
    nhomNguyenNhan: v.nhomNguyenNhan ?? '',
    nguyenNhan: v.nguyenNhan ?? '',
    giaiPhap: v.giaiPhap ?? '',
    donViXuLy: v.donViXuLy ?? '',
    hanXuLy: v.hanXuLy ?? '',
    mucDo: v.mucDo,
  })
  return (
    <HopThoai
      tieuDe="Phân tích nguyên nhân và giải pháp"
      phu={v.noiDung.length > 120 ? `${v.noiDung.slice(0, 120)}…` : v.noiDung}
      dong={dong}
      khoa={ghi.dangChay}
      rong="max-w-[640px]"
      chan={
        <>
          <Nut onClick={dong} disabled={ghi.dangChay}>
            Hủy
          </Nut>
          <Nut
            kieu="chinh"
            disabled={ghi.dangChay}
            onClick={() => ghi.chay(() => luuPhanTich(hs.id, v.id, deGui(p)), dong)}
          >
            {ghi.dangChay ? 'Đang lưu…' : 'Lưu phân tích'}
          </Nut>
        </>
      }
    >
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <OPhanTich p={p} doi={(moi) => datP((c) => ({ ...c, ...moi }))} />
    </HopThoai>
  )
}

function NeuVuongMac({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const [noiDung, datNoiDung] = useState('')
  const [buocId, datBuocId] = useState('')
  const [p, datP] = useState<Phan>(PHAN_TRONG)
  const [moPhanTich, datMoPhanTich] = useState(false)
  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () => neuVuongMac(hs.id, { noiDung: noiDung.trim(), buocId: buocId || null, ...deGui(p) }),
      () => {
        datNoiDung('')
        datP(PHAN_TRONG)
      },
    )
  }
  return (
    <The tieuDe="Nêu vướng mắc">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <form onSubmit={gui}>
        <label htmlFor="vm-noi-dung" className={LOP_NHAN}>
          Nội dung
        </label>
        <textarea
          id="vm-noi-dung"
          rows={3}
          required
          maxLength={4000}
          value={noiDung}
          onChange={(e) => datNoiDung(e.target.value)}
          className={`${LOP_O} mb-3.5`}
        />
        <OChon
          id="vm-buoc"
          nhan="Gắn với bước (không bắt buộc)"
          value={buocId}
          onChange={(e) => datBuocId(e.target.value)}
        >
          <option value="">— Cả dự án —</option>
          {hs.buoc
            .filter((b) => !b.laNhom && !b.ngayHoanThanh)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.stt}. {b.ten.length > 60 ? `${b.ten.slice(0, 60)}…` : b.ten}
              </option>
            ))}
        </OChon>
        <details open={moPhanTich} onToggle={(e) => datMoPhanTich(e.currentTarget.open)} className="mb-3">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-brand">
            Phân tích nguyên nhân, giải pháp ngay (có thể bổ sung sau)
          </summary>
          <div className="mt-3">
            <OPhanTich p={p} doi={(moi) => datP((c) => ({ ...c, ...moi }))} />
          </div>
        </details>
        <Nut type="submit" kieu="chinh" disabled={ghi.dangChay || !noiDung.trim()}>
          Nêu vướng mắc
        </Nut>
      </form>
    </The>
  )
}
