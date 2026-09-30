/**
 * CÂY PHÂN HỆ 4 CẤP — ADR-0002. Dựng từ `locTheoQuyen()` trên ĐÚNG tập quyền
 * API trả về, nên người dùng chỉ thấy những gì API cho làm. Không có danh sách
 * menu viết tay nào ở đây.
 *
 *   Cấp 1 Tầng      — tiêu đề màu, đóng/mở được (nhớ theo máy)
 *   Cấp 2 Nhóm      — tiêu đề phân đoạn, LUÔN hiện, không đóng mở
 *   Cấp 3 Module    — biểu tượng + tên; chỉ MỘT module mở tại một lúc
 *   Cấp 4 Chức năng — thụt dưới module, có đường dẫn dọc; đang xem có vạch vàng
 *
 * Mỗi cấp một kiểu hiển thị riêng — nhìn là biết mẹ con, không phải đếm mũi tên.
 */
import { laPhac, type NhanhTang } from '@gdos/shared'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { docTam, ghiTam } from '@/lib/luu-tam'
import { BieuTuongNhom, MuiTen } from './bieu-tuong'

const KHOA_LUU = 'gdos-cay-tang-dong'

/** Nhãn cho màn phác — chữ rõ nghĩa, không cần chú thích riêng. */
const SapCo = () => (
  <span className="ml-auto flex-none rounded bg-line-2 px-1.5 py-px text-[10px] font-medium text-faint">
    sắp có
  </span>
)

/** Module chứa chức năng đang xem. */
function moduleCua(cay: NhanhTang[], id: string | undefined): string | undefined {
  if (!id) return undefined
  for (const t of cay)
    for (const n of t.nhom) for (const m of n.modules) if (m.con.some((c) => c.id === id)) return m.module.id
  return undefined
}

export function CayPhanHe({ cay, dangXem }: { cay: NhanhTang[]; dangXem: string | undefined }) {
  const di = useNavigate()
  // Tầng đang ĐÓNG (mặc định mở hết) — nhớ theo máy, không nhớ được thì thôi.
  const [tangDong, datTangDong] = useState<number[]>(() => docTam(KHOA_LUU, []))
  const [moModule, datMoModule] = useState<string | undefined>(() => moduleCua(cay, dangXem))

  // Đổi màn (link, tìm kiếm, gõ URL) → mở module chứa nó. Điều chỉnh lúc render —
  // cách React khuyên — nên người dùng vẫn tự thu gọn được module đang xem.
  const [dangXemTruoc, datDangXemTruoc] = useState(dangXem)
  if (dangXem !== dangXemTruoc) {
    datDangXemTruoc(dangXem)
    const m = moduleCua(cay, dangXem)
    if (m) datMoModule(m)
  }

  const doiTang = (so: number) => {
    const moi = tangDong.includes(so) ? tangDong.filter((x) => x !== so) : [...tangDong, so]
    datTangDong(moi)
    ghiTam(KHOA_LUU, moi)
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
      {cay.map((t) => {
        const mo1 = !tangDong.includes(t.so)
        return (
          <div key={t.so} className={t.so === 2 ? 'mt-4' : ''}>
            {/* Cấp 1 — Tầng */}
            <button
              type="button"
              onClick={() => doiTang(t.so)}
              aria-expanded={mo1}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] font-extrabold tracking-[.7px] uppercase hover:bg-nav-hover ${t.so === 2 ? 'text-tim' : 'text-vang'}`}
            >
              <span className="h-3.5 w-[3px] flex-none rounded-sm bg-current" />
              <span className="min-w-0 flex-1">
                Tầng {t.so} — {t.nhan}
              </span>
              <MuiTen mo={mo1} />
            </button>

            {mo1 &&
              t.nhom.map((n) => (
                <section key={n.ma} aria-label={n.nhan} className="mt-1.5">
                  {/* Cấp 2 — Nhóm: tiêu đề phân đoạn, không đóng mở */}
                  <h3
                    title={n.hoi}
                    className="m-0 flex items-center gap-2 px-2 pt-2 pb-1 text-[10px] font-bold tracking-[.8px] text-faint uppercase"
                  >
                    {n.nhan}
                    <span aria-hidden="true" className="h-px flex-1 bg-line-2" />
                  </h3>

                  {n.modules.map(({ module: m, con }) => {
                    const mo3 = moModule === m.id
                    const chua = con.some((c) => c.id === dangXem)
                    return (
                      <div key={m.id}>
                        {/* Cấp 3 — Module */}
                        <button
                          type="button"
                          title={m.mo}
                          aria-expanded={mo3}
                          onClick={() => {
                            // Đang mở → thu lại. Chưa mở → mở (module khác tự đóng), vào chức năng đầu nếu chưa ở trong.
                            if (mo3) return datMoModule(undefined)
                            datMoModule(m.id)
                            if (!chua) void di({ to: '/$chucNang', params: { chucNang: con[0]!.id } })
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[13px] ${mo3 || chua ? 'bg-nav-hover font-semibold text-ink' : 'text-body hover:bg-nav-hover'}`}
                        >
                          <span className={`w-4 flex-none ${m.phac ? 'opacity-50' : 'opacity-85'}`}>
                            <BieuTuongNhom nhom={n.ma} tang={t.so} />
                          </span>
                          <span className={`min-w-0 flex-1 ${m.phac ? 'text-faint' : ''}`}>{m.nhan}</span>
                          {m.phac && <SapCo />}
                          <MuiTen mo={mo3} />
                        </button>

                        {/* Cấp 4 — Chức năng */}
                        {mo3 && (
                          <div className="mt-0.5 mb-1.5 ml-[17px] border-l border-line pl-2">
                            {con.map((c) => {
                              const dang = c.id === dangXem
                              return (
                                <Link
                                  key={c.id}
                                  to="/$chucNang"
                                  params={{ chucNang: c.id }}
                                  aria-current={dang ? 'page' : undefined}
                                  className={`-ml-[9px] flex items-center gap-1.5 border-l-[3px] py-1.5 pr-2 pl-[14px] text-[12.5px] ${dang ? 'border-vang bg-tint-brand font-semibold text-brand' : 'border-transparent text-body hover:bg-nav-hover'} ${laPhac(m, c) && !dang ? 'text-faint' : ''}`}
                                >
                                  <span className="min-w-0 flex-1">{c.nhan}</span>
                                  {c.phac && !m.phac && <SapCo />}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              ))}
          </div>
        )
      })}
    </nav>
  )
}
