import {
  DANH_SACH_MODULE,
  KHOA_TRANG_DAU,
  NHOM,
  VAI,
  VAI_TRANG_DAU,
  quyenCua,
  tinhQuyen,
  type KhoaTrangDau,
  type TrangDau,
} from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { MAN_HINH } from '@/app/man-hinh'
import { KHOA_CAU_HINH, KHOA_CONG_KHAI, luuTrangDau, truyVanCauHinh } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { Nut, The, ThongBao } from '@/ui/co-ban'
import { ChiXem } from './cau-hinh-bao-mat'

/** Quyền rộng nhất của mỗi nhóm — để chỉ liệt kê chức năng mà vai đó MỞ ĐƯỢC. */
const QUYEN_CUA: Record<KhoaTrangDau, ReadonlySet<string>> = {
  LANH_DAO: tinhQuyen(DANH_SACH_MODULE, [{ vai: 'LANH_DAO', phamVi: 'tat-ca' }], false),
  CHUYEN_VIEN: tinhQuyen(DANH_SACH_MODULE, [{ vai: 'CHUYEN_VIEN', phamVi: 'tat-ca' }], false),
  THANH_TRA: tinhQuyen(DANH_SACH_MODULE, [{ vai: 'THANH_TRA', phamVi: 'tat-ca' }], false),
  QUAN_TRI: tinhQuyen(DANH_SACH_MODULE, [], true),
}

/** Chức năng chọn được làm trang đầu của một vai: đã xây màn và vai đó có quyền mở. */
function luaChonCua(k: KhoaTrangDau) {
  return NHOM.map((n) => ({
    nhom: n.nhan,
    muc: DANH_SACH_MODULE.filter((m) => m.nhom === n.ma).flatMap((m) =>
      m.con
        .filter((c) => MAN_HINH[c.id] && QUYEN_CUA[k].has(quyenCua(m, c)))
        .map((c) => ({ id: c.id, nhan: `${m.nhan} › ${c.nhan}` })),
    ),
  })).filter((g) => g.muc.length > 0)
}

/**
 * Hiển thị › Trang mặc định theo vai — trang mở ra ngay sau khi đăng nhập. Để trống là trang
 * chủ ("Việc của tôi"). Người giữ nhiều vai: lãnh đạo → chuyên viên → thanh tra → quản trị.
 */
export default function CauHinhTrangDau() {
  const qc = useQueryClient()
  const { data: ch } = useSuspenseQuery(truyVanCauHinh)
  const [gt, datGt] = useState<TrangDau>(ch.trangDau)
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()

  const luu = useMutation({
    mutationFn: () => luuTrangDau(gt),
    onSuccess: async (moi) => {
      qc.setQueryData(KHOA_CAU_HINH, moi)
      await qc.invalidateQueries({ queryKey: KHOA_CONG_KHAI })
      datKq({ ok: true, cau: 'Đã lưu. Áp dụng từ lần đăng nhập tiếp theo.' })
    },
    onError: (e) => datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không lưu được.' }),
  })

  const gui = (e: FormEvent) => {
    e.preventDefault()
    luu.mutate()
  }

  return (
    <div className="max-w-[760px]">
      <ChiXem ch={ch} />
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <form onSubmit={gui}>
        <The tieuDe="Trang mở ra sau khi đăng nhập" phu="Để trống = trang chủ">
          {KHOA_TRANG_DAU.map((k) => (
            <div key={k} className="mb-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-[220px_1fr] sm:items-start">
              <label htmlFor={`td-${k}`} className="text-[13px]">
                <b className="block text-ink">{VAI_TRANG_DAU[k]}</b>
                {k !== 'QUAN_TRI' && <span className="block text-[11.5px] text-faint">{VAI[k].mo}</span>}
              </label>
              <select
                id={`td-${k}`}
                value={gt[k]}
                disabled={!ch.coTheSua}
                onChange={(e) => datGt((c) => ({ ...c, [k]: e.target.value }))}
                className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink disabled:opacity-60"
              >
                <option value="">Trang chủ — Việc của tôi</option>
                {luaChonCua(k).map((g) => (
                  <optgroup key={g.nhom} label={g.nhom}>
                    {g.muc.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nhan}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
          <p className="m-0 text-[12px] text-faint">
            Chỉ liệt kê chức năng đã xây mà vai đó mở được. Người giữ nhiều vai dùng trang của vai đứng trước
            trong danh sách này; không có quyền mở trang đã đặt (do phạm vi phân công hẹp hơn) thì về trang
            chủ. Mở hệ thống bằng một đường dẫn cụ thể thì vẫn tới đúng đường dẫn đó.
          </p>
        </The>
        {ch.coTheSua && (
          <Nut type="submit" kieu="chinh" disabled={luu.isPending}>
            {luu.isPending ? 'Đang lưu…' : 'Lưu trang mặc định'}
          </Nut>
        )}
      </form>
    </div>
  )
}
