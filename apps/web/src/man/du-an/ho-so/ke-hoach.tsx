import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  ngayKetThucDuKien,
  soNgayGiua,
  type BenThucHien,
  type GiaiDoan,
  type HoSoDuAn,
} from '@gdos/shared'
import { useState, type FormEvent } from 'react'
import { chotKeHoach, themBuoc } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { KhungBang, LOP_TD, LOP_TH, Nut, OChon, ODanhDau, ONhap, The, ThongBao } from '@/ui/co-ban'
import { BangGiaHan } from './gia-han'
import { useGhiHoSo } from './ghi-ho-so'

/**
 * Kế hoạch & điều chỉnh. Hai lớp: kế hoạch ĐANG LÀM (sửa hạn, thêm bước nháp) và
 * các PHIÊN BẢN đã chốt (không sửa được). "Chốt kế hoạch" biến nháp thành chính
 * thức và ghi phiên bản mới kèm lý do — số lần điều chỉnh vào KPI.
 */
export default function KeHoach({ hs }: { hs: HoSoDuAn }) {
  const cuoi = hs.phienBan[0]
  const that = hs.buoc.filter((b) => !b.laNhom && !b.laNhap)
  const nhap = hs.buoc.filter((b) => b.laNhap)
  const lech = that.filter((b) => b.id in hs.hanDaChot && hs.hanDaChot[b.id] !== b.han)
  const coThayDoi = nhap.length > 0 || lech.length > 0

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <TheSo
          nhan="Phiên bản đã chốt"
          gt={`v${cuoi?.so ?? 1}`}
          phu={`${Math.max(0, hs.phienBan.length - 1)} lần điều chỉnh`}
        />
        <TheSo
          nhan="Thay đổi chưa chốt"
          gt={nhap.length + lech.length}
          phu="đang lưu nháp"
          mau={coThayDoi ? 'text-warn' : undefined}
        />
        <TheSo
          nhan="Trượt tích lũy"
          gt={hs.phienBan.reduce((t, p) => t + p.soNgayLui, 0)}
          phu="ngày qua các lần chốt"
          mau={hs.phienBan.some((p) => p.soNgayLui > 0) ? 'text-danger' : undefined}
        />
      </div>
      <BangGiaHan hs={hs} />
      <KeHoachChinh hs={hs} />
    </>
  )
}

function TheSo({ nhan, gt, phu, mau }: { nhan: string; gt: string | number; phu: string; mau?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-nen px-3.5 py-3">
      <p className="m-0 text-[11px] font-bold tracking-[.06em] text-faint uppercase">{nhan}</p>
      <p className={`m-0 mt-0.5 text-[24px] leading-tight font-bold tabular-nums ${mau ?? 'text-ink'}`}>
        {gt}
      </p>
      <p className="m-0 text-[11.5px] text-faint">{phu}</p>
    </div>
  )
}

function KeHoachChinh({ hs }: { hs: HoSoDuAn }) {
  const cuoi = hs.phienBan[0]
  const that = hs.buoc.filter((b) => !b.laNhom && !b.laNhap)
  const nhap = hs.buoc.filter((b) => b.laNhap)
  const lech = that.filter((b) => b.id in hs.hanDaChot && hs.hanDaChot[b.id] !== b.han)
  const ketThuc = ngayKetThucDuKien(hs.buoc)
  const lui = cuoi?.ngayKetThuc && ketThuc ? soNgayGiua(cuoi.ngayKetThuc, ketThuc) : 0
  const coThayDoi = nhap.length > 0 || lech.length > 0

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
      <div>
        <The
          tieuDe="So với lần chốt gần nhất"
          phu={cuoi ? `phiên bản ${cuoi.so} · ${ngayVn(cuoi.ngay)}` : undefined}
        >
          <dl className="m-0 mb-3 grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-faint">Kết thúc dự kiến đã chốt</dt>
            <dd className="m-0 tabular-nums">{ngayVn(cuoi?.ngayKetThuc)}</dd>
            <dt className="text-faint">Kết thúc dự kiến hiện tại</dt>
            <dd className="m-0 tabular-nums">
              {ngayVn(ketThuc)}
              {lui !== 0 && (
                <b className={`ml-2 ${lui > 0 ? 'text-danger' : 'text-ok'}`}>
                  {lui > 0 ? `lùi ${lui} ngày` : `sớm ${-lui} ngày`}
                </b>
              )}
            </dd>
            <dt className="text-faint">Bước đổi hạn</dt>
            <dd className="m-0">{lech.length}</dd>
            <dt className="text-faint">Bước nháp chờ chốt</dt>
            <dd className="m-0">{nhap.length}</dd>
          </dl>
          {lech.length > 0 && (
            <KhungBang nhan="Bước đổi hạn so với lần chốt">
              <thead>
                <tr>
                  <th className={LOP_TH}>Bước</th>
                  <th className={LOP_TH}>Hạn đã chốt</th>
                  <th className={LOP_TH}>Hạn hiện tại</th>
                  <th className={`${LOP_TH} text-right`}>Lệch</th>
                </tr>
              </thead>
              <tbody>
                {lech.slice(0, 30).map((b) => {
                  const cu = hs.hanDaChot[b.id]
                  const d = cu && b.han ? soNgayGiua(cu, b.han) : 0
                  return (
                    <tr key={b.id}>
                      <td className={LOP_TD}>
                        <span className="text-faint">{b.stt}.</span> {b.ten}
                      </td>
                      <td className={`${LOP_TD} tabular-nums`}>{ngayVn(cu)}</td>
                      <td className={`${LOP_TD} tabular-nums`}>{ngayVn(b.han)}</td>
                      <td
                        className={`${LOP_TD} text-right tabular-nums ${d > 0 ? 'text-danger' : 'text-ok'}`}
                      >
                        {d > 0 ? `+${d}` : d}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </KhungBang>
          )}
          {nhap.length > 0 && (
            <p className="mt-3 mb-0 text-[12.5px]">Nháp: {nhap.map((b) => b.ten).join(' · ')}</p>
          )}
          {hs.quyen.sua && <ChotKeHoach hs={hs} coThayDoi={coThayDoi} />}
        </The>

        <The tieuDe="Lịch sử phiên bản kế hoạch">
          <KhungBang nhan="Phiên bản kế hoạch">
            <thead>
              <tr>
                <th className={LOP_TH}>Phiên bản</th>
                <th className={LOP_TH}>Ngày chốt</th>
                <th className={LOP_TH}>Lý do · căn cứ</th>
                <th className={LOP_TH}>Kết thúc dự kiến</th>
                <th className={`${LOP_TH} text-right`}>Lùi</th>
                <th className={LOP_TH}>Người chốt</th>
              </tr>
            </thead>
            <tbody>
              {hs.phienBan.map((p) => (
                <tr key={p.id}>
                  <td className={`${LOP_TD} font-semibold`}>v{p.so}</td>
                  <td className={`${LOP_TD} tabular-nums`}>{ngayVn(p.ngay)}</td>
                  <td className={LOP_TD}>
                    {p.lyDo}
                    {p.canCu && <span className="block text-[11.5px] text-faint">{p.canCu}</span>}
                  </td>
                  <td className={`${LOP_TD} tabular-nums`}>{ngayVn(p.ngayKetThuc)}</td>
                  <td className={`${LOP_TD} text-right tabular-nums ${p.soNgayLui ? 'text-danger' : ''}`}>
                    {p.soNgayLui ? `${p.soNgayLui} ngày` : '—'}
                  </td>
                  <td className={LOP_TD}>{p.nguoiChot ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </KhungBang>
        </The>
      </div>

      {hs.quyen.sua && <ThemBuoc hs={hs} />}
    </div>
  )
}

function ChotKeHoach({ hs, coThayDoi }: { hs: HoSoDuAn; coThayDoi: boolean }) {
  const ghi = useGhiHoSo()
  const [lyDo, datLyDo] = useState('')
  const [canCu, datCanCu] = useState('')
  const [xong, datXong] = useState(false)
  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () => chotKeHoach(hs.id, lyDo.trim(), canCu.trim()),
      () => {
        datLyDo('')
        datCanCu('')
        datXong(true)
      },
    )
  }
  return (
    <form onSubmit={gui} className="mt-4 border-t border-line-2 pt-3">
      <h3 className="mt-0 mb-2 text-[13px] font-semibold">Chốt kế hoạch</h3>
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {xong && <ThongBao kieu="ok">Đã chốt — thêm một phiên bản vào lịch sử.</ThongBao>}
      {!coThayDoi && (
        <p className="mt-0 mb-2 text-[12.5px] text-faint">Kế hoạch đang khớp lần chốt gần nhất.</p>
      )}
      <div className="grid gap-x-3 sm:grid-cols-2">
        <ONhap
          id="kh-ly-do"
          nhan="Lý do điều chỉnh"
          required
          maxLength={1000}
          value={lyDo}
          onChange={(e) => {
            datXong(false)
            datLyDo(e.target.value)
          }}
        />
        <ONhap
          id="kh-can-cu"
          nhan="Căn cứ (cấp có thẩm quyền)"
          maxLength={500}
          placeholder="VD: Công văn số …"
          value={canCu}
          onChange={(e) => datCanCu(e.target.value)}
        />
      </div>
      <Nut type="submit" kieu="chinh" disabled={ghi.dangChay || !lyDo.trim()}>
        {ghi.dangChay ? 'Đang chốt…' : 'Chốt kế hoạch'}
      </Nut>
    </form>
  )
}

function ThemBuoc({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const [gd, datGd] = useState<GiaiDoan>('I')
  const [sau, datSau] = useState('')
  const [ten, datTen] = useState('')
  const [soNgay, datSoNgay] = useState('5')
  const [ben, datBen] = useState<BenThucHien>('chu-dau-tu')
  const [laNhom, datLaNhom] = useState(false)
  const [xong, datXong] = useState(false)
  const trongGd = hs.buoc.filter((b) => b.giaiDoan === gd)

  const gui = (e: FormEvent) => {
    e.preventDefault()
    ghi.chay(
      () =>
        themBuoc(hs.id, {
          giaiDoan: gd,
          sauBuocId: sau || null,
          ten: ten.trim(),
          soNgay: Math.max(0, Math.round(Number(soNgay) || 0)),
          benThucHien: ben,
          laNhom,
        }),
      () => {
        datTen('')
        datXong(true)
      },
    )
  }

  return (
    <The tieuDe="Thêm bước" phu="vào dạng nháp — chốt kế hoạch mới tính hạn">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {xong && <ThongBao kieu="ok">Đã thêm bước nháp. Chốt kế hoạch để bước vào tiến độ.</ThongBao>}
      <form onSubmit={gui}>
        <OChon
          id="tb-gd"
          nhan="Giai đoạn"
          value={gd}
          onChange={(e) => {
            datGd(e.target.value as GiaiDoan)
            datSau('')
          }}
        >
          {(Object.keys(GIAI_DOAN) as GiaiDoan[]).map((g) => (
            <option key={g} value={g}>
              {g} — {GIAI_DOAN[g]}
            </option>
          ))}
        </OChon>
        <OChon id="tb-sau" nhan="Đặt sau bước" value={sau} onChange={(e) => datSau(e.target.value)}>
          <option value="">— Cuối giai đoạn —</option>
          {trongGd.map((b) => (
            <option key={b.id} value={b.id}>
              {b.stt}. {b.ten.length > 70 ? `${b.ten.slice(0, 70)}…` : b.ten}
            </option>
          ))}
        </OChon>
        <ONhap
          id="tb-ten"
          nhan="Tên bước"
          required
          maxLength={500}
          value={ten}
          onChange={(e) => datTen(e.target.value)}
        />
        <div className="grid gap-x-3 sm:grid-cols-2">
          <ONhap
            id="tb-so-ngay"
            nhan="Số ngày chuẩn"
            type="number"
            min={0}
            disabled={laNhom}
            value={soNgay}
            onChange={(e) => datSoNgay(e.target.value)}
          />
          <OChon
            id="tb-ben"
            nhan="Bên thực hiện"
            value={ben}
            onChange={(e) => datBen(e.target.value as BenThucHien)}
          >
            {Object.entries(BEN_THUC_HIEN).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </OChon>
        </div>
        <ODanhDau
          id="tb-nhom"
          nhan="Là nhóm bước"
          mo="Nhóm gom các bước con, không có hạn riêng."
          checked={laNhom}
          onChange={(e) => datLaNhom(e.target.checked)}
        />
        <Nut type="submit" kieu="chinh" disabled={ghi.dangChay || !ten.trim()}>
          Thêm bước nháp
        </Nut>
      </form>
    </The>
  )
}
