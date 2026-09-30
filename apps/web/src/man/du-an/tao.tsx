import { CAP_DON_VI, HINH_THUC, homNay, kiemMaDuAn, LOAI_CHI, NHOM_DU_AN, type CapDonVi } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { capNhatHoSo, taoDuAn, truyVanChuDauTu, truyVanDanhMuc, truyVanQuyTrinhMau } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'

/**
 * Tạo dự án: chọn quy trình mẫu → hệ thống chép các bước sang, tính hạn từ ngày
 * bắt đầu. Hình thức đầu tư đi theo quy trình; mã để trống thì tự sinh.
 */
export default function TaoDuAn() {
  const qc = useQueryClient()
  const di = useNavigate()
  const { data: dsCdt } = useSuspenseQuery(truyVanChuDauTu)
  const { data: dsQt } = useSuspenseQuery(truyVanQuyTrinhMau)
  const { data: dsLv } = useSuspenseQuery(truyVanDanhMuc('linh-vuc'))

  const [f, datF] = useState({
    ten: '',
    ma: '',
    donViId: dsCdt[0]?.id ?? '',
    quyTrinhMa: dsQt[0]?.ma ?? '',
    loaiChi: 'dtpt',
    nhomDuAn: 'C',
    linhVucId: '',
    tongMuc: '',
    ngayBatDau: homNay(),
    canCu: '',
    diaDiem: '',
  })
  const [loi, datLoi] = useState<string>()
  const doi = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    datF((c) => ({ ...c, [k]: e.target.value }))
  const qt = dsQt.find((q) => q.ma === f.quyTrinhMa)
  const loiMa = f.ma.trim() ? kiemMaDuAn(f.ma.trim()) : null

  const tao = useMutation({
    mutationFn: () =>
      taoDuAn({
        ten: f.ten.trim(),
        ma: f.ma.trim() || undefined,
        donViId: f.donViId,
        quyTrinhMa: f.quyTrinhMa,
        loaiChi: f.loaiChi,
        nhomDuAn: f.nhomDuAn || undefined,
        linhVucId: f.linhVucId || undefined,
        tongMuc: Math.round(Number(f.tongMuc) || 0),
        ngayBatDau: f.ngayBatDau,
        canCu: f.canCu.trim() || undefined,
        diaDiem: f.diaDiem.trim() || undefined,
      }),
    onSuccess: async (hs) => {
      capNhatHoSo(qc, hs)
      await di({ to: '/du-an/$id', params: { id: hs.id } })
    },
    onError: (e) => datLoi(e instanceof LoiApi ? e.message : 'Không tạo được dự án.'),
  })

  if (dsCdt.length === 0)
    return <ThongBao kieu="loi">Không có đơn vị nào trong phạm vi của bạn để làm chủ đầu tư.</ThongBao>

  const gui = (e: FormEvent) => {
    e.preventDefault()
    if (!loiMa) tao.mutate()
  }

  return (
    <form onSubmit={gui} className="grid max-w-[1000px] gap-4 lg:grid-cols-2">
      <div>
        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        <The tieuDe="Thông tin dự án">
          <ONhap id="da-ten" nhan="Tên dự án" required maxLength={500} value={f.ten} onChange={doi('ten')} />
          <OChon id="da-cdt" nhan="Chủ đầu tư" value={f.donViId} onChange={doi('donViId')}>
            {dsCdt.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ten} ({CAP_DON_VI[d.cap as CapDonVi] ?? d.cap})
              </option>
            ))}
          </OChon>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <OChon id="da-lv" nhan="Lĩnh vực" value={f.linhVucId} onChange={doi('linhVucId')}>
              <option value="">— Chưa chọn —</option>
              {dsLv.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.ten}
                </option>
              ))}
            </OChon>
            <OChon id="da-nhom" nhan="Nhóm dự án" value={f.nhomDuAn} onChange={doi('nhomDuAn')}>
              {NHOM_DU_AN.map((n) => (
                <option key={n} value={n}>
                  Nhóm {n}
                </option>
              ))}
            </OChon>
            <OChon id="da-loai-chi" nhan="Loại chi" value={f.loaiChi} onChange={doi('loaiChi')}>
              {Object.entries(LOAI_CHI).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </OChon>
            <ONhap
              id="da-tong-muc"
              nhan="Tổng mức đầu tư (triệu đồng)"
              type="number"
              min={0}
              step={1}
              value={f.tongMuc}
              onChange={doi('tongMuc')}
            />
          </div>
          <ONhap
            id="da-can-cu"
            nhan="Căn cứ (quyết định phê duyệt…)"
            maxLength={500}
            value={f.canCu}
            onChange={doi('canCu')}
          />
          <ONhap
            id="da-dia-diem"
            nhan="Địa điểm đầu tư"
            maxLength={300}
            value={f.diaDiem}
            onChange={doi('diaDiem')}
          />
          <ONhap
            id="da-ma"
            nhan="Mã dự án"
            maxLength={40}
            placeholder="Để trống — hệ thống tự sinh DA-năm-số"
            goiY={loiMa ?? 'Không đổi được sau khi tạo.'}
            aria-invalid={!!loiMa}
            value={f.ma}
            onChange={doi('ma')}
          />
        </The>
      </div>
      <div>
        <The tieuDe="Quy trình & tiến độ">
          <OChon id="da-qt" nhan="Quy trình mẫu" value={f.quyTrinhMa} onChange={doi('quyTrinhMa')}>
            {dsQt.map((q) => (
              <option key={q.ma} value={q.ma}>
                {q.ten} — {q.soBuoc} bước
              </option>
            ))}
          </OChon>
          {qt && (
            <p className="mt-[-6px] mb-3.5 text-[12px] text-faint">
              Hình thức: <b>{HINH_THUC[qt.hinhThuc]}</b>
              {qt.canCu ? ` · ${qt.canCu}` : ''}
            </p>
          )}
          <ONhap
            id="da-bat-dau"
            nhan="Ngày bắt đầu"
            type="date"
            required
            goiY="Hạn từng bước tính nối tiếp từ ngày này theo số ngày chuẩn của quy trình."
            value={f.ngayBatDau}
            onChange={doi('ngayBatDau')}
          />
        </The>
        <Nut type="submit" kieu="chinh" disabled={tao.isPending || !!loiMa || !f.ten.trim()}>
          {tao.isPending ? 'Đang tạo…' : 'Tạo dự án'}
        </Nut>
      </div>
    </form>
  )
}
