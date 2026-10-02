/** Mảnh dùng chung của màn Nhiệm vụ — ảnh đại diện, nhãn trạng thái, hạn, ô tìm người. */
import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  NHAN_TRANG_THAI,
  NHAN_VAI_TRO,
  SAC_THAI,
  TRANG_THAI_NV,
  VAI_TRO,
  chuDau,
  ngayVN,
  thanhNguoiThamGia,
  thongTinHan,
  trangThaiHien,
  truyVanNguoiDanhBa,
  type DonViDanhBa,
  type LocTrangThai,
  type NguoiDanhBa,
  type NguoiThamGiaNhap,
  type NutNhiemVu,
  type TrangThaiNV,
  type VaiTroThamGia,
} from '@/lib/nhiem-vu'
import { NutNoiLen } from '@/ui/noi-len'
import { BieuTuong, LOP_O_NHO } from '../van-ban/chung'

const NEN_AVATAR = ['bg-brand', 'bg-ok', 'bg-tim', 'bg-warn', 'bg-danger']

/** Chữ cái đầu trên nền màu băm theo tên — cùng một người luôn cùng màu. */
export function AnhDaiDien({ ten, nho }: { ten: string; nho?: boolean }) {
  let h = 0
  for (const ch of ten) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <span
      title={ten}
      className={`inline-flex flex-none items-center justify-center rounded-full border-2 border-nen leading-none font-bold text-nen ${NEN_AVATAR[h % NEN_AVATAR.length]} ${nho ? 'size-6 text-[9px]' : 'size-7 text-[10px]'}`}
    >
      {chuDau(ten)}
    </span>
  )
}

export const NhanTrangThai = ({ tt, nho }: { tt: LocTrangThai; nho?: boolean }) => (
  <span
    className={`inline-flex rounded-md px-2 py-0.5 font-bold whitespace-nowrap ${nho ? 'text-[10.5px]' : 'text-[11.5px]'} ${SAC_THAI[tt].nhan}`}
  >
    {NHAN_TRANG_THAI[tt]}
  </span>
)

export function HanXuLy({ nut }: { nut: Pick<NutNhiemVu, 'deadline' | 'status'> }) {
  const { loai, ngay } = thongTinHan(nut)
  const ngayHan = ngayVN(nut.deadline)
  const chu = {
    khong: 'Không hạn',
    qua: `Quá ${ngay} ngày`,
    'hom-nay': 'Hạn hôm nay',
    sap: `Còn ${ngay} ngày`,
    con: `Còn ${ngay} ngày`,
    xong: `Hạn ${ngayHan}`,
  }[loai]
  const lop = {
    qua: 'bg-tint-danger px-1.5 py-0.5 text-danger',
    'hom-nay': 'bg-tint-danger px-1.5 py-0.5 text-danger',
    sap: 'bg-tint-warn px-1.5 py-0.5 text-warn',
    con: 'text-body',
    xong: 'text-faint',
    khong: 'text-faint',
  }[loai]
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center gap-1 rounded-md text-[11.5px] font-semibold ${lop}`}>
        {(loai === 'qua' || loai === 'hom-nay' || loai === 'sap') && <BieuTuong ten="cho" co={12} />}
        {chu}
      </span>
      {loai !== 'khong' && loai !== 'xong' && (
        <span className="text-[11px] text-faint tabular-nums">{ngayHan}</span>
      )}
    </span>
  )
}

export const TieuDeMuc = ({ children }: { children: ReactNode }) => (
  <h3 className="m-0 mb-2 text-[11px] font-bold tracking-[.08em] text-faint uppercase">{children}</h3>
)

export const LOP_KHUNG =
  'rounded-[12px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)]'

/** Nhãn trạng thái bấm được — đổi trạng thái ngay tại dòng. */
export function MenuTrangThai({
  nut,
  doi,
  khoa,
}: {
  nut: NutNhiemVu
  doi: (n: NutNhiemVu, tt: TrangThaiNV) => void
  khoa?: boolean
}) {
  const hien = trangThaiHien(nut)
  const conDo = nut.child_total - nut.child_done
  if (khoa) return <NhanTrangThai tt={hien} />
  return (
    <NutNoiLen
      tieuDe={`Đổi trạng thái: ${NHAN_TRANG_THAI[hien]}`}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-bold ${SAC_THAI[hien].nhan}`}
      nhan={
        <>
          {NHAN_TRANG_THAI[hien]} <span aria-hidden="true">▾</span>
        </>
      }
    >
      {(dong) => (
        <ul className="m-0 min-w-[190px] list-none p-0">
          {TRANG_THAI_NV.map((s) => {
            // Việc cha chỉ hoàn thành được khi mọi việc con đã xong — Native cũng chặn.
            const chan = s === nut.status || (s === 'HOAN_THANH' && conDo > 0)
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={chan}
                  onClick={() => {
                    dong()
                    doi(nut, s)
                  }}
                  className="w-full rounded-md px-2.5 py-1.5 text-left hover:bg-nav-hover disabled:opacity-45"
                >
                  {s === 'HOAN_THANH' && conDo > 0
                    ? `Hoàn thành (còn ${conDo} việc con)`
                    : NHAN_TRANG_THAI[s]}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </NutNoiLen>
  )
}

/* ── Chọn người ───────────────────────────────────────────────────────────── */

/** Gõ tên / email → danh bạ Native trả kết quả; chọn xong tự xóa ô để chọn tiếp. */
export function OTimNguoi({
  boQua,
  chon,
  loi,
}: {
  boQua: readonly string[]
  chon: (u: NguoiDanhBa) => void
  loi?: boolean
}) {
  const [nhap, datNhap] = useState('')
  const [tuKhoa, datTuKhoa] = useState('')
  const [mo, datMo] = useState(false)
  const [dangTro, datDangTro] = useState(0)
  const idDs = useId()

  useEffect(() => {
    const t = setTimeout(() => datTuKhoa(nhap.trim()), 300)
    return () => clearTimeout(t)
  }, [nhap])

  const q = useQuery({ ...truyVanNguoiDanhBa(tuKhoa), enabled: mo })
  const ds = (q.data ?? []).filter((u) => !boQua.includes(u.id))
  const lay = (u: NguoiDanhBa) => {
    chon(u)
    datNhap('')
    datDangTro(0)
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={mo}
        aria-controls={idDs}
        aria-autocomplete="list"
        aria-invalid={loi || undefined}
        aria-label="Tìm người theo tên hoặc email"
        value={nhap}
        placeholder="Tìm người theo tên hoặc email…"
        onChange={(e) => {
          datNhap(e.target.value)
          datMo(true)
          datDangTro(0)
        }}
        onFocus={() => datMo(true)}
        // Trễ một nhịp để cú bấm vào dòng kết quả kịp chạy trước khi danh sách đóng.
        onBlur={() => setTimeout(() => datMo(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            datDangTro((i) => Math.min(i + 1, ds.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            datDangTro((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && mo && ds[dangTro]) {
            e.preventDefault()
            lay(ds[dangTro])
          } else if (e.key === 'Escape') datMo(false)
        }}
        className={`${LOP_O_NHO} ${loi ? 'border-danger' : ''}`}
      />
      {mo && (
        <ul
          id={idDs}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 m-0 mt-1 max-h-60 list-none overflow-y-auto rounded-[10px] border border-line bg-nen p-1 shadow-[0_14px_38px_rgba(10,22,44,.18)]"
        >
          {q.isFetching && ds.length === 0 ? (
            <li className="px-3 py-2 text-[12.5px] text-faint">Đang tìm…</li>
          ) : q.error ? (
            <li className="px-3 py-2 text-[12.5px] text-danger">Không tra được danh bạ FOXAI Native.</li>
          ) : ds.length === 0 ? (
            <li className="px-3 py-2 text-[12.5px] text-faint">Không tìm thấy người dùng</li>
          ) : (
            ds.map((u, i) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- phím (↑ ↓ Enter) xử lý ở ô nhập, theo mẫu combobox
              <li
                key={u.id}
                role="option"
                aria-selected={i === dangTro}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => lay(u)}
                onMouseEnter={() => datDangTro(i)}
                className={`cursor-pointer truncate rounded-md px-3 py-2 text-[13px] text-ink ${i === dangTro ? 'bg-nav-hover' : ''}`}
              >
                {u.fullName} · <span className="text-faint">{u.email}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export const ChonVaiTro = ({
  giaTri,
  doi,
  chi,
}: {
  giaTri: VaiTroThamGia
  doi: (v: VaiTroThamGia) => void
  chi?: readonly VaiTroThamGia[]
}) => (
  <select
    aria-label="Vai trò"
    value={giaTri}
    onChange={(e) => doi(e.target.value as VaiTroThamGia)}
    className="rounded-lg border border-line bg-nen-2 px-2 py-1.5 text-[12.5px] text-ink"
  >
    {(chi ?? VAI_TRO).map((r) => (
      <option key={r} value={r}>
        {NHAN_VAI_TRO[r]}
      </option>
    ))}
  </select>
)

/** Danh sách người thực hiện của một việc: tìm thêm, đổi vai, bỏ. */
export function ChonNguoiThamGia({
  giaTri,
  doi,
  donVi,
  loi,
}: {
  giaTri: NguoiThamGiaNhap[]
  doi: (ds: NguoiThamGiaNhap[]) => void
  donVi: readonly DonViDanhBa[]
  loi?: boolean
}) {
  return (
    <div className="grid gap-2">
      <OTimNguoi
        loi={loi}
        boQua={giaTri.map((p) => p.user_id)}
        chon={(u) =>
          // Người đầu tiên mặc định chủ trì; những người sau mặc định phối hợp.
          doi([
            ...giaTri,
            thanhNguoiThamGia(u, donVi, giaTri.some((p) => p.role === 'CHU_TRI') ? 'PHOI_HOP' : 'CHU_TRI'),
          ])
        }
      />
      {giaTri.length === 0 ? (
        <p className="m-0 text-[12px] text-faint">Chưa chọn người thực hiện</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-line-2 rounded-[10px] border border-line p-0">
          {giaTri.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2 px-3 py-2">
              <AnhDaiDien ten={p.user_name} />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[13px] text-ink">{p.user_name}</p>
                <p className="m-0 truncate text-[11.5px] text-faint">
                  {[p.org_name, p.user_email].filter(Boolean).join(' · ')}
                </p>
              </div>
              <ChonVaiTro
                giaTri={p.role}
                doi={(v) => doi(giaTri.map((x) => (x.user_id === p.user_id ? { ...x, role: v } : x)))}
              />
              <button
                type="button"
                aria-label={`Bỏ ${p.user_name}`}
                onClick={() => doi(giaTri.filter((x) => x.user_id !== p.user_id))}
                className="grid size-7 place-items-center rounded-md text-faint hover:bg-nav-hover hover:text-danger"
              >
                <BieuTuong ten="dong" co={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
