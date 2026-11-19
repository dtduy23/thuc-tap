import { TRANG_THAI_BHYT_THU, quyenBenhVien, type HoSoBhytThu } from '@gdos/shared'
import { useState } from 'react'
import { ngayVn } from '@/lib/ngay'
import { Chip, Nut, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { NhacGiaLap, useGhiThu, useQuyenThu, useThu } from './chung'

const COT: CotLuoi<HoSoBhytThu>[] = [
  { id: 'ma', nhan: 'Mã hồ sơ', kieu: 'chu', giaTri: (d) => d.ma, batBuoc: true, rong: 146 },
  { id: 'ngay', nhan: 'Ngày dịch vụ', kieu: 'ngay', giaTri: (d) => d.ngay },
  { id: 'the', nhan: 'Mã thẻ mẫu', kieu: 'chu', giaTri: (d) => d.maThe, rong: 138 },
  { id: 'ma-dich-vu', nhan: 'Mã dịch vụ', kieu: 'chu', giaTri: (d) => d.maDichVu, rong: 134 },
  { id: 'trang-thai', nhan: 'Trạng thái', kieu: 'danh-muc', giaTri: (d) => TRANG_THAI_BHYT_THU[d.trangThai] },
]

function ChiTietBhyt({ h }: { h: HoSoBhytThu }) {
  const q = useQuyenThu()
  const ghi = useGhiThu()
  const sua = q.includes(quyenBenhVien('ho-so-bhyt', 'UPDATE'))
  const duyet = q.includes(quyenBenhVien('ho-so-bhyt', 'APPROVE'))
  const gui = q.includes(quyenBenhVien('ho-so-bhyt', 'EXPORT'))
  const thaoTac = (viec: string) => ghi.mutate({ duongDan: `/bhyt/${h.ma}/${viec}` })
  return (
    <The tieuDe={h.ma} phu={ngayVn(h.ngay)}>
      <div className="mb-3">
        <Chip mau={h.trangThai === 'can-sua' ? 'warn' : h.trangThai === 'da-gui' ? 'ok' : 'brand'}>
          {TRANG_THAI_BHYT_THU[h.trangThai]}
        </Chip>
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
        {h.trangThai === 'da-duyet' && gui && (
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
  const [ma, datMa] = useState(ds[0]?.ma)
  const h = ds.find((d) => d.ma === ma)
  const canSua = ds.filter((d) => d.trangThai === 'can-sua').length
  const daGui = ds.filter((d) => d.trangThai === 'da-gui').length
  return (
    <>
      <NhacGiaLap>Rà soát theo quy tắc mẫu. Cán bộ quyết định duyệt hay trả hồ sơ.</NhacGiaLap>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip>{ds.length} hồ sơ diễn tập</Chip>
        <Chip mau="warn">{canSua} cần bổ sung</Chip>
        <Chip mau="ok">{daGui} đã gửi giả lập</Chip>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.52fr)]">
        <Luoi
          ma="bv-bhyt"
          tieuDe="Hồ sơ BHYT giả lập"
          cot={COT}
          dong={ds}
          khoa={(d) => d.ma}
          moDong={(d) => datMa(d.ma)}
        />
        {h && <ChiTietBhyt key={`${h.ma}:${h.trangThai}`} h={h} />}
      </div>
    </>
  )
}
