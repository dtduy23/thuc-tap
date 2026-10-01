import { Inject, Injectable } from '@nestjs/common'
import { BO_CHI_TIEU, type BangChiTieu, type GiaTriChiTieu, type SoLieuPhanHe } from '@gdos/shared'
import { and, isNull, sql } from 'drizzle-orm'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { vanBan } from '../db/schema/index.js'
import { DuAnService } from '../du-an/du-an.service.js'
import { GOI_NATIVE } from '../native/chuyen-tiep.controller.js'
import { LienKetNativeService } from '../native/lien-ket.service.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { KY_MINH_HOA, SO_LIEU_MINH_HOA, chuoiMinhHoa } from './so-lieu-minh-hoa.js'

/** Số thật đọc được từ các phân hệ — null từng phần khi không có quyền / chưa lấy được. */
export interface SoThat {
  nhiemVu: { tong: number; quaHan: number; hoanThanh: number; dangLam: number } | null
  lyDoNhiemVu?: string
  duAn: { tong: number; dangThucHien: number; quaHan: number; tongMuc: number; daGiaiNgan: number } | null
  vanBan: { tong: number; den: number; daTomTat: number } | null
}

const tron = (n: number, le = 1) => Number(n.toFixed(le))

/**
 * Ghép bảng chỉ tiêu: số THẬT từ phân hệ đã xây đè lên số minh họa. Hàm thuần — test thẳng.
 * KPI suy ra từ chỉ tiêu lĩnh vực, nên KPI mang nguồn của chỉ tiêu gốc.
 */
export function ghepBangChiTieu(t: SoThat): BangChiTieu {
  const giaTri: Record<string, GiaTriChiTieu> = {}
  for (const [ma, [v, dd, xh]] of Object.entries(SO_LIEU_MINH_HOA))
    giaTri[ma] = { giaTri: v, nguon: 'minh-hoa', chuoi: chuoiMinhHoa(ma, v, dd, xh) }

  // ── Dự án → giải ngân đầu tư công, công trình đang thi công ──
  if (t.duAn && t.duAn.tong > 0) {
    const chung = { nguon: 'that' as const, chuoi: [], phanHe: 'Dự án', lienKet: 'da-tat-ca' }
    giaTri['HT-06'] = { ...chung, giaTri: t.duAn.dangThucHien }
    giaTri['KT-04'] =
      t.duAn.tongMuc > 0
        ? { ...chung, giaTri: tron((t.duAn.daGiaiNgan / t.duAn.tongMuc) * 100) }
        : { giaTri: null, nguon: 'chua-co', chuoi: [], lyDo: 'Các dự án chưa khai tổng mức đầu tư.' }
  }

  // ── KPI: tính từ chỉ tiêu lĩnh vực ──
  const lay = (ma: string) => giaTri[ma]?.giaTri ?? null
  const kpi = (ma: string, v: number | null, goc: string) => {
    const g = giaTri[goc]!
    giaTri[ma] = {
      giaTri: v,
      nguon: g.nguon,
      chuoi: g.nguon === 'minh-hoa' && v !== null ? chuoiMinhHoa(ma, v, 0.012, 0.003) : [],
    }
  }
  const dung = lay('TTHC-03')
  const xong = lay('TTHC-02')
  kpi('KPI-01', dung !== null && xong ? tron((dung / xong) * 100, 2) : null, 'TTHC-03')
  kpi('KPI-02', lay('TTHC-07'), 'TTHC-07')
  kpi('KPI-03', lay('PAKN-05'), 'PAKN-05')
  kpi('KPI-05', lay('TTHC-08'), 'TTHC-08')
  kpi('KPI-06', lay('TTHC-17'), 'TTHC-17')
  // KPI-04: nhiệm vụ đúng hạn — số THẬT từ phân hệ Nhiệm vụ (FOXAI Native), không có bản minh họa.
  giaTri['KPI-04'] =
    t.nhiemVu && t.nhiemVu.tong > 0
      ? {
          giaTri: tron(((t.nhiemVu.tong - t.nhiemVu.quaHan) / t.nhiemVu.tong) * 100),
          nguon: 'that',
          chuoi: [],
          phanHe: 'Nhiệm vụ',
          lienKet: 'nv-theo-doi',
        }
      : {
          giaTri: null,
          nguon: 'chua-co',
          chuoi: [],
          lyDo: t.lyDoNhiemVu ?? 'Chưa có nhiệm vụ nào trong phân hệ Nhiệm vụ.',
        }

  for (const c of BO_CHI_TIEU)
    giaTri[c.ma] ??= { giaTri: null, nguon: 'chua-co', chuoi: [], lyDo: 'Chưa có nguồn số liệu.' }

  const phanHe: SoLieuPhanHe[] = [
    {
      phanHe: 'Nhiệm vụ',
      lienKet: 'nv-theo-doi',
      lyDo: t.lyDoNhiemVu,
      so: t.nhiemVu && [
        { nhan: 'Tổng nhiệm vụ', giaTri: t.nhiemVu.tong },
        { nhan: 'Đang thực hiện', giaTri: t.nhiemVu.dangLam },
        { nhan: 'Quá hạn', giaTri: t.nhiemVu.quaHan, mau: t.nhiemVu.quaHan ? 'danger' : 'ok' },
        { nhan: 'Hoàn thành', giaTri: t.nhiemVu.hoanThanh, mau: 'ok' },
      ],
    },
    {
      phanHe: 'Dự án',
      lienKet: 'da-tat-ca',
      lyDo: t.duAn ? undefined : 'Tài khoản không có quyền xem Dự án.',
      so: t.duAn && [
        { nhan: 'Tổng dự án', giaTri: t.duAn.tong },
        { nhan: 'Đang thực hiện', giaTri: t.duAn.dangThucHien },
        { nhan: 'Có bước quá hạn', giaTri: t.duAn.quaHan, mau: t.duAn.quaHan ? 'danger' : 'ok' },
        {
          nhan: 'Giải ngân (%)',
          giaTri: t.duAn.tongMuc > 0 ? tron((t.duAn.daGiaiNgan / t.duAn.tongMuc) * 100) : 0,
        },
      ],
    },
    {
      phanHe: 'Xử lý văn bản',
      lienKet: 'vb-tom-tat',
      lyDo: t.vanBan ? undefined : 'Tài khoản không có quyền xem Văn bản.',
      so: t.vanBan && [
        { nhan: 'Tổng văn bản', giaTri: t.vanBan.tong },
        { nhan: 'Văn bản đến', giaTri: t.vanBan.den },
        { nhan: 'Đã tóm tắt', giaTri: t.vanBan.daTomTat, mau: 'ok' },
        {
          nhan: 'Chưa tóm tắt',
          giaTri: t.vanBan.tong - t.vanBan.daTomTat,
          mau: t.vanBan.tong - t.vanBan.daTomTat ? 'warn' : 'ok',
        },
      ],
    },
  ]
  return { ky: KY_MINH_HOA, giaTri, phanHe }
}

/**
 * Điều hành › Chỉ tiêu điều hành. Đọc số thật của các phân hệ ĐÃ XÂY theo đúng quyền và
 * phạm vi (RLS) của người xem; phần còn lại là số minh họa (so-lieu-minh-hoa.ts).
 */
@Injectable()
export class ChiTieuService {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
    @Inject(DuAnService) private readonly duAn: DuAnService,
    @Inject(LienKetNativeService) private readonly lienKet: LienKetNativeService,
    @Inject(GOI_NATIVE) private readonly goi: typeof fetch,
  ) {}

  async bang(nd: NguoiDungPhien): Promise<BangChiTieu> {
    const [nv, da, vb] = await Promise.all([this.nhiemVu(nd), this.soDuAn(nd), this.soVanBan(nd)])
    return ghepBangChiTieu({ nhiemVu: nv.so, lyDoNhiemVu: nv.lyDo, duAn: da, vanBan: vb })
  }

  /** Thống kê nhiệm vụ trên FOXAI Native, bằng tài khoản Native của chính người xem. */
  private async nhiemVu(nd: NguoiDungPhien): Promise<{ so: SoThat['nhiemVu']; lyDo?: string }> {
    if (!nd.quyen.has('NHIEM_VU.READ')) return { so: null, lyDo: 'Tài khoản không có quyền xem Nhiệm vụ.' }
    const goc = this.cauHinh.native.url
    if (!goc || this.cauHinh.native.gia) return { so: null, lyDo: 'Máy chủ chưa nối FOXAI Native thật.' }
    try {
      const token = await this.lienKet.tokenCua(nd)
      const kq = await this.goi(`${goc}/api/document/tasks/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!kq.ok) return { so: null, lyDo: 'Chưa đọc được nhiệm vụ từ FOXAI Native.' }
      const d = (await kq.json()) as Record<string, unknown>
      const n = (k: string) => (typeof d[k] === 'number' ? d[k] : 0)
      return {
        so: {
          tong: n('total'),
          quaHan: n('qua_han'),
          hoanThanh: n('hoan_thanh'),
          dangLam: n('dang_thuc_hien'),
        },
      }
    } catch {
      // Chưa liên kết tài khoản Native, hoặc Native không trả lời — bảng vẫn hiện, ghi rõ lý do.
      return {
        so: null,
        lyDo: 'Tài khoản chưa liên kết FOXAI Native (Cài đặt cá nhân), hoặc Native chưa trả lời.',
      }
    }
  }

  private async soDuAn(nd: NguoiDungPhien): Promise<SoThat['duAn']> {
    if (!nd.quyen.has('DU_AN.READ')) return null
    const ds = (await this.duAn.danhSach(nd, 'tat-ca')).filter((d) => d.trangThai !== 'huy')
    return {
      tong: ds.length,
      dangThucHien: ds.filter((d) => d.trangThai === 'dang-thuc-hien').length,
      quaHan: ds.filter((d) => d.trangThai !== 'hoan-thanh' && d.thongKe.sucKhoe === 'qua-han').length,
      tongMuc: ds.reduce((t, d) => t + d.tongMuc, 0),
      daGiaiNgan: ds.reduce((t, d) => t + d.daGiaiNgan, 0),
    }
  }

  private async soVanBan(nd: NguoiDungPhien): Promise<SoThat['vanBan']> {
    if (!nd.quyen.has('VAN_BAN.READ')) return null
    const [d] = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          tong: sql<number>`count(*)::int`,
          den: sql<number>`count(*) filter (where ${vanBan.nguon} <> 'tai-len')::int`,
          daTomTat: sql<number>`count(*) filter (where ${vanBan.trangThai} = 'xong')::int`,
        })
        .from(vanBan)
        .where(and(isNull(vanBan.deletedAt))),
    )
    return { tong: Number(d?.tong ?? 0), den: Number(d?.den ?? 0), daTomTat: Number(d?.daTomTat ?? 0) }
  }
}
