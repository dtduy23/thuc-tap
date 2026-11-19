import {
  NHAN_PHIM,
  NGUON_PHIM,
  VIEC_NGHIEN_CUU,
  type KetQuaBaoCao,
  type NghienCuuPhimThu,
  type PhimThu,
} from '@gdos/shared'
import { PHIEN_BAN_MO_HINH } from './x-quang.js'

export const MA_TAI_LIEU = ['bao-cao', 'phan-loai', 'bien-ban', 'dao-tao', 'bo-nhan'] as const

const KHUNG = {
  coTong: false,
  phuDe: 'BẢN NHÁP · DỮ LIỆU GIẢ LẬP · Không dùng làm hồ sơ lâm sàng hoặc nộp cơ quan quản lý',
} as const

export function baoCaoNghienCuu(
  ma: Exclude<(typeof MA_TAI_LIEU)[number], 'bo-nhan'>,
  nc: NghienCuuPhimThu,
): KetQuaBaoCao {
  const kq = nc.doiChieu
  const chung: [string, string | number][] = [
    ['Bộ dữ liệu', 'Ảnh X-quang phantom tạo bằng phần mềm. Không chứa dữ liệu bệnh nhân.'],
    ['Mô hình thử', PHIEN_BAN_MO_HINH],
  ]
  const mau: Record<typeof ma, { ten: string; dong: [string, string | number][] }> = {
    'bao-cao': {
      ten: 'Báo cáo khoa học thử nghiệm',
      dong: [
        ...chung,
        ['Số phim lịch sử', nc.soPhimLichSu],
        ['Đã duyệt nhãn', nc.daDuyet],
        ['Chờ duyệt', nc.choDuyet],
        ['Chờ gán nhãn', nc.choNhan],
        ['Đã chạy song song', nc.daChaySongSong],
        ['Đúng có dấu', kq.dungCoDau],
        ['Đúng không dấu', kq.dungKhongDau],
        ['Báo dư', kq.baoDu],
        ['Bỏ sót', kq.boSot],
        [
          'Giới hạn',
          'Chỉ đối chiếu phim đánh giá/chạy song song có nhãn đã duyệt và kết quả. Không suy ra hiệu năng lâm sàng.',
        ],
      ],
    },
    'phan-loai': {
      ten: 'Phiếu chuẩn bị hồ sơ phân loại thiết bị y tế',
      dong: [
        ...chung,
        ['Đơn vị chịu trách nhiệm', '[Điền theo hồ sơ chính thức]'],
        ['Mục đích sử dụng dự kiến', '[Cần xác nhận với đơn vị chuyên môn]'],
        ['Tài liệu kỹ thuật và quản lý rủi ro', '[Đính kèm khi có]'],
        ['Kết luận phân loại', '[Do đơn vị có thẩm quyền xác định]'],
      ],
    },
    'bien-ban': {
      ten: 'Dự thảo biên bản rà soát đạo đức nghiên cứu',
      dong: [
        ...chung,
        ['Hội đồng, người tham dự và ngày họp', '[Điền theo cuộc họp]'],
        ['Kế hoạch bảo vệ dữ liệu', 'Bản diễn tập chỉ sử dụng ảnh phantom và mã giả lập.'],
        ...VIEC_NGHIEN_CUU.map((v): [string, string] => [
          v.ten,
          nc.viec.find((d) => d.ma === v.ma)?.daGhiNhan ? 'Đã ghi nhận diễn tập' : 'Chưa ghi nhận',
        ]),
        ['Kết luận Hội đồng', '[Để Hội đồng ghi và ký]'],
      ],
    },
    'dao-tao': {
      ten: 'Phiếu đào tạo và phản hồi người đọc',
      dong: [
        ...chung,
        ['Nội dung thực hành', 'Nhận phim mẫu, đọc ảnh, gán nhãn độc lập, duyệt, rồi đối chiếu gợi ý.'],
        ['Tình huống cần thực hành', 'Phim không đạt chất lượng, mô hình báo dư và mô hình bỏ sót.'],
        ['Người tham dự', '[Điền trong buổi đào tạo]'],
        ['Phản hồi và việc cần điều chỉnh', '[Điền sau buổi đào tạo]'],
      ],
    },
  }
  const m = mau[ma]
  return {
    ...KHUNG,
    ma,
    tieuDe: m.ten,
    tenTep: `ban-nhap-x-quang-${ma}-gia-lap`,
    cot: [{ nhan: 'Nội dung' }, { nhan: 'Chi tiết', rong: 72 }],
    dong: m.dong.map((o) => ({ cap: 0, o })),
  }
}

export function baoCaoBoNhan(ds: PhimThu[]): KetQuaBaoCao {
  return {
    ...KHUNG,
    ma: 'bo-nhan',
    tieuDe: 'Danh sách nhãn phim lịch sử đã duyệt',
    tenTep: 'bo-nhan-x-quang-gia-lap',
    cot: [
      { nhan: 'Mã phim' },
      { nhan: 'Nguồn', rong: 32 },
      { nhan: 'Tập' },
      { nhan: 'Nhãn đã duyệt', rong: 42 },
    ],
    dong: ds.map((p) => ({
      cap: 0,
      o: [p.ma, NGUON_PHIM[p.nguon], p.nhom, p.nhan ? NHAN_PHIM[p.nhan] : null],
    })),
  }
}
