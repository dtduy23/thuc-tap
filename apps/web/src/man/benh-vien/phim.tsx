import {
  NHAN_PHIM,
  NGUON_PHIM,
  quyenBenhVien,
  type DanhSachPhimThu,
  type LocPhim,
  type NhanPhim,
  type NguonPhim,
  type PhimThu,
} from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { goiApi } from '@/lib/http'
import { Chip, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { NhacGiaLap, useQuyenThu, useGhiThu } from './chung'

const NHAN_TRANG_THAI = {
  'cho-nhan': 'Chờ gán nhãn',
  'cho-duyet': 'Chờ duyệt',
  'da-duyet': 'Đã duyệt',
} as const
const COT: CotLuoi<PhimThu>[] = [
  { id: 'ma', nhan: 'Mã phim', kieu: 'chu', giaTri: (r) => r.ma, batBuoc: true, rong: 110 },
  { id: 'ho-ten', nhan: 'Người bệnh', kieu: 'chu', giaTri: (r) => r.hoTen ?? 'Bệnh nhân', rong: 140 },
  {
    id: 'tuoi',
    nhan: 'Tuổi',
    kieu: 'so',
    giaTri: (r) => r.tuoi ?? 0,
    hien: (r) => `${r.tuoi ?? '—'} t`,
    rong: 70,
  },
  { id: 'khoa', nhan: 'Khoa phòng', kieu: 'danh-muc', giaTri: (r) => r.khoaChiDinh ?? 'CĐHA', rong: 140 },
  { id: 'nguon', nhan: 'Nguồn chụp', kieu: 'danh-muc', giaTri: (r) => NGUON_PHIM[r.nguon], rong: 170 },
  { id: 'nhom', nhan: 'Tập dữ liệu', kieu: 'danh-muc', giaTri: (r) => r.nhom, rong: 130 },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (r) => NHAN_TRANG_THAI[r.trangThai],
    hien: (r) => (
      <Chip mau={r.trangThai === 'da-duyet' ? 'ok' : r.trangThai === 'cho-duyet' ? 'brand' : 'xam'}>
        {NHAN_TRANG_THAI[r.trangThai]}
      </Chip>
    ),
    rong: 130,
  },
]

function AnhPhantom({ ma }: { ma: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const anh = useQuery({
    queryKey: ['anh-phim-gia-lap', ma],
    queryFn: () => goiApi<{ rong: number; anh: string }>(`/benh-vien/phim/${ma}/anh`),
  })
  useEffect(() => {
    const d = anh.data
    const ctx = cv.current?.getContext('2d')
    if (!d || !ctx) return
    const anhGoc = atob(d.anh)
    const im = ctx.createImageData(d.rong, d.rong)
    for (let i = 0; i < anhGoc.length; i++) {
      const j = i * 4
      const px = anhGoc.charCodeAt(i)
      im.data[j] = px
      im.data[j + 1] = px
      im.data[j + 2] = px
      im.data[j + 3] = 255
    }
    ctx.putImageData(im, 0, 0)
  }, [anh.data])
  if (anh.isError) return <ThongBao kieu="loi">{anh.error.message}</ThongBao>
  if (!anh.data) return <p role="status">Đang tải ảnh tổng hợp…</p>
  return (
    <figure className="mb-4 rounded-xl bg-black p-3 text-center text-white">
      <canvas
        ref={cv}
        width={anh.data.rong}
        height={anh.data.rong}
        role="img"
        aria-label={`Ảnh phantom phổi ${ma}`}
        className="mx-auto aspect-square w-full max-w-72"
      />
      <figcaption className="pt-2 text-xs">Ảnh phantom tổng hợp · {ma}</figcaption>
    </figure>
  )
}

function HopThoaiMoPhim({ p, dong }: { p: PhimThu; dong: () => void }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const [nhan, datNhan] = useState<NhanPhim | ''>(p.nhan ?? '')
  const sua = q.includes(quyenBenhVien('phim-x-quang', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('phim-x-quang', 'APPROVE'))
  const goi = (tacVu: string, body?: unknown) => ghi.mutate({ duongDan: `/phim/${p.ma}/${tacVu}`, body })

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [dong])

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && dong()}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,22,44,.5)] backdrop-blur-[2px] p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bv-phim-tieu-de"
        className="hien-dan flex max-h-[92vh] w-full max-w-[640px] flex-col rounded-[12px] border border-line bg-nen shadow-[0_18px_44px_rgba(4,14,33,.3)]"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="bv-phim-tieu-de" className="m-0 text-[17px] font-extrabold text-ink">
                {p.ma}
              </h2>
              <Chip mau={p.trangThai === 'da-duyet' ? 'ok' : p.trangThai === 'cho-duyet' ? 'brand' : 'xam'}>
                {NHAN_TRANG_THAI[p.trangThai]}
              </Chip>
              <span className="text-xs text-faint">({p.nhom})</span>
            </div>
            <p className="mt-0.5 mb-0 text-xs text-faint">
              {NGUON_PHIM[p.nguon]} · {p.hoTen ?? 'Bệnh nhân'} ({p.tuoi ?? '—'} tuổi)
            </p>
          </div>
          <Nut onClick={dong}>Đóng</Nut>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs border-b border-line pb-2.5">
            <div className="rounded-md border border-line bg-nen-2 p-2">
              <span className="text-faint block">Người bệnh:</span>
              <strong className="text-ink">{p.hoTen ?? 'Bệnh nhân'}</strong> ({p.tuoi ?? '—'} tuổi)
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2">
              <span className="text-faint block">Khoa chỉ định:</span>
              <strong className="text-ink">{p.khoaChiDinh ?? 'CĐHA'}</strong>
            </div>
            <div className="col-span-2 rounded-md border border-line bg-nen-2 p-2">
              <span className="text-faint block">Mã chỉ định HIS:</span>
              <strong className="text-ink">{p.maChiDinh}</strong>
            </div>
          </div>

          <AnhPhantom ma={p.ma} />

          {p.tonThuongPhatHien && p.tonThuongPhatHien.length > 0 && (
            <div className="mb-3 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-xs text-warn">
              <strong className="block mb-1">Vùng tổn thương ghi nhận:</strong>
              <ul className="list-disc pl-4 space-y-0.5">
                {p.tonThuongPhatHien.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}

          {p.trangThai !== 'da-duyet' && sua && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (nhan) goi('nhan', { nhan })
              }}
              className="mb-3"
            >
              <OChon
                id="bv-nhan-phim"
                nhan="Nhãn của người đọc"
                value={nhan}
                onChange={(e) => datNhan(e.target.value as NhanPhim | '')}
              >
                <option value="">Chọn nhãn</option>
                {Object.entries(NHAN_PHIM).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </OChon>
              <Nut type="submit" kieu="chinh" disabled={!nhan || ghi.isPending}>
                Lưu nhãn chờ duyệt
              </Nut>
            </form>
          )}

          {p.nhan && (
            <p className="mb-2 text-sm">
              Nhãn đã lưu: <strong className="text-brand">{NHAN_PHIM[p.nhan]}</strong>
            </p>
          )}

          {p.goiY && (
            <div className="mt-3 space-y-1 rounded-lg border border-brand/30 bg-tint-brand p-3 text-sm">
              <div className="font-semibold text-brand">🤖 Gợi ý thử nghiệm: {NHAN_PHIM[p.goiY.nhan]}</div>
              <p className="text-xs text-faint">
                Điểm tín hiệu {p.goiY.diem}/100 · Phiên bản {p.goiY.phienBan}
              </p>
              <p className="text-xs font-semibold">
                {p.goiY.nhan === p.nhan ? (
                  <span className="text-ok">✓ Trùng nhãn đã duyệt</span>
                ) : (
                  <span className="text-warn">⚠ Khác nhãn đã duyệt</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3 bg-nen-2/40 rounded-b-[12px]">
          {p.trangThai === 'cho-duyet' && duyet && (
            <>
              <Nut
                kieu="chinh"
                disabled={ghi.isPending}
                onClick={() => goi('duyet', { nhan: p.nhan, chapNhan: true })}
              >
                Duyệt nhãn
              </Nut>
              <Nut disabled={ghi.isPending} onClick={() => goi('duyet', { nhan: p.nhan, chapNhan: false })}>
                Trả lại
              </Nut>
            </>
          )}
          {!p.goiY && p.trangThai === 'da-duyet' && p.nhan !== 'khong-doc' && sua && (
            <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => goi('goi-y')}>
              Chạy gợi ý thử
            </Nut>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function DanhSachPhim() {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const [loc, datLoc] = useState<LocPhim>('tat-ca')
  const [nguon, datNguon] = useState<NguonPhim | ''>('')
  const [tim, datTim] = useState('')
  const [trang, datTrang] = useState(1)
  const [chon, datChon] = useState<string>()
  const thamSo = new URLSearchParams({ loc, trang: String(trang) })
  if (nguon) thamSo.set('nguon', nguon)
  if (tim.trim()) thamSo.set('tim', tim.trim())
  const ds = useQuery({
    queryKey: ['benh-vien-thu', 'phim', thamSo.toString()],
    queryFn: () => goiApi<DanhSachPhimThu>(`/benh-vien/phim?${thamSo}`),
  })
  const p = ds.data?.dong.find((d) => d.ma === chon)
  return (
    <>
      <NhacGiaLap>
        Quản lý tập ảnh X-quang phổi, gán nhãn Ground Truth và thử nghiệm song song mô hình AI hỗ trợ đọc
        phim.
      </NhacGiaLap>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Tổng số phim</span>
          <strong className="text-xl text-ink">{ds.data?.tong ?? 5000}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Đã duyệt nhãn</span>
          <strong className="text-xl text-ok">{ds.data?.daDuyet ?? 0}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Chờ duyệt nhãn</span>
          <strong className="text-xl text-warn">{ds.data?.choDuyet ?? 0}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Đã chạy mô hình AI</span>
          <strong className="text-xl text-brand">{ds.data?.daChay ?? 0}</strong>
        </div>
      </div>
      {q.includes(quyenBenhVien('phim-x-quang', 'CREATE')) && (
        <The tieuDe="Nhận lô chạy song song">
          <div className="flex flex-wrap gap-2">
            {Object.entries(NGUON_PHIM).map(([ma, ten]) => (
              <Nut
                key={ma}
                disabled={ghi.isPending}
                onClick={() => ghi.mutate({ duongDan: `/phim/nhan-lo/${ma}` })}
              >
                Nhận lô từ {ten}
              </Nut>
            ))}
            <Link
              className="self-center text-sm font-semibold text-brand underline"
              to="/$chucNang"
              params={{ chucNang: 'bv-nghien-cuu' }}
            >
              Hồ sơ nghiên cứu
            </Link>
          </div>
          {ghi.isError && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {ghi.error.message}
            </p>
          )}
          {ghi.isSuccess && (
            <p role="status" className="mt-2 text-sm text-ok">
              Lô mẫu đã sẵn sàng trong kho phim.
            </p>
          )}
        </The>
      )}
      <div className="w-full">
        <The tieuDe="Lọc kho phim">
          <div className="grid gap-x-3 sm:grid-cols-3">
            <OChon
              id="bv-phim-loc"
              nhan="Trạng thái"
              value={loc}
              onChange={(e) => {
                datLoc(e.target.value as LocPhim)
                datTrang(1)
              }}
            >
              <option value="tat-ca">Tất cả</option>
              {Object.entries(NHAN_TRANG_THAI).map(([ma, ten]) => (
                <option key={ma} value={ma}>
                  {ten}
                </option>
              ))}
            </OChon>
            <OChon
              id="bv-phim-nguon"
              nhan="Nguồn nhận"
              value={nguon}
              onChange={(e) => {
                datNguon(e.target.value as NguonPhim | '')
                datTrang(1)
              }}
            >
              <option value="">Tất cả nguồn</option>
              {Object.entries(NGUON_PHIM).map(([ma, ten]) => (
                <option key={ma} value={ma}>
                  {ten}
                </option>
              ))}
            </OChon>
            <ONhap
              id="bv-phim-tim"
              nhan="Tìm theo mã"
              placeholder="XQ-0001"
              maxLength={15}
              value={tim}
              onChange={(e) => {
                datTim(e.target.value)
                datTrang(1)
              }}
            />
          </div>
          {ds.data && (
            <div className="flex flex-wrap gap-2">
              <Chip>{ds.data.choNhan} chờ nhãn</Chip>
              <Chip mau="warn">{ds.data.choDuyet} chờ duyệt</Chip>
              <Chip mau="ok">{ds.data.daDuyet.toLocaleString('vi-VN')} đã duyệt</Chip>
            </div>
          )}
        </The>
        {ds.isError && <ThongBao kieu="loi">{ds.error.message}</ThongBao>}
        {ds.isPending && <p role="status">Đang tải danh sách…</p>}
        {ds.data && (
          <Luoi
            ma="bv-kho-phim"
            tieuDe="Trang phim giả lập"
            cot={COT}
            dong={ds.data.dong}
            khoa={(d) => d.ma}
            moDong={(d) => datChon(d.ma)}
            dongDangMo={p?.ma}
            rong="Không tìm thấy phim phù hợp."
            phanTrangMayChu={
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Nut disabled={trang === 1} onClick={() => datTrang(trang - 1)}>
                  Về trang trước
                </Nut>
                <span role="status">
                  Trang {trang}/{Math.max(1, Math.ceil(ds.data.tong / 25))} ·{' '}
                  {ds.data.tong.toLocaleString('vi-VN')} phim
                </span>
                <Nut disabled={trang * 25 >= ds.data.tong} onClick={() => datTrang(trang + 1)}>
                  Sang trang sau
                </Nut>
              </div>
            }
          />
        )}
      </div>
      {p && <HopThoaiMoPhim key={`${p.ma}:${p.trangThai}:${p.nhan}`} p={p} dong={() => datChon(undefined)} />}
    </>
  )
}
