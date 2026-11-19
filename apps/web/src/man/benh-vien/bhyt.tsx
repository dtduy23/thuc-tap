import { TRANG_THAI_BHYT_THU, quyenBenhVien, type HoSoBhytThu } from '@gdos/shared'
import { useRef, useState } from 'react'
import { ngayVn } from '@/lib/ngay'
import { Chip, Nut, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi, type LocCot } from '@/ui/luoi/luoi'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const COT_CHI_TIET: CotLuoi<HoSoBhytThu>[] = [
  { id: 'ngay', nhan: 'Ngày dịch vụ', kieu: 'ngay', giaTri: (d) => d.ngay },
  { id: 'the', nhan: 'Mã thẻ mẫu', kieu: 'chu', giaTri: (d) => d.maThe, rong: 138 },
  { id: 'ma-dich-vu', nhan: 'Mã dịch vụ', kieu: 'chu', giaTri: (d) => d.maDichVu, rong: 134 },
  {
    id: 'trang-thai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (d) => d.trangThai,
    luaChon: Object.entries(TRANG_THAI_BHYT_THU).map(([giaTri, nhan]) => ({ giaTri, nhan })),
  },
]

const NHOM_HO_SO = [
  { ma: '', nhan: 'hồ sơ diễn tập', mau: 'xam' },
  { ma: 'can-sua', nhan: 'cần bổ sung', mau: 'warn' },
  { ma: 'da-gui', nhan: 'đã gửi giả lập', mau: 'ok' },
] as const

function ChiTietBhyt({ h, dong }: { h: HoSoBhytThu; dong: () => void }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const sua = q.includes(quyenBenhVien('ho-so-bhyt', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('ho-so-bhyt', 'APPROVE'))
  const thaoTac = (viec: string) => ghi.mutate({ duongDan: `/bhyt/${h.ma}/${viec}` })
  return (
    <The tieuDe={h.ma} phu={ngayVn(h.ngay)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Chip mau={h.trangThai === 'can-sua' ? 'warn' : h.trangThai === 'da-gui' ? 'ok' : 'brand'}>
          {TRANG_THAI_BHYT_THU[h.trangThai]}
        </Chip>
        <Nut onClick={dong}>Đóng chi tiết</Nut>
      </div>
      <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-faint">Mã thẻ mẫu</dt>
          <dd className="font-semibold">{h.maThe ?? 'Thiếu'}</dd>
        </div>
        <div>
          <dt className="text-faint">Mã dịch vụ</dt>
          <dd className="font-semibold">{h.maDichVu ?? 'Thiếu'}</dd>
        </div>
      </dl>
      {ghi.isError && <ThongBao kieu="loi">{ghi.error.message}</ThongBao>}
      {h.trangThai === 'cho-ra-soat' && (
        <p className="mb-3 text-sm text-faint">
          Chạy rà soát để kiểm tra thông tin, hiệu lực thẻ và lượt dịch vụ trùng.
        </p>
      )}
      {h.trangThai === 'can-sua' && (
        <ul className="mb-3 list-disc space-y-1 pl-4 text-sm text-warn">
          {h.loi.length ? (
            h.loi.map((d) => <li key={d}>{d}</li>)
          ) : (
            <li>Người duyệt đã trả lại để đối soát.</li>
          )}
        </ul>
      )}
      {h.trangThai === 'cho-duyet' && (
        <p className="mb-3 text-sm text-faint">
          Đã qua các bước kiểm tra mẫu. Cần cán bộ duyệt trước khi gửi.
        </p>
      )}
      {h.trangThai === 'da-gui' && <p className="text-sm text-ok">Cổng BHXH giả lập đã nhận hồ sơ.</p>}
      <div className="flex flex-wrap gap-2">
        {h.trangThai === 'cho-ra-soat' && sua && (
          <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('ra-soat')}>
            Rà soát hồ sơ
          </Nut>
        )}
        {h.trangThai === 'can-sua' && sua && (
          <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('bo-sung')}>
            Áp dụng bản bổ sung mẫu
          </Nut>
        )}
        {h.trangThai === 'cho-duyet' && duyet && (
          <>
            <Nut kieu="chinh" disabled={ghi.isPending} onClick={() => thaoTac('duyet')}>
              Duyệt hồ sơ
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
    </The>
  )
}

export default function RaSoatBhyt() {
  const ds = useThu<HoSoBhytThu[]>('/bhyt')
  const [ma, datMa] = useState<string>()
  const [loc, datLoc] = useState<Record<string, LocCot>>({})
  const chiTiet = useRef<HTMLElement>(null)
  const danhSach = useRef<HTMLElement>(null)
  const locTrangThai = loc['trang-thai']
  const trangThai = locTrangThai?.kieu === 'danh-muc' ? locTrangThai.chon : []
  const hoSoTrongNhom = (d: HoSoBhytThu) => !trangThai.length || trangThai.includes(d.trangThai)
  const h = ds.find((d) => d.ma === ma && hoSoTrongNhom(d))

  function moHoSo(d: HoSoBhytThu) {
    datMa(d.ma)
    requestAnimationFrame(() => {
      chiTiet.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      chiTiet.current?.focus({ preventScroll: true })
    })
  }

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
          aria-controls="bv-bhyt-chi-tiet"
          aria-expanded={h?.ma === d.ma}
          className="max-w-full truncate font-semibold text-brand hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            moHoSo(d)
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
      <NhacGiaLap>Rà soát theo quy tắc mẫu. Cán bộ quyết định duyệt hay trả hồ sơ.</NhacGiaLap>
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
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.52fr)]">
        <section
          id="bv-bhyt-danh-sach"
          ref={danhSach}
          tabIndex={-1}
          aria-label="Danh sách hồ sơ BHYT"
          className="min-w-0 rounded-lg outline-none focus:ring-2 focus:ring-brand focus:ring-offset-4 focus:ring-offset-nen"
        >
          <Luoi
            ma="bv-bhyt"
            tieuDe="Hồ sơ BHYT giả lập"
            cot={cot}
            dong={ds}
            khoa={(d) => d.ma}
            moDong={moHoSo}
            dongDangMo={h?.ma}
            boLocCot={{ giaTri: loc, doi: datLoc }}
          />
        </section>
        <aside id="bv-bhyt-chi-tiet" ref={chiTiet} tabIndex={-1} aria-label="Chi tiết hồ sơ BHYT">
          {h ? (
            <ChiTietBhyt
              key={`${h.ma}:${h.trangThai}`}
              h={h}
              dong={() => {
                datMa(undefined)
                danhSach.current?.focus()
              }}
            />
          ) : (
            <The tieuDe="Chi tiết hồ sơ">
              <p className="m-0 text-sm text-faint">
                {ds.some(hoSoTrongNhom)
                  ? 'Chọn một hồ sơ trong bảng để xem chi tiết.'
                  : 'Chưa có hồ sơ để xem trong nhóm này.'}
              </p>
            </The>
          )}
        </aside>
      </div>
    </>
  )
}
