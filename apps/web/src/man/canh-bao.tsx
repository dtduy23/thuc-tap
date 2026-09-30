import type { CanhBaoDef } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ngayVn } from '@/lib/ngay'
import { truyVanCanhBao } from '@/lib/xuyen-suot'
import { KhungBang, LOP_TD, LOP_TH } from '@/ui/co-ban'

const NHAN: Record<CanhBaoDef['loai'], { tieuDe: string; soNgay: string; trong: string }> = {
  'qua-han': { tieuDe: 'Hạn', soNgay: 'Trễ', trong: 'Không có việc nào quá hạn.' },
  'sap-han': { tieuDe: 'Hạn', soNgay: 'Còn', trong: 'Không có việc nào sắp đến hạn.' },
  'lau-khong-cap-nhat': {
    tieuDe: '',
    soNgay: 'Không cập nhật',
    trong: 'Hồ sơ nào cũng được cập nhật gần đây.',
  },
}

/**
 * Giám sát › Hồ sơ quá hạn — MỘT màn cho ba cấp 4. Không biết nghiệp vụ nào: mọi
 * dòng do module nghiệp vụ đóng góp (ADR-0007), cột "Nghiệp vụ" cho biết từ đâu.
 */
export function CanhBao({ loai }: { loai: CanhBaoDef['loai'] }) {
  const { data: ds } = useSuspenseQuery(truyVanCanhBao(loai))
  const di = useNavigate()
  const n = NHAN[loai]
  return (
    <>
      <p className="mt-0 mb-3 text-[12.5px] text-faint">
        {ds.length} mục · bấm một dòng để mở đúng chỗ cần xử lý
      </p>
      <KhungBang nhan="Cảnh báo">
        <thead>
          <tr>
            <th className={LOP_TH}>Nghiệp vụ</th>
            <th className={LOP_TH}>Hồ sơ</th>
            <th className={LOP_TH}>Nội dung</th>
            {n.tieuDe && <th className={LOP_TH}>{n.tieuDe}</th>}
            <th className={`${LOP_TH} text-right`}>{n.soNgay}</th>
          </tr>
        </thead>
        <tbody>
          {ds.map((d, i) => (
            <tr
              key={`${d.nguon}-${i}`}
              onClick={() => void di({ href: d.lienKet })}
              className="cursor-pointer hover:bg-nav-hover"
            >
              <td className={`${LOP_TD} text-[12px] whitespace-nowrap text-faint`}>{d.nghiepVu}</td>
              <td className={`${LOP_TD} min-w-[220px]`}>
                <b className="text-ink">{d.hoSoTen}</b>
                <span className="block text-[11.5px] text-faint">
                  <code>{d.hoSoMa}</code> · {d.donViTen}
                </span>
              </td>
              <td className={LOP_TD}>{d.noiDung}</td>
              {n.tieuDe && <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>{ngayVn(d.han)}</td>}
              <td
                className={`${LOP_TD} text-right font-semibold whitespace-nowrap tabular-nums ${loai === 'sap-han' ? 'text-warn' : 'text-danger'}`}
              >
                {d.soNgay} ngày
              </td>
            </tr>
          ))}
          {ds.length === 0 && (
            <tr>
              <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                {n.trong}
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>
    </>
  )
}

export const DaQuaHan = () => <CanhBao loai="qua-han" />
export const SapDenHan = () => <CanhBao loai="sap-han" />
export const LauKhongCapNhat = () => <CanhBao loai="lau-khong-cap-nhat" />
