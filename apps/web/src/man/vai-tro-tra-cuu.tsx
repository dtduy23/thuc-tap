/**
 * Vai trò & quyền › Tra cứu phân công — trả lời hai câu hỏi của người quản trị:
 * "người này đang giữ vai gì, ở phân hệ nào?" và "ai làm được việc X ở phân hệ Y?".
 * CHỈ XEM; quyền tính bằng đúng `tinhQuyen()` mà API dùng để chặn nên không lệch.
 * Sửa phân công ở Tài khoản › Danh sách tài khoản.
 */
import {
  DANH_SACH_MODULE,
  HANH_DONG,
  NHOM,
  tinhQuyen,
  VAI,
  type HanhDong,
  type MaVai,
  type TaiKhoanDong,
} from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { truyVanTaiKhoan } from '@/lib/quan-tri'
import { Chip, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const TEN_HANH_DONG: Record<HanhDong, string> = {
  READ: 'Xem',
  CREATE: 'Tạo',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
  EXPORT: 'Xuất',
  APPROVE: 'Duyệt',
  ASSIGN: 'Giao việc',
}
const TEN_MODULE = new Map(DANH_SACH_MODULE.map((m) => [m.id, m.nhan]))
const LOP_CHON =
  'rounded-lg border border-line bg-nen-2 px-3 py-[7px] text-[13px] text-ink outline-none focus:border-brand'

/** Một dòng = một phân công của một tài khoản (tài khoản chưa có phân công vẫn có một dòng). */
interface Dong {
  khoa: string
  tk: TaiKhoanDong
  vai: MaVai | null
  phamVi: string
}

export default function TraCuuPhanCong() {
  const { data: ds } = useSuspenseQuery(truyVanTaiKhoan)
  const [maModule, datMaModule] = useState('')
  const [hanhDong, datHanhDong] = useState<HanhDong>('READ')

  const mod = DANH_SACH_MODULE.find((m) => m.id === maModule)
  const maQuyen = mod ? `${mod.maQuyen}.${hanhDong}` : null
  /** Lọc "ai làm được việc này": tính quyền thật của từng tài khoản. */
  const duQuyen = (tk: TaiKhoanDong) =>
    !maQuyen || tinhQuyen(DANH_SACH_MODULE, tk.phanCong, tk.laQuanTri).has(maQuyen)

  const dong: Dong[] = ds.filter(duQuyen).flatMap((tk): Dong[] =>
    tk.phanCong.length
      ? tk.phanCong.map((p, i) => ({
          khoa: `${tk.id}-${i}`,
          tk,
          vai: p.vai,
          phamVi:
            p.phamVi === 'tat-ca' ? 'Mọi phân hệ' : p.phamVi.map((id) => TEN_MODULE.get(id) ?? id).join(', '),
        }))
      : [{ khoa: tk.id, tk, vai: null, phamVi: '' }],
  )

  const cot: CotLuoi<Dong>[] = [
    {
      id: 'hoTen',
      nhan: 'Cán bộ',
      kieu: 'chu',
      rong: 230,
      batBuoc: true,
      giaTri: (d) => d.tk.hoTen,
      hien: (d) => (
        <span>
          <b className="text-ink">{d.tk.hoTen}</b>
          {d.tk.trangThai === 'khoa' && (
            <span className="ml-2">
              <Chip mau="danger">Đang khóa</Chip>
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'tenDangNhap',
      nhan: 'Tên đăng nhập',
      kieu: 'chu',
      rong: 160,
      giaTri: (d) => d.tk.tenDangNhap,
      hien: (d) => <code className="text-[12.5px]">{d.tk.tenDangNhap}</code>,
    },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 220, giaTri: (d) => d.tk.donViTen },
    {
      id: 'vai',
      nhan: 'Vai trò',
      kieu: 'danh-muc',
      rong: 150,
      giaTri: (d) => (d.vai ? VAI[d.vai].ten : 'Chưa phân công'),
      hien: (d) =>
        d.vai ? (
          <Chip mau={d.vai === 'LANH_DAO' ? 'brand' : d.vai === 'THANH_TRA' ? 'tim' : 'ok'}>
            {VAI[d.vai].ten}
          </Chip>
        ) : (
          <span className="text-faint">Chưa phân công</span>
        ),
    },
    {
      id: 'phamVi',
      nhan: 'Phân hệ được phân công',
      kieu: 'chu',
      rong: 340,
      giaTri: (d) => d.phamVi,
      hien: (d) => <span className="text-body">{d.phamVi || '—'}</span>,
    },
    {
      id: 'quanTri',
      nhan: 'Quản trị',
      kieu: 'danh-muc',
      rong: 120,
      giaTri: (d) => (d.tk.laQuanTri ? 'Có' : 'Không'),
      hien: (d) =>
        d.tk.laQuanTri ? <Chip mau="warn">Quản trị</Chip> : <span className="text-faint">—</span>,
    },
    {
      id: 'giamSat',
      nhan: 'Giám sát lĩnh vực',
      kieu: 'chu',
      rong: 220,
      an: true,
      giaTri: (d) => d.tk.giamSatLinhVuc.map((l) => l.ten).join(', '),
    },
  ]

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Mỗi dòng là một phân công. Chọn phân hệ và thao tác để biết{' '}
        <b className="text-body">ai làm được việc đó</b> — tính theo đúng quyền hệ thống đang áp dụng. Sửa
        phân công ở Tài khoản › Danh sách tài khoản.
      </p>
      {maQuyen && (
        <ThongBao>
          Đang lọc: tài khoản có quyền <b>{TEN_HANH_DONG[hanhDong]}</b> ở phân hệ <b>{mod!.nhan}</b> (
          <code>{maQuyen}</code>) — {new Set(dong.map((d) => d.tk.id)).size} người.
        </ThongBao>
      )}
      <Luoi
        ma="tra-cuu-phan-cong"
        tieuDe="Phân công"
        cot={cot}
        dong={dong}
        khoa={(d) => d.khoa}
        rong={maQuyen ? 'Không tài khoản nào có quyền này.' : 'Chưa có tài khoản nào.'}
        congCu={
          <>
            <select
              aria-label="Phân hệ cần tra"
              value={maModule}
              onChange={(e) => datMaModule(e.target.value)}
              className={LOP_CHON}
            >
              <option value="">Ai có quyền ở phân hệ…</option>
              {NHOM.map((n) => (
                <optgroup key={n.ma} label={n.nhan}>
                  {DANH_SACH_MODULE.filter((m) => m.nhom === n.ma).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nhan}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              aria-label="Thao tác cần tra"
              value={hanhDong}
              disabled={!maModule}
              onChange={(e) => datHanhDong(e.target.value as HanhDong)}
              className={LOP_CHON}
            >
              {HANH_DONG.map((h) => (
                <option key={h} value={h}>
                  {TEN_HANH_DONG[h]}
                </option>
              ))}
            </select>
          </>
        }
      />
    </>
  )
}
