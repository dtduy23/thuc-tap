import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { truyVanDanhSachDuAn } from '@/lib/du-an'
import { truyVanToi } from '@/lib/phien'
import { ChonTaiKhoan } from '@/ui/chon-tai-khoan'
import { OChon, ThongBao } from '@/ui/co-ban'
import NhatKyDs from './nhat-ky-ds'

/**
 * Giám sát › Nhật ký thao tác › Theo hồ sơ / Theo người dùng — CÙNG một màn nhật
 * ký, chỉ chọn trước một trục lọc. Không có bảng hay API riêng.
 */
export function NhatKyTheoHoSo() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const xemDuAn = toi.quyen.includes('DU_AN.READ')
  const { data: ds = [] } = useQuery({ ...truyVanDanhSachDuAn('tat-ca'), enabled: xemDuAn })
  const [id, datId] = useState('')
  if (!xemDuAn) return <ThongBao>Chưa có nghiệp vụ nào có hồ sơ bạn xem được.</ThongBao>
  return (
    <>
      <div className="max-w-[560px]">
        <OChon id="nk-du-an" nhan="Hồ sơ dự án" value={id} onChange={(e) => datId(e.target.value)}>
          <option value="">— Chọn một dự án —</option>
          {ds.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ma} · {d.ten}
            </option>
          ))}
        </OChon>
      </div>
      {id ? (
        <NhatKyDs key={id} duAnId={id} />
      ) : (
        <p className="text-[13px] text-faint">Chọn một hồ sơ để xem vết thao tác.</p>
      )}
    </>
  )
}

export function NhatKyTheoNguoi() {
  const [tk, datTk] = useState<{ id: string; hoTen: string } | null>(null)
  return (
    <>
      <div className="max-w-[560px]">
        <ChonTaiKhoan nhan="Người thực hiện" gt={tk} doi={datTk} khoa={false} />
      </div>
      {tk ? (
        <NhatKyDs key={tk.id} taiKhoanId={tk.id} />
      ) : (
        <p className="text-[13px] text-faint">Tìm và chọn một người để xem họ đã làm gì.</p>
      )}
    </>
  )
}
