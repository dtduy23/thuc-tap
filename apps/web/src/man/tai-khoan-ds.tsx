import type { PhanCong, TaiKhoanDong } from '@gdos/shared'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { truyVanDanhMuc } from '@/lib/du-an'
import { lamMoiPhienNgay, LoiApi } from '@/lib/http'
import { ngay } from '@/lib/ngay'
import { KHOA_TOI, truyVanToi } from '@/lib/phien'
import {
  datGiamSat,
  datLaiMatKhau,
  datPhanCong,
  KHOA_TAI_KHOAN,
  khoaTaiKhoan,
  suaTaiKhoan,
  truyVanTaiKhoan,
} from '@/lib/quan-tri'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, ODanhDau, ONhap, The, ThongBao } from '@/ui/co-ban'
import { BoPhanCong, loiPhanCong, tomTatPhanCong } from './bo-phan-cong'
import { HopMatKhauTam } from './mat-khau-tam'

/** So khớp không dấu: gõ "hoa" tìm ra "Hòa". */
const boDau = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export function TrangThaiTaiKhoan({ tk }: { tk: TaiKhoanDong }) {
  return (
    <span className="flex flex-wrap gap-1">
      {tk.trangThai === 'khoa' ? <Chip mau="danger">Đã khóa</Chip> : <Chip mau="ok">Hoạt động</Chip>}
      {tk.khoaTamDen && <Chip mau="warn">Khóa tạm (nhập sai)</Chip>}
      {tk.phaiDoiMatKhau && <Chip mau="xam">Chờ đổi mật khẩu</Chip>}
    </span>
  )
}

/**
 * Danh sách tài khoản trong phạm vi + chi tiết để sửa, khóa, đặt lại mật khẩu, phân công.
 * `chiKhoa`: cấp 4 "Tài khoản bị khóa" — cùng màn, lọc sẵn (khóa hẳn hoặc khóa tạm).
 */
export default function TaiKhoanDs({ chiKhoa = false }: { chiKhoa?: boolean }) {
  const { data: tatCa } = useSuspenseQuery(truyVanTaiKhoan)
  const ds = chiKhoa ? tatCa.filter((x) => x.trangThai === 'khoa' || !!x.khoaTamDen) : tatCa
  const [tim, datTim] = useState('')
  const [chon, datChon] = useState<string>()

  const loc = useMemo(() => {
    const t = boDau(tim.trim())
    return t ? ds.filter((x) => boDau(`${x.tenDangNhap} ${x.hoTen} ${x.donViTen}`).includes(t)) : ds
  }, [ds, tim])
  const dangChon = ds.find((x) => x.id === chon)

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Tìm tài khoản"
          placeholder="Tìm theo tên, họ tên, đơn vị…"
          value={tim}
          onChange={(e) => datTim(e.target.value)}
          className="w-full max-w-[320px] rounded-lg border border-line bg-nen px-3 py-1.5 text-[13px]"
        />
        <span className="text-[12px] text-faint">
          {loc.length}/{ds.length} tài khoản
        </span>
      </div>

      {dangChon && <ChiTietTaiKhoan key={dangChon.id} tk={dangChon} dong={() => datChon(undefined)} />}

      <KhungBang nhan="Danh sách tài khoản">
        <thead>
          <tr>
            <th className={LOP_TH}>Tài khoản</th>
            <th className={LOP_TH}>Đơn vị</th>
            <th className={LOP_TH}>Phân công</th>
            <th className={LOP_TH}>Trạng thái</th>
            <th className={LOP_TH}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {loc.map((tk) => (
            <tr key={tk.id} className={tk.id === chon ? 'bg-tint-brand' : undefined}>
              <td className={LOP_TD}>
                <b className="text-ink">{tk.hoTen}</b>
                <span className="block text-[12px] text-faint">{tk.tenDangNhap}</span>
              </td>
              <td className={LOP_TD}>{tk.donViTen}</td>
              <td className={LOP_TD}>
                <span className="flex flex-wrap gap-1">
                  {tk.laQuanTri && <Chip mau="tim">Quản trị</Chip>}
                  {tk.phanCong.map((p) => (
                    <Chip key={p.vai} mau="brand">
                      {tomTatPhanCong(p)}
                    </Chip>
                  ))}
                  {tk.giamSatLinhVuc.map((l) => (
                    <Chip key={l.id} mau="xam">
                      Giám sát {l.ten}
                    </Chip>
                  ))}
                  {!tk.laQuanTri && tk.phanCong.length === 0 && (
                    <span className="text-faint">Chưa phân công</span>
                  )}
                </span>
              </td>
              <td className={LOP_TD}>
                <TrangThaiTaiKhoan tk={tk} />
              </td>
              <td className={`${LOP_TD} text-right`}>
                <Nut onClick={() => datChon(tk.id === chon ? undefined : tk.id)}>
                  {tk.id === chon ? 'Đóng' : 'Chi tiết'}
                </Nut>
              </td>
            </tr>
          ))}
          {loc.length === 0 && (
            <tr>
              <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                {chiKhoa ? 'Không có tài khoản nào đang bị khóa.' : 'Không có tài khoản nào khớp.'}
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>
    </>
  )
}

function ChiTietTaiKhoan({ tk, dong }: { tk: TaiKhoanDong; dong: () => void }) {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const laToi = tk.id === toi.id

  const [hoTen, datHoTen] = useState(tk.hoTen)
  const [nativeUserId, datNative] = useState(tk.nativeUserId ?? '')
  const [laQuanTri, datLaQuanTri] = useState(tk.laQuanTri)
  const [pc, datPc] = useState<PhanCong[]>(tk.phanCong)
  const [gs, datGs] = useState<string[]>(tk.giamSatLinhVuc.map((l) => l.id))
  const { data: linhVuc = [] } = useQuery(truyVanDanhMuc('linh-vuc'))
  const [thongBao, datThongBao] = useState<{ ok: boolean; cau: string }>()
  const [matKhauTam, datMatKhauTam] = useState<string>()

  /** Cập nhật dòng trong danh sách; đổi chính mình thì làm mới vé để menu theo kịp. */
  const xong = async (moi: TaiKhoanDong, cau: string) => {
    qc.setQueryData<TaiKhoanDong[]>(KHOA_TAI_KHOAN, (cu) => cu?.map((x) => (x.id === moi.id ? moi : x)))
    datThongBao({ ok: true, cau })
    if (laToi && (await lamMoiPhienNgay())) await qc.invalidateQueries({ queryKey: KHOA_TOI })
  }
  const loi = (e: unknown) =>
    datThongBao({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không thực hiện được. Thử lại.' })

  const luuThongTin = useMutation({
    mutationFn: () =>
      suaTaiKhoan(tk.id, { hoTen: hoTen.trim(), nativeUserId: nativeUserId.trim(), laQuanTri }),
    onSuccess: (moi) => xong(moi, 'Đã lưu thông tin tài khoản.'),
    onError: loi,
  })
  const luuPhanCong = useMutation({
    mutationFn: () => datPhanCong(tk.id, pc),
    onSuccess: (moi) => xong(moi, 'Đã lưu phân công. Người dùng thấy thay đổi trong tối đa 15 phút.'),
    onError: loi,
  })
  const luuGiamSat = useMutation({
    mutationFn: () => datGiamSat(tk.id, gs),
    onSuccess: (moi) => xong(moi, 'Đã lưu lĩnh vực giám sát.'),
    onError: loi,
  })
  const dangKhoa = tk.trangThai === 'khoa' || !!tk.khoaTamDen
  const doiKhoa = useMutation({
    mutationFn: () => khoaTaiKhoan(tk.id, !dangKhoa),
    onSuccess: (moi) =>
      xong(moi, moi.trangThai === 'khoa' ? 'Đã khóa và đăng xuất mọi phiên của tài khoản.' : 'Đã mở khóa.'),
    onError: loi,
  })
  const datLai = useMutation({
    mutationFn: () => datLaiMatKhau(tk.id),
    onSuccess: async (kq) => {
      datMatKhauTam(kq.matKhauTam)
      await xong(kq.taiKhoan, 'Đã cấp mật khẩu tạm mới; mọi phiên cũ đã bị đăng xuất.')
    },
    onError: loi,
  })

  const loiPc = loiPhanCong(pc)
  const guiThongTin = (e: FormEvent) => {
    e.preventDefault()
    luuThongTin.mutate()
  }

  return (
    <The tieuDe={`${tk.hoTen} · ${tk.tenDangNhap}`} phu={`${tk.donViTen} · tạo ngày ${ngay(tk.taoLuc)}`}>
      {thongBao && <ThongBao kieu={thongBao.ok ? 'ok' : 'loi'}>{thongBao.cau}</ThongBao>}
      {matKhauTam && <HopMatKhauTam ten={tk.tenDangNhap} matKhau={matKhauTam} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={guiThongTin}>
          <h3 className="mt-0 mb-2 text-[13px] font-semibold">Thông tin</h3>
          <ONhap
            id="tk-ho-ten"
            nhan="Họ tên"
            required
            maxLength={150}
            value={hoTen}
            onChange={(e) => datHoTen(e.target.value)}
          />
          <ONhap
            id="tk-native"
            nhan="Mã tài khoản FOXAI Native"
            goiY="Để trống nếu người này chưa dùng tính năng gọi Native."
            maxLength={100}
            value={nativeUserId}
            onChange={(e) => datNative(e.target.value)}
          />
          <ODanhDau
            id="tk-quan-tri"
            nhan="Cờ quản trị hệ thống"
            mo={
              laToi
                ? 'Không tự bỏ được cờ của chính mình — nhờ quản trị viên khác.'
                : 'Vào được Tầng 2: tài khoản, đơn vị, phân quyền. Không tự động đọc hồ sơ nghiệp vụ.'
            }
            disabled={laToi}
            checked={laQuanTri}
            onChange={(e) => datLaQuanTri(e.target.checked)}
          />
          <Nut type="submit" kieu="chinh" disabled={luuThongTin.isPending} className="mt-1">
            {luuThongTin.isPending ? 'Đang lưu…' : 'Lưu thông tin'}
          </Nut>

          <h3 className="mt-5 mb-2 text-[13px] font-semibold">Bảo mật</h3>
          <div className="mb-2">
            <TrangThaiTaiKhoan tk={tk} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Nut
              kieu={dangKhoa ? 'phu' : 'nguy-hiem'}
              disabled={laToi || doiKhoa.isPending}
              title={laToi ? 'Không tự khóa tài khoản của chính mình' : undefined}
              onClick={() => {
                if (dangKhoa || confirm(`Khóa tài khoản ${tk.tenDangNhap}? Người này bị đăng xuất ngay.`))
                  doiKhoa.mutate()
              }}
            >
              {dangKhoa ? 'Mở khóa' : 'Khóa tài khoản'}
            </Nut>
            <Nut
              disabled={laToi || datLai.isPending}
              title={laToi ? 'Tài khoản của mình thì dùng “Đổi mật khẩu”' : undefined}
              onClick={() => {
                if (confirm(`Cấp mật khẩu tạm mới cho ${tk.tenDangNhap}? Mật khẩu hiện tại hết dùng được.`))
                  datLai.mutate()
              }}
            >
              Đặt lại mật khẩu
            </Nut>
          </div>
        </form>

        <div>
          <h3 className="mt-0 mb-2 text-[13px] font-semibold">Phân công</h3>
          <BoPhanCong tienTo={`pc-${tk.id}`} giaTri={pc} doi={datPc} />
          <div className="mt-3 flex gap-2">
            <Nut
              kieu="chinh"
              disabled={loiPc.length > 0 || luuPhanCong.isPending}
              onClick={() => luuPhanCong.mutate()}
            >
              {luuPhanCong.isPending ? 'Đang lưu…' : 'Lưu phân công'}
            </Nut>
            <Nut onClick={dong}>Đóng</Nut>
          </div>

          <h3 className="mt-5 mb-1 text-[13px] font-semibold">Giám sát theo lĩnh vực</h3>
          <p className="mt-0 mb-2 text-[12px] text-faint">
            Xem (không sửa) mọi dự án thuộc lĩnh vực đã chọn ở mọi đơn vị — vd Sở chuyên ngành theo dõi dự án
            của các xã.
          </p>
          {linhVuc.map((l) => (
            <ODanhDau
              key={l.id}
              id={`gs-${tk.id}-${l.id}`}
              nhan={l.ten}
              checked={gs.includes(l.id)}
              onChange={(e) => datGs((c) => (e.target.checked ? [...c, l.id] : c.filter((x) => x !== l.id)))}
            />
          ))}
          <Nut disabled={luuGiamSat.isPending} onClick={() => luuGiamSat.mutate()}>
            {luuGiamSat.isPending ? 'Đang lưu…' : 'Lưu lĩnh vực giám sát'}
          </Nut>
        </div>
      </div>
    </The>
  )
}
