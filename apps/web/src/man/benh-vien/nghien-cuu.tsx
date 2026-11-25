import {
  NGUON_PHIM,
  NHAN_PHIM,
  VIEC_NGHIEN_CUU,
  quyenBenhVien,
  type LoaiDoiChieu,
  type MucNghienCuu,
  type NghienCuuPhimThu,
} from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ngayGio } from '@/lib/ngay'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, The, ThongBao } from '@/ui/co-ban'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const NHAN_DOI_CHIEU: { ma: LoaiDoiChieu; ten: string; moTa: string; mau: string }[] = [
  {
    ma: 'dungCoDau',
    ten: 'Phát hiện đúng ca bệnh',
    moTa: 'Bác sĩ & AI cùng xác định có dấu hiệu',
    mau: 'text-ok',
  },
  {
    ma: 'dungKhongDau',
    ten: 'Đọc đúng ca bình thường',
    moTa: 'Bác sĩ & AI cùng xác định không có dấu hiệu',
    mau: 'text-ok',
  },
  {
    ma: 'baoDu',
    ten: 'AI báo nhầm (Dương tính giả)',
    moTa: 'Bác sĩ đọc bình thường, AI báo có dấu hiệu',
    mau: 'text-warn',
  },
  {
    ma: 'boSot',
    ten: 'AI bỏ sót (Âm tính giả)',
    moTa: 'Bác sĩ đọc có dấu hiệu, AI không phát hiện',
    mau: 'text-err',
  },
]

const CHI_TIET_VIEC: Record<MucNghienCuu, string> = {
  'de-cuong': 'Quy trình tách dữ liệu định danh DICOM, mã hóa ID người bệnh và phân chia tập Học / Đánh giá.',
  'dao-duc': 'Hội đồng đạo đức phê duyệt sử dụng 5.000 phim lịch sử ẩn danh và mở khóa nhận lô chạy song song.',
  'phan-loai': 'Hồ sơ phân loại trang thiết bị y tế phần mềm hỗ trợ chẩn đoán hình ảnh theo quy định hiện hành.',
  'dao-tao': 'Tài liệu hướng dẫn gán nhãn độc lập cho bác sĩ đọc phim và tổng hợp phản hồi sử dụng hệ thống.',
}

export default function HoSoNghienCuu() {
  const nc = useThu<NghienCuuPhimThu>('/nghien-cuu')
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const duyet = q.includes(quyenBenhVien('phim-x-quang', 'APPROVE'))
  const sua = q.includes(quyenBenhVien('phim-x-quang', 'UPDATE'))
  const xuat = q.includes(quyenBenhVien('phim-x-quang', 'EXPORT'))
  const phanTram = Math.round((nc.daDuyet / nc.soPhimLichSu) * 1000) / 10
  const kq = nc.doiChieu
  const chiTiet = nc.chiTietDoiChieu ?? []

  const [nhomTienDo, datNhomTienDo] = useState<'cho-nhan' | 'cho-duyet' | 'song-song' | null>(null)
  const [locDoiChieu, datLocDoiChieu] = useState<LoaiDoiChieu | 'tat-ca' | null>(null)
  const [xemTatCaDoiChieu, datXemTatCaDoiChieu] = useState(false)
  const [viecDangMo, datViecDangMo] = useState<MucNghienCuu | null>(null)
  const [thongBaoDanhGia, datThongBaoDanhGia] = useState<string | null>(null)
  const [thongBaoViec, datThongBaoViec] = useState<string | null>(null)

  const dsLoc =
    locDoiChieu === null
      ? []
      : locDoiChieu === 'tat-ca'
        ? chiTiet
        : chiTiet.filter((d) => d.ketQua === locDoiChieu)

  const chayDanhGia = () => {
    ghi.mutate(
      { duongDan: '/nghien-cuu/danh-gia' },
      {
        onSuccess: (res) => {
          const soPhim = (res as { soPhim?: number } | undefined)?.soPhim ?? 0
          datThongBaoDanhGia(
            soPhim > 0
              ? `Đã chạy mô hình đối chiếu thêm ${soPhim} phim trong tập đánh giá.`
              : `Toàn bộ tập đánh giá đã được đối chiếu trước đó (0 phim mới). Đang hiển thị ${chiTiet.length} kết quả hiện có.`,
          )
          datLocDoiChieu('tat-ca')
        },
      },
    )
  }

  const ghiNhanViec = (ma: MucNghienCuu, ten: string, daGhiNhan: boolean) => {
    ghi.mutate(
      { duongDan: `/nghien-cuu/viec/${ma}`, body: { daGhiNhan } },
      {
        onSuccess: () => {
          datViecDangMo(ma)
          datThongBaoViec(
            daGhiNhan
              ? `Đã ghi nhận hoàn tất mốc "${ten}".`
              : `Đã hủy ghi nhận mốc "${ten}".`,
          )
        },
      },
    )
  }

  return (
    <>
      <NhacGiaLap>Mốc đạo đức, hồ sơ và kết quả trong màn này chỉ phục vụ diễn tập.</NhacGiaLap>
      {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}
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
              <button
                type="button"
                className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-brand/50"
                onClick={() => datNhomTienDo((cu) => (cu === 'cho-nhan' ? null : 'cho-nhan'))}
              >
                <Chip>{nc.choNhan} chờ nhãn</Chip>
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-brand/50"
                onClick={() => datNhomTienDo((cu) => (cu === 'cho-duyet' ? null : 'cho-duyet'))}
              >
                <Chip mau="warn">{nc.choDuyet} chờ duyệt</Chip>
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-brand/50"
                onClick={() => datNhomTienDo((cu) => (cu === 'song-song' ? null : 'song-song'))}
              >
                <Chip mau="brand">{nc.daChaySongSong} đã chạy song song</Chip>
              </button>
            </div>
            {nhomTienDo && (
              <div className="mt-3 rounded-lg border border-line bg-nen-2 p-3 text-xs">
                <p className="font-semibold text-strong">
                  {nhomTienDo === 'cho-nhan' && `Hiện có ${nc.choNhan} phim lịch sử đang chờ bác sĩ gán nhãn.`}
                  {nhomTienDo === 'cho-duyet' && `Hiện có ${nc.choDuyet} phim đã gán nhãn và đang chờ lãnh đạo duyệt.`}
                  {nhomTienDo === 'song-song' &&
                    `Hiện có ${nc.daChaySongSong} phim từ lô chạy song song đã được chạy gợi ý thử nghiệm.`}
                </p>
                <Link
                  to="/$chucNang"
                  params={{ chucNang: 'bv-phim' }}
                  className="mt-1.5 inline-block font-semibold text-brand hover:underline"
                >
                  Mở Kho phim và gán nhãn →
                </Link>
              </div>
            )}
          </The>

          <The tieuDe="Đối chiếu trên ảnh phantom">
            <p className="mb-2 text-sm text-faint">
              {chiTiet.length} phim đã duyệt nhãn và chạy mô hình trong tập đánh giá hoặc lô song song. Bấm vào
              từng ô để xem danh sách chi tiết.
            </p>
            <dl className="mb-3 grid grid-cols-2 gap-2">
              {NHAN_DOI_CHIEU.map(({ ma, ten, moTa, mau }) => {
                const dangChon = locDoiChieu === ma
                return (
                  <button
                    key={ma}
                    type="button"
                    onClick={() => datLocDoiChieu((cu) => (cu === ma ? null : ma))}
                    className={`rounded-lg border p-2.5 text-left transition cursor-pointer ${
                      dangChon ? 'border-brand bg-tint-brand' : 'border-transparent bg-nen-2 hover:border-line'
                    }`}
                  >
                    <dt className="text-xs font-medium text-body">{ten}</dt>
                    <dd className={`text-lg font-bold ${mau}`}>{kq[ma]}</dd>
                    <dd className="mt-0.5 text-[11px] leading-snug text-faint">{moTa}</dd>
                  </button>
                )
              })}
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              {sua && (
                <Nut kieu="chinh" disabled={ghi.isPending} onClick={chayDanhGia}>
                  Chạy tối đa 25 phim đánh giá
                </Nut>
              )}
              {locDoiChieu !== null && (
                <Nut onClick={() => datLocDoiChieu(null)}>Thu gọn danh sách</Nut>
              )}
            </div>
            {thongBaoDanhGia && (
              <p role="status" className="mt-2 text-sm text-ok">
                {thongBaoDanhGia}
              </p>
            )}
            {locDoiChieu !== null && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-faint">
                  <span>
                    {locDoiChieu === 'tat-ca'
                      ? `Tất cả kết quả đối chiếu (${dsLoc.length} phim)`
                      : `${NHAN_DOI_CHIEU.find((n) => n.ma === locDoiChieu)?.moTa ?? ''} (${dsLoc.length} phim)`}
                  </span>
                  {locDoiChieu !== 'tat-ca' && (
                    <button
                      type="button"
                      className="cursor-pointer text-brand hover:underline"
                      onClick={() => datLocDoiChieu('tat-ca')}
                    >
                      Xem tất cả ({chiTiet.length})
                    </button>
                  )}
                </div>
                {dsLoc.length === 0 ? (
                  <p className="rounded-lg bg-nen-2 p-3 text-xs text-faint">Chưa có phim nào thuộc nhóm này.</p>
                ) : (
                  <KhungBang nhan="Danh sách phim đối chiếu">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className={LOP_TH}>Mã phim</th>
                          <th className={LOP_TH}>Nguồn</th>
                          <th className={LOP_TH}>Nhãn duyệt</th>
                          <th className={LOP_TH}>Mô hình</th>
                          <th className={LOP_TH}>Kết luận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(xemTatCaDoiChieu ? dsLoc : dsLoc.slice(0, 25)).map((d) => {
                          const meta = NHAN_DOI_CHIEU.find((n) => n.ma === d.ketQua)!
                          return (
                            <tr key={d.ma}>
                              <td className={LOP_TD}>
                                <strong>{d.ma}</strong>
                              </td>
                              <td className={LOP_TD}>{NGUON_PHIM[d.nguon]}</td>
                              <td className={LOP_TD}>{NHAN_PHIM[d.nhan]}</td>
                              <td className={LOP_TD}>
                                {NHAN_PHIM[d.goiY]} ({d.diem})
                              </td>
                              <td className={`${LOP_TD} font-semibold ${meta.mau}`}>{meta.ten}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </KhungBang>
                )}
                {dsLoc.length > 25 && (
                  <div className="mt-2 flex items-center justify-between text-xs text-faint">
                    <span>
                      Đang hiển thị {xemTatCaDoiChieu ? dsLoc.length : 25}/{dsLoc.length} phim
                    </span>
                    <button
                      type="button"
                      className="cursor-pointer font-semibold text-brand hover:underline"
                      onClick={() => datXemTatCaDoiChieu((v) => !v)}
                    >
                      {xemTatCaDoiChieu ? 'Thu gọn (25 phim)' : `Xem toàn bộ ${dsLoc.length} phim`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </The>
        </div>

        <div>
          <The tieuDe="Các mốc chuẩn bị">
            {thongBaoViec && (
              <div className="mb-2">
                <ThongBao kieu="thong-tin">{thongBaoViec}</ThongBao>
              </div>
            )}
            <ul className="divide-y divide-line">
              {VIEC_NGHIEN_CUU.map(({ ma, ten }) => {
                const d = nc.viec.find((v) => v.ma === ma)!
                const choPhep = ma === 'dao-duc' ? duyet : sua
                const dangMo = viecDangMo === ma || d.daGhiNhan
                return (
                  <li key={ma} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => datViecDangMo((cu) => (cu === ma ? null : ma))}
                        className="cursor-pointer text-left hover:opacity-85"
                      >
                        <p className="text-sm font-semibold">{ten}</p>
                        <p className="text-xs text-faint">
                          {d.daGhiNhan && d.luc
                            ? `Đã ghi nhận diễn tập lúc ${ngayGio(d.luc)}`
                            : 'Chưa ghi nhận diễn tập (bấm để xem chi tiết)'}
                        </p>
                      </button>
                      {choPhep && (
                        <Nut
                          disabled={ghi.isPending}
                          aria-label={`${d.daGhiNhan ? 'Bỏ ghi nhận' : 'Ghi nhận'} ${ten}`}
                          onClick={() => ghiNhanViec(ma, ten, !d.daGhiNhan)}
                        >
                          {d.daGhiNhan ? 'Bỏ ghi nhận' : 'Ghi nhận'}
                        </Nut>
                      )}
                    </div>
                    {dangMo && (
                      <div className="mt-2 rounded-lg border border-line bg-nen-2 px-3 py-2 text-xs text-body">
                        <span className={`font-semibold ${d.daGhiNhan ? 'text-ok' : 'text-faint'}`}>
                          {d.daGhiNhan ? '✓ Đã xác nhận hồ sơ: ' : 'Nội dung hồ sơ: '}
                        </span>
                        {CHI_TIET_VIEC[ma]}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </The>
          {xuat && (
            <The tieuDe="Tài liệu và nhãn">
              <Link
                to="/$chucNang"
                params={{ chucNang: 'bv-bao-cao-phim' }}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Mở Báo cáo nghiên cứu
              </Link>
            </The>
          )}
        </div>
      </div>
    </>
  )
}
