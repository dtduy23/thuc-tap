import type { KetNoiDong, KetQuaKiemTraKetNoi } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { kiemTraKetNoi, truyVanKetNoi } from '@/lib/van-ban'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const CHE_DO = { that: 'Đang nối thật', gia: 'Bản giả (máy dev)', chua: 'Chưa kết nối' } as const
const MAU = { that: 'ok', gia: 'warn', chua: 'danger' } as const

/**
 * Quản trị › Kết nối › Dịch vụ nền tảng. Cấu hình kết nối nằm ở biến môi trường của
 * máy chủ (bí mật không bao giờ qua trình duyệt) — màn này chỉ XEM và KIỂM TRA.
 */
function KetNoi({ kiemTraNgay }: { kiemTraNgay: boolean }) {
  const { data: ds } = useSuspenseQuery(truyVanKetNoi)
  const [kq, datKq] = useState<Record<string, KetQuaKiemTraKetNoi>>({})
  const [dang, datDang] = useState<string>()
  const [loi, datLoi] = useState<string>()

  const kiemTra = async (ma: string) => {
    datLoi(undefined)
    datDang(ma)
    try {
      const r = await kiemTraKetNoi(ma)
      datKq((c) => ({ ...c, [ma]: r }))
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không kiểm tra được.')
    } finally {
      datDang(undefined)
    }
  }

  const cot: CotLuoi<KetNoiDong>[] = [
    {
      id: 'ten',
      nhan: 'Hệ thống',
      kieu: 'chu',
      rong: 260,
      batBuoc: true,
      giaTri: (k) => k.ten,
      hien: (k) => <b className="text-ink">{k.ten}</b>,
    },
    {
      id: 'cheDo',
      nhan: 'Chế độ',
      kieu: 'danh-muc',
      rong: 160,
      giaTri: (k) => k.cheDo,
      luaChon: Object.entries(CHE_DO).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (k) => <Chip mau={MAU[k.cheDo]}>{CHE_DO[k.cheDo]}</Chip>,
    },
    { id: 'diaChi', nhan: 'Địa chỉ', kieu: 'chu', rong: 240, giaTri: (k) => k.diaChi },
    { id: 'moTa', nhan: 'Ghi chú', kieu: 'chu', rong: 340, giaTri: (k) => k.moTa },
    {
      id: 'ketQua',
      nhan: 'Lần kiểm tra gần nhất',
      kieu: 'chu',
      rong: 320,
      giaTri: (k) => kq[k.ma]?.thongDiep ?? null,
      hien: (k) =>
        kq[k.ma] ? (
          <span className={kq[k.ma]!.ok ? 'text-ok' : 'text-danger'}>
            {kq[k.ma]!.ok ? '✓' : '✗'} {kq[k.ma]!.thongDiep}{' '}
            <span className="text-faint">
              ({kq[k.ma]!.msPhanHoi} ms · {ngayGio(kq[k.ma]!.luc)})
            </span>
          </span>
        ) : (
          <span className="text-faint">Chưa kiểm tra</span>
        ),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 110,
      khongLoc: true,
      giaTri: () => null,
      hien: (k) => (
        <Nut disabled={dang === k.ma} onClick={() => void kiemTra(k.ma)}>
          {dang === k.ma ? 'Đang thử…' : 'Kiểm tra'}
        </Nut>
      ),
    },
  ]

  return (
    <>
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {kiemTraNgay && (
        <div className="mb-3">
          <Nut kieu="chinh" disabled={!!dang} onClick={() => void Promise.all(ds.map((k) => kiemTra(k.ma)))}>
            Kiểm tra tất cả
          </Nut>
        </div>
      )}
      <Luoi ma="ket-noi" tieuDe="Dịch vụ nền tảng" cot={cot} dong={ds} khoa={(k) => k.ma} />
      <p className="mt-3 text-[12px] text-faint">
        Địa chỉ và bí mật kết nối đặt ở biến môi trường của máy chủ (NATIVE_URL…), không nhập qua màn hình —
        trình duyệt không bao giờ giữ khóa của hệ thống bên ngoài.
      </p>
    </>
  )
}

export const DanhSachKetNoi = () => <KetNoi kiemTraNgay={false} />
export const KiemTraKetNoi = () => <KetNoi kiemTraNgay />
