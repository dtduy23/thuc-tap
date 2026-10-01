import { HINH_THUC, LOAI_CHI, NHOM_DU_AN, TRANG_THAI_DU_AN, type HoSoDuAn } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { suaDuAn, truyVanDanhMuc } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { ChonTaiKhoan } from '@/ui/chon-tai-khoan'
import { tenGiaiDoan, ThanhTienDo, trieuDong } from '../chung'
import { useGhiHoSo } from './ghi-ho-so'

function O({ nhan, gt, mau }: { nhan: string; gt: ReactNode; mau?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-nen px-3.5 py-3">
      <p className="m-0 text-[11.5px] font-semibold text-faint">{nhan}</p>
      <p className={`m-0 mt-0.5 text-[22px] leading-tight font-bold tabular-nums ${mau ?? 'text-ink'}`}>
        {gt}
      </p>
    </div>
  )
}

/** Thẻ Tổng quan: số liệu tiến độ + thông tin chung (sửa được nếu là chủ đầu tư). */
export default function TongQuan({ hs }: { hs: HoSoDuAn }) {
  const tk = hs.thongKe
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <O nhan="Tiến độ" gt={`${tk.phanTram}%`} />
          <O nhan="Quá hạn" gt={tk.quaHan} mau={tk.quaHan ? 'text-danger' : undefined} />
          <O nhan="Sắp đến hạn" gt={tk.sapHan} mau={tk.sapHan ? 'text-warn' : undefined} />
          <O nhan="Chờ xác nhận" gt={tk.choXacNhan} mau={tk.choXacNhan ? 'text-tim' : undefined} />
        </div>
        <The tieuDe="Đang ở đâu">
          <ThanhTienDo phanTram={tk.phanTram} />
          <p className="mt-2 mb-0 text-[13px]">
            {tk.xong}/{tk.tong} bước đã xong · Giai đoạn <b>{tenGiaiDoan(tk.giaiDoan)}</b>
          </p>
          {tk.buocHienTai && (
            <p className="mt-1 mb-0 text-[13px] text-body">
              Bước tiếp theo:{' '}
              <b>
                {tk.buocHienTai.stt}. {tk.buocHienTai.ten}
              </b>
            </p>
          )}
          {tk.quaHan > 0 && (
            <p className="mt-1 mb-0 text-[13px] text-danger">
              {tk.quaHan} bước quá hạn — trễ nhất {tk.treNhat} ngày.
            </p>
          )}
        </The>
        <ThongTin hs={hs} />
      </div>
      <The tieuDe="Tóm tắt">
        <dl className="m-0 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[13px]">
          <dt className="text-faint">Mã</dt>
          <dd className="m-0 font-mono">{hs.ma}</dd>
          <dt className="text-faint">Chủ đầu tư</dt>
          <dd className="m-0">{hs.donViTen}</dd>
          <dt className="text-faint">Hình thức</dt>
          <dd className="m-0">{HINH_THUC[hs.hinhThuc]}</dd>
          <dt className="text-faint">Loại chi</dt>
          <dd className="m-0">{LOAI_CHI[hs.loaiChi]}</dd>
          <dt className="text-faint">Tổng mức</dt>
          <dd className="m-0">{trieuDong(hs.tongMuc)}</dd>
          <dt className="text-faint">Bắt đầu</dt>
          <dd className="m-0">{ngayVn(hs.ngayBatDau)}</dd>
          <dt className="text-faint">Cán bộ phụ trách</dt>
          <dd className="m-0">{hs.canBo?.hoTen ?? '—'}</dd>
          <dt className="text-faint">Cập nhật gần nhất</dt>
          <dd className="m-0">{ngayVn(hs.capNhatNgay)}</dd>
        </dl>
      </The>
    </div>
  )
}

function ThongTin({ hs }: { hs: HoSoDuAn }) {
  const { data: dsLv = [] } = useQuery(truyVanDanhMuc('linh-vuc'))
  const ghi = useGhiHoSo()
  const [daLuu, datDaLuu] = useState(false)
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
  const doi = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    datDaLuu(false)
    datF((c) => ({ ...c, [k]: e.target.value }))
  }
  const khoa = !hs.quyen.sua

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
      () => datDaLuu(true),
    )
  }

  return (
    <The tieuDe="Thông tin chung" phu={khoa ? 'chỉ xem' : undefined}>
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {daLuu && <ThongBao kieu="ok">Đã lưu.</ThongBao>}
      <form onSubmit={gui}>
        <fieldset disabled={khoa} className="m-0 border-0 p-0">
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
          <ONhap id="tt-can-cu" nhan="Căn cứ" maxLength={500} value={f.canCu} onChange={doi('canCu')} />
          <ONhap
            id="tt-dia-diem"
            nhan="Địa điểm đầu tư"
            maxLength={300}
            value={f.diaDiem}
            onChange={doi('diaDiem')}
          />
          <ChonTaiKhoan nhan="Cán bộ phụ trách" gt={canBo} doi={datCanBo} khoa={khoa} />
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
              className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink disabled:opacity-60"
            />
          </div>
          {!khoa && (
            <Nut type="submit" kieu="chinh" disabled={ghi.dangChay}>
              {ghi.dangChay ? 'Đang lưu…' : 'Lưu thông tin'}
            </Nut>
          )}
        </fieldset>
      </form>
    </The>
  )
}
