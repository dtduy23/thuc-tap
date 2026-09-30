import type { CanhBaoDef, DongCanhBao } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { truyVanCanhBao } from '@/lib/xuyen-suot'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const NHAN: Record<CanhBaoDef['loai'], { soNgay: string; trong: string }> = {
  'qua-han': { soNgay: 'Trễ (ngày)', trong: 'Không có việc nào quá hạn.' },
  'sap-han': { soNgay: 'Còn (ngày)', trong: 'Không có việc nào sắp đến hạn.' },
  'lau-khong-cap-nhat': { soNgay: 'Không cập nhật (ngày)', trong: 'Hồ sơ nào cũng được cập nhật gần đây.' },
}

function cotCua(loai: CanhBaoDef['loai']): CotLuoi<DongCanhBao>[] {
  const mau = loai === 'sap-han' ? 'text-warn' : 'text-danger'
  return [
    {
      id: 'hoSo',
      nhan: 'Hồ sơ',
      kieu: 'chu',
      rong: 280,
      batBuoc: true,
      giaTri: (d) => d.hoSoTen,
      hien: (d) => <b className="text-ink">{d.hoSoTen}</b>,
    },
    { id: 'ma', nhan: 'Mã hồ sơ', kieu: 'chu', rong: 130, giaTri: (d) => d.hoSoMa },
    { id: 'nghiepVu', nhan: 'Nghiệp vụ', kieu: 'danh-muc', rong: 120, giaTri: (d) => d.nghiepVu },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.donViTen },
    { id: 'noiDung', nhan: 'Nội dung', kieu: 'chu', rong: 320, giaTri: (d) => d.noiDung },
    ...(loai === 'lau-khong-cap-nhat'
      ? []
      : [{ id: 'han', nhan: 'Hạn', kieu: 'ngay', giaTri: (d) => d.han } satisfies CotLuoi<DongCanhBao>]),
    {
      id: 'soNgay',
      nhan: NHAN[loai].soNgay,
      kieu: 'so',
      rong: 130,
      giaTri: (d) => d.soNgay,
      hien: (d) => <span className={`font-semibold ${mau}`}>{d.soNgay}</span>,
    },
  ]
}

/**
 * Giám sát › Hồ sơ quá hạn — MỘT màn cho ba cấp 4. Không biết nghiệp vụ nào: mọi
 * dòng do module nghiệp vụ đóng góp (ADR-0007), cột "Nghiệp vụ" cho biết từ đâu.
 */
export function CanhBao({ loai }: { loai: CanhBaoDef['loai'] }) {
  const { data: ds } = useSuspenseQuery(truyVanCanhBao(loai))
  const di = useNavigate()
  return (
    <Luoi
      ma={`canh-bao-${loai}`}
      tieuDe={
        loai === 'qua-han'
          ? 'Hồ sơ quá hạn'
          : loai === 'sap-han'
            ? 'Hồ sơ sắp đến hạn'
            : 'Hồ sơ lâu không cập nhật'
      }
      cot={cotCua(loai)}
      dong={ds}
      khoa={(d) => `${d.nguon}-${d.hoSoId}-${d.noiDung}`}
      moDong={(d) => void di({ href: d.lienKet })}
      rong={NHAN[loai].trong}
    />
  )
}

export const DaQuaHan = () => <CanhBao loai="qua-han" />
export const SapDenHan = () => <CanhBao loai="sap-han" />
export const LauKhongCapNhat = () => <CanhBao loai="lau-khong-cap-nhat" />
