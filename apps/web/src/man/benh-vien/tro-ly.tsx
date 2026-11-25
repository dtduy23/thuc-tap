import {
  CHI_TIEU_BENH_VIEN,
  CHU_DE_TRO_LY_BENH_VIEN,
  MA_CONG_SUAT_GIUONG,
  kyHienTai,
  quyenBenhVien,
  type CaLaoThu,
  type ChuDeTroLyBenhVien,
  type TraLoiBenhVienThu,
} from '@gdos/shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { goiApi } from '@/lib/http'
import { Chip, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { NhacGiaLap, useQuyenThu } from './chung'

const MO_TA_CHU_DE: Record<ChuDeTroLyBenhVien, string> = {
  'ma-icd': 'Tra cứu mã bệnh ICD-10 đã lưu và chẩn đoán chuẩn trên hồ sơ ca lao.',
  'nhac-theo-doi': 'Tổng hợp lịch uống thuốc DOTS và các mốc cần liên hệ nhắc tái khám.',
  'kiem-tra-don-thuoc': 'Đối chiếu phác đồ chuẩn CTCLQG (2RHZE/4RH), liều lượng và cảnh báo tương tác.',
  'soan-thao': 'Soạn thảo biểu mẫu báo cáo, phiếu theo dõi đúng thể thức Bộ Y tế.',
  'du-thao': 'Tổng hợp số liệu bệnh viện thành bản dự thảo văn bản giao ban định kỳ.',
  'so-lieu': 'Truy vấn số liệu KPI từng chỉ tiêu bệnh viện theo kỳ báo cáo từ Dashboard.',
}

interface CauHoi {
  chuDe: ChuDeTroLyBenhVien
  ky: string
  ma?: string
}

function TraCuuBenhVien({ theo }: { theo: 'lao' | 'so-lieu' }) {
  const q = useQuyenThu()
  const coLao = theo === 'lao' && q.includes(quyenBenhVien('dieu-tri-lao', 'READ'))
  const coSoLieu = theo === 'so-lieu' && q.includes(quyenBenhVien('tong-quan', 'READ'))
  const [chuDe, datChuDe] = useState<ChuDeTroLyBenhVien>(theo === 'so-lieu' ? 'so-lieu' : 'ma-icd')
  const [ky, datKy] = useState(kyHienTai)
  const [maCa, datMaCa] = useState('')
  const [maChiTieu, datMaChiTieu] = useState('BV-01')
  const [nhap, datNhap] = useState('')
  const [daChep, datDaChep] = useState(false)
  const [loiChep, datLoiChep] = useState(false)
  const laLao =
    chuDe === 'ma-icd' || chuDe === 'nhac-theo-doi' || chuDe === 'kiem-tra-don-thuoc' || chuDe === 'soan-thao'
  const ds = useQuery({
    queryKey: ['benh-vien-thu', '/lao'],
    queryFn: () => goiApi<CaLaoThu[]>('/benh-vien/lao'),
    enabled: laLao && coLao,
  })
  const hoSo = maCa || ds.data?.[0]?.ma
  const hoi = useMutation({
    mutationFn: (body: CauHoi) => goiApi<TraLoiBenhVienThu>('/benh-vien/tro-ly', { method: 'POST', body }),
    onSuccess: (d) => {
      datNhap(d.noiDung)
      datDaChep(false)
      datLoiChep(false)
    },
  })
  async function chep() {
    try {
      await navigator.clipboard.writeText(nhap)
      datDaChep(true)
      datLoiChep(false)
    } catch {
      datLoiChep(true)
    }
  }
  return (
    <>
      {theo === 'lao' ? (
        <NhacGiaLap>Tra mã đã lưu và lịch theo dõi của ca mẫu.</NhacGiaLap>
      ) : (
        <ThongBao>
          Tra cứu theo kỳ từ bảng điều hành. Số đã nạp được ưu tiên và từng kết quả có ghi nguồn.
        </ThongBao>
      )}
      {!coLao && !coSoLieu ? (
        <ThongBao kieu="loi">Tài khoản chưa được cấp quyền đọc nguồn cho trợ lý bệnh viện.</ThongBao>
      ) : (
        <div className="grid items-start gap-x-4 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
          <The tieuDe="Đặt câu hỏi">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                hoi.mutate({ chuDe, ky, ma: laLao ? hoSo : chuDe === 'so-lieu' ? maChiTieu : undefined })
              }}
            >
              <OChon
                id="bv-chu-de"
                nhan="Chủ đề"
                value={chuDe}
                onChange={(e) => {
                  datChuDe(e.target.value as ChuDeTroLyBenhVien)
                  datNhap('')
                  datDaChep(false)
                  datLoiChep(false)
                  hoi.reset()
                }}
              >
                {Object.entries(CHU_DE_TRO_LY_BENH_VIEN)
                  .filter(([ma]) =>
                    ma === 'ma-icd' ||
                    ma === 'nhac-theo-doi' ||
                    ma === 'kiem-tra-don-thuoc' ||
                    ma === 'soan-thao'
                      ? coLao
                      : coSoLieu,
                  )
                  .map(([ma, ten]) => (
                    <option key={ma} value={ma}>
                      {ten}
                    </option>
                  ))}
              </OChon>
              <p className="mb-3 -mt-1 text-xs text-faint">{MO_TA_CHU_DE[chuDe]}</p>
              {laLao ? (
                <OChon
                  id="bv-ca-tro-ly"
                  nhan="Ca mẫu"
                  value={hoSo ?? ''}
                  onChange={(e) => datMaCa(e.target.value)}
                >
                  {ds.isPending && <option value="">Đang tải ca mẫu…</option>}
                  {ds.data?.map((d) => (
                    <option key={d.ma} value={d.ma}>
                      {d.hoTen ? `${d.ma} — ${d.hoTen}` : d.ma}
                    </option>
                  ))}
                </OChon>
              ) : (
                <ONhap
                  id="bv-ky-tro-ly"
                  nhan="Kỳ báo cáo"
                  type="month"
                  min="2000-01"
                  max="2100-12"
                  value={ky}
                  onChange={(e) => {
                    if (e.target.value && e.target.validity.valid) datKy(e.target.value)
                  }}
                />
              )}
              {chuDe === 'so-lieu' && (
                <OChon
                  id="bv-chi-tieu-tro-ly"
                  nhan="Chỉ tiêu"
                  value={maChiTieu}
                  onChange={(e) => datMaChiTieu(e.target.value)}
                >
                  {CHI_TIEU_BENH_VIEN.map(({ ma, ten }) => (
                    <option key={ma} value={ma}>
                      {ten}
                    </option>
                  ))}
                  <option value={MA_CONG_SUAT_GIUONG}>Công suất sử dụng giường</option>
                </OChon>
              )}
              {((laLao && ds.isError) || hoi.isError) && (
                <ThongBao kieu="loi">{hoi.error?.message ?? ds.error?.message}</ThongBao>
              )}
              <Nut type="submit" kieu="chinh" disabled={hoi.isPending || (laLao && !hoSo)}>
                {hoi.isPending ? 'Đang tra cứu…' : 'Thực hiện tra cứu'}
              </Nut>
            </form>
          </The>
          <The tieuDe="Trả lời và soạn thảo">
            {hoi.data ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Chip mau="brand">{CHU_DE_TRO_LY_BENH_VIEN[hoi.variables.chuDe]}</Chip>
                  <Chip>{hoi.data.nguon}</Chip>
                </div>
                <label className="block text-sm font-semibold" htmlFor="bv-loi-dap">
                  Nội dung có thể chỉnh sửa
                </label>
                <textarea
                  id="bv-loi-dap"
                  className="w-full rounded-lg border border-line bg-nen-2 p-3 text-sm leading-6 text-ink"
                  rows={11}
                  value={nhap}
                  onChange={(e) => {
                    datNhap(e.target.value)
                    datDaChep(false)
                  }}
                />
                <Nut onClick={() => void chep()} disabled={!nhap}>
                  {daChep ? '✓ Đã chép' : 'Sao chép kết quả'}
                </Nut>
                {daChep && (
                  <span className="ml-2 text-sm text-ok" role="status">
                    Đã sao chép.
                  </span>
                )}
                {loiChep && (
                  <p className="text-sm text-danger" role="alert">
                    Không sao chép tự động được. Có thể chọn và chép nội dung ở ô trên.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-faint">Chọn chủ đề và gửi câu hỏi để xem câu trả lời kèm nguồn.</p>
            )}
          </The>
        </div>
      )}
    </>
  )
}

export default function TraCuuCaMau() {
  return <TraCuuBenhVien theo="lao" />
}
export function TraCuuSoLieuBenhVien() {
  return <TraCuuBenhVien theo="so-lieu" />
}
