/**
 * MỘT MỤC MENU, NHIỀU GÓC NHÌN. Điều hành sắp theo câu hỏi của người điều hành, mỗi chủ đề
 * một chỗ trên menu; các góc nhìn của cùng chủ đề (chỉ tiêu · chi tiết · chấm điểm…) là các
 * THẺ TRONG TRANG, không lên menu. Thẻ đang xem nhớ theo máy.
 */
import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { docTam, ghiTam } from '@/lib/luu-tam'

export interface PhanMan {
  id: string
  nhan: string
  Man: LazyExoticComponent<ComponentType>
}

export function gopMan(
  ma: string,
  phan: readonly [PhanMan, PhanMan, ...PhanMan[]],
): LazyExoticComponent<ComponentType> {
  const khoa = `gdos-phan-${ma}`
  function ManGop() {
    const [dang, datDang] = useState<string>(() => docTam<string>(khoa, phan[0].id))
    const hash = useLocation({ select: (l) => l.hash })
    const chuyen = useNavigate()
    const tuLienKet = phan.find((x) => x.id === hash)
    const p = tuLienKet ?? phan.find((x) => x.id === dang) ?? phan[0]
    const Man = p.Man
    return (
      <>
        <div
          role="tablist"
          aria-label="Góc nhìn"
          className="mb-4 flex flex-wrap gap-1 rounded-[10px] bg-nen-2 p-1"
        >
          {phan.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === p.id}
              onClick={() => {
                datDang(x.id)
                ghiTam(khoa, x.id)
                if (tuLienKet) void chuyen({ hash: x.id, replace: true, resetScroll: false })
              }}
              className={`rounded-[7px] px-3.5 py-1.5 text-[13px] font-semibold ${
                x.id === p.id
                  ? 'bg-nen text-brand shadow-[0_1px_3px_rgba(16,30,54,.12)]'
                  : 'text-faint hover:text-ink'
              }`}
            >
              {x.nhan}
            </button>
          ))}
        </div>
        <Suspense fallback={<p className="text-faint">Đang tải…</p>}>
          <Man />
        </Suspense>
      </>
    )
  }
  return lazy(() => Promise.resolve({ default: ManGop }))
}
