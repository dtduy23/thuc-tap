/**
 * CÂY PHÂN HỆ 4 CẤP — ADR-0002. Dựng từ `locTheoQuyen()` trên ĐÚNG tập quyền
 * API trả về, nên người dùng chỉ thấy những gì API cho làm. Không có danh sách
 * menu viết tay nào ở đây.
 *
 *   Cấp 1 Tầng      — tiêu đề màu, thu gọn được
 *   Cấp 2 Nhóm      — tiêu đề nhỏ chữ nhạt (như PMS), thu gọn được
 *   Cấp 3 Module    — mục menu kiểu PMS; chỉ MỘT module mở tại một lúc
 *   Cấp 4 Chức năng — thụt dưới module, có đường dẫn dọc
 *
 * Tầng, nhóm đang ĐÓNG nhớ theo máy. Vào một trang thì nhánh chứa nó tự mở.
 * Không hiện mã, số cấp hay ghi chú thiết kế — người dùng chỉ thấy tên nghiệp vụ.
 */
import { laPhac, type NhanhTang } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { docTam, ghiTam } from '@/lib/luu-tam'
import { truyVanToi } from '@/lib/phien'
import { truyVanCanhBao } from '@/lib/xuyen-suot'
import { BieuTuongNhom, MuiTen } from './bieu-tuong'

const KHOA_LUU = 'gdos-cay-dong'

const SapCo = () => (
  <span className="ml-auto flex-none rounded bg-line-2 px-1.5 py-px text-[10px] font-medium text-faint">
    sắp có
  </span>
)

/** Tầng, nhóm, module chứa chức năng đang xem. */
function nhanhCua(cay: NhanhTang[], id: string | undefined) {
  if (!id) return undefined
  for (const t of cay)
    for (const n of t.nhom)
      for (const m of n.modules)
        if (m.con.some((c) => c.id === id))
          return { tang: `t:${t.so}`, nhom: `g:${n.ma}`, module: m.module.id }
  return undefined
}

/** Số việc quá hạn — hiện thành số đỏ cạnh "Hồ sơ quá hạn", như PMS. */
function useSoQuaHan(): number {
  const { data: toi } = useQuery(truyVanToi)
  const { data } = useQuery({
    ...truyVanCanhBao('qua-han'),
    enabled: !!toi?.quyen.includes('QUA_HAN.READ'),
    staleTime: 60_000,
  })
  return data?.length ?? 0
}

export function CayPhanHe({ cay, dangXem }: { cay: NhanhTang[]; dangXem: string | undefined }) {
  const di = useNavigate()
  const soQuaHan = useSoQuaHan()
  const [dong, datDong] = useState<string[]>(() => docTam(KHOA_LUU, []))
  const [moModule, datMoModule] = useState<string | undefined>(() => nhanhCua(cay, dangXem)?.module)

  // Đổi màn (link, tìm kiếm, gõ URL) → mở nhánh chứa nó. Điều chỉnh lúc render —
  // cách React khuyên — nên người dùng vẫn tự thu gọn được sau đó.
  const [dangXemTruoc, datDangXemTruoc] = useState(dangXem)
  if (dangXem !== dangXemTruoc) {
    datDangXemTruoc(dangXem)
    const nh = nhanhCua(cay, dangXem)
    if (nh) {
      datMoModule(nh.module)
      if (dong.includes(nh.tang) || dong.includes(nh.nhom))
        datDong(dong.filter((k) => k !== nh.tang && k !== nh.nhom))
    }
  }

  const doi = (k: string) => {
    const moi = dong.includes(k) ? dong.filter((x) => x !== k) : [...dong, k]
    datDong(moi)
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
    <nav aria-label="Menu chức năng">
      {cay.map((t) => {
        const k1 = `t:${t.so}`
        const mo1 = !dong.includes(k1)
        return (
          <div key={t.so} className={t.so === 2 ? 'mt-3 border-t border-line-2 pt-2' : ''}>
            {/* Cấp 1 — Tầng */}
            <button
              type="button"
              onClick={() => doi(k1)}
              aria-expanded={mo1}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11.5px] font-extrabold tracking-[.1em] uppercase hover:bg-nav-hover ${t.so === 2 ? 'text-tim' : 'text-vang'}`}
            >
              <span className="min-w-0 flex-1">{t.nhan}</span>
              <MuiTen mo={mo1} />
            </button>

            {mo1 &&
              t.nhom.map((n) => {
                const k2 = `g:${n.ma}`
                const mo2 = !dong.includes(k2)
                return (
                  <section key={n.ma} aria-label={n.nhan} className="ml-3">
                    {/* Cấp 2 — Nhóm */}
                    <button
                      type="button"
                      onClick={() => doi(k2)}
                      aria-expanded={mo2}
                      className="mt-2.5 flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-left text-[10.5px] font-bold tracking-[.12em] text-ink uppercase hover:bg-nav-hover"
                    >
                      <span className="min-w-0 flex-1">{n.nhan}</span>
                      <MuiTen mo={mo2} />
                    </button>

                    {mo2 &&
                      n.modules.map(({ module: m, con }) => {
                        const mo3 = moModule === m.id
                        const chua = con.some((c) => c.id === dangXem)
                        const dem = m.id === 'qua-han' ? soQuaHan : 0
                        return (
                          <div key={m.id}>
                            {/* Cấp 3 — Module: kiểu mục menu PMS */}
                            <button
                              type="button"
                              aria-expanded={mo3}
                              onClick={() => {
                                if (mo3) return datMoModule(undefined)
                                datMoModule(m.id)
                                if (!chua)
                                  void di({
                                    to: '/$chucNang',
                                    params: { chucNang: (con.find((c) => !laPhac(m, c)) ?? con[0]!).id },
                                  })
                              }}
                              className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-left text-[13px] ${chua ? 'border-vang bg-tint-brand font-semibold text-ink' : `border-transparent font-medium hover:bg-nav-hover hover:text-ink ${mo3 ? 'text-ink' : 'text-body'}`}`}
                            >
                              <span className={`w-4 flex-none ${m.phac ? 'opacity-50' : 'opacity-90'}`}>
                                <BieuTuongNhom nhom={n.ma} tang={t.so} />
                              </span>
                              <span className={`min-w-0 flex-1 ${m.phac ? 'text-faint' : ''}`}>{m.nhan}</span>
                              {m.phac && <SapCo />}
                              {dem > 0 && (
                                <span className="flex-none rounded-full bg-danger px-1.5 text-[10px] leading-4 font-bold text-white">
                                  {dem > 99 ? '99+' : dem}
                                </span>
                              )}
                              <MuiTen mo={mo3} />
                            </button>

                            {/* Cấp 4 — Chức năng */}
                            {mo3 && (
                              <div className="mt-0.5 mb-2 ml-[19px] border-l border-line pl-1.5">
                                {con.map((c) => {
                                  const dang = c.id === dangXem
                                  return (
                                    <Link
                                      key={c.id}
                                      to="/$chucNang"
                                      params={{ chucNang: c.id }}
                                      aria-current={dang ? 'page' : undefined}
                                      className={`flex items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px] ${dang ? 'font-semibold text-vang' : 'text-faint hover:bg-nav-hover hover:text-ink'}`}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`size-[5px] flex-none rounded-full bg-current ${dang ? '' : 'opacity-60'}`}
                                      />
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
                )
              })}
          </div>
        )
      })}
    </nav>
  )
}
