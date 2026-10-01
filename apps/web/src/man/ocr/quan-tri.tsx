/**
 * Quản trị › Kết nối › Nhận dạng chứng từ (OCR). Hai màn:
 *   Loại chứng từ      — chụp danh sách loại từ FOXAI Native, chọn loại nào được lấy về.
 *   Kết quả đã lấy về  — bấm "Lấy về ngay", xem kết quả theo từng loại.
 * Phần quản trị chỉ ĐƯA DỮ LIỆU VỀ; trực quan hóa và dùng là việc của phân hệ tác nghiệp
 * (gọi `<BangChungTuOcr />` hoặc `truyVanChungTuOcr`).
 */
import type { KetQuaLayVeOcr, LoaiChungTuOcr } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { KHOA_OCR, batLoaiOcr, dongBoLoaiOcr, layVeOcr, truyVanLoaiOcr } from '@/lib/ocr'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { LOP_O_NHO, LuoiKpi, TheKpi } from '../van-ban/chung'
import { BangChungTuOcr } from './bang-chung-tu'

type KetQua = { ok: boolean; cau: string }
const cauLoi = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)

export function LoaiOcr() {
  const qc = useQueryClient()
  const { data: ds } = useSuspenseQuery(truyVanLoaiOcr)
  const [kq, datKq] = useState<KetQua>()

  const dongBo = useMutation({
    mutationFn: dongBoLoaiOcr,
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: KHOA_OCR })
      datKq({
        ok: true,
        cau: `Đã cập nhật ${r.tong} loại từ FOXAI Native${r.moi ? ` — ${r.moi} loại mới (chưa bật)` : ''}.`,
      })
    },
    onError: (e) => datKq({ ok: false, cau: cauLoi(e, 'Không cập nhật được danh sách loại.') }),
  })
  const bat = useMutation({
    mutationFn: (l: LoaiChungTuOcr) => batLoaiOcr(l.ma, !l.bat),
    onSuccess: (moi) => {
      qc.setQueryData(truyVanLoaiOcr.queryKey, moi)
      datKq(undefined)
    },
    onError: (e) => datKq({ ok: false, cau: cauLoi(e, 'Không đổi được.') }),
  })

  const cot: CotLuoi<LoaiChungTuOcr>[] = [
    {
      id: 'ten',
      nhan: 'Loại chứng từ',
      kieu: 'chu',
      rong: 300,
      batBuoc: true,
      giaTri: (l) => l.ten,
      hien: (l) => <b className="text-ink">{l.ten}</b>,
    },
    {
      id: 'ma',
      nhan: 'Mã',
      kieu: 'chu',
      rong: 150,
      giaTri: (l) => l.ma,
      hien: (l) => <code className="text-[12px]">{l.ma}</code>,
    },
    {
      id: 'bat',
      nhan: 'Lấy về GDOS',
      kieu: 'danh-muc',
      rong: 140,
      giaTri: (l) => (l.bat ? 'Đang lấy về' : 'Không lấy'),
      hien: (l) => <Chip mau={l.bat ? 'ok' : 'xam'}>{l.bat ? 'Đang lấy về' : 'Không lấy'}</Chip>,
    },
    { id: 'soTruong', nhan: 'Số trường', kieu: 'so', rong: 110, giaTri: (l) => l.truong.length },
    { id: 'soBang', nhan: 'Số bảng', kieu: 'so', rong: 100, giaTri: (l) => l.bang.length },
    { id: 'soChungTu', nhan: 'Đã lấy về', kieu: 'so', rong: 110, cong: true, giaTri: (l) => l.soChungTu },
    {
      id: 'hoatDong',
      nhan: 'Trên Native',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (l) => (l.hoatDong ? 'Đang dùng' : 'Đã tắt'),
      hien: (l) => <Chip mau={l.hoatDong ? 'brand' : 'warn'}>{l.hoatDong ? 'Đang dùng' : 'Đã tắt'}</Chip>,
    },
    {
      id: 'truong',
      nhan: 'Các trường',
      kieu: 'chu',
      rong: 380,
      an: true,
      giaTri: (l) => l.truong.map((t) => t.nhan).join(', '),
      hien: (l) => (
        <span className="line-clamp-2 text-[12.5px] text-body">{l.truong.map((t) => t.nhan).join(', ')}</span>
      ),
    },
    { id: 'moTa', nhan: 'Mô tả', kieu: 'chu', rong: 320, an: true, giaTri: (l) => l.moTa },
    {
      id: 'dongBoLuc',
      nhan: 'Định nghĩa cập nhật lúc',
      kieu: 'ngay',
      rong: 180,
      an: true,
      giaTri: (l) => l.dongBoLuc.slice(0, 10),
      hien: (l) => ngayGio(l.dongBoLuc),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 130,
      khongLoc: true,
      giaTri: () => null,
      hien: (l) => (
        <Nut disabled={bat.isPending} onClick={() => bat.mutate(l)}>
          {l.bat ? 'Thôi lấy về' : 'Bật lấy về'}
        </Nut>
      ),
    },
  ]

  return (
    <>
      <ThongBao>
        Danh sách loại và các trường do <b>FOXAI Native</b> khai — GDOS chỉ chụp lại. Bật “lấy về” cho những
        loại đơn vị mình dùng; loại không bật thì kết quả không vào GDOS.
      </ThongBao>
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <LuoiKpi>
        <TheKpi nhan="Loại trên Native" giaTri={ds.length} bieuTuong="mau" mau="brand" />
        <TheKpi nhan="Đang lấy về" giaTri={ds.filter((l) => l.bat).length} bieuTuong="xong" mau="ok" />
        <TheKpi
          nhan="Chứng từ đã lấy về"
          giaTri={ds.reduce((t, l) => t + l.soChungTu, 0)}
          bieuTuong="van"
          mau="tim"
        />
      </LuoiKpi>
      <Luoi
        ma="ocr-loai"
        tieuDe="Loại chứng từ"
        cot={cot}
        dong={ds}
        khoa={(l) => l.ma}
        congCu={
          <Nut kieu="chinh" disabled={dongBo.isPending} onClick={() => dongBo.mutate()}>
            {dongBo.isPending ? 'Đang cập nhật…' : 'Cập nhật từ Native'}
          </Nut>
        }
        rong="Chưa có loại nào — bấm “Cập nhật từ Native” để chụp danh sách loại chứng từ."
      />
    </>
  )
}

const cauLayVe = (r: KetQuaLayVeOcr) =>
  [
    `Đã duyệt ${r.daXem} chứng từ trên Native: ${r.moi} mới, ${r.capNhat} cập nhật, ${r.khongDoi} không đổi`,
    r.boQua ? `${r.boQua} bỏ qua (chưa nhận dạng xong, lỗi, hoặc thuộc loại chưa bật)` : '',
    r.loi ? `${r.loi} không đọc được kết quả` : '',
    r.conNua ? 'còn chứng từ cũ hơn chưa duyệt tới' : '',
  ]
    .filter(Boolean)
    .join(' · ') + '.'

export function KetQuaOcr() {
  const qc = useQueryClient()
  const { data: dsLoai } = useSuspenseQuery(truyVanLoaiOcr)
  const dangBat = dsLoai.filter((l) => l.bat || l.soChungTu > 0)
  const [chon, datChon] = useState<string>()
  const [kq, datKq] = useState<KetQua>()
  const loai = dangBat.find((l) => l.ma === chon) ?? dangBat[0]

  const layVe = useMutation({
    mutationFn: layVeOcr,
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: KHOA_OCR })
      datKq({ ok: r.loi === 0, cau: cauLayVe(r) })
    },
    onError: (e) => datKq({ ok: false, cau: cauLoi(e, 'Không lấy về được.') }),
  })

  if (!loai)
    return (
      <ThongBao>
        Chưa bật loại chứng từ nào. Vào <b>Loại chứng từ</b>, bấm “Cập nhật từ Native” rồi bật những loại cần
        lấy về.
      </ThongBao>
    )

  return (
    <>
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[260px]">
          <label htmlFor="ocr-loai-chon" className="mb-1.5 block text-[12.5px] font-semibold text-body">
            Loại chứng từ
          </label>
          <select
            id="ocr-loai-chon"
            value={loai.ma}
            onChange={(e) => datChon(e.target.value)}
            className={LOP_O_NHO}
          >
            {dangBat.map((l) => (
              <option key={l.ma} value={l.ma}>
                {l.ten} ({l.soChungTu})
              </option>
            ))}
          </select>
        </div>
        <Nut kieu="chinh" disabled={layVe.isPending} onClick={() => layVe.mutate()}>
          {layVe.isPending ? 'Đang lấy về…' : 'Lấy về ngay'}
        </Nut>
        <span className="text-[12px] text-faint">
          Lấy mọi loại đang bật, bằng tài khoản Native bạn đã liên kết. GDOS chỉ đọc, không sửa gì bên Native.
        </span>
      </div>
      <Suspense fallback={<p className="text-[13px] text-faint">Đang tải…</p>}>
        <BangChungTuOcr key={loai.ma} loai={loai.ma} />
      </Suspense>
    </>
  )
}
