import { SO_PHIM_LICH_SU, type NguonPhim, type NhanPhim, type PhimThu } from '@gdos/shared'

const RONG = 64
export const PHIEN_BAN_MO_HINH = 'phantom-centroid-v1'
export const SO_PHIM_MOI_MAY = 6
type NhanMoHinh = Exclude<NhanPhim, 'khong-doc'>

export const maPhimThu = (so: number) => `XQ-${String(so).padStart(4, '0')}`
export const nguonPhimThu = (so: number): NguonPhim => (so % 2 ? 'benh-vien' : 'xe-luu-dong')
export const nhanThamChieu = (so: number): NhanMoHinh => ((so * 13) % 17 < 6 ? 'co-dau' : 'khong-co-dau')
export const nhomPhimThu = (so: number): PhimThu['nhom'] =>
  so > SO_PHIM_LICH_SU ? 'Chạy song song' : so % 5 === 0 ? 'Đánh giá' : 'Học'

/** Tạo ảnh phantom 8 bit lặp lại được, không lấy hình từ bệnh nhân hoặc thiết bị thật. */
function taoAnh(so: number): Buffer {
  const anh = Buffer.alloc(RONG * RONG)
  const coDau = nhanThamChieu(so) === 'co-dau'
  // Độ sáng chồng lấn giữa hai nhóm để có cả dự đoán sai khi kiểm thử.
  const cuongDo = (coDau ? 28 : 6) + ((so * 31) % 29) - 14
  let nhieu = so
  for (let y = 0; y < RONG; y++) {
    for (let x = 0; x < RONG; x++) {
      const longNguc = ((x - 31.5) / 27) ** 2 + ((y - 31.5) / 30) ** 2 < 1
      const phoi = ((Math.abs(x - 31.5) - 12) / 9) ** 2 + ((y - 30) / 22) ** 2 < 1
      const suon = Math.cos((y + Math.abs(x - 31.5) * 0.23) * 1.07) > 0.79
      const dau = Math.exp(-((x - 42) ** 2 + (y - 34) ** 2) / 26)
      nhieu = (Math.imul(1_664_525, nhieu) + 1_013_904_223) >>> 0
      anh[y * RONG + x] = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            (longNguc ? 118 : 19) -
              (phoi ? 63 : 0) +
              (longNguc && suon ? 14 : 0) +
              (Math.abs(x - 31.5) < 3 && longNguc ? 34 : 0) +
              dau * cuongDo +
              (nhieu % 17) -
              8,
          ),
        ),
      )
    }
  }
  return anh
}

export function anhPhimThu(so: number) {
  return { rong: RONG, anh: taoAnh(so).toString('base64') }
}

/** Chênh sáng giữa hai vùng đối xứng của phantom. Không dùng cho ảnh X-quang lâm sàng. */
function dacTrung(anh: Buffer): number {
  let tong = 0
  for (let y = 31; y <= 37; y++) {
    for (let x = 39; x <= 45; x++) tong += anh[y * RONG + x]! - anh[y * RONG + 63 - x]!
  }
  return tong / 49
}

let nguong: number | undefined
function hocNguong(): number {
  let a = 0,
    b = 0,
    demA = 0,
    demB = 0
  for (let so = 1; so <= 400; so++) {
    if (nhomPhimThu(so) !== 'Học') continue
    const diem = dacTrung(taoAnh(so))
    if (nhanThamChieu(so) === 'co-dau') {
      a += diem
      demA++
    } else {
      b += diem
      demB++
    }
  }
  return (a / demA + b / demB) / 2
}

export function chayMoHinhThu(so: number): NonNullable<PhimThu['goiY']> {
  nguong ??= hocNguong()
  const lech = dacTrung(taoAnh(so)) - nguong
  return {
    nhan: lech >= 0 ? 'co-dau' : 'khong-co-dau',
    diem: Math.round(Math.min(100, Math.abs(lech) * 4)),
    phienBan: PHIEN_BAN_MO_HINH,
  }
}
