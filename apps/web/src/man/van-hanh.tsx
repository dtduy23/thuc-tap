/**
 * Quản trị › Cấu hình & Vận hành › Theo dõi vận hành — cho người làm kỹ thuật: hệ thống có
 * khỏe không, có văn bản nào kẹt trong hàng đợi, kho tệp đang giữ bao nhiêu. Chỉ đọc.
 */
import {
  dungLuongDoc,
  type DongLuuTru,
  type HangDoiXuLy,
  type LuuTruTep,
  type MucHangDoi,
  type SucKhoeHeThong,
} from '@gdos/shared'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { goiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { LuoiKpi, TheKpi } from './van-ban/chung'

const truyVanSucKhoe = queryOptions({
  queryKey: ['van-hanh', 'suc-khoe'],
  queryFn: () => goiApi<SucKhoeHeThong>('/van-hanh/suc-khoe'),
  // Tự kiểm lại mỗi nửa phút khi đang mở màn.
  refetchInterval: 30_000,
})
const truyVanHangDoi = queryOptions({
  queryKey: ['van-hanh', 'hang-doi'],
  queryFn: () => goiApi<HangDoiXuLy>('/van-hanh/hang-doi'),
  refetchInterval: 15_000,
})
const truyVanLuuTru = queryOptions({
  queryKey: ['van-hanh', 'luu-tru'],
  queryFn: () => goiApi<LuuTruTep>('/van-hanh/luu-tru'),
})

const MAU_TT = { ok: 'ok', 'canh-bao': 'warn', loi: 'danger' } as const
const NHAN_TT = { ok: 'Hoạt động', 'canh-bao': 'Cần để ý', loi: 'Lỗi' } as const

function khoangChay(tuLuc: string): string {
  const phut = Math.max(0, Math.round((Date.now() - new Date(tuLuc).getTime()) / 60_000))
  if (phut < 60) return `${phut} phút`
  if (phut < 48 * 60) return `${Math.floor(phut / 60)} giờ ${phut % 60} phút`
  return `${Math.floor(phut / 1440)} ngày`
}

/* ── Sức khỏe hệ thống ────────────────────────────────────────────────────── */

export function SucKhoeHeThongMan() {
  const q = useQuery(truyVanSucKhoe)
  const d = q.data
  const loi = d?.thanhPhan.filter((t) => t.trangThai === 'loi').length ?? 0
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="m-0 min-w-0 flex-1 text-[13px] text-faint">
          Tình trạng các thành phần hệ thống — tự kiểm lại mỗi 30 giây.
          {d && ` Lần kiểm gần nhất: ${ngayGio(d.kiemLuc)}.`}
        </p>
        <Nut onClick={() => void q.refetch()} disabled={q.isFetching}>
          {q.isFetching ? 'Đang kiểm…' : 'Kiểm tra lại'}
        </Nut>
      </div>
      {q.error && (
        <ThongBao kieu="loi">
          Không lấy được tình trạng hệ thống — máy chủ có thể đang khởi động lại.
        </ThongBao>
      )}
      {d && (
        <>
          <ThongBao kieu={loi ? 'loi' : 'ok'}>
            {loi
              ? `${loi} thành phần đang lỗi — xem chi tiết bên dưới.`
              : 'Các thành phần bắt buộc đều hoạt động.'}
          </ThongBao>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {d.thanhPhan.map((t) => (
              <div
                key={t.ma}
                className="rounded-[12px] border border-line bg-nen px-4 py-3 shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-[13.5px] text-ink">{t.ten}</b>
                  <Chip mau={MAU_TT[t.trangThai]}>{NHAN_TT[t.trangThai]}</Chip>
                </div>
                <p className="m-0 mt-1 text-[12.5px] text-body">{t.chiTiet}</p>
                {t.msPhanHoi !== null && t.ma !== 'api' && (
                  <p className="m-0 mt-0.5 text-[11.5px] text-faint tabular-nums">
                    Phản hồi trong {t.msPhanHoi} ms
                  </p>
                )}
              </div>
            ))}
          </div>
          <dl className="m-0 grid gap-x-6 gap-y-2 rounded-[12px] border border-line bg-nen p-4 text-[13px] sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ['Phiên bản', d.phienBan],
                ['Môi trường', d.moiTruong],
                ['Chạy liên tục', khoangChay(d.khoiDongLuc)],
                ['Bộ nhớ đang dùng', `${d.boNhoMb} MB`],
                ['Node.js', d.nodeJs],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] text-faint">{k}</dt>
                <dd className="m-0 font-semibold text-ink tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </>
  )
}

/* ── Hàng đợi xử lý ───────────────────────────────────────────────────────── */

const TT_HANG_DOI = { cho: 'Đang chờ', 'dang-xu-ly': 'Đang xử lý', loi: 'Lỗi — cần gửi lại' } as const
const MAU_HANG_DOI = { cho: 'warn', 'dang-xu-ly': 'brand', loi: 'danger' } as const
/** Đứng ở "đang xử lý" quá chừng này phút là đáng ngờ. */
const PHUT_KET = 15

export function HangDoiXuLyMan() {
  const di = useNavigate()
  const { data: d } = useSuspenseQuery(truyVanHangDoi)
  const ket = d.muc.filter((m) => m.trangThai !== 'loi' && m.soPhutCho >= PHUT_KET).length

  const cot: CotLuoi<MucHangDoi>[] = [
    {
      id: 'ten',
      nhan: 'Văn bản',
      kieu: 'chu',
      rong: 360,
      batBuoc: true,
      giaTri: (m) => m.ten,
      hien: (m) => <b className="text-ink">{m.ten}</b>,
    },
    {
      id: 'trangThai',
      nhan: 'Trạng thái',
      kieu: 'danh-muc',
      rong: 170,
      giaTri: (m) => m.trangThai,
      luaChon: Object.entries(TT_HANG_DOI).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (m) => <Chip mau={MAU_HANG_DOI[m.trangThai]}>{TT_HANG_DOI[m.trangThai]}</Chip>,
    },
    {
      id: 'cho',
      nhan: 'Đã chờ (phút)',
      kieu: 'so',
      rong: 130,
      giaTri: (m) => m.soPhutCho,
      hien: (m) => (
        <span className={m.trangThai !== 'loi' && m.soPhutCho >= PHUT_KET ? 'font-bold text-danger' : ''}>
          {m.soPhutCho.toLocaleString('vi-VN')}
        </span>
      ),
    },
    { id: 'capNhat', nhan: 'Cập nhật', kieu: 'ngay', rong: 120, giaTri: (m) => m.capNhatLuc.slice(0, 10) },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 180, giaTri: (m) => m.donViTen },
    { id: 'nguoi', nhan: 'Người gửi', kieu: 'danh-muc', rong: 170, giaTri: (m) => m.nguoiTao },
    {
      id: 'loi',
      nhan: 'Lỗi',
      kieu: 'chu',
      rong: 320,
      giaTri: (m) => m.loi,
      hien: (m) => <span className="line-clamp-2 text-[12.5px] text-danger">{m.loi ?? ''}</span>,
    },
  ]

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Văn bản đang gửi FOXAI Native xử lý và văn bản lỗi cần gửi lại — tự cập nhật mỗi 15 giây. Bấm một dòng
        để mở văn bản.
      </p>
      {ket > 0 && (
        <ThongBao kieu="loi">
          {ket} văn bản đã chờ quá {PHUT_KET} phút — kiểm tra kết nối FOXAI Native ở “Sức khỏe hệ thống”.
        </ThongBao>
      )}
      <LuoiKpi>
        <TheKpi nhan="Đang chờ" giaTri={d.dem.cho} bieuTuong="cho" mau="warn" />
        <TheKpi nhan="Đang xử lý" giaTri={d.dem.dangXuLy} bieuTuong="moi" mau="brand" />
        <TheKpi nhan="Lỗi cần gửi lại" giaTri={d.dem.loi} bieuTuong="dong" mau="tim" />
        <TheKpi nhan="Chờ quá lâu" giaTri={ket} bieuTuong="cho" mau={ket ? 'warn' : 'ok'} />
      </LuoiKpi>
      <Luoi
        ma="van-hanh-hang-doi"
        tieuDe="Hàng đợi xử lý văn bản"
        cot={cot}
        dong={d.muc}
        khoa={(m) => m.id}
        moDong={(m) => void di({ to: '/van-ban/$id', params: { id: m.id } })}
        mauDong={(m) => (m.trangThai === 'loi' ? 'danger' : undefined)}
        rong="Hàng đợi trống — không có văn bản nào đang chờ hay bị lỗi."
      />
    </>
  )
}

/* ── Lưu trữ tệp ──────────────────────────────────────────────────────────── */

export function LuuTruTepMan() {
  const { data: d } = useSuspenseQuery(truyVanLuuTru)
  const cot: CotLuoi<DongLuuTru>[] = [
    { id: 'nhom', nhan: 'Nghiệp vụ', kieu: 'danh-muc', rong: 180, batBuoc: true, giaTri: (x) => x.nhom },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 240, giaTri: (x) => x.donViTen },
    {
      id: 'loai',
      nhan: 'Loại tệp',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (x) => x.loaiTep,
      hien: (x) => <code className="text-[12.5px]">.{x.loaiTep}</code>,
    },
    { id: 'soTep', nhan: 'Số tệp', kieu: 'so', rong: 120, cong: true, giaTri: (x) => x.soTep },
    {
      id: 'mb',
      nhan: 'Dung lượng (MB)',
      kieu: 'so',
      rong: 160,
      cong: true,
      giaTri: (x) => Math.round((x.dungLuong / 1024 / 1024) * 100) / 100,
    },
    {
      id: 'tb',
      nhan: 'Trung bình / tệp',
      kieu: 'chu',
      rong: 150,
      khongLoc: true,
      giaTri: (x) => (x.soTep ? dungLuongDoc(Math.round(x.dungLuong / x.soTep)) : ''),
    },
  ]
  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Tệp đính kèm GDOS đang giữ, trong phạm vi đơn vị của bạn. Văn bản kéo về từ FOXAI Native không tính ở
        đây — tệp gốc nằm bên Native.
      </p>
      <LuoiKpi>
        <TheKpi nhan="Tổng số tệp" giaTri={d.tongTep.toLocaleString('vi-VN')} bieuTuong="kep" mau="brand" />
        <TheKpi nhan="Tổng dung lượng" giaTri={dungLuongDoc(d.tongDungLuong)} bieuTuong="tai" mau="tim" />
        <TheKpi
          nhan="Trung bình / tệp"
          giaTri={d.tongTep ? dungLuongDoc(Math.round(d.tongDungLuong / d.tongTep)) : '—'}
          bieuTuong="van"
          mau="ok"
        />
        <TheKpi
          nhan="Tệp nằm ở Native"
          giaTri={d.tepONative.toLocaleString('vi-VN')}
          bieuTuong="den"
          mau="warn"
        />
      </LuoiKpi>
      <Luoi
        ma="van-hanh-luu-tru"
        tieuDe="Dung lượng theo nghiệp vụ – đơn vị – loại tệp"
        cot={cot}
        dong={d.dong}
        khoa={(x) => `${x.nhom}|${x.donViTen}|${x.loaiTep}`}
        rong="Chưa có tệp đính kèm nào."
      />
    </>
  )
}
