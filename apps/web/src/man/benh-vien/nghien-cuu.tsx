import { VIEC_NGHIEN_CUU, quyenBenhVien, type NghienCuuPhimThu } from '@gdos/shared'
import { Download } from 'lucide-react'
import { ngayGio } from '@/lib/ngay'
import { Chip, Nut, The, ThongBao } from '@/ui/co-ban'
import { NhacGiaLap, useGhiThu, useQuyenThu, useTaiLieuThu, useThu } from './chung'

const BIEU_MAU = [
  ['bao-cao', 'Báo cáo khoa học'],
  ['bien-ban', 'Dự thảo biên bản Hội đồng'],
  ['phan-loai', 'Phiếu chuẩn bị phân loại thiết bị'],
  ['dao-tao', 'Phiếu đào tạo và phản hồi'],
  ['bo-nhan', 'Bộ nhãn lịch sử đã duyệt'],
] as const

export default function HoSoNghienCuu() {
  const nc = useThu<NghienCuuPhimThu>('/nghien-cuu')
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const tai = useTaiLieuThu()
  const duyet = q.includes(quyenBenhVien('phim-x-quang', 'APPROVE'))
  const sua = q.includes(quyenBenhVien('phim-x-quang', 'UPDATE'))
  const xuat = q.includes(quyenBenhVien('phim-x-quang', 'EXPORT'))
  const phanTram = Math.round((nc.daDuyet / nc.soPhimLichSu) * 1000) / 10
  const kq = nc.doiChieu
  const dong = [
    ['Đúng có dấu', kq.dungCoDau],
    ['Đúng không dấu', kq.dungKhongDau],
    ['Báo dư', kq.baoDu],
    ['Bỏ sót', kq.boSot],
  ] as const
  const tongDanhGia = dong.reduce((t, [, n]) => t + n, 0)
  return (
    <>
      <NhacGiaLap>Mốc đạo đức, hồ sơ và kết quả trong màn này chỉ phục vụ diễn tập.</NhacGiaLap>
      {(ghi.isError || tai.isError) && (
        <ThongBao kieu="loi">{ghi.error?.message ?? tai.error?.message}</ThongBao>
      )}
      <div className="grid gap-x-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <The tieuDe="Tiến độ 5.000 phim lịch sử">
            <div className="flex items-center justify-between gap-2 text-sm">
              <strong>
                {nc.daDuyet.toLocaleString('vi-VN')}/{nc.soPhimLichSu.toLocaleString('vi-VN')} phim đã duyệt
                nhãn
              </strong>
              <span>{phanTram.toLocaleString('vi-VN')}%</span>
            </div>
            <progress
              aria-label="Tiến độ duyệt nhãn"
              className="my-3 h-3 w-full accent-brand"
              value={nc.daDuyet}
              max={nc.soPhimLichSu}
            />
            <div className="flex flex-wrap gap-2">
              <Chip>{nc.choNhan} chờ nhãn</Chip>
              <Chip mau="warn">{nc.choDuyet} chờ duyệt</Chip>
              <Chip mau="brand">{nc.daChaySongSong} đã chạy song song</Chip>
            </div>
          </The>
          <The tieuDe="Đối chiếu trên ảnh phantom">
            <p className="mb-2 text-sm text-faint">
              {tongDanhGia} phim đã duyệt nhãn và chạy mô hình trong tập đánh giá hoặc lô song song.
            </p>
            <dl className="mb-3 grid grid-cols-2 gap-2">
              {dong.map(([ten, val]) => (
                <div key={ten} className="rounded-lg bg-nen-2 p-2.5">
                  <dt className="text-xs text-body">{ten}</dt>
                  <dd className="text-lg font-bold">{val}</dd>
                </div>
              ))}
            </dl>
            {sua && (
              <Nut
                kieu="chinh"
                disabled={ghi.isPending}
                onClick={() => ghi.mutate({ duongDan: '/nghien-cuu/danh-gia' })}
              >
                Chạy tối đa 25 phim đánh giá
              </Nut>
            )}
            {ghi.isSuccess && ghi.variables.duongDan === '/nghien-cuu/danh-gia' && (
              <p role="status" className="mt-2 text-sm text-ok">
                Đã cập nhật kết quả đối chiếu.
              </p>
            )}
          </The>
        </div>
        <div>
          <The tieuDe="Các mốc chuẩn bị">
            <ul className="divide-y divide-line">
              {VIEC_NGHIEN_CUU.map(({ ma, ten }) => {
                const d = nc.viec.find((v) => v.ma === ma)!
                const choPhep = ma === 'dao-duc' ? duyet : sua
                return (
                  <li key={ma} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{ten}</p>
                      <p className="text-xs text-faint">
                        {d.daGhiNhan && d.luc
                          ? `Ghi nhận diễn tập lúc ${ngayGio(d.luc)}`
                          : 'Chưa ghi nhận diễn tập'}
                      </p>
                    </div>
                    {choPhep && (
                      <Nut
                        disabled={ghi.isPending}
                        aria-label={`${d.daGhiNhan ? 'Bỏ ghi nhận' : 'Ghi nhận'} ${ten}`}
                        onClick={() =>
                          ghi.mutate({
                            duongDan: `/nghien-cuu/viec/${ma}`,
                            body: { daGhiNhan: !d.daGhiNhan },
                          })
                        }
                      >
                        {d.daGhiNhan ? 'Bỏ ghi nhận' : 'Ghi nhận'}
                      </Nut>
                    )}
                  </li>
                )
              })}
            </ul>
          </The>
          {xuat && (
            <The tieuDe="Tài liệu và nhãn">
              <div className="flex flex-wrap gap-2">
                {BIEU_MAU.map(([ma, ten]) => (
                  <Nut key={ma} disabled={tai.isPending} onClick={() => tai.mutate(ma)}>
                    <Download size={15} aria-hidden="true" />
                    {ten}
                  </Nut>
                ))}
              </div>
            </The>
          )}
        </div>
      </div>
    </>
  )
}
