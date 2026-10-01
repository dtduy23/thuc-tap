import { SO_DONG_NHAP_TOI_DA, type KetQuaNhapDuAn } from '@gdos/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { KHOA_DU_AN } from '@/lib/du-an'
import { LoiApi, taiLenTep, taiVeTep } from '@/lib/http'
import { KhungBang, LOP_TD, LOP_TH, Nut, The, ThongBao } from '@/ui/co-ban'

const loiCua = (e: unknown) => (e instanceof LoiApi ? e.message : 'Có lỗi, vui lòng thử lại.')

/**
 * Dự án › Nhập từ Excel. Ba bước: tải mẫu → chọn tệp (máy chủ kiểm MỌI dòng, chưa
 * ghi gì) → nhập. Có dòng sai thì không nhập dòng nào — sửa tệp rồi chọn lại.
 */
export default function NhapDuAn() {
  const qc = useQueryClient()
  const oTep = useRef<HTMLInputElement>(null)
  const [tep, datTep] = useState<File>()
  const [kq, datKq] = useState<KetQuaNhapDuAn>()
  const [loi, datLoi] = useState<string>()
  const [xong, datXong] = useState<number>()
  const [dangChay, datDangChay] = useState(false)

  const chay = async (viec: () => Promise<void>) => {
    datLoi(undefined)
    datDangChay(true)
    try {
      await viec()
    } catch (e) {
      datLoi(loiCua(e))
    } finally {
      datDangChay(false)
    }
  }
  const goi = (f: File) => {
    const du = new FormData()
    du.append('tep', f)
    return du
  }

  const chonTep = (f: File | undefined) => {
    datTep(f)
    datKq(undefined)
    datXong(undefined)
    if (f) void chay(async () => datKq(await taiLenTep<KetQuaNhapDuAn>('/du-an/nhap/kiem-tra', goi(f))))
  }

  const nhap = () =>
    chay(async () => {
      const r = await taiLenTep<{ soDuAn: number }>('/du-an/nhap', goi(tep!))
      datXong(r.soDuAn)
      datKq(undefined)
      datTep(undefined)
      if (oTep.current) oTep.current.value = ''
      await qc.invalidateQueries({ queryKey: KHOA_DU_AN })
    })

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <div>
        <The tieuDe="1. Tải tệp mẫu">
          <p className="mt-0 mb-3 text-[12.5px] text-faint">
            Tệp mẫu có sẵn danh sách chủ đầu tư, quy trình mẫu, lĩnh vực trong phạm vi của bạn (sheet “Hướng
            dẫn”). Tối đa {SO_DONG_NHAP_TOI_DA} dự án mỗi lần.
          </p>
          <Nut onClick={() => void chay(() => taiVeTep('/du-an/nhap/mau', 'Mau_nhap_du_an.xlsx'))}>
            ⬇ Tải tệp mẫu
          </Nut>
        </The>
        <The tieuDe="2. Chọn tệp đã điền">
          <label htmlFor="nhap-tep" className="sr-only">
            Tệp Excel
          </label>
          <input
            id="nhap-tep"
            ref={oTep}
            type="file"
            accept=".xlsx"
            disabled={dangChay}
            onChange={(e) => chonTep(e.target.files?.[0])}
            className="w-full text-[13px]"
          />
          <p className="mt-2 mb-0 text-[12px] text-faint">Hệ thống kiểm từng dòng — chưa ghi gì.</p>
        </The>
      </div>

      <div>
        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        {xong !== undefined && (
          <ThongBao kieu="ok">
            Đã nhập {xong} dự án.{' '}
            <Link to="/$chucNang" params={{ chucNang: 'da-tat-ca' }} className="font-semibold underline">
              Xem danh sách dự án
            </Link>
          </ThongBao>
        )}
        {dangChay && <p className="text-faint">Đang xử lý…</p>}
        {kq && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-[13px]">
                <b className="text-ok">{kq.soHopLe}</b> dòng hợp lệ ·{' '}
                <b className={kq.soLoi ? 'text-danger' : 'text-faint'}>{kq.soLoi}</b> dòng lỗi
              </span>
              <Nut kieu="chinh" disabled={dangChay || kq.soLoi > 0} onClick={() => void nhap()}>
                3. Nhập {kq.soHopLe} dự án
              </Nut>
              {kq.soLoi > 0 && (
                <span className="text-[12px] text-danger">Sửa các dòng lỗi trong tệp rồi chọn lại tệp.</span>
              )}
            </div>
            <KhungBang nhan="Kết quả kiểm tệp">
              <thead>
                <tr>
                  <th className={LOP_TH}>Hàng</th>
                  <th className={LOP_TH}>Tên dự án</th>
                  <th className={LOP_TH}>Chủ đầu tư</th>
                  <th className={LOP_TH}>Quy trình</th>
                  <th className={LOP_TH}>Kết quả kiểm</th>
                </tr>
              </thead>
              <tbody>
                {kq.dong.map((d) => (
                  <tr key={d.hang} className={d.loi.length ? 'bg-tint-danger' : undefined}>
                    <td className={`${LOP_TD} tabular-nums`}>{d.hang}</td>
                    <td className={`${LOP_TD} min-w-[220px] font-semibold text-ink`}>{d.ten || '—'}</td>
                    <td className={LOP_TD}>{d.chuDauTu}</td>
                    <td className={LOP_TD}>{d.quyTrinh}</td>
                    <td className={`${LOP_TD} text-[12.5px]`}>
                      {d.loi.length ? (
                        <ul className="m-0 list-disc pl-4 text-danger">
                          {d.loi.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-ok">Hợp lệ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </KhungBang>
          </>
        )}
      </div>
    </div>
  )
}
