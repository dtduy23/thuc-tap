import { KHOA_NGUONG, NGUONG_CANH_BAO, NGUONG_MAC_DINH, kiemNguong, type NguongCanhBao } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { KHOA_CAU_HINH, KHOA_CONG_KHAI, luuNguong, truyVanCauHinh } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { Nut, The, ThongBao } from '@/ui/co-ban'
import { ChiXem } from './cau-hinh-bao-mat'

/**
 * Quy tắc cảnh báo › Hạn & ngưỡng cảnh báo — hai ngưỡng dùng chung cho tình trạng bước dự án,
 * Giám sát › Hồ sơ quá hạn và "Việc của tôi". Form dựng từ NGUONG_CANH_BAO trong @gdos/shared.
 */
export default function CauHinhCanhBao() {
  const qc = useQueryClient()
  const { data: ch } = useSuspenseQuery(truyVanCauHinh)
  const [gt, datGt] = useState<Record<string, string>>(() =>
    Object.fromEntries(KHOA_NGUONG.map((k) => [k, String(ch.nguong[k])])),
  )
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()

  const soHoa = () => Object.fromEntries(KHOA_NGUONG.map((k) => [k, Number(gt[k])])) as NguongCanhBao
  const loi = kiemNguong(soHoa())

  const luu = useMutation({
    mutationFn: () => luuNguong(soHoa()),
    onSuccess: async (moi) => {
      qc.setQueryData(KHOA_CAU_HINH, moi)
      // Màu bước, danh sách cảnh báo, việc của tôi đều tính theo ngưỡng — nạp lại hết.
      await qc.invalidateQueries({ queryKey: KHOA_CONG_KHAI })
      await qc.invalidateQueries()
      datKq({ ok: true, cau: 'Đã lưu. Tình trạng bước và các danh sách cảnh báo tính theo ngưỡng mới ngay.' })
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
        <The tieuDe="Hạn & ngưỡng cảnh báo" phu="Áp dụng cho cả hệ thống">
          {KHOA_NGUONG.map((k) => {
            const d = NGUONG_CANH_BAO[k]
            return (
              <div key={k} className="mb-4 grid gap-x-4 sm:grid-cols-[1fr_150px] sm:items-start">
                <label htmlFor={`ng-${k}`} className="text-[13px]">
                  <b className="block text-ink">{d.nhan}</b>
                  <span className="block text-[11.5px] text-faint">
                    {d.mo} Mặc định {d.macDinh} {d.donVi}; từ {d.min} đến {d.max}.
                  </span>
                </label>
                <div className="mt-1.5 flex items-center gap-2 sm:mt-0">
                  <input
                    id={`ng-${k}`}
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
          <p className="m-0 text-[12px] text-faint">
            “Quá hạn” không có ngưỡng: bước chưa xong mà đã qua hạn là quá hạn.
          </p>
        </The>
        {ch.coTheSua && (
          <div className="flex flex-wrap gap-2">
            <Nut type="submit" kieu="chinh" disabled={loi.length > 0 || luu.isPending}>
              {luu.isPending ? 'Đang lưu…' : 'Lưu ngưỡng'}
            </Nut>
            <Nut
              onClick={() =>
                datGt(Object.fromEntries(KHOA_NGUONG.map((k) => [k, String(NGUONG_MAC_DINH[k])])))
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
