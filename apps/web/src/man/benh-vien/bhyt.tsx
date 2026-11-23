import { TRANG_THAI_BHYT_THU, quyenBenhVien, type HoSoBhytThu } from '@gdos/shared'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ngayVn } from '@/lib/ngay'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi, type LocCot } from '@/ui/luoi/luoi'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const COT_CHI_TIET: CotLuoi<HoSoBhytThu>[] = [
  { id: 'ho-ten', nhan: 'Người bệnh', kieu: 'chu', giaTri: (d) => d.hoTen ?? 'Bệnh nhân' },
  { id: 'khoa', nhan: 'Khoa điều trị', kieu: 'danh-muc', giaTri: (d) => d.khoa ?? 'Khám bệnh', rong: 150 },
  { id: 'ngay', nhan: 'Ngày dịch vụ', kieu: 'ngay', giaTri: (d) => d.ngay },
  { id: 'the', nhan: 'Mã thẻ BHYT', kieu: 'chu', giaTri: (d) => d.maThe ?? 'Thiếu', rong: 138 },
  {
    id: 'tong-chi-phi',
    nhan: 'Tổng chi phí',
    kieu: 'so',
    giaTri: (d) => d.tongChiPhi ?? 0,
    hien: (d) => (d.tongChiPhi ?? 0).toLocaleString('vi-VN') + ' đ',
  },
  {
    id: 'tien-bhyt',
    nhan: 'BHYT chi trả',
    kieu: 'so',
    giaTri: (d) => d.tienBhyt ?? 0,
    hien: (d) => (d.tienBhyt ?? 0).toLocaleString('vi-VN') + ' đ',
  },
  {
    id: 'rui-ro',
    nhan: 'Rủi ro AI',
    kieu: 'danh-muc',
    giaTri: (d) => d.mucDoRuiRo ?? 'thap',
    hien: (d) =>
      d.mucDoRuiRo === 'cao' ? (
        <Chip mau="danger">Rủi ro cao</Chip>
      ) : d.mucDoRuiRo === 'trung-binh' ? (
        <Chip mau="warn">Cảnh báo</Chip>
      ) : (
        <Chip mau="ok">An toàn</Chip>
      ),
  },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (d) => d.trangThai,
    luaChon: Object.entries(TRANG_THAI_BHYT_THU).map(([giaTri, nhan]) => ({ giaTri, nhan })),
  },
]

const NHOM_HO_SO = [
  { ma: '', nhan: 'tất cả hồ sơ', mau: 'xam' },
  { ma: 'can-sua', nhan: 'cần bổ sung', mau: 'warn' },
  { ma: 'cho-duyet', nhan: 'chờ duyệt', mau: 'brand' },
  { ma: 'da-gui', nhan: 'đã gửi BHXH', mau: 'ok' },
] as const

function HopThoaiChiTietBhyt({ h, dong }: { h: HoSoBhytThu; dong: () => void }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const sua = q.includes(quyenBenhVien('ho-so-bhyt', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('ho-so-bhyt', 'APPROVE'))
  const thaoTac = (viec: string) => ghi.mutate({ duongDan: `/bhyt/${h.ma}/${viec}` })

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
        aria-labelledby="bv-bhyt-tieu-de"
        className="hien-dan flex max-h-[90vh] w-full max-w-[580px] flex-col rounded-[12px] border border-line bg-nen shadow-[0_18px_44px_rgba(4,14,33,.3)]"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="bv-bhyt-tieu-de" className="m-0 text-[17px] font-extrabold text-ink">
                {h.ma}
              </h2>
              <Chip mau={h.trangThai === 'can-sua' ? 'warn' : h.trangThai === 'da-gui' ? 'ok' : 'brand'}>
                {TRANG_THAI_BHYT_THU[h.trangThai]}
              </Chip>
            </div>
            <p className="mt-0.5 mb-0 text-xs text-faint">
              {h.hoTen ?? 'Bệnh nhân'} · {ngayVn(h.ngay)}
            </p>
          </div>
          <Nut onClick={dong}>Đóng</Nut>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Khoa điều trị</dt>
              <dd className="font-semibold text-ink">{h.khoa ?? 'Khám bệnh'}</dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Mã thẻ BHYT</dt>
              <dd className="font-semibold text-ink">{h.maThe ?? 'Chưa có'}</dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">Tổng chi phí KCB</dt>
              <dd className="font-semibold text-ink">{(h.tongChiPhi ?? 0).toLocaleString('vi-VN')} đ</dd>
            </div>
            <div className="rounded-md border border-line bg-nen-2 p-2.5">
              <dt className="text-xs text-faint">BHYT thanh toán</dt>
              <dd className="font-semibold text-ok">{(h.tienBhyt ?? 0).toLocaleString('vi-VN')} đ</dd>
            </div>
          </dl>

          {h.goiYAI && (
            <div className="mb-4 rounded-lg border border-brand/30 bg-brand/5 p-3.5 text-sm">
              <div className="mb-1.5 flex items-center justify-between font-semibold text-brand">
                <span>🤖 Đề xuất xử lý từ AI (QĐ 130)</span>
                <span className="text-xs font-normal opacity-80">Độ tin cậy 92%</span>
              </div>
              <p className="m-0 text-ink leading-relaxed">{h.goiYAI}</p>
            </div>
          )}

          {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}

          {h.trangThai === 'cho-ra-soat' && (
            <p className="mb-3 text-sm text-faint">
              Chạy rà soát tự động 5 tệp XML theo chuẩn Quyết định 130/QĐ-BYT trước khi trình duyệt.
            </p>
          )}

          {h.trangThai === 'can-sua' && (
            <div className="mb-3 rounded-lg border border-warn/30 bg-warn/10 p-3.5 text-sm">
              <strong className="block mb-1.5 text-warn">Lỗi phát hiện trong hồ sơ:</strong>
              <ul className="list-disc space-y-1 pl-4 text-warn">
                {h.loi.length ? (
                  h.loi.map((d) => <li key={d}>{d}</li>)
                ) : (
                  <li>Người duyệt đã trả lại để đối soát.</li>
                )}
              </ul>
            </div>
          )}

          {h.trangThai === 'cho-duyet' && (
            <p className="mb-3 text-sm text-faint">
              Hồ sơ đã qua kiểm tra bộ luật QĐ 130. Cần cán bộ có thẩm quyền ký số phê duyệt.
            </p>
          )}

          {h.trangThai === 'da-gui' && (
            <p className="mb-3 text-sm text-ok">
              ✓ Đã ký số và gửi thành công lên Cổng giám định BHYT Quốc gia. Mã giao dịch tiếp nhận:{' '}
              <code>GD-{h.ma}-OK</code>
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3 bg-nen-2/40 rounded-b-[12px]">
          {h.trangThai === 'cho-ra-soat' && sua && (
            <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('ra-soat')}>
              Rà soát hồ sơ
            </Nut>
          )}
          {h.trangThai === 'can-sua' && sua && (
            <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('bo-sung')}>
              Áp dụng bản bổ sung mẫu (AI)
            </Nut>
          )}
          {h.trangThai === 'cho-duyet' && duyet && (
            <>
              <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('duyet')}>
                Duyệt hồ sơ (Ký số)
              </Nut>
              <Nut disabled={ghi.isPending} onClick={() => thaoTac('tra-lai')}>
                Trả lại
              </Nut>
            </>
          )}
          {h.trangThai === 'da-duyet' && sua && (
            <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('gui')}>
              Gửi cổng BHXH giả lập
            </Nut>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function RaSoatBhyt() {
  const ds = useThu<HoSoBhytThu[]>('/bhyt')
  const [ma, datMa] = useState<string>()
  const [loc, datLoc] = useState<Record<string, LocCot>>({})
  const danhSach = useRef<HTMLElement>(null)
  const locTrangThai = loc['trang-thai']
  const trangThai = locTrangThai?.kieu === 'danh-muc' ? locTrangThai.chon : []
  const hoSoTrongNhom = (d: HoSoBhytThu) => !trangThai.length || trangThai.includes(d.trangThai)
  const h = ds.find((d) => d.ma === ma && hoSoTrongNhom(d))

  const tongTien = ds.reduce((s, d) => s + (d.tongChiPhi ?? 0), 0)
  const hopLe = ds.filter((d) => d.trangThai === 'da-duyet' || d.trangThai === 'da-gui').length
  const loi = ds.filter((d) => d.trangThai === 'can-sua').length
  const ruiRoCao = ds.filter((d) => d.mucDoRuiRo === 'cao').length

  const cot: CotLuoi<HoSoBhytThu>[] = [
    {
      id: 'ma',
      nhan: 'Mã hồ sơ',
      kieu: 'chu',
      giaTri: (d) => d.ma,
      batBuoc: true,
      rong: 146,
      hien: (d) => (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={h?.ma === d.ma}
          className="max-w-full truncate font-semibold text-brand hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            datMa(d.ma)
          }}
        >
          {d.ma}
        </button>
      ),
    },
    ...COT_CHI_TIET,
  ]

  return (
    <>
      <NhacGiaLap>
        Kiểm soát hồ sơ BHYT trước khi gửi cổng giám định (QĐ 130/QĐ-BYT). AI hỗ trợ phát hiện rủi ro và gợi ý
        sửa lỗi.
      </NhacGiaLap>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Tổng số hồ sơ</span>
          <strong className="text-xl text-ink">{ds.length}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Đã duyệt / Hợp lệ</span>
          <strong className="text-xl text-ok">{hopLe}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Cảnh báo lỗi XML</span>
          <strong className="text-xl text-warn">{loi}</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Rủi ro cao (AI)</span>
          <strong className="text-xl text-danger">{ruiRoCao} hồ sơ</strong>
        </div>
        <div className="rounded-lg border border-line bg-nen-2 p-3">
          <span className="block text-xs text-faint">Tổng chi phí đề nghị</span>
          <strong className="text-xl text-brand">{(tongTien / 1_000_000).toFixed(1)} tr</strong>
        </div>
      </div>

      <div role="group" aria-label="Lọc nhanh hồ sơ BHYT" className="mb-4 flex flex-wrap gap-2">
        {NHOM_HO_SO.map(({ ma: nhom, nhan, mau }) => {
          const dangLoc = nhom ? trangThai.length === 1 && trangThai[0] === nhom : !trangThai.length
          const soHoSo = nhom ? ds.filter((d) => d.trangThai === nhom).length : ds.length
          return (
            <button
              key={nhom}
              type="button"
              aria-controls="bv-bhyt-danh-sach"
              aria-pressed={dangLoc}
              className="cursor-pointer rounded-full hover:ring-1 hover:ring-brand aria-pressed:ring-2 aria-pressed:ring-brand"
              onClick={() => {
                datMa(undefined)
                datLoc({ ...loc, 'trang-thai': { kieu: 'danh-muc', chon: nhom ? [nhom] : [] } })
                danhSach.current?.focus()
              }}
            >
              <Chip mau={mau}>
                {soHoSo} {nhan}
              </Chip>
            </button>
          )
        })}
      </div>

      <div className="w-full">
        <section
          id="bv-bhyt-danh-sach"
          ref={danhSach}
          tabIndex={-1}
          aria-label="Danh sách hồ sơ BHYT"
          className="min-w-0 rounded-lg outline-none focus:ring-2 focus:ring-brand focus:ring-offset-4 focus:ring-offset-nen"
        >
          <Luoi
            ma="bv-bhyt"
            tieuDe="Hồ sơ BHYT giám định trước khi gửi"
            cot={cot}
            dong={ds}
            khoa={(d) => d.ma}
            moDong={(d) => datMa(d.ma)}
            dongDangMo={h?.ma}
            boLocCot={{ giaTri: loc, doi: datLoc }}
          />
        </section>
      </div>

      {h && (
        <HopThoaiChiTietBhyt
          key={`${h.ma}:${h.trangThai}`}
          h={h}
          dong={() => {
            datMa(undefined)
            danhSach.current?.focus()
          }}
        />
      )}
    </>
  )
}
