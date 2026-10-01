import { homNay, type HoSoDuAn } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { suaVon, themGiaiNgan, themVon, truyVanDanhMuc, xoaGiaiNgan, xoaVon } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { KhungBang, LOP_TD, LOP_TH, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { ThanhTienDo, trieuDong } from '../chung'
import { useGhiHoSo } from './ghi-ho-so'

function O({ nhan, gt, phu }: { nhan: string; gt: ReactNode; phu?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-nen px-3.5 py-3">
      <p className="m-0 text-[11.5px] font-semibold text-faint">{nhan}</p>
      <p className="m-0 mt-0.5 text-[19px] leading-tight font-bold tabular-nums">{gt}</p>
      {phu && <p className="m-0 text-[11.5px] text-faint">{phu}</p>}
    </div>
  )
}

/**
 * Kinh phí & giải ngân: kế hoạch vốn theo năm × nguồn vốn, và các đợt giải ngân.
 * Số đã giải ngân luôn là TỔNG CÁC ĐỢT — không có ô nhập tay (tránh hai số lệch nhau).
 */
export default function KinhPhi({ hs }: { hs: HoSoDuAn }) {
  const tc = hs.taiChinh
  const ghi = useGhiHoSo()
  const daGiaiTheoDong = (nam: number, nguon: string) =>
    hs.giaiNgan.filter((g) => g.nam === nam && g.nguonVonId === nguon).reduce((t, g) => t + g.soTien, 0)

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <O nhan="Tổng mức đầu tư" gt={trieuDong(hs.tongMuc)} />
        <O
          nhan="Kế hoạch vốn"
          gt={trieuDong(tc.keHoach)}
          phu={`tới hết năm nay: ${trieuDong(tc.keHoachDenNay)}`}
        />
        <O nhan="Đã giải ngân" gt={trieuDong(tc.daGiaiNgan)} phu={`${hs.giaiNgan.length} đợt`} />
        <div className="rounded-[10px] border border-line bg-nen px-3.5 py-3">
          <p className="m-0 mb-1 text-[11.5px] font-semibold text-faint">Tỉ lệ giải ngân</p>
          <ThanhTienDo phanTram={Math.min(100, Math.round(tc.phanTramTongMuc))} />
          <p className="m-0 mt-1 text-[11.5px] text-faint">
            {tc.phanTramTongMuc.toLocaleString('vi-VN')}% tổng mức ·{' '}
            {tc.phanTramKeHoach.toLocaleString('vi-VN')}% kế hoạch tới nay
          </p>
        </div>
      </div>
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}

      <div className="grid gap-4 xl:grid-cols-2">
        <The tieuDe="Kế hoạch vốn">
          <KhungBang nhan="Kế hoạch vốn">
            <thead>
              <tr>
                <th className={LOP_TH}>Năm</th>
                <th className={LOP_TH}>Nguồn vốn</th>
                <th className={`${LOP_TH} text-right`}>Kế hoạch</th>
                <th className={`${LOP_TH} text-right`}>Đã giải ngân</th>
                <th className={LOP_TH}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {hs.von.map((v) => (
                <tr key={v.id}>
                  <td className={`${LOP_TD} tabular-nums`}>{v.nam}</td>
                  <td className={LOP_TD}>{v.nguonVonTen}</td>
                  <td className={`${LOP_TD} text-right tabular-nums`}>
                    {hs.quyen.sua ? (
                      <input
                        type="number"
                        min={0}
                        aria-label={`Kế hoạch ${v.nam} ${v.nguonVonTen}`}
                        defaultValue={v.keHoach}
                        onBlur={(e) => {
                          const moi = Math.max(0, Math.round(Number(e.target.value) || 0))
                          if (moi !== v.keHoach) ghi.chay(() => suaVon(hs.id, v.id, { keHoach: moi }))
                        }}
                        className="w-28 rounded-md border border-line bg-nen px-2 py-0.5 text-right"
                      />
                    ) : (
                      v.keHoach.toLocaleString('vi-VN')
                    )}
                  </td>
                  <td className={`${LOP_TD} text-right tabular-nums`}>
                    {daGiaiTheoDong(v.nam, v.nguonVonId).toLocaleString('vi-VN')}
                  </td>
                  <td className={`${LOP_TD} text-right`}>
                    {hs.quyen.sua && (
                      <Nut
                        kieu="nguy-hiem"
                        className="!py-0.5"
                        disabled={ghi.dangChay}
                        onClick={() => {
                          if (confirm(`Xóa dòng kế hoạch ${v.nam} — ${v.nguonVonTen}?`))
                            ghi.chay(() => xoaVon(hs.id, v.id))
                        }}
                      >
                        Xóa
                      </Nut>
                    )}
                  </td>
                </tr>
              ))}
              {hs.von.length === 0 && (
                <tr>
                  <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                    Chưa có kế hoạch vốn.
                  </td>
                </tr>
              )}
            </tbody>
          </KhungBang>
          <p className="mt-1.5 mb-0 text-[11.5px] text-faint">
            Đơn vị: triệu đồng. Sửa số kế hoạch rồi bấm ra ngoài ô để lưu.
          </p>
          {hs.quyen.sua && <ThemVon hs={hs} />}
        </The>

        <The tieuDe="Các đợt giải ngân">
          <KhungBang nhan="Các đợt giải ngân">
            <thead>
              <tr>
                <th className={LOP_TH}>Ngày</th>
                <th className={LOP_TH}>Đợt · chứng từ</th>
                <th className={LOP_TH}>Nguồn (năm)</th>
                <th className={`${LOP_TH} text-right`}>Số tiền</th>
                <th className={LOP_TH}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {hs.giaiNgan.map((g) => (
                <tr key={g.id}>
                  <td className={`${LOP_TD} tabular-nums`}>{ngayVn(g.ngay)}</td>
                  <td className={LOP_TD}>
                    {g.dot ?? '—'}
                    {g.soKyHieu && <span className="block text-[11.5px] text-faint">{g.soKyHieu}</span>}
                  </td>
                  <td className={`${LOP_TD} text-[12px]`}>
                    {g.nguonVonTen} ({g.nam})
                  </td>
                  <td className={`${LOP_TD} text-right tabular-nums`}>{g.soTien.toLocaleString('vi-VN')}</td>
                  <td className={`${LOP_TD} text-right`}>
                    {hs.quyen.sua && (
                      <Nut
                        kieu="nguy-hiem"
                        className="!py-0.5"
                        disabled={ghi.dangChay}
                        onClick={() => {
                          if (confirm(`Xóa đợt giải ngân ngày ${ngayVn(g.ngay)}?`))
                            ghi.chay(() => xoaGiaiNgan(hs.id, g.id))
                        }}
                      >
                        Xóa
                      </Nut>
                    )}
                  </td>
                </tr>
              ))}
              {hs.giaiNgan.length === 0 && (
                <tr>
                  <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                    Chưa có đợt giải ngân.
                  </td>
                </tr>
              )}
            </tbody>
          </KhungBang>
          <p className="mt-1.5 mb-0 text-[11.5px] text-faint">
            Chứng từ của đợt: tải lên ở thẻ Văn bản, chọn “Gắn với” đợt đó.
          </p>
          {hs.quyen.sua && <ThemDot hs={hs} />}
        </The>
      </div>
    </>
  )
}

function useNguonVon() {
  return useQuery(truyVanDanhMuc('nguon-von')).data ?? []
}

function ThemVon({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const nguon = useNguonVon()
  const [nam, datNam] = useState(homNay().slice(0, 4))
  const [nguonVonId, datNguon] = useState('')
  const [keHoach, datKeHoach] = useState('')
  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () =>
        themVon(hs.id, {
          nam: Number(nam),
          nguonVonId: nguonVonId || nguon[0]?.id,
          keHoach: Math.max(0, Math.round(Number(keHoach) || 0)),
        }),
      () => datKeHoach(''),
    )
  }
  return (
    <form
      onSubmit={gui}
      className="mt-3 grid items-end gap-x-2 border-t border-line-2 pt-3 sm:grid-cols-[90px_1fr_120px_auto]"
    >
      {ghi.loi && (
        <div className="sm:col-span-4">
          <ThongBao kieu="loi">{ghi.loi}</ThongBao>
        </div>
      )}
      <ONhap
        id="von-nam"
        nhan="Năm"
        type="number"
        min={2000}
        max={2100}
        value={nam}
        onChange={(e) => datNam(e.target.value)}
      />
      <OChon id="von-nguon" nhan="Nguồn vốn" value={nguonVonId} onChange={(e) => datNguon(e.target.value)}>
        {nguon.map((n) => (
          <option key={n.id} value={n.id}>
            {n.ten}
          </option>
        ))}
      </OChon>
      <ONhap
        id="von-ke-hoach"
        nhan="Kế hoạch"
        type="number"
        min={0}
        value={keHoach}
        onChange={(e) => datKeHoach(e.target.value)}
      />
      <div className="mb-3.5">
        <Nut type="submit" kieu="chinh" disabled={ghi.dangChay}>
          Thêm
        </Nut>
      </div>
    </form>
  )
}

function ThemDot({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const nguon = useNguonVon()
  const [f, datF] = useState({ ngay: homNay(), nguonVonId: '', soTien: '', dot: '', soKyHieu: '' })
  const doi = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    datF((c) => ({ ...c, [k]: e.target.value }))
  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () =>
        themGiaiNgan(hs.id, {
          nam: Number(f.ngay.slice(0, 4)),
          nguonVonId: f.nguonVonId || nguon[0]?.id,
          ngay: f.ngay,
          soTien: Math.round(Number(f.soTien) || 0),
          dot: f.dot.trim() || null,
          soKyHieu: f.soKyHieu.trim() || null,
        }),
      () => datF((c) => ({ ...c, soTien: '', dot: '', soKyHieu: '' })),
    )
  }
  return (
    <form onSubmit={gui} className="mt-3 border-t border-line-2 pt-3">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <div className="grid gap-x-2 sm:grid-cols-3">
        <ONhap id="gn-ngay" nhan="Ngày" type="date" required value={f.ngay} onChange={doi('ngay')} />
        <OChon id="gn-nguon" nhan="Nguồn vốn" value={f.nguonVonId} onChange={doi('nguonVonId')}>
          {nguon.map((n) => (
            <option key={n.id} value={n.id}>
              {n.ten}
            </option>
          ))}
        </OChon>
        <ONhap
          id="gn-so-tien"
          nhan="Số tiền (tr.đ)"
          type="number"
          min={1}
          required
          value={f.soTien}
          onChange={doi('soTien')}
        />
        <ONhap
          id="gn-dot"
          nhan="Đợt"
          placeholder="VD: Đợt 1"
          maxLength={60}
          value={f.dot}
          onChange={doi('dot')}
        />
        <ONhap id="gn-so" nhan="Số chứng từ" maxLength={120} value={f.soKyHieu} onChange={doi('soKyHieu')} />
        <div className="mb-3.5 self-end">
          <Nut type="submit" kieu="chinh" disabled={ghi.dangChay || !f.soTien}>
            Thêm đợt
          </Nut>
        </div>
      </div>
    </form>
  )
}
