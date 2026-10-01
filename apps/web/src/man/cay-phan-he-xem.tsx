/**
 * Khai báo module › Cây phân hệ — bảng tra toàn bộ cây 4 cấp (tầng › nhóm › module › chức
 * năng) đúng như registry trong mã: mã quyền, nguồn dữ liệu, đã xây hay còn đang xây dựng.
 * CHỈ XEM: cây là một phần của mã nguồn (ADR-0002) — đổi cây là đổi mã, có test chặn sai.
 */
import { DANH_SACH_MODULE, NHOM, quyenCua } from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import { MAN_HINH } from '@/app/man-hinh'
import { Chip, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { LuoiKpi, TheKpi } from './van-ban/chung'

interface Dong {
  id: string
  tang: string
  nhom: string
  module: string
  chucNang: string
  quyen: string
  nguon: string
  daXay: boolean
  moTa: string
}

const TEN_TANG: Record<number, string> = { 1: 'Tầng 1 — Nghiệp vụ', 2: 'Tầng 2 — Quản trị hệ thống' }
const NGUON = { db: 'GDOS (Postgres)', native: 'FOXAI Native' } as const

const DONG: Dong[] = DANH_SACH_MODULE.flatMap((m) => {
  const n = NHOM.find((x) => x.ma === m.nhom)!
  return m.con.map((c) => ({
    id: c.id,
    tang: TEN_TANG[n.tang] ?? `Tầng ${n.tang}`,
    nhom: n.nhan,
    module: m.nhan,
    chucNang: c.nhan,
    quyen: quyenCua(m, c),
    nguon: NGUON[m.nguon],
    // "Đã xây" = có màn thật đăng ký; còn lại là màn đang xây dựng.
    daXay: !!MAN_HINH[c.id],
    moTa: c.mo ?? m.mo,
  }))
})

export default function CayPhanHeXem() {
  const daXay = DONG.filter((d) => d.daXay).length
  const cot: CotLuoi<Dong>[] = [
    { id: 'tang', nhan: 'Tầng', kieu: 'danh-muc', rong: 190, an: true, giaTri: (d) => d.tang },
    { id: 'nhom', nhan: 'Nhóm', kieu: 'danh-muc', rong: 190, giaTri: (d) => d.nhom },
    {
      id: 'module',
      nhan: 'Module',
      kieu: 'danh-muc',
      rong: 200,
      giaTri: (d) => d.module,
      hien: (d) => <b className="text-ink">{d.module}</b>,
    },
    {
      id: 'chucNang',
      nhan: 'Chức năng',
      kieu: 'chu',
      rong: 240,
      batBuoc: true,
      giaTri: (d) => d.chucNang,
      hien: (d) => (
        <Link
          to="/$chucNang"
          params={{ chucNang: d.id }}
          className="text-brand hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {d.chucNang}
        </Link>
      ),
    },
    {
      id: 'trangThai',
      nhan: 'Tình trạng',
      kieu: 'danh-muc',
      rong: 160,
      giaTri: (d) => (d.daXay ? 'Đã xây' : 'Đang xây dựng'),
      hien: (d) => <Chip mau={d.daXay ? 'ok' : 'warn'}>{d.daXay ? 'Đã xây' : 'Đang xây dựng'}</Chip>,
    },
    {
      id: 'quyen',
      nhan: 'Quyền cần có',
      kieu: 'chu',
      rong: 220,
      giaTri: (d) => d.quyen,
      hien: (d) => <code className="text-[12px]">{d.quyen}</code>,
    },
    { id: 'nguon', nhan: 'Nguồn dữ liệu', kieu: 'danh-muc', rong: 170, giaTri: (d) => d.nguon },
    {
      id: 'ma',
      nhan: 'Mã chức năng',
      kieu: 'chu',
      rong: 150,
      an: true,
      giaTri: (d) => d.id,
      hien: (d) => <code className="text-[12px]">{d.id}</code>,
    },
    {
      id: 'moTa',
      nhan: 'Mô tả',
      kieu: 'chu',
      rong: 360,
      an: true,
      giaTri: (d) => d.moTa,
      hien: (d) => <span className="line-clamp-2 text-[12.5px] text-body">{d.moTa}</span>,
    },
  ]

  return (
    <>
      <ThongBao>
        Cây phân hệ là một phần của mã nguồn — màn này để <b>tra cứu</b>: chức năng nào đã xây, cần quyền gì,
        dữ liệu nằm ở đâu. Lọc cột “Tình trạng” để xem phần còn đang xây dựng.
      </ThongBao>
      <LuoiKpi>
        <TheKpi nhan="Module" giaTri={DANH_SACH_MODULE.length} bieuTuong="mau" mau="brand" />
        <TheKpi nhan="Chức năng" giaTri={DONG.length} bieuTuong="viec" mau="tim" />
        <TheKpi nhan="Đã xây" giaTri={daXay} bieuTuong="xong" mau="ok" />
        <TheKpi nhan="Đang xây dựng" giaTri={DONG.length - daXay} bieuTuong="cho" mau="warn" />
      </LuoiKpi>
      <Luoi
        ma="cay-phan-he"
        tieuDe="Cây phân hệ"
        cot={cot}
        dong={DONG}
        khoa={(d) => d.id}
        rong="Không có chức năng nào."
      />
    </>
  )
}
