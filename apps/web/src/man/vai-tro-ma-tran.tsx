import {
  DANH_SACH_MODULE,
  HANH_DONG,
  MA_VAI,
  NHOM,
  tangCuaNhom,
  tinhQuyen,
  VAI,
  type HanhDong,
} from '@gdos/shared'
import { KhungBang, LOP_TD, LOP_TH, ThongBao } from '@/ui/co-ban'

const TEN_HANH_DONG: Record<HanhDong, string> = {
  READ: 'Xem',
  CREATE: 'Tạo',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
  EXPORT: 'Xuất',
  APPROVE: 'Duyệt',
  ASSIGN: 'Giao việc',
}

const Dau = ({ co }: { co: boolean }) =>
  co ? (
    <span className="font-bold text-ok" aria-label="có">
      ✓
    </span>
  ) : (
    <span className="text-line" aria-label="không">
      –
    </span>
  )

/**
 * Ma trận quyền — CHỈ XEM. Sinh thẳng từ `VAI` và `tinhQuyen()` (cùng hàm API
 * dùng để chặn), nên bảng này không thể lệch với quyền thật. Đổi vai = viết ADR.
 */
export default function VaiTroMaTran() {
  // Mỗi vai phân công "mọi phân hệ" — trường hợp rộng nhất.
  const quyenCuaVai = Object.fromEntries(
    MA_VAI.map((v) => [v, tinhQuyen(DANH_SACH_MODULE, [{ vai: v, phamVi: 'tat-ca' }], false)]),
  )
  const quyenQuanTri = tinhQuyen(DANH_SACH_MODULE, [], true)

  return (
    <>
      <ThongBao>
        <b>Quyền = vai × phân công.</b> Vai quyết định <i>làm được gì</i>; phân công quyết định{' '}
        <i>làm ở phân hệ nào</i>. Một người có thể giữ nhiều vai; quyền là hợp của tất cả. Cờ quản trị tách
        riêng: chỉ mở phần Quản trị hệ thống, không tự động đọc hồ sơ nghiệp vụ.
      </ThongBao>

      <h2 className="mt-5 mb-2 text-[15px] font-semibold">Vai và hành động</h2>
      <KhungBang nhan="Vai và hành động">
        <thead>
          <tr>
            <th className={LOP_TH}>Vai</th>
            {HANH_DONG.map((h) => (
              <th key={h} className={`${LOP_TH} text-center`}>
                {TEN_HANH_DONG[h]}
              </th>
            ))}
            <th className={`${LOP_TH} text-center`}>Nhật ký</th>
          </tr>
        </thead>
        <tbody>
          {MA_VAI.map((v) => (
            <tr key={v}>
              <td className={`${LOP_TD} min-w-[200px]`}>
                <b className="text-ink">{VAI[v].ten}</b>
                <span className="block text-[12px] text-faint">{VAI[v].mo}</span>
              </td>
              {HANH_DONG.map((h) => (
                <td key={h} className={`${LOP_TD} text-center`}>
                  <Dau co={(VAI[v].hanhDong as readonly HanhDong[]).includes(h)} />
                </td>
              ))}
              <td className={`${LOP_TD} text-center`}>
                <Dau co={VAI[v].thayGiamSat} />
              </td>
            </tr>
          ))}
        </tbody>
      </KhungBang>

      <h2 className="mt-6 mb-2 text-[15px] font-semibold">Theo từng phân hệ</h2>
      <p className="mt-0 mb-2 text-[12.5px] text-faint">
        Khi vai được phân công “mọi phân hệ”. Phân công một số phân hệ thì chỉ có quyền ở các phân hệ đó —
        riêng Danh mục thì vai nào cũng được xem để chọn giá trị khi nhập liệu.
      </p>
      <KhungBang nhan="Quyền theo phân hệ">
        <thead>
          <tr>
            <th className={LOP_TH}>Phân hệ</th>
            {MA_VAI.map((v) => (
              <th key={v} className={LOP_TH}>
                {VAI[v].ten}
              </th>
            ))}
            <th className={LOP_TH}>Cờ quản trị</th>
          </tr>
        </thead>
        <tbody>
          {DANH_SACH_MODULE.map((m) => {
            const o = (q: Set<string>) => {
              const co = HANH_DONG.filter((h) => q.has(`${m.maQuyen}.${h}`))
              return co.length ? (
                co.map((h) => TEN_HANH_DONG[h]).join(', ')
              ) : (
                <span className="text-faint">—</span>
              )
            }
            return (
              <tr key={m.id}>
                <td className={`${LOP_TD} min-w-[180px]`}>
                  <b className="text-ink">{m.nhan}</b>
                  <span className="block text-[11.5px] text-faint">
                    Tầng {tangCuaNhom(m.nhom)} · {NHOM.find((n) => n.ma === m.nhom)?.nhan} ·{' '}
                    <code>{m.maQuyen}</code>
                  </span>
                </td>
                {MA_VAI.map((v) => (
                  <td key={v} className={LOP_TD}>
                    {o(quyenCuaVai[v]!)}
                  </td>
                ))}
                <td className={LOP_TD}>{o(quyenQuanTri)}</td>
              </tr>
            )
          })}
        </tbody>
      </KhungBang>
    </>
  )
}
