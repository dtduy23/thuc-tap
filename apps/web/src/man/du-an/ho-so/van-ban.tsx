import { DUOI_TEP_CHO_PHEP, KICH_THUOC_TEP_TOI_DA, type HoSoDuAn } from '@gdos/shared'
import { useRef, useState, type FormEvent } from 'react'
import { duongDanTaiVe, taiLenVanBan, xoaVanBan } from '@/lib/du-an'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { KhungBang, LOP_TD, LOP_TH, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { useGhiHoSo } from './ghi-ho-so'

const kichThuoc = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

/**
 * Văn bản dự án — tệp đính kèm kèm số ký hiệu, ngày ký, người ký. Gắn được vào
 * một bước (văn bản của bước đó) hoặc một đợt giải ngân (chứng từ).
 */
export default function VanBan({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const tenBuoc = new Map(hs.buoc.map((b) => [b.id, `${b.stt}. ${b.ten}`]))
  const tenDot = new Map(hs.giaiNgan.map((g) => [g.id, `${g.dot ?? 'Đợt giải ngân'} · ${ngayVn(g.ngay)}`]))

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div>
        {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
        <KhungBang nhan="Văn bản dự án">
          <thead>
            <tr>
              <th className={LOP_TH}>Văn bản</th>
              <th className={LOP_TH}>Số ký hiệu · ngày ký</th>
              <th className={LOP_TH}>Gắn với</th>
              <th className={LOP_TH}>Tải lên</th>
              <th className={LOP_TH}>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {hs.vanBan.map((v) => (
              <tr key={v.id}>
                <td className={`${LOP_TD} min-w-[220px]`}>
                  <a href={duongDanTaiVe(hs.id, v.id)} className="font-semibold text-brand hover:underline">
                    {v.tieuDe || v.tenTep}
                  </a>
                  <span className="block text-[11.5px] text-faint">
                    {v.tenTep} · {kichThuoc(v.kichThuoc)}
                  </span>
                </td>
                <td className={LOP_TD}>
                  {v.soKyHieu ?? '—'}
                  <span className="block text-[11.5px] text-faint">
                    {ngayVn(v.ngayKy)}
                    {v.nguoiKy ? ` · ${v.nguoiKy}` : ''}
                  </span>
                </td>
                <td className={`${LOP_TD} max-w-[260px] text-[12px]`}>
                  {v.buocId ? tenBuoc.get(v.buocId) : v.giaiNganId ? tenDot.get(v.giaiNganId) : '—'}
                </td>
                <td className={`${LOP_TD} text-[12px] whitespace-nowrap`}>
                  {v.nguoiTai ?? '—'}
                  <span className="block text-faint">{ngayGio(v.taiLuc)}</span>
                </td>
                <td className={`${LOP_TD} text-right`}>
                  {hs.quyen.sua && (
                    <Nut
                      kieu="nguy-hiem"
                      className="!py-0.5"
                      disabled={ghi.dangChay}
                      onClick={() => {
                        if (confirm(`Xóa văn bản “${v.tieuDe || v.tenTep}”?`))
                          ghi.chay(() => xoaVanBan(hs.id, v.id))
                      }}
                    >
                      Xóa
                    </Nut>
                  )}
                </td>
              </tr>
            ))}
            {hs.vanBan.length === 0 && (
              <tr>
                <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                  Chưa có văn bản nào.
                </td>
              </tr>
            )}
          </tbody>
        </KhungBang>
      </div>
      {hs.quyen.sua && <TaiLen hs={hs} />}
    </div>
  )
}

function TaiLen({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const oTep = useRef<HTMLInputElement>(null)
  const [f, datF] = useState({ tieuDe: '', soKyHieu: '', ngayKy: '', nguoiKy: '', gan: '' })
  const [loiTep, datLoiTep] = useState<string>()
  const [xong, datXong] = useState(false)
  const doi = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    datXong(false)
    datF((c) => ({ ...c, [k]: e.target.value }))
  }

  const gui = (e: FormEvent) => {
    e.preventDefault()
    const tep = oTep.current?.files?.[0]
    if (!tep) return datLoiTep('Chưa chọn tệp.')
    const duoi = tep.name.split('.').pop()?.toLowerCase() ?? ''
    if (!(DUOI_TEP_CHO_PHEP as readonly string[]).includes(duoi))
      return datLoiTep(`Chỉ nhận tệp: ${DUOI_TEP_CHO_PHEP.join(', ')}.`)
    if (tep.size > KICH_THUOC_TEP_TOI_DA) return datLoiTep('Tệp quá 25 MB.')
    datLoiTep(undefined)
    const du = new FormData()
    du.append('tep', tep)
    for (const k of ['tieuDe', 'soKyHieu', 'ngayKy', 'nguoiKy'] as const)
      if (f[k].trim()) du.append(k, f[k].trim())
    if (f.gan.startsWith('b:')) du.append('buocId', f.gan.slice(2))
    if (f.gan.startsWith('g:')) du.append('giaiNganId', f.gan.slice(2))
    ghi.chay(
      () => taiLenVanBan(hs.id, du),
      () => {
        datF({ tieuDe: '', soKyHieu: '', ngayKy: '', nguoiKy: '', gan: '' })
        if (oTep.current) oTep.current.value = ''
        datXong(true)
      },
    )
  }

  return (
    <The tieuDe="Tải lên văn bản" phu={`tối đa 25 MB · ${DUOI_TEP_CHO_PHEP.join(', ')}`}>
      {(loiTep ?? ghi.loi) && <ThongBao kieu="loi">{loiTep ?? ghi.loi}</ThongBao>}
      {xong && <ThongBao kieu="ok">Đã tải lên.</ThongBao>}
      <form onSubmit={gui}>
        <div className="mb-3.5">
          <label htmlFor="vb-tep" className="mb-1.5 block text-[12.5px] font-semibold text-body">
            Tệp
          </label>
          <input
            id="vb-tep"
            ref={oTep}
            type="file"
            accept={DUOI_TEP_CHO_PHEP.map((d) => `.${d}`).join(',')}
            className="w-full text-[13px]"
          />
        </div>
        <ONhap id="vb-tieu-de" nhan="Tên văn bản" maxLength={400} value={f.tieuDe} onChange={doi('tieuDe')} />
        <div className="grid gap-x-3 sm:grid-cols-2">
          <ONhap id="vb-so" nhan="Số ký hiệu" maxLength={120} value={f.soKyHieu} onChange={doi('soKyHieu')} />
          <ONhap id="vb-ngay" nhan="Ngày ký" type="date" value={f.ngayKy} onChange={doi('ngayKy')} />
        </div>
        <ONhap id="vb-nguoi-ky" nhan="Người ký" maxLength={200} value={f.nguoiKy} onChange={doi('nguoiKy')} />
        <OChon id="vb-gan" nhan="Gắn với" value={f.gan} onChange={doi('gan')}>
          <option value="">— Dự án (không gắn bước) —</option>
          <optgroup label="Bước">
            {hs.buoc
              .filter((b) => !b.laNhom)
              .map((b) => (
                <option key={b.id} value={`b:${b.id}`}>
                  {b.stt}. {b.ten.length > 60 ? `${b.ten.slice(0, 60)}…` : b.ten}
                </option>
              ))}
          </optgroup>
          {hs.giaiNgan.length > 0 && (
            <optgroup label="Chứng từ đợt giải ngân">
              {hs.giaiNgan.map((g) => (
                <option key={g.id} value={`g:${g.id}`}>
                  {g.dot ?? 'Đợt'} · {ngayVn(g.ngay)} · {g.soTien.toLocaleString('vi-VN')} tr.đ
                </option>
              ))}
            </optgroup>
          )}
        </OChon>
        <Nut type="submit" kieu="chinh" disabled={ghi.dangChay}>
          {ghi.dangChay ? 'Đang tải lên…' : 'Tải lên'}
        </Nut>
      </form>
    </The>
  )
}
