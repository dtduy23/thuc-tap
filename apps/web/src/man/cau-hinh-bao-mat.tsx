import {
  CHINH_SACH,
  CHINH_SACH_MAC_DINH,
  KHOA_CHINH_SACH,
  kiemChinhSach,
  type CauHinhHeThong,
  type ChinhSachBaoMat,
} from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { KHOA_CAU_HINH, KHOA_CONG_KHAI, luuBaoMat, truyVanCauHinh } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { Nut, The, ThongBao } from '@/ui/co-ban'

/** Chỉ quản trị ở đơn vị gốc sửa được — người khác xem, biết vì sao không sửa được. */
export function ChiXem({ ch }: { ch: CauHinhHeThong }) {
  if (ch.coTheSua) return null
  return (
    <ThongBao>
      Cấu hình này áp dụng cho <b>cả hệ thống</b>, nên chỉ quản trị ở đơn vị gốc
      {ch.tenDonViGoc ? ` (${ch.tenDonViGoc})` : ''} được sửa. Bạn đang xem.
    </ThongBao>
  )
}

/** Chính sách đăng nhập & mật khẩu — form dựng từ khai báo CHINH_SACH trong @gdos/shared. */
export default function CauHinhBaoMat() {
  const qc = useQueryClient()
  const { data: ch } = useSuspenseQuery(truyVanCauHinh)
  const [gt, datGt] = useState<Record<string, string>>(() =>
    Object.fromEntries(KHOA_CHINH_SACH.map((k) => [k, String(ch.baoMat[k])])),
  )
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()

  const soHoa = () => Object.fromEntries(KHOA_CHINH_SACH.map((k) => [k, Number(gt[k])])) as ChinhSachBaoMat
  const loi = kiemChinhSach(soHoa())

  const luu = useMutation({
    mutationFn: () => luuBaoMat(soHoa()),
    onSuccess: async (moi) => {
      qc.setQueryData(KHOA_CAU_HINH, moi)
      await qc.invalidateQueries({ queryKey: KHOA_CONG_KHAI })
      datKq({
        ok: true,
        cau: 'Đã lưu. Áp dụng ngay cho lần đăng nhập, làm mới phiên và đổi mật khẩu tiếp theo.',
      })
    },
    onError: (e) => datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không lưu được.' }),
  })

  const gui = (e: FormEvent) => {
    e.preventDefault()
    if (loi.length === 0) luu.mutate()
  }

  return (
    <div className="max-w-[720px]">
      <ChiXem ch={ch} />
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <form onSubmit={gui}>
        <The tieuDe="Đăng nhập & mật khẩu">
          {KHOA_CHINH_SACH.map((k) => {
            const d = CHINH_SACH[k]
            const mo = 'mo' in d ? d.mo : undefined
            return (
              <div key={k} className="mb-4 grid gap-x-4 sm:grid-cols-[1fr_150px] sm:items-start">
                <label htmlFor={`cs-${k}`} className="text-[13px]">
                  <b className="block text-ink">{d.nhan}</b>
                  <span className="block text-[11.5px] text-faint">
                    {mo ? `${mo} ` : ''}Mặc định {d.macDinh} {d.donVi}; từ {d.min} đến {d.max}.
                  </span>
                </label>
                <div className="mt-1.5 flex items-center gap-2 sm:mt-0">
                  <input
                    id={`cs-${k}`}
                    type="number"
                    inputMode="numeric"
                    min={d.min}
                    max={d.max}
                    step={1}
                    required
                    disabled={!ch.coTheSua}
                    value={gt[k]}
                    onChange={(e) => datGt((c) => ({ ...c, [k]: e.target.value }))}
                    className="w-[84px] rounded-lg border border-line bg-nen-2 px-2.5 py-1.5 text-right text-[13.5px] text-ink tabular-nums disabled:opacity-60"
                  />
                  <span className="text-[12.5px] text-faint">{d.donVi}</span>
                </div>
              </div>
            )
          })}
          {loi.map((l) => (
            <p key={l} className="m-0 mb-1 text-[12px] text-danger">
              {l}
            </p>
          ))}
        </The>
        {ch.coTheSua && (
          <div className="flex flex-wrap gap-2">
            <Nut type="submit" kieu="chinh" disabled={loi.length > 0 || luu.isPending}>
              {luu.isPending ? 'Đang lưu…' : 'Lưu chính sách'}
            </Nut>
            <Nut
              onClick={() =>
                datGt(Object.fromEntries(KHOA_CHINH_SACH.map((k) => [k, String(CHINH_SACH_MAC_DINH[k])])))
              }
            >
              Điền lại mặc định
            </Nut>
          </div>
        )}
      </form>
    </div>
  )
}
