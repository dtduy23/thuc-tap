import { useQuery } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { Bot, MessageSquare } from 'lucide-react'
import { KHOA_TL, layChatbot, moTaLoi } from '@/dieu-hanh/lib/api-tro-ly'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { ErrorState, ModuleSkeleton } from '@/dieu-hanh/components/ui/StateViews'
import { BotChat } from './components/BotChat'

/**
 * Trò chuyện với Chatbot — port `/tro-ly-ai/chatbot/[id]` của FOXAINATIVE.
 *
 * Bản gốc liệt kê bot ngay trong thanh bên; sidebar GDOS sinh từ registry và chỉ
 * một cấp, nên mục này mở danh sách bot trước, bot đang mở nằm ở `?ma=`.
 */
export default function TroChuyenChatbot() {
  const { ma } = useSearch({ strict: false })
  return ma ? <BotChat key={ma} id={ma} /> : <DanhSachBot />
}

function DanhSachBot() {
  const ds = useQuery({ queryKey: KHOA_TL.chatbot, queryFn: () => layChatbot() })
  // Cùng luật với thanh bên của bản gốc: chỉ bot đang bật VÀ trả lời được.
  const chay = (ds.data ?? []).filter((b) => b.active && b.answerable)

  return (
    <>
      <PageHeader
        crumb="Trợ lý AI · Trò chuyện với Chatbot"
        tieuDe="Trò chuyện với Chatbot"
        moTa="Trò chuyện với chatbot đã được cấu hình ngữ cảnh và bộ canh cổng."
        gocKey="trochuyen"
        mau="#4A48C4"
      />
      {ds.error ? (
        <ErrorState loi={new Error(moTaLoi(ds.error))} thuLai={() => void ds.refetch()} />
      ) : ds.isPending ? (
        <ModuleSkeleton />
      ) : chay.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-card bg-nen p-10 text-center shadow-card">
          <Bot className="size-8 text-faint" />
          <p className="text-[0.8rem] text-body">Chưa có chatbot nào đang bật và trả lời được.</p>
          <Link
            to="/$chucNang"
            params={{ chucNang: 'tl-cau-hinh' }}
            className="text-[0.78rem] font-medium text-brand underline"
          >
            Mở Cấu hình Chatbot
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {chay.map((b) => (
            <Link
              key={b.id}
              to="/$chucNang"
              params={{ chucNang: 'tl-tro-chuyen' }}
              search={{ ma: b.id }}
              aria-label={`Mở cuộc trò chuyện với ${b.name}`}
              className="flex items-start gap-3 rounded-card border border-line bg-nen p-4 shadow-card transition-colors hover:border-border-strong hover:bg-nav-hover"
            >
              <span className="grid size-10 flex-none place-items-center rounded-[11px] bg-tint-brand text-brand">
                <Bot className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.86rem] font-semibold text-ink">{b.name}</span>
                <span className="mt-0.5 line-clamp-2 block text-[0.74rem] text-body">
                  {b.shortDescription || 'Hỏi một câu để bắt đầu cuộc trò chuyện.'}
                </span>
              </span>
              <MessageSquare className="mt-1 size-4 flex-none text-brand" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
