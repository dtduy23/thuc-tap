import { CHI_TIEU_BENH_VIEN, kyHienTai, quyenBenhVien, type KetNoiBenhVienThu } from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { goiApi, LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { Chip, Nut, ONhap, The, ThongBao } from '@/ui/co-ban'
import { useQueryClient } from '@tanstack/react-query'
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
  const qc = useQueryClient()
  const [thongBao, datThongBao] = useState<string | null>(null)
  const [loiAll, datLoiAll] = useState<string | null>(null)
  const [dangDongBoAll, datDangDongBoAll] = useState(false)
  const [kyTruoc, datKyTruoc] = useState(ky)
  if (ky !== kyTruoc) {
    datKyTruoc(ky)
    datThongBao(null)
    datLoiAll(null)
    ghi.reset()
  }
  const sua = q.includes(quyenBenhVien('qt-nguon-vao', 'UPDATE'))
  const daKetNoi = ds.filter((d) => d.luc).length

  const dongBoMot = (ma: string, ten: string) => {
    datLoiAll(null)
    ghi.mutate(
      { duongDan: `/ket-noi/${ma}/dong-bo?ky=${ky}` },
      {
        onSuccess: (res) => {
          const soDong = (res as { soDong?: number } | undefined)?.soDong ?? 0
          datThongBao(`Đã đồng bộ nguồn ${ten} (kỳ ${ky}): cập nhật ${soDong} chỉ tiêu.`)
        },
      },
    )
  }

  const dongBoTatCa = async () => {
    datLoiAll(null)
    ghi.reset()
    datDangDongBoAll(true)
    try {
      let tongDong = 0
      for (const n of ds) {
        const res = await goiApi<{ soDong?: number }>(`/benh-vien/ket-noi/${n.ma}/dong-bo?ky=${ky}`, {
          method: 'POST',
        })
        tongDong += res.soDong ?? 0
      }
      await qc.invalidateQueries({ queryKey: ['benh-vien-thu'] })
      datThongBao(`Đã đồng bộ toàn bộ ${ds.length} nguồn dữ liệu (kỳ ${ky}): tổng ${tongDong} chỉ tiêu.`)
    } catch (e) {
      datLoiAll(e instanceof LoiApi ? e.message : 'Đồng bộ nguồn thất bại, vui lòng thử lại.')
    } finally {
      datDangDongBoAll(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-nen-2 p-3">
        <div className="text-sm">
          <span className="text-faint">Trạng thái liên thông kỳ {ky}: </span>
          <strong className={daKetNoi === ds.length ? 'text-ok' : 'text-brand'}>
            {daKetNoi}/{ds.length} nguồn đã đồng bộ
          </strong>
        </div>
        {sua && (
          <Nut kieu="chinh" disabled={ghi.isPending || dangDongBoAll} onClick={() => void dongBoTatCa()}>
            {dangDongBoAll ? 'Đang đồng bộ 5 nguồn…' : 'Đồng bộ tất cả 5 nguồn'}
          </Nut>
        )}
      </div>

      {(ghi.isError || loiAll) && <ThongBao kieu="loi">{loiAll ?? ghi.error?.message}</ThongBao>}
      {thongBao && (
        <div className="mb-3">
          <ThongBao kieu="ok">{thongBao}</ThongBao>
        </div>
      )}

      <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-3">
        {ds.map(({ ma, ten, luc, soLieu }) => (
          <The key={ma} tieuDe={ten}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip mau={luc ? 'ok' : 'xam'}>{luc ? 'Đã kết nối' : 'Chưa đồng bộ kỳ này'}</Chip>
              {luc && <span className="text-xs text-faint">{ngayGio(luc)}</span>}
            </div>
            <p className="mb-3 text-xs font-medium text-brand">
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
            {sua && (
              <Nut
                disabled={ghi.isPending || dangDongBoAll}
                onClick={() => dongBoMot(ma, ten)}
              >
                {luc ? `Đồng bộ lại ${ten}` : `Đồng bộ ${ten}`}
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
      <NhacGiaLap>Trục tích hợp 5 nguồn dữ liệu y tế đồng bộ cùng kỳ báo cáo với bảng điều hành.</NhacGiaLap>
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
            Mở bảng điều hành BI
          </Link>
        )}
      </div>
      <Nguon ky={ky} />
    </>
  )
}
