import {
  DUOI_TEP_VAN_BAN,
  LOAI_VAN_BAN,
  NGUON_VAN_BAN,
  TRANG_THAI_VAN_BAN,
  type TrangThaiVanBan,
  type VanBanDong,
} from '@gdos/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useRef, useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { KHOA_VAN_BAN, taiLenVanBan, truyVanTrangThaiVanBan, truyVanVanBan } from '@/lib/van-ban'
import { Chip, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const MAU: Record<TrangThaiVanBan, 'xam' | 'brand' | 'warn' | 'ok' | 'danger'> = {
  'chua-gui': 'xam',
  cho: 'warn',
  'dang-xu-ly': 'brand',
  xong: 'ok',
  loi: 'danger',
}
export const ChipVanBan = ({ tt }: { tt: TrangThaiVanBan }) => (
  <Chip mau={MAU[tt]}>{TRANG_THAI_VAN_BAN[tt]}</Chip>
)

const COT: CotLuoi<VanBanDong>[] = [
  {
    id: 'ten',
    nhan: 'Văn bản',
    kieu: 'chu',
    rong: 300,
    batBuoc: true,
    giaTri: (d) => d.ten,
    hien: (d) => <b className="text-ink">{d.ten}</b>,
  },
  {
    id: 'loai',
    nhan: 'Loại',
    kieu: 'danh-muc',
    rong: 130,
    giaTri: (d) => d.loai,
    luaChon: LOAI_VAN_BAN.map((l) => ({ giaTri: l, nhan: l })),
  },
  {
    id: 'trangThai',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    rong: 150,
    giaTri: (d) => d.trangThai,
    luaChon: Object.entries(TRANG_THAI_VAN_BAN).map(([giaTri, nhan]) => ({ giaTri, nhan })),
    hien: (d) => <ChipVanBan tt={d.trangThai} />,
  },
  {
    id: 'nguon',
    nhan: 'Nguồn',
    kieu: 'danh-muc',
    rong: 130,
    giaTri: (d) => d.nguon,
    luaChon: Object.entries(NGUON_VAN_BAN).map(([giaTri, nhan]) => ({ giaTri, nhan })),
  },
  { id: 'rutGon', nhan: 'Rút gọn (%)', kieu: 'so', rong: 110, giaTri: (d) => d.tyLeRutGon },
  { id: 'soKyTu', nhan: 'Ký tự gốc', kieu: 'so', rong: 110, an: true, giaTri: (d) => d.soKyTuGoc },
  {
    id: 'hieuChinh',
    nhan: 'Đã hiệu chỉnh',
    kieu: 'danh-muc',
    rong: 120,
    an: true,
    giaTri: (d) => (d.daHieuChinh ? 'co' : 'khong'),
    luaChon: [
      { giaTri: 'co', nhan: 'Có' },
      { giaTri: 'khong', nhan: 'Không' },
    ],
  },
  { id: 'tenTep', nhan: 'Tệp', kieu: 'chu', rong: 180, an: true, giaTri: (d) => d.tenTep },
  { id: 'nguoiTao', nhan: 'Người tạo', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.nguoiTao },
  { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 150, an: true, giaTri: (d) => d.donViTen },
  { id: 'taoLuc', nhan: 'Ngày tạo', kieu: 'ngay', giaTri: (d) => d.taoLuc.slice(0, 10) },
]

/**
 * Xử lý văn bản › Tóm tắt văn bản. Tải văn bản lên → FOXAI Native tóm tắt → xem
 * bản gốc và bản tóm tắt song song, sửa lại được (ADR-0009).
 */
export default function TomTatVanBan() {
  const di = useNavigate()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: ds } = useSuspenseQuery(truyVanVanBan)
  const { data: tt } = useSuspenseQuery(truyVanTrangThaiVanBan)
  const coTao = toi.quyen.includes('VAN_BAN.CREATE')

  return (
    <>
      {tt.cheDo === 'gia' && (
        <ThongBao>
          <b>Bản giả.</b> {tt.moTa} Khi nối FOXAI Native thật, tóm tắt do AI làm (đọc được cả PDF scan).
        </ThongBao>
      )}
      {tt.cheDo === 'chua' && (
        <ThongBao kieu="loi">
          <b>Chưa kết nối FOXAI Native.</b> {tt.moTa} Văn bản cũ vẫn xem được; chưa gửi tóm tắt mới được.
        </ThongBao>
      )}
      {tt.cheDo !== 'chua' && !tt.daLienKet && coTao && (
        <ThongBao kieu="loi">
          Tài khoản của bạn chưa liên kết FOXAI Native.{' '}
          <Link to="/cai-dat" className="font-semibold underline">
            Liên kết ở Cài đặt cá nhân
          </Link>{' '}
          (đăng nhập tài khoản Native của bạn một lần).
        </ThongBao>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Luoi
            ma="van-ban-tom-tat"
            tieuDe="Văn bản tóm tắt"
            cot={COT}
            dong={ds}
            khoa={(d) => d.id}
            moDong={(d) => void di({ to: '/van-ban/$id', params: { id: d.id } })}
            rong="Chưa có văn bản nào — tải văn bản lên ở khung bên cạnh."
          />
        </div>
        {coTao && tt.cheDo !== 'chua' && tt.daLienKet && (
          <div className="xl:sticky xl:top-0 xl:self-start">
            <TaiLen />
          </div>
        )}
      </div>
    </>
  )
}

function TaiLen() {
  const qc = useQueryClient()
  const di = useNavigate()
  const oTep = useRef<HTMLInputElement>(null)
  const [ten, datTen] = useState('')
  const [loai, datLoai] = useState<string>(LOAI_VAN_BAN[0])
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    const tep = oTep.current?.files?.[0]
    if (!tep) return datLoi('Chưa chọn tệp.')
    const du = new FormData()
    du.append('tep', tep)
    du.append('loai', loai)
    if (ten.trim()) du.append('ten', ten.trim())
    datLoi(undefined)
    datDangGui(true)
    try {
      const vb = await taiLenVanBan(du)
      await qc.invalidateQueries({ queryKey: KHOA_VAN_BAN })
      void di({ to: '/van-ban/$id', params: { id: vb.id } })
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không tải lên được.')
    } finally {
      datDangGui(false)
    }
  }

  return (
    <The tieuDe="Tóm tắt văn bản mới" phu={`${DUOI_TEP_VAN_BAN.join(', ')} · tối đa 20 MB`}>
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <form onSubmit={(e) => void gui(e)}>
        <div className="mb-3.5">
          <label htmlFor="vbm-tep" className="mb-1.5 block text-[12.5px] font-semibold text-body">
            Tệp văn bản
          </label>
          <input
            id="vbm-tep"
            ref={oTep}
            type="file"
            accept={DUOI_TEP_VAN_BAN.map((d) => `.${d}`).join(',')}
            className="w-full text-[13px]"
          />
        </div>
        <ONhap
          id="vbm-ten"
          nhan="Tên văn bản"
          maxLength={500}
          goiY="Để trống — lấy theo tên tệp."
          value={ten}
          onChange={(e) => datTen(e.target.value)}
        />
        <OChon id="vbm-loai" nhan="Loại văn bản" value={loai} onChange={(e) => datLoai(e.target.value)}>
          {LOAI_VAN_BAN.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </OChon>
        <Nut type="submit" kieu="chinh" disabled={dangGui}>
          {dangGui ? 'Đang gửi…' : 'Gửi tóm tắt'}
        </Nut>
      </form>
    </The>
  )
}
