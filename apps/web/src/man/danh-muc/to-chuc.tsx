/**
 * Danh mục › Tổ chức — danh bạ Đơn vị và Cán bộ để tra cứu khi làm nghiệp vụ. CHỈ ĐỌC,
 * trong phạm vi đơn vị của người xem. Khai báo, sửa, khóa tài khoản là việc của
 * Quản trị hệ thống › Người dùng & Phân quyền.
 */
import { CAP_DON_VI, VAI, type CanBoDong, type DonViDong } from '@gdos/shared'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { goiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { Chip } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const truyVanDanhBaDonVi = queryOptions({
  queryKey: ['to-chuc', 'don-vi'],
  queryFn: () => goiApi<DonViDong[]>('/to-chuc/don-vi'),
})
const truyVanDanhBaCanBo = queryOptions({
  queryKey: ['to-chuc', 'can-bo'],
  queryFn: () => goiApi<CanBoDong[]>('/to-chuc/can-bo'),
})

const LUA_CHON_CAP = Object.entries(CAP_DON_VI).map(([giaTri, nhan]) => ({ giaTri, nhan }))
const GhiChu = ({ children }: { children: string }) => (
  <p className="mt-0 mb-4 text-[13px] text-faint">{children}</p>
)

export function DanhBaDonVi() {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: ds } = useSuspenseQuery(truyVanDanhBaDonVi)
  const tenCua = new Map(ds.map((d) => [d.id, d.ten]))

  const cot: CotLuoi<DonViDong>[] = [
    {
      id: 'stt',
      nhan: 'STT',
      kieu: 'so',
      rong: 64,
      khongLoc: true,
      giaTri: () => null,
      hien: (_d, s) => <span className="text-faint">{s}</span>,
    },
    {
      id: 'ten',
      nhan: 'Đơn vị',
      kieu: 'chu',
      rong: 320,
      batBuoc: true,
      giaTri: (d) => d.ten,
      hien: (d) => (
        <span>
          <b className="text-ink">{d.ten}</b>
          {d.id === toi.donVi.id && (
            <span className="ml-2">
              <Chip mau="brand">Đơn vị của bạn</Chip>
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'ma',
      nhan: 'Mã',
      kieu: 'chu',
      rong: 140,
      giaTri: (d) => d.ma,
      hien: (d) => <code className="text-[12.5px]">{d.ma}</code>,
    },
    { id: 'cap', nhan: 'Loại', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.cap, luaChon: LUA_CHON_CAP },
    {
      id: 'cha',
      nhan: 'Trực thuộc',
      kieu: 'danh-muc',
      rong: 220,
      giaTri: (d) => (d.chaId ? (tenCua.get(d.chaId) ?? null) : null),
    },
    { id: 'soCanBo', nhan: 'Số cán bộ', kieu: 'so', rong: 120, cong: true, giaTri: (d) => d.soTaiKhoan },
  ]

  return (
    <>
      <GhiChu>
        Danh bạ đơn vị trong phạm vi của bạn — chỉ để tra cứu. Thêm, sửa đơn vị ở Quản trị hệ thống › Đơn vị.
      </GhiChu>
      <Luoi
        ma="danh-ba-don-vi"
        tieuDe="Đơn vị"
        cot={cot}
        dong={ds}
        khoa={(d) => d.id}
        rong="Chưa có đơn vị nào trong phạm vi của bạn."
      />
    </>
  )
}

export function DanhBaCanBo() {
  const { data: ds } = useSuspenseQuery(truyVanDanhBaCanBo)

  const cot: CotLuoi<CanBoDong>[] = [
    {
      id: 'stt',
      nhan: 'STT',
      kieu: 'so',
      rong: 64,
      khongLoc: true,
      giaTri: () => null,
      hien: (_d, s) => <span className="text-faint">{s}</span>,
    },
    {
      id: 'hoTen',
      nhan: 'Họ và tên',
      kieu: 'chu',
      rong: 260,
      batBuoc: true,
      giaTri: (d) => d.hoTen,
      hien: (d) => <b className="text-ink">{d.hoTen}</b>,
    },
    {
      id: 'tenDangNhap',
      nhan: 'Tên đăng nhập',
      kieu: 'chu',
      rong: 180,
      giaTri: (d) => d.tenDangNhap,
      hien: (d) => <code className="text-[12.5px]">{d.tenDangNhap}</code>,
    },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 260, giaTri: (d) => d.donViTen },
    {
      id: 'cap',
      nhan: 'Loại đơn vị',
      kieu: 'danh-muc',
      rong: 150,
      an: true,
      giaTri: (d) => d.donViCap,
      luaChon: LUA_CHON_CAP,
    },
    {
      id: 'vai',
      nhan: 'Vai trò',
      kieu: 'chu',
      rong: 240,
      giaTri: (d) => d.vai.map((v) => VAI[v].ten).join(', '),
      hien: (d) =>
        d.vai.length ? (
          <span className="flex flex-wrap gap-1">
            {d.vai.map((v) => (
              <Chip key={v} mau={v === 'LANH_DAO' ? 'brand' : v === 'THANH_TRA' ? 'tim' : 'ok'}>
                {VAI[v].ten}
              </Chip>
            ))}
          </span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ]

  return (
    <>
      <GhiChu>
        Danh bạ cán bộ đang hoạt động trong phạm vi của bạn — chỉ để tra cứu. Tạo, khóa, phân công ở Quản trị
        hệ thống › Tài khoản.
      </GhiChu>
      <Luoi
        ma="danh-ba-can-bo"
        tieuDe="Cán bộ"
        cot={cot}
        dong={ds}
        khoa={(d) => d.id}
        rong="Chưa có cán bộ nào trong phạm vi của bạn."
      />
    </>
  )
}
