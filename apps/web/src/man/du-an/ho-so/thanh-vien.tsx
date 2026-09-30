import { VAI_TRO_THANH_VIEN, type HoSoDuAn, type TaiKhoanDanhBa, type VaiTroThanhVien } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { boThanhVien, themThanhVien, timDanhBa } from '@/lib/du-an'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, OChon, The, ThongBao } from '@/ui/co-ban'
import { useGhiHoSo } from './ghi-ho-so'

/**
 * Thành viên dự án — người NGOÀI đơn vị chủ đầu tư được vào dự án (nhà thầu, tư
 * vấn, giám sát) hoặc cán bộ được chỉ định. Nhà thầu, tư vấn chỉ gửi cập nhật;
 * chủ đầu tư xác nhận (ADR-0008).
 */
export default function ThanhVien({ hs }: { hs: HoSoDuAn }) {
  const ghi = useGhiHoSo()
  const [tim, datTim] = useState('')
  const [vaiTro, datVaiTro] = useState<VaiTroThanhVien>('nha-thau')
  const { data: ds = [] } = useQuery({
    queryKey: ['danh-ba', tim],
    queryFn: () => timDanhBa(tim),
    enabled: tim.trim().length >= 2,
  })

  return (
    <div className="max-w-[900px]">
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      <KhungBang nhan="Thành viên dự án">
        <thead>
          <tr>
            <th className={LOP_TH}>Người</th>
            <th className={LOP_TH}>Đơn vị</th>
            <th className={LOP_TH}>Vai trò trong dự án</th>
            {hs.quyen.thanhVien && (
              <th className={LOP_TH}>
                <span className="sr-only">Thao tác</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {hs.canBo && (
            <tr>
              <td className={LOP_TD}>
                <b>{hs.canBo.hoTen}</b>
              </td>
              <td className={LOP_TD}>{hs.donViTen}</td>
              <td className={LOP_TD}>
                <Chip mau="brand">Cán bộ phụ trách chính</Chip>
                <span className="ml-1 text-[11.5px] text-faint">(đổi ở Tổng quan)</span>
              </td>
              {hs.quyen.thanhVien && <td className={LOP_TD} />}
            </tr>
          )}
          {hs.thanhVien.map((t) => (
            <tr key={t.id}>
              <td className={LOP_TD}>
                <b>{t.hoTen}</b>
              </td>
              <td className={LOP_TD}>{t.donViTen}</td>
              <td className={LOP_TD}>
                <Chip mau={t.vaiTro === 'nha-thau' || t.vaiTro === 'tu-van' ? 'tim' : 'xam'}>
                  {VAI_TRO_THANH_VIEN[t.vaiTro]}
                </Chip>
              </td>
              {hs.quyen.thanhVien && (
                <td className={`${LOP_TD} text-right`}>
                  <Nut
                    kieu="nguy-hiem"
                    disabled={ghi.dangChay}
                    onClick={() => {
                      if (confirm(`Bỏ ${t.hoTen} khỏi dự án?`)) ghi.chay(() => boThanhVien(hs.id, t.id))
                    }}
                    className="!py-0.5"
                  >
                    Bỏ
                  </Nut>
                </td>
              )}
            </tr>
          ))}
          {!hs.canBo && hs.thanhVien.length === 0 && (
            <tr>
              <td colSpan={4} className={`${LOP_TD} text-center text-faint`}>
                Chưa có thành viên nào.
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>

      {hs.quyen.thanhVien && (
        <div className="mt-4">
          <The tieuDe="Thêm thành viên" phu="Tìm trong danh bạ tài khoản — gồm cả tài khoản của doanh nghiệp">
            <div className="grid gap-x-3 sm:grid-cols-[1fr_200px]">
              <div className="mb-3.5">
                <label htmlFor="tv-tim" className="mb-1.5 block text-[12.5px] font-semibold text-body">
                  Người
                </label>
                <input
                  id="tv-tim"
                  type="search"
                  placeholder="Gõ tên, tên đăng nhập hoặc tên đơn vị…"
                  value={tim}
                  onChange={(e) => datTim(e.target.value)}
                  className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px]"
                />
              </div>
              <OChon
                id="tv-vai"
                nhan="Vai trò"
                value={vaiTro}
                onChange={(e) => datVaiTro(e.target.value as VaiTroThanhVien)}
              >
                {Object.entries(VAI_TRO_THANH_VIEN).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </OChon>
            </div>
            {tim.trim().length >= 2 && (
              <ul className="m-0 max-h-60 list-none overflow-y-auto rounded-lg border border-line p-1">
                {ds.map((t: TaiKhoanDanhBa) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-nav-hover"
                  >
                    <span className="min-w-0 flex-1 text-[13px]">
                      {t.hoTen}{' '}
                      <span className="text-faint">
                        · {t.tenDangNhap} · {t.donViTen}
                      </span>
                    </span>
                    <Nut
                      kieu="chinh"
                      disabled={ghi.dangChay}
                      className="!py-0.5"
                      onClick={() =>
                        ghi.chay(
                          () => themThanhVien(hs.id, t.id, vaiTro),
                          () => datTim(''),
                        )
                      }
                    >
                      Thêm làm {VAI_TRO_THANH_VIEN[vaiTro].toLowerCase()}
                    </Nut>
                  </li>
                ))}
                {ds.length === 0 && <li className="px-2 py-1.5 text-[12.5px] text-faint">Không tìm thấy.</li>}
              </ul>
            )}
          </The>
        </div>
      )}
    </div>
  )
}
