import {
  DANH_SACH_MODULE,
  kiemTraPhanCong,
  MA_VAI,
  tangCuaNhom,
  VAI,
  type MaVai,
  type PhanCong,
} from '@gdos/shared'
import { ODanhDau } from '@/ui/co-ban'

/** Phân hệ phân công được: chỉ Tầng 1 (Tầng 2 đi theo cờ quản trị — ADR-0006). */
const PHAN_HE = DANH_SACH_MODULE.filter((m) => tangCuaNhom(m.nhom) === 1)

/** Lỗi của cả bộ phân công — CÙNG hàm API dùng để từ chối. */
export const loiPhanCong = (ds: readonly PhanCong[]) =>
  ds.flatMap((pc) => kiemTraPhanCong(pc, DANH_SACH_MODULE))

/**
 * Soạn phân công: mỗi vai giao hay không, trên mọi phân hệ hay một số phân hệ.
 * Ô bị khóa khi luật không cho (vd Chuyên viên không vào Giám sát & Lưu vết).
 */
export function BoPhanCong({
  giaTri,
  doi,
  tienTo,
}: {
  giaTri: readonly PhanCong[]
  doi: (ds: PhanCong[]) => void
  /** Phân biệt id ô khi một trang có nhiều bộ. */
  tienTo: string
}) {
  const thay = (vai: MaVai, pc: PhanCong | null) => {
    const con = giaTri.filter((p) => p.vai !== vai)
    doi(
      pc
        ? MA_VAI.map((v) => (v === vai ? pc : con.find((p) => p.vai === v))).filter((p) => p !== undefined)
        : con,
    )
  }

  return (
    <div className="space-y-2.5">
      {MA_VAI.map((vai) => {
        const pc = giaTri.find((p) => p.vai === vai)
        const chonRieng = pc && pc.phamVi !== 'tat-ca' ? pc.phamVi : null
        const loi = pc ? kiemTraPhanCong(pc, DANH_SACH_MODULE) : []
        return (
          <fieldset key={vai} className="rounded-lg border border-line px-3 pt-2.5 pb-1">
            <legend className="sr-only">Vai {VAI[vai].ten}</legend>
            <ODanhDau
              id={`${tienTo}-${vai}`}
              nhan={<b>{VAI[vai].ten}</b>}
              mo={VAI[vai].mo}
              checked={!!pc}
              onChange={(e) => thay(vai, e.target.checked ? { vai, phamVi: 'tat-ca' } : null)}
            />
            {pc && (
              <div className="mb-1.5 ml-5.5">
                <div className="mb-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                  {(
                    [
                      ['tat-ca', 'Mọi phân hệ'],
                      ['chon', 'Chọn phân hệ'],
                    ] as const
                  ).map(([gt, nhan]) => (
                    <label key={gt} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name={`${tienTo}-${vai}-pv`}
                        className="accent-brand"
                        checked={gt === 'tat-ca' ? pc.phamVi === 'tat-ca' : pc.phamVi !== 'tat-ca'}
                        onChange={() => thay(vai, { vai, phamVi: gt === 'tat-ca' ? 'tat-ca' : [] })}
                      />
                      {nhan}
                    </label>
                  ))}
                </div>
                {chonRieng && (
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    {PHAN_HE.map((m) => {
                      const camGiamSat = m.nhom === 'giam-sat' && !VAI[vai].thayGiamSat
                      return (
                        <ODanhDau
                          key={m.id}
                          id={`${tienTo}-${vai}-${m.id}`}
                          nhan={m.nhan}
                          mo={camGiamSat ? `Vai ${VAI[vai].ten} không xem Giám sát & Lưu vết` : undefined}
                          disabled={camGiamSat}
                          checked={chonRieng.includes(m.id)}
                          onChange={(e) =>
                            thay(vai, {
                              vai,
                              phamVi: e.target.checked
                                ? [...chonRieng, m.id]
                                : chonRieng.filter((x) => x !== m.id),
                            })
                          }
                        />
                      )
                    })}
                  </div>
                )}
                {loi.map((l) => (
                  <p key={l} className="m-0 mb-1 text-[12px] text-danger">
                    {l}
                  </p>
                ))}
              </div>
            )}
          </fieldset>
        )
      })}
    </div>
  )
}

/** Tóm tắt phân công thành chữ ngắn cho bảng. */
export function tomTatPhanCong(pc: PhanCong): string {
  const pv =
    pc.phamVi === 'tat-ca'
      ? 'mọi phân hệ'
      : pc.phamVi.map((id) => DANH_SACH_MODULE.find((m) => m.id === id)?.nhan ?? id).join(', ')
  return `${VAI[pc.vai].ten} · ${pv}`
}
