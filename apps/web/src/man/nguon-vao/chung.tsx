import { kyHien, type KetQuaKiemNap } from '@gdos/shared'
import { KhungBang, LOP_TD, LOP_TH } from '@/ui/co-ban'

export const soVn = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 4 })

/** Bảng xem trước các dòng đã kiểm — dùng chung cho Excel và "Lấy thử" API. */
export function BangKiemNap({ kq, nhanHang }: { kq: KetQuaKiemNap; nhanHang: string }) {
  return (
    <>
      <KhungBang nhan="Kết quả kiểm">
        <thead>
          <tr>
            <th className={LOP_TH}>{nhanHang}</th>
            <th className={LOP_TH}>Mã</th>
            <th className={LOP_TH}>Chỉ tiêu</th>
            <th className={LOP_TH}>Kỳ</th>
            <th className={`${LOP_TH} text-right`}>Giá trị</th>
            <th className={LOP_TH}>Kết quả kiểm</th>
          </tr>
        </thead>
        <tbody>
          {kq.dong.map((d) => (
            <tr key={`${d.hang}-${d.maChiTieu}`} className={d.loi.length ? 'bg-tint-danger' : undefined}>
              <td className={`${LOP_TD} tabular-nums`}>{d.hang}</td>
              <td className={LOP_TD}>
                <code className="text-[12px]">{d.maChiTieu || '—'}</code>
              </td>
              <td className={`${LOP_TD} min-w-[200px]`}>{d.tenChiTieu || '—'}</td>
              <td className={`${LOP_TD} whitespace-nowrap`}>{d.loi.length ? d.ky || '—' : kyHien(d.ky)}</td>
              <td className={`${LOP_TD} text-right tabular-nums`}>
                {d.giaTri === null ? '—' : soVn(d.giaTri)}
              </td>
              <td className={`${LOP_TD} text-[12.5px]`}>
                {d.loi.length ? (
                  <span className="text-danger">{d.loi.join('; ')}</span>
                ) : (
                  <span className="text-ok">Hợp lệ</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </KhungBang>
      {kq.soHopLe + kq.soLoi > kq.dong.length && (
        <p className="mt-2 mb-0 text-[12px] text-faint">
          Đang hiện {kq.dong.length} / {kq.soHopLe + kq.soLoi} dòng (dòng lỗi xếp trước).
        </p>
      )}
    </>
  )
}
