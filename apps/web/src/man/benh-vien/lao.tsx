import { KET_QUA_NHAC_LAO, quyenBenhVien, type CaLaoThu, type KetQuaNhacLao } from '@gdos/shared'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { Chip, Nut, OChon, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const COT: CotLuoi<CaLaoThu>[] = [
  { id: 'ma', nhan: 'Mã ca lao', kieu: 'chu', giaTri: (d) => d.ma, rong: 130, batBuoc: true },
  { id: 'ho-ten', nhan: 'Người bệnh', kieu: 'chu', giaTri: (d) => d.hoTen ?? 'Bệnh nhân', rong: 160 },
  {
    id: 'thong-tin',
    nhan: 'Tuổi / Giới',
    kieu: 'chu',
    giaTri: (d) => `${d.namSinh ? new Date().getFullYear() - d.namSinh : '—'} tuổi · ${d.gioiTinh ?? '—'}`,
    rong: 120,
  },
  { id: 'phan-loai', nhan: 'Phân loại ca', kieu: 'danh-muc', giaTri: (d) => d.phanLoai ?? 'Mới', rong: 130 },
  {
    id: 'the-benh',
    nhan: 'Thể bệnh',
    kieu: 'danh-muc',
    giaTri: (d) => d.theBenh ?? 'Lao phổi AFB(+)',
    rong: 160,
  },
  { id: 'phac-do', nhan: 'Phác đồ điều trị', kieu: 'chu', giaTri: (d) => d.phacDo ?? '2RHZE/4RH', rong: 170 },
  { id: 'bat-dau', nhan: 'Ngày bắt đầu', kieu: 'ngay', giaTri: (d) => d.batDau },
  {
    id: 'tuan-thu',
    nhan: 'Tuân thủ DOTS',
    kieu: 'so',
    giaTri: (d) => d.tuanThuDots ?? 90,
    hien: (d) => (
      <span
        className={d.tuanThuDots && d.tuanThuDots < 85 ? 'text-warn font-semibold' : 'text-ok font-semibold'}
      >
        {d.tuanThuDots ?? 90}%
      </span>
    ),
  },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (d) => (d.hoanTat ? 'Hoàn tất theo dõi' : 'Đang điều trị DOTS'),
    hien: (d) =>
      d.hoanTat ? <Chip mau="ok">Hoàn tất theo dõi</Chip> : <Chip mau="brand">Đang điều trị DOTS</Chip>,
  },
]

function HopThoaiChiTietLao({ ca, dong }: { ca: CaLaoThu; dong: () => void }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const sua = q.includes(quyenBenhVien('dieu-tri-lao', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('dieu-tri-lao', 'APPROVE'))
  const coMoi = ca.lanTheoDoi.some((d) => d.ketQua)
  const daXacNhan = ca.lanTheoDoi.filter((d) => d.ketQua === 'da-xac-nhan').length
  const lam = (viec: string, body?: unknown) => ghi.mutate({ duongDan: `/lao/${ca.ma}/${viec}`, body })

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [dong])

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && dong()}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,22,44,.5)] backdrop-blur-[2px] p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bv-lao-tieu-de"
        className="hien-dan flex max-h-[90vh] w-full max-w-[620px] flex-col rounded-[12px] border border-line bg-nen shadow-[0_18px_44px_rgba(4,14,33,.3)]"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 id="bv-lao-tieu-de" className="m-0 text-[17px] font-extrabold text-ink">
              {ca.ma} — {ca.hoTen ?? 'Bệnh nhân'}
            </h2>
            <p className="mt-0.5 mb-0 text-xs text-faint">
              ICD-10: {ca.maIcd} · {ca.theBenh ?? 'Lao phổi'}
            </p>
          </div>
          <Nut onClick={dong}>Đóng</Nut>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm border-b border-line pb-3">
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Phân loại & thể bệnh</dt>
              <dd className="font-semibold text-ink">
                {ca.phanLoai ?? 'Mới'} · {ca.theBenh ?? 'Lao phổi'}
              </dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Phác đồ CTCLQG</dt>
              <dd className="font-semibold text-brand">{ca.phacDo ?? '2RHZE/4RH'}</dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Đầu mối phụ trách</dt>
              <dd className="font-semibold text-ink">{ca.theoDoi}</dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Bắt đầu điều trị</dt>
              <dd className="font-semibold text-ink">{ngayVn(ca.batDau)}</dd>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-faint mb-1">
              <span>Tiến độ uống thuốc giám sát trực tiếp (DOTS)</span>
              <span>
                {daXacNhan}/{ca.lanTheoDoi.length} mốc đã xác nhận
              </span>
            </div>
            <progress
              aria-label="Mốc theo dõi đã xác nhận"
              className="h-2.5 w-full accent-brand rounded-full overflow-hidden"
              value={daXacNhan}
              max={ca.lanTheoDoi.length}
            />
          </div>

          {ca.ketQuaXnDom && ca.ketQuaXnDom.length > 0 && (
            <div className="mb-4 rounded-lg border border-line bg-nen-2 p-3 text-sm">
              <strong className="block mb-2 text-xs uppercase tracking-wide text-faint">
                Kết quả xét nghiệm đờm theo dõi
              </strong>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {ca.ketQuaXnDom.map((xn) => (
                  <div key={xn.thang} className="rounded border border-line bg-nen p-1.5">
                    <span className="block text-faint">Tháng {xn.thang}</span>
                    <strong className={xn.ketQua === 'Âm tính' ? 'text-ok' : 'text-warn'}>{xn.ketQua}</strong>
                    <span className="block text-[10px] text-faint">{xn.ngayXn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}

          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Nhật ký uống thuốc DOTS định kỳ
          </h4>
          <ul className="mb-4 divide-y divide-line">
            {ca.lanTheoDoi.map(({ ngay, ketQua }) => (
              <li key={ngay} className="flex flex-wrap items-center justify-between gap-2 py-2 [&>div]:mb-0">
                {sua && !ca.hoanTat ? (
                  <OChon
                    id={`bv-${ca.ma}-${ngay}`}
                    nhan={`Uống thuốc ngày ${ngayVn(ngay)}`}
                    value={ketQua ?? ''}
                    disabled={ghi.isPending}
                    onChange={(e) => {
                      if (e.target.value) lam('nhac', { ngay, ketQua: e.target.value as KetQuaNhacLao })
                    }}
                  >
                    <option value="" disabled>
                      Chưa ghi nhận
                    </option>
                    {Object.entries(KET_QUA_NHAC_LAO).map(([k, ten]) => (
                      <option key={k} value={k}>
                        {ten}
                      </option>
                    ))}
                  </OChon>
                ) : (
                  <div className="text-sm">
                    <strong>{ngayVn(ngay)}</strong> · {ketQua ? KET_QUA_NHAC_LAO[ketQua] : 'Chưa ghi nhận'}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3 bg-nen-2/40 rounded-b-[12px]">
          {duyet && !ca.hoanTat && (
            <Nut
              disabled={ghi.isPending || daXacNhan !== ca.lanTheoDoi.length}
              onClick={() => lam('hoan-tat')}
            >
              Hoàn tất theo dõi
            </Nut>
          )}
          {sua && (
            <Nut kieu="chinh" disabled={ghi.isPending || !coMoi} onClick={() => lam('dong-bo')}>
              Đồng bộ VITIMES (CTCLQG)
            </Nut>
          )}
        </div>

        {ca.dongBoLuc && (
          <p role="status" className="px-5 py-2 text-sm text-ok border-t border-line/40 m-0">
            ✓ Hệ thống Quốc gia VITIMES đã xác nhận đồng bộ bản ghi lúc {ngayGio(ca.dongBoLuc)}.
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default function TheoDoiLao() {
  const ds = useThu<CaLaoThu[]>('/lao')
  const [ma, datMa] = useState<string>()
  const ca = ds.find((d) => d.ma === ma)
  const hoanTat = ds.filter((d) => d.hoanTat).length
  const canLienHe = ds.filter((d) => d.lanTheoDoi.some((l) => l.ketQua === 'bo-lo')).length

  return (
    <>
      <NhacGiaLap>
        Quản lý điều trị bệnh nhân lao theo Chương trình Chống lao Quốc gia (CTCLQG) và liên thông dữ liệu
        VITIMES.
      </NhacGiaLap>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Tổng ca quản lý</span>
          <strong className="text-xl text-ink">{ds.length}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Đang điều trị DOTS</span>
          <strong className="text-xl text-brand">{ds.length - hoanTat}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Cần liên hệ lại</span>
          <strong className="text-xl text-warn">{canLienHe}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Tỷ lệ âm hóa đờm T2</span>
          <strong className="text-xl text-ok">84 %</strong>
        </div>
      </div>

      <div className="w-full">
        <Luoi
          ma="bv-ca-lao"
          tieuDe="Danh sách bệnh nhân lao đang điều trị theo phác đồ"
          cot={COT}
          dong={ds}
          khoa={(d) => d.ma}
          moDong={(d) => datMa(d.ma)}
          dongDangMo={ca?.ma}
        />
      </div>

      {ca && <HopThoaiChiTietLao key={ca.ma} ca={ca} dong={() => datMa(undefined)} />}
    </>
  )
}
