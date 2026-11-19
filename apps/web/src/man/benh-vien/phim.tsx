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
  { id: 'ma', nhan: 'Mã phim', kieu: 'chu', giaTri: (r) => r.ma, batBuoc: true, rong: 120 },
  { id: 'nguon', nhan: 'Nguồn', kieu: 'danh-muc', giaTri: (r) => NGUON_PHIM[r.nguon], rong: 184 },
  { id: 'nhom', nhan: 'Tập', kieu: 'danh-muc', giaTri: (r) => r.nhom, rong: 134 },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (r) => NHAN_TRANG_THAI[r.trangThai],
    rong: 144,
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

function MoPhim({ p }: { p: PhimThu }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const [nhan, datNhan] = useState<NhanPhim | ''>(p.nhan ?? '')
  const sua = q.includes(quyenBenhVien('phim-x-quang', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('phim-x-quang', 'APPROVE'))
  const goi = (tacVu: string, body?: unknown) => ghi.mutate({ duongDan: `/phim/${p.ma}/${tacVu}`, body })
  return (
    <The tieuDe={p.ma} phu={p.nhom}>
      <p className="mb-2 text-sm text-faint">
        {NGUON_PHIM[p.nguon]} · {NHAN_TRANG_THAI[p.trangThai]}
      </p>
      <p className="mb-3 text-sm text-faint">
        Chỉ định HIS mẫu <strong>{p.maChiDinh}</strong>
      </p>
      <AnhPhantom ma={p.ma} />
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
          Nhãn đã lưu: <strong>{NHAN_PHIM[p.nhan]}</strong>
        </p>
      )}
      {p.trangThai === 'cho-duyet' && duyet && (
        <div className="flex flex-wrap gap-2">
          <Nut disabled={ghi.isPending} onClick={() => goi('duyet', { nhan: p.nhan, chapNhan: true })}>
            Duyệt nhãn
          </Nut>
          <Nut disabled={ghi.isPending} onClick={() => goi('duyet', { nhan: p.nhan, chapNhan: false })}>
            Trả lại
          </Nut>
        </div>
      )}
      {p.goiY && (
        <div className="mt-3 space-y-1 rounded-lg bg-tint-brand p-3 text-sm">
          <div>
            <strong>Gợi ý thử nghiệm</strong> · {NHAN_PHIM[p.goiY.nhan]}
          </div>
          <p className="text-xs">
            Điểm tín hiệu {p.goiY.diem}/100 · {p.goiY.phienBan}
          </p>
          <p className="text-xs font-semibold">
            {p.goiY.nhan === p.nhan ? 'Trùng nhãn đã duyệt' : 'Khác nhãn đã duyệt'}
          </p>
        </div>
      )}
      {!p.goiY && p.trangThai === 'da-duyet' && p.nhan !== 'khong-doc' && sua && (
        <Nut disabled={ghi.isPending} onClick={() => goi('goi-y')}>
          Chạy gợi ý thử
        </Nut>
      )}
    </The>
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
  const p = ds.data?.dong.find((d) => d.ma === chon) ?? ds.data?.dong[0]
  return (
    <>
      <NhacGiaLap>
        Ảnh phantom và nhãn chỉ dùng để diễn tập. Đọc và duyệt nhãn trước khi xem gợi ý thử.
      </NhacGiaLap>
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
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)]">
        <div className="min-w-0">
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
        {p && <MoPhim key={`${p.ma}:${p.trangThai}:${p.nhan}`} p={p} />}
      </div>
    </>
  )
}
