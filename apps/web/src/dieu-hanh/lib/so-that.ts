/**
 * NÂNG CẤP so với GDOS cũ: 8 dashboard xã/phường không chỉ chạy bằng số mẫu. Chỉ tiêu nào hệ
 * thống mới có SỐ THẬT — tính từ phân hệ đã xây, hoặc nạp qua API / Excel ở Quản trị › Nguồn
 * dữ liệu vào (ADR-0010) — thì thẻ chỉ số và KPI hiện số đó, chân thẻ ghi rõ nguồn. Bố cục,
 * biểu đồ và các chỉ tiêu chưa có số thật giữ nguyên như bản cũ.
 */
import type { BangChiTieu, GiaTriChiTieu } from '@gdos/shared'
import type { KpiXp, TileXp } from '@/dieu-hanh/mocks/xa-phuong'

type CoSo = GiaTriChiTieu & { giaTri: number }

const laThat = (g: GiaTriChiTieu | undefined): g is CoSo =>
  !!g && (g.nguon === 'that' || g.nguon === 'nap') && g.giaTri !== null

/** Dòng nguồn ở chân thẻ. */
export function nhanNguon(g: GiaTriChiTieu): string {
  if (g.nguon === 'that') return `Số thật · ${g.phanHe ?? 'phân hệ nghiệp vụ'}`
  return `Nguồn: ${g.kenh === 'api' ? 'API' : 'Excel'}${g.tenNguon ? ` (${g.tenNguon})` : ''} · ${g.ky ?? ''}`
}

/**
 * Thẻ chỉ số: thay giá trị và chuỗi 10 kỳ. Chưa đủ 10 kỳ thật thì các kỳ đầu lấy bằng kỳ thật
 * sớm nhất (đường phẳng) — KHÔNG sinh chuỗi mô phỏng cho một số thật.
 */
export function ganTile(t: TileXp, b: BangChiTieu | undefined): TileXp {
  const g = b?.giaTri[t.code]
  if (!laThat(g)) return t
  const chuoi = g.chuoi.length > 0 ? g.chuoi.slice(-10) : [g.giaTri]
  const dau = chuoi[0] ?? g.giaTri
  const data = [...Array.from({ length: 10 - chuoi.length }, () => dau), ...chuoi]
  const { sim: _boMoPhong, ...con } = t
  return { ...con, value: g.giaTri, data, foot: nhanNguon(g), footCanhBao: false }
}

export function ganKpi(k: KpiXp, b: BangChiTieu | undefined): KpiXp {
  const g = b?.giaTri[k.code]
  return laThat(g) ? { ...k, v: g.giaTri } : k
}

/** Số chỉ tiêu trong danh sách thẻ / KPI đang có số thật. */
export const demSoThat = (ma: readonly string[], b: BangChiTieu | undefined): number =>
  new Set(ma.filter((m) => laThat(b?.giaTri[m]))).size
