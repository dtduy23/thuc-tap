import { homNay, type HoSoDuAn, type VuongMacDuAn } from '@gdos/shared'
import { useState, type FormEvent } from 'react'
import { giaiQuyetVuongMac, moLaiVuongMac, neuVuongMac, xoaVuongMac } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { Chip, Nut, OChon, The, ThongBao } from '@/ui/co-ban'
import { useGhiHoSo } from './ghi-ho-so'

/**
 * Vướng mắc — khó khăn của dự án, có thể gắn một bước. Vướng mắc chưa giải quyết
 * được đếm ở danh sách dự án và (Mốc 3 · phiên 5) hiện ở Cảnh báo, Việc của tôi.
 */
export default function VuongMac({ hs }: { hs: HoSoDuAn }) {
  const mo = hs.vuongMac.filter((v) => !v.ngayGiaiQuyet)
  const xong = hs.vuongMac.filter((v) => v.ngayGiaiQuyet)
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
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
      {hs.quyen.sua && <NeuVuongMac hs={hs} />}
    </div>
  )
}

function MotVuongMac({ hs, v }: { hs: HoSoDuAn; v: VuongMacDuAn }) {
  const ghi = useGhiHoSo()
  const [ketQua, datKetQua] = useState('')
  const [ngay, datNgay] = useState(homNay())
  const buoc = v.buocId ? hs.buoc.find((b) => b.id === v.buocId) : undefined
  return (
    <div
      className={`mb-3 rounded-[10px] border p-3 ${v.ngayGiaiQuyet ? 'border-line bg-nen' : 'border-danger/40 bg-tint-danger/40'}`}
    >
      <div className="flex flex-wrap items-start gap-2">
        <p className="m-0 min-w-0 flex-1 text-[13.5px] whitespace-pre-line text-ink">{v.noiDung}</p>
        {v.ngayGiaiQuyet ? <Chip mau="ok">Đã giải quyết</Chip> : <Chip mau="danger">Đang vướng</Chip>}
      </div>
      <p className="mt-1 mb-0 text-[11.5px] text-faint">
        Nêu {ngayVn(v.ngayNeu)}
        {v.nguoiNeu ? ` · ${v.nguoiNeu}` : ''}
        {buoc ? ` · Bước ${buoc.stt}. ${buoc.ten}` : ''}
      </p>
      {v.ngayGiaiQuyet && (
        <p className="mt-1 mb-0 text-[12.5px]">
          <b>Giải quyết {ngayVn(v.ngayGiaiQuyet)}:</b> {v.ketQua}
        </p>
      )}
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {hs.quyen.sua && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          {v.ngayGiaiQuyet ? (
            <Nut
              className="!py-0.5"
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
                className="min-w-[200px] flex-1 rounded-md border border-line bg-nen px-2 py-1 text-[13px]"
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
                Đánh dấu đã giải quyết
              </Nut>
            </>
          )}
          <Nut
            kieu="nguy-hiem"
            className="!py-0.5"
            disabled={ghi.dangChay}
            onClick={() => {
              if (confirm('Xóa vướng mắc này (nhập nhầm)?')) ghi.chay(() => xoaVuongMac(hs.id, v.id))
            }}
          >
            Xóa
          </Nut>
        </div>
      )}
    </div>
  )
}

function NeuVuongMac({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const [noiDung, datNoiDung] = useState('')
  const [buocId, datBuocId] = useState('')
  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () => neuVuongMac(hs.id, { noiDung: noiDung.trim(), buocId: buocId || null }),
      () => datNoiDung(''),
    )
  }
  return (
    <The tieuDe="Nêu vướng mắc">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <form onSubmit={gui}>
        <label htmlFor="vm-noi-dung" className="mb-1.5 block text-[12.5px] font-semibold text-body">
          Nội dung
        </label>
        <textarea
          id="vm-noi-dung"
          rows={4}
          required
          maxLength={4000}
          value={noiDung}
          onChange={(e) => datNoiDung(e.target.value)}
          className="mb-3.5 w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px]"
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
        <Nut type="submit" kieu="chinh" disabled={ghi.dangChay || !noiDung.trim()}>
          Nêu vướng mắc
        </Nut>
      </form>
    </The>
  )
}
