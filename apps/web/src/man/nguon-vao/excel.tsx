import { SO_DONG_NAP_TOI_DA, type KetQuaKiemNap, type LanNap } from '@gdos/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { LoiApi, taiVeTep } from '@/lib/http'
import { KHOA_NGUON_VAO, kiemTepSoLieu, napTepSoLieu } from '@/lib/nguon-vao'
import { Nut, The, ThongBao } from '@/ui/co-ban'
import { BangKiemNap } from './chung'

const loiCua = (e: unknown) => (e instanceof LoiApi ? e.message : 'Có lỗi, vui lòng thử lại.')

/**
 * Nguồn dữ liệu vào › Nạp từ Excel — kênh nạp cho khách KHÔNG có API. Ba bước: tải mẫu → chọn
 * tệp (máy chủ kiểm mọi dòng, chưa ghi gì) → nạp. Có dòng sai thì không nạp dòng nào.
 */
export default function NapExcel() {
  const qc = useQueryClient()
  const oTep = useRef<HTMLInputElement>(null)
  const [tep, datTep] = useState<File>()
  const [kq, datKq] = useState<KetQuaKiemNap>()
  const [loi, datLoi] = useState<string>()
  const [xong, datXong] = useState<LanNap>()
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

  const chonTep = (f: File | undefined) => {
    datTep(f)
    datKq(undefined)
    datXong(undefined)
    if (f) void chay(async () => datKq(await kiemTepSoLieu(f)))
  }

  const nap = () =>
    chay(async () => {
      datXong(await napTepSoLieu(tep!))
      datKq(undefined)
      datTep(undefined)
      if (oTep.current) oTep.current.value = ''
      await qc.invalidateQueries({ queryKey: KHOA_NGUON_VAO })
      await qc.invalidateQueries({ queryKey: ['chi-tieu'] })
    })

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <div>
        <The tieuDe="1. Tải tệp mẫu">
          <p className="mt-0 mb-3 text-[12.5px] text-faint">
            Tệp mẫu liệt kê sẵn cả bộ chỉ tiêu. Chỉ điền cột <b>Giá trị</b> cho những chỉ tiêu có số; hàng để
            trống được bỏ qua. Tối đa {SO_DONG_NAP_TOI_DA.toLocaleString('vi-VN')} dòng mỗi lần.
          </p>
          <Nut
            onClick={() => void chay(() => taiVeTep('/nguon-vao/excel/mau', 'Mau_nap_so_lieu_chi_tieu.xlsx'))}
          >
            ⬇ Tải tệp mẫu
          </Nut>
        </The>
        <The tieuDe="2. Chọn tệp đã điền">
          <label htmlFor="nap-tep" className="sr-only">
            Tệp Excel
          </label>
          <input
            id="nap-tep"
            ref={oTep}
            type="file"
            accept=".xlsx"
            disabled={dangChay}
            onChange={(e) => chonTep(e.target.files?.[0])}
            className="w-full text-[13px]"
          />
          <p className="mt-2 mb-0 text-[12px] text-faint">
            Hệ thống kiểm từng dòng — chưa ghi gì. Nạp lại cùng chỉ tiêu và kỳ thì số mới thay số cũ.
          </p>
        </The>
      </div>

      <div>
        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        {xong && (
          <ThongBao kieu="ok">
            Đã nạp {xong.soDong} số liệu từ “{xong.tenNguon}”. Số đã lên{' '}
            <Link to="/$chucNang" params={{ chucNang: 'ct-tong-quan' }} className="font-semibold underline">
              Tổng quan điều hành
            </Link>
            ; xem lại ở{' '}
            <Link to="/$chucNang" params={{ chucNang: 'nd-ket-qua' }} className="font-semibold underline">
              Kết quả lấy về
            </Link>
            .
          </ThongBao>
        )}
        {dangChay && <p className="text-faint">Đang xử lý…</p>}
        {!kq && !xong && !dangChay && !loi && (
          <ThongBao>
            Đây là <b>kênh nạp</b> số liệu chỉ tiêu cho đơn vị chưa có API — ngang hàng với “Nguồn API”. Số
            nạp vào đi thẳng lên các trang Điều hành, kèm nhãn nguồn và kỳ.
          </ThongBao>
        )}
        {kq && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-[13px]">
                <b className="text-ok">{kq.soHopLe}</b> dòng hợp lệ ·{' '}
                <b className={kq.soLoi ? 'text-danger' : 'text-faint'}>{kq.soLoi}</b> dòng lỗi
              </span>
              <Nut kieu="chinh" disabled={dangChay || kq.soLoi > 0} onClick={() => void nap()}>
                3. Nạp {kq.soHopLe} số liệu
              </Nut>
              {kq.soLoi > 0 && (
                <span className="text-[12px] text-danger">Sửa các dòng lỗi trong tệp rồi chọn lại tệp.</span>
              )}
            </div>
            <BangKiemNap kq={kq} nhanHang="Hàng" />
          </>
        )}
      </div>
    </div>
  )
}
