import { CHI_TIEU_BENH_VIEN, kyHienTai, quyenBenhVien, type KetNoiBenhVienThu } from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ngayGio } from '@/lib/ngay'
import { Chip, Nut, ONhap, The, ThongBao } from '@/ui/co-ban'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const GIAO_THUC_NGUON: Record<string, string> = {
  his: 'REST API / Webhook (HIS-CORE)',
  lis: 'ASTM 1381/1394 & HL7 v2.x',
  'x-quang': 'DICOM 3.0 / WADO-RS',
  bhyt: 'XML QĐ 130/QĐ-BYT & QĐ 4750',
  vitimes: 'API Liên thông CTCLQG',
}

function Nguon({ ky }: { ky: string }) {
  const ds = useThu<KetNoiBenhVienThu[]>(`/ket-noi?ky=${ky}`)
  const q = useQuyenThu()
  const ghi = useGhiThu()
  return (
    <>
      {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}
      <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-3">
        {ds.map(({ ma, ten, luc, soLieu }) => (
          <The key={ma} tieuDe={ten}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip mau={luc ? 'ok' : 'xam'}>{luc ? 'Đã kết nối' : 'Chưa nạp kỳ này'}</Chip>
              {luc && <span className="text-xs text-faint">{ngayGio(luc)}</span>}
            </div>
            <p className="mb-3 text-xs text-brand font-medium">
              Chuẩn: {GIAO_THUC_NGUON[ma] ?? 'RESTful API'}
            </p>
            {soLieu.length > 0 && (
              <dl className="mb-3 space-y-2">
                {soLieu.map((s) => (
                  <div key={s.ma} className="flex justify-between gap-2 text-sm">
                    <dt className="text-body">{CHI_TIEU_BENH_VIEN.find((c) => c.ma === s.ma)?.ten}</dt>
                    <dd className="font-semibold tabular-nums">{s.giaTri.toLocaleString('vi-VN')}</dd>
                  </div>
                ))}
              </dl>
            )}
            {q.includes(quyenBenhVien('qt-nguon-vao', 'UPDATE')) && (
              <Nut
                disabled={ghi.isPending}
                onClick={() => ghi.mutate({ duongDan: `/ket-noi/${ma}/dong-bo?ky=${ky}` })}
              >
                {luc ? `Nạp lại ${ten}` : `Nạp mẫu ${ten}`}
              </Nut>
            )}
          </The>
        ))}
      </div>
    </>
  )
}

export default function KetNoiBenhVien() {
  const q = useQuyenThu()
  const [ky, datKy] = useState(kyHienTai)
  return (
    <>
      <NhacGiaLap>Năm nguồn trả số tổng hợp mẫu theo cùng kỳ báo cáo với bảng điều hành.</NhacGiaLap>
      <div className="mb-3 flex flex-wrap items-center gap-4 [&>div]:mb-0">
        <ONhap
          nhan="Kỳ đồng bộ"
          id="bv-ky-dong-bo"
          type="month"
          min="2000-01"
          max="2100-12"
          value={ky}
          onChange={(e) => {
            if (e.target.value && e.target.validity.valid) datKy(e.target.value)
          }}
        />
        {q.includes(quyenBenhVien('tong-quan', 'READ')) && (
          <Link
            className="mt-4 text-sm font-semibold text-brand underline"
            to="/$chucNang"
            params={{ chucNang: 'dh-bang-dieu-hanh' }}
            hash="benh-vien"
          >
            Mở bảng điều hành
          </Link>
        )}
      </div>
      <Nguon ky={ky} />
    </>
  )
}
