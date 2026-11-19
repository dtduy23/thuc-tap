import { KET_QUA_NHAC_LAO, quyenBenhVien, type CaLaoThu, type KetQuaNhacLao } from '@gdos/shared'
import { useState } from 'react'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { Chip, Nut, OChon, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const COT: CotLuoi<CaLaoThu>[] = [
  { id: 'ma', nhan: 'Mã ca', kieu: 'chu', giaTri: (d) => d.ma, rong: 130, batBuoc: true },
  { id: 'bat-dau', nhan: 'Bắt đầu', kieu: 'ngay', giaTri: (d) => d.batDau },
  { id: 'theo-doi', nhan: 'Đầu mối', kieu: 'danh-muc', giaTri: (d) => d.theoDoi, rong: 180 },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (d) => (d.hoanTat ? 'Hoàn tất theo dõi' : 'Đang theo dõi'),
  },
]

function ChiTietLao({ ca }: { ca: CaLaoThu }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const sua = q.includes(quyenBenhVien('dieu-tri-lao', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('dieu-tri-lao', 'APPROVE'))
  const xuat = q.includes(quyenBenhVien('dieu-tri-lao', 'EXPORT'))
  const coMoi = ca.lanTheoDoi.some((d) => d.ketQua)
  const daXacNhan = ca.lanTheoDoi.filter((d) => d.ketQua === 'da-xac-nhan').length
  const lam = (viec: string, body?: unknown) => ghi.mutate({ duongDan: `/lao/${ca.ma}/${viec}`, body })
  return (
    <The tieuDe={ca.ma} phu={ca.maIcd}>
      <p className="mb-3 text-sm text-faint">
        {ca.theoDoi} · bắt đầu {ngayVn(ca.batDau)}
      </p>
      <progress
        aria-label="Mốc theo dõi đã xác nhận"
        className="mb-3 h-2.5 w-full accent-brand"
        value={daXacNhan}
        max={ca.lanTheoDoi.length}
      />
      {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}
      <ul className="mb-3 divide-y divide-line">
        {ca.lanTheoDoi.map(({ ngay, ketQua }) => (
          <li key={ngay} className="flex flex-wrap items-center justify-between gap-2 py-2.5 [&>div]:mb-0">
            {sua && !ca.hoanTat ? (
              <OChon
                id={`bv-${ca.ma}-${ngay}`}
                nhan={`Theo dõi ${ngayVn(ngay)}`}
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
      <div className="flex flex-wrap gap-2">
        {duyet && !ca.hoanTat && (
          <Nut disabled={ghi.isPending || daXacNhan !== ca.lanTheoDoi.length} onClick={() => lam('hoan-tat')}>
            Hoàn tất theo dõi
          </Nut>
        )}
        {xuat && (
          <Nut kieu="chinh" disabled={ghi.isPending || !coMoi} onClick={() => lam('dong-bo')}>
            Đồng bộ VITIMES giả lập
          </Nut>
        )}
      </div>
      {ca.dongBoLuc && (
        <p role="status" className="mt-3 text-sm text-ok">
          VITIMES giả lập đã nhận bản mới nhất lúc {ngayGio(ca.dongBoLuc)}.
        </p>
      )}
    </The>
  )
}

export default function TheoDoiLao() {
  const ds = useThu<CaLaoThu[]>('/lao')
  const [ma, datMa] = useState(ds[0]?.ma)
  const ca = ds.find((d) => d.ma === ma)
  const hoanTat = ds.filter((d) => d.hoanTat).length
  const canLienHe = ds.filter((d) => d.lanTheoDoi.some((l) => l.ketQua === 'bo-lo')).length
  return (
    <>
      <NhacGiaLap>
        Ghi nhận lịch theo dõi của ca mẫu. Mọi lần đồng bộ đều trong môi trường diễn tập.
      </NhacGiaLap>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip>{ds.length - hoanTat} đang theo dõi</Chip>
        <Chip mau="warn">{canLienHe} cần liên hệ lại</Chip>
        <Chip mau="ok">{hoanTat} đã hoàn tất</Chip>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
        <Luoi
          ma="bv-ca-lao"
          tieuDe="Ca theo dõi lao giả lập"
          cot={COT}
          dong={ds}
          khoa={(d) => d.ma}
          moDong={(d) => datMa(d.ma)}
        />
        {ca && <ChiTietLao key={ca.ma} ca={ca} />}
      </div>
    </>
  )
}
