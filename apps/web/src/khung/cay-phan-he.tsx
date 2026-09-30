/**
 * CÂY PHÂN HỆ 4 CẤP — ADR-0002. Dựng từ `locTheoQuyen()` trên ĐÚNG tập quyền
 * API trả về, nên người dùng chỉ thấy những gì API cho làm. Không có danh sách
 * menu viết tay nào ở đây.
 *
 *   Cấp 1 Tầng → Cấp 2 Nhóm → Cấp 3 Module → Cấp 4 Chức năng (link)
 *
 * Mặc định mở cấp 1–2, đóng cấp 3 — trừ nhánh đang xem. Trạng thái đóng/mở nhớ
 * theo máy (localStorage), không nhớ được thì thôi.
 */
import type { NhanhTang } from '@gdos/shared'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { docTam, ghiTam } from '@/lib/luu-tam'
import { BieuTuongNhom, MuiTen } from './bieu-tuong'

const KHOA_LUU = 'gdos-cay-mo'

/** Khóa đóng/mở của tầng, nhóm, module chứa chức năng đang xem. */
function toTienCua(cay: NhanhTang[], id: string | undefined): string[] {
  if (!id) return []
  for (const t of cay)
    for (const n of t.nhom)
      for (const m of n.modules)
        if (m.con.some((c) => c.id === id)) return [`t:${t.so}`, `g:${n.ma}`, `m:${m.module.id}`]
  return []
}

export function CayPhanHe({ cay, dangXem }: { cay: NhanhTang[]; dangXem: string | undefined }) {
  const [mo, datMo] = useState<Record<string, boolean>>(() => docTam(KHOA_LUU, {}))
  const di = useNavigate()

  const dangMo = (k: string) => mo[k] ?? (k.startsWith('t:') || k.startsWith('g:'))
  const ghi = (moi: Record<string, boolean>) => {
    datMo(moi)
    ghiTam(KHOA_LUU, moi)
  }
  const doi = (k: string) => ghi({ ...mo, [k]: !dangMo(k) })

  // Vào một chức năng từ đâu cũng được (link, tìm kiếm, gõ URL) — nhánh chứa nó
  // phải mở. Chỉ làm khi ĐỔI màn (điều chỉnh lúc render — cách React khuyên), nên
  // người dùng vẫn tự thu gọn được nhánh đang xem. Không ghi localStorage: chỉ
  // nhớ lựa chọn của người dùng, không nhớ việc tự mở.
  const [dangXemTruoc, datDangXemTruoc] = useState<string>()
  if (dangXem !== dangXemTruoc) {
    datDangXemTruoc(dangXem)
    const can = toTienCua(cay, dangXem).filter((k) => !dangMo(k))
    if (can.length) datMo({ ...mo, ...Object.fromEntries(can.map((k) => [k, true])) })
  }

  const moHet = (moRa: boolean) => {
    const moi: Record<string, boolean> = {}
    for (const t of cay) {
      moi[`t:${t.so}`] = true // tầng luôn mở, để còn thấy khung
      for (const n of t.nhom) {
        moi[`g:${n.ma}`] = moRa
        for (const m of n.modules) moi[`m:${m.module.id}`] = moRa
      }
    }
    ghi(moi)
  }

  if (cay.length === 0) {
    return (
      <p className="px-3 py-4 text-[12px] leading-relaxed text-faint">
        Tài khoản chưa được phân công phân hệ nào. Liên hệ quản trị hệ thống.
      </p>
    )
  }

  return (
    <nav aria-label="Cây phân hệ">
      <div className="flex gap-1 px-0.5 pb-1.5">
        {(
          [
            [true, 'Mở rộng tất cả'],
            [false, 'Thu gọn tất cả'],
          ] as const
        ).map(([moRa, nhan]) => (
          <button
            key={nhan}
            type="button"
            onClick={() => moHet(moRa)}
            className="flex-1 rounded-md border border-line-2 px-1 py-1 text-[11px] text-faint hover:bg-nav-hover hover:text-body"
          >
            {nhan}
          </button>
        ))}
      </div>

      {cay.map((t) => {
        const k1 = `t:${t.so}`
        const mo1 = dangMo(k1)
        return (
          <div key={t.so} className={t.so === 2 ? 'mt-3 border-t border-line-2 pt-1' : ''}>
            <button
              type="button"
              onClick={() => doi(k1)}
              aria-expanded={mo1}
              className={`flex w-full items-center gap-1.5 px-1.5 pt-3 pb-0.5 text-left text-[10.5px] font-extrabold tracking-[.7px] uppercase ${t.so === 2 ? 'text-tim' : 'text-brand'}`}
            >
              <MuiTen mo={mo1} />
              <span className="h-3 w-[3px] flex-none rounded-sm bg-current" />
              Tầng {t.so} — {t.nhan}
            </button>
            {mo1 && (
              <>
                <p className="px-2 pb-1 pl-7 text-[10.5px] leading-snug text-faint italic">{t.hoi}</p>
                {t.nhom.map((n) => {
                  const k2 = `g:${n.ma}`
                  const mo2 = dangMo(k2)
                  return (
                    <div key={n.ma}>
                      <button
                        type="button"
                        onClick={() => doi(k2)}
                        aria-expanded={mo2}
                        title={n.hoi}
                        className="flex w-full items-center gap-1.5 px-1.5 pt-2 pb-0.5 pl-3 text-left text-[10.5px] font-bold tracking-[.5px] text-faint uppercase hover:text-body"
                      >
                        <MuiTen mo={mo2} />
                        {n.nhan}
                      </button>
                      {mo2 &&
                        n.modules.map(({ module: m, con }) => {
                          const k3 = `m:${m.id}`
                          const mo3 = dangMo(k3)
                          const chua = con.some((c) => c.id === dangXem)
                          return (
                            <div key={m.id}>
                              <button
                                type="button"
                                title={m.mo}
                                aria-expanded={mo3}
                                onClick={() => {
                                  // Bấm module: mở ra và vào chức năng đầu tiên; đang ở trong thì thu lại.
                                  if (mo3 && chua) return doi(k3)
                                  ghi({ ...mo, [k3]: true })
                                  if (!chua) void di({ to: '/$chucNang', params: { chucNang: con[0]!.id } })
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 pl-3 text-left text-[13px] hover:bg-nav-hover ${chua ? 'font-semibold text-ink' : 'text-body'}`}
                              >
                                <span className="w-4 flex-none opacity-85">
                                  <BieuTuongNhom nhom={n.ma} tang={t.so} />
                                </span>
                                <span className="min-w-0 flex-1">{m.nhan}</span>
                                <MuiTen mo={mo3} />
                              </button>
                              {mo3 && (
                                <div className="mt-px mb-1 ml-[27px] border-l border-line pl-1.5">
                                  {con.map((c) => (
                                    <Link
                                      key={c.id}
                                      to="/$chucNang"
                                      params={{ chucNang: c.id }}
                                      className={`block rounded-md px-2 py-1.5 text-[12.5px] ${c.id === dangXem ? 'bg-tint-brand font-semibold text-brand' : 'text-body hover:bg-nav-hover'}`}
                                    >
                                      {c.nhan}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
