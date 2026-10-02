/**
 * NÚT TRỢ LÝ AI nổi ở góc dưới phải của mọi trang — mở một ngăn trò chuyện với chatbot đã
 * cấu hình trên FOXAI Native mà không rời màn đang làm. Chỉ hiện với người có quyền xem
 * Trợ lý AI. Ngăn dùng lại đúng màn "Trò chuyện với Chatbot" ở dạng gọn; phần nặng (khung
 * chat) chỉ tải khi mở lần đầu.
 */
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import { docTam, ghiTam } from '@/lib/luu-tam'

const KHOA_BOT = 'gdos-tro-ly-bot'

const NganChat = lazy(async () => {
  const [{ BotChat }, { KHOA_TL, layChatbot, moTaLoi }] = await Promise.all([
    import('@/dieu-hanh/modules/tro-chuyen-chatbot/components/BotChat'),
    import('@/dieu-hanh/lib/api-tro-ly'),
  ])

  function Ngan({ dong, suaDuoc }: { dong: () => void; suaDuoc: boolean }) {
    const ds = useQuery({ queryKey: KHOA_TL.chatbot, queryFn: () => layChatbot() })
    // Cùng luật với màn Trò chuyện: chỉ bot đang bật VÀ trả lời được.
    const chay = (ds.data ?? []).filter((b) => b.active && b.answerable)
    const [nho, datNho] = useState(() => docTam<string>(KHOA_BOT, ''))
    const bot = chay.find((b) => b.id === nho) ?? chay[0]
    const chuaLienKet = ds.error ? /liên kết/i.test(moTaLoi(ds.error)) : false

    return (
      <>
        <header className="flex flex-none items-center gap-2 border-b border-line px-3 py-2">
          <span className="text-[13px] font-bold text-ink">Trợ lý AI</span>
          {chay.length > 1 && bot && (
            <select
              aria-label="Chọn chatbot"
              value={bot.id}
              onChange={(e) => {
                datNho(e.target.value)
                ghiTam(KHOA_BOT, e.target.value)
              }}
              className="min-w-0 flex-1 rounded-md border border-line bg-nen px-2 py-1 text-[12px] text-ink"
            >
              {chay.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <span className="flex-1" />
          {bot && (
            <Link
              to="/$chucNang"
              params={{ chucNang: 'tl-tro-chuyen' }}
              search={{ ma: bot.id }}
              onClick={dong}
              className="rounded-md px-2 py-1 text-[12px] font-semibold text-brand hover:bg-nen-2"
            >
              Mở rộng
            </Link>
          )}
          <button
            type="button"
            aria-label="Đóng trợ lý"
            onClick={dong}
            className="grid size-7 place-items-center rounded-md text-[16px] text-faint hover:bg-nen-2 hover:text-ink"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 p-2">
          {ds.isPending ? (
            <p className="p-4 text-[13px] text-faint">Đang tải…</p>
          ) : ds.error ? (
            <div className="grid gap-2 p-4 text-[13px] text-body">
              <p className="m-0">{moTaLoi(ds.error)}</p>
              {chuaLienKet ? (
                <Link to="/cai-dat" onClick={dong} className="font-semibold text-brand underline">
                  Mở Cài đặt cá nhân để liên kết FOXAI Native
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void ds.refetch()}
                  className="w-fit font-semibold text-brand underline"
                >
                  Thử lại
                </button>
              )}
            </div>
          ) : bot ? (
            <BotChat key={bot.id} id={bot.id} gon />
          ) : (
            <div className="grid gap-2 p-4 text-[13px] text-body">
              <p className="m-0">Chưa có chatbot nào đang bật và trả lời được.</p>
              {suaDuoc && (
                <Link
                  to="/$chucNang"
                  params={{ chucNang: 'tl-cau-hinh' }}
                  onClick={dong}
                  className="font-semibold text-brand underline"
                >
                  Mở Cấu hình Chatbot
                </Link>
              )}
            </div>
          )}
        </div>
      </>
    )
  }
  return { default: Ngan }
})

export function NutTroLy({ quyen, an }: { quyen: readonly string[]; an: boolean }) {
  const [mo, datMo] = useState(false)
  const duocXem = quyen.includes('TRO_LY.READ')

  useEffect(() => {
    if (!mo) return
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') datMo(false)
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [mo])

  // Đang ở chính màn Trò chuyện thì không cần nút — tránh hai khung chat chồng nhau.
  if (!duocXem || an) return null

  return (
    <>
      {mo && (
        <section
          aria-label="Trợ lý AI"
          className="fixed right-4 bottom-[76px] z-50 flex h-[min(640px,calc(100dvh-100px))] w-[min(460px,calc(100vw-24px))] flex-col overflow-hidden rounded-[14px] border border-line bg-nen shadow-[0_18px_50px_rgba(16,30,54,.28)] max-md:right-3"
        >
          <Suspense fallback={<p className="p-4 text-[13px] text-faint">Đang tải…</p>}>
            <NganChat dong={() => datMo(false)} suaDuoc={quyen.includes('TRO_LY.UPDATE')} />
          </Suspense>
        </section>
      )}
      <button
        type="button"
        aria-label={mo ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        aria-expanded={mo}
        title="Trợ lý AI"
        onClick={() => datMo((x) => !x)}
        className="fixed right-4 bottom-4 z-50 grid size-[52px] place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(16,30,54,.3)] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-md:right-3"
      >
        {mo ? (
          <span aria-hidden className="text-[22px] leading-none">
            ×
          </span>
        ) : (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v3M5 10a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-4l-4 3v-3a3 3 0 0 1-3-3z" />
            <path d="M9.5 12.5h.01M14.5 12.5h.01" />
          </svg>
        )}
      </button>
    </>
  )
}
