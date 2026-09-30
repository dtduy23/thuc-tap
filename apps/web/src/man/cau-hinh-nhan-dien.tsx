import { KHOA_NHAN_DIEN, kiemNhanDien, NHAN_DIEN, type NhanDien } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { KHOA_CAU_HINH, KHOA_CONG_KHAI, luuNhanDien, truyVanCauHinh } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { CoDoSaoVang } from '@/ui/co-do-sao-vang'
import { Nut, ONhap, The, ThongBao } from '@/ui/co-ban'
import { ChiXem } from './cau-hinh-bao-mat'

/** Tên cơ quan, tên hệ thống, mô tả — hiện trên màn đăng nhập và thanh trên. */
export default function CauHinhNhanDien() {
  const qc = useQueryClient()
  const { data: ch } = useSuspenseQuery(truyVanCauHinh)
  const [nd, datNd] = useState<NhanDien>(ch.nhanDien)
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()
  const loi = kiemNhanDien(nd)

  const luu = useMutation({
    mutationFn: () => luuNhanDien(nd),
    onSuccess: async (moi) => {
      qc.setQueryData(KHOA_CAU_HINH, moi)
      await qc.invalidateQueries({ queryKey: KHOA_CONG_KHAI })
      datKq({ ok: true, cau: 'Đã lưu. Màn đăng nhập và thanh trên hiện tên mới.' })
    },
    onError: (e) => datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không lưu được.' }),
  })

  const gui = (e: FormEvent) => {
    e.preventDefault()
    if (loi.length === 0) luu.mutate()
  }
  const coQuan = nd.tenCoQuan.trim() || ch.tenDonViGoc || ''

  return (
    <div className="grid max-w-[1000px] gap-4 lg:grid-cols-2">
      <div>
        <ChiXem ch={ch} />
        {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
        <form onSubmit={gui}>
          <The tieuDe="Tên & nhận diện">
            {KHOA_NHAN_DIEN.map((k) => (
              <ONhap
                key={k}
                id={`nd-${k}`}
                nhan={NHAN_DIEN[k].nhan}
                goiY={NHAN_DIEN[k].goiY}
                maxLength={NHAN_DIEN[k].toiDa}
                required={k === 'tenHeThong'}
                disabled={!ch.coTheSua}
                placeholder={k === 'tenCoQuan' ? (ch.tenDonViGoc ?? '') : undefined}
                value={nd[k]}
                onChange={(e) => datNd((c) => ({ ...c, [k]: e.target.value }))}
              />
            ))}
            {loi.map((l) => (
              <p key={l} className="m-0 mb-1 text-[12px] text-danger">
                {l}
              </p>
            ))}
          </The>
          {ch.coTheSua && (
            <Nut type="submit" kieu="chinh" disabled={loi.length > 0 || luu.isPending}>
              {luu.isPending ? 'Đang lưu…' : 'Lưu'}
            </Nut>
          )}
        </form>
      </div>

      <div>
        <h2 className="mt-0 mb-2 text-[13px] font-semibold text-faint">Xem trước màn đăng nhập</h2>
        <div className="rounded-[12px] bg-[linear-gradient(158deg,var(--dam-1)_0%,var(--dam-2)_55%,var(--t-600)_100%)] px-5 py-7 text-center text-white">
          <CoDoSaoVang rong={52} className="mx-auto mb-3" />
          {coQuan && (
            <p className="m-0 text-[11px] font-semibold tracking-[.16em] text-[#c3d2ea] uppercase">
              {coQuan}
            </p>
          )}
          <p className="mt-1 mb-1 text-[19px] leading-snug font-extrabold">{nd.tenHeThong || '—'}</p>
          {nd.moTa.trim() && <p className="m-0 font-serif text-[13px] text-[#cfdcf0] italic">{nd.moTa}</p>}
        </div>
      </div>
    </div>
  )
}
