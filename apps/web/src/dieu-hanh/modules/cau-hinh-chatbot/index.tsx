import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@heroui/react'
import { Bot, CircleCheck, MessageSquare, Plus, TriangleAlert } from 'lucide-react'
import {
  KHOA_TL,
  layBoTriThucGon,
  layChatbot,
  layNguon,
  moTaLoi,
  xoaChatbot,
  type Chatbot,
} from '@/dieu-hanh/lib/api-tro-ly'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { XacNhanXoa } from '@/dieu-hanh/components/overlay/XacNhanXoa'
import { ErrorState } from '@/dieu-hanh/components/ui/StateViews'
import { useQuyen } from '@/dieu-hanh/hooks/use-quyen'
import { toast } from '@/dieu-hanh/store/toast'
import { FormBot } from './components/FormBot'

/**
 * Cấu hình chatbot AI — port `ChatbotConfigView` của FOXAINATIVE.
 *
 * Một bot là một BẢN KHAI, không phải một tiến trình: nó ghi lại bot nói giọng
 * nào, tra ở đâu, câu nào có sẵn câu trả lời. Trợ lí đọc bản khai khi có người hỏi.
 */
export default function CauHinhChatbot() {
  const qc = useQueryClient()
  // Quyền hỏi máy chủ, không tự suy: ADMIN có UPDATE, USER thì không.
  const suaDuoc = useQuyen('ASSISTANT_CHATBOT').duoc('UPDATE')
  const [chon, setChon] = useState<string | null>(null)
  const [taoMoi, setTaoMoi] = useState(false)
  const [dangXoa, setDangXoa] = useState<Chatbot | null>(null)

  const ds = useQuery({ queryKey: KHOA_TL.chatbot, queryFn: () => layChatbot() })
  const bo = useQuery({ queryKey: KHOA_TL.boTriThuc, queryFn: layBoTriThucGon, staleTime: 5 * 60_000 })
  const nguon = useQuery({ queryKey: KHOA_TL.nguon, queryFn: layNguon, staleTime: 60_000 })

  const dangSua = ds.data?.find((b) => b.id === chon) ?? null

  const xoa = useMutation({
    mutationFn: (b: Chatbot) => xoaChatbot(b.id),
    onSuccess: async () => {
      toast.thanhCong('Đã xoá chatbot')
      setDangXoa(null)
      setChon(null)
      await qc.invalidateQueries({ queryKey: KHOA_TL.chatbot })
    },
    onError: (e) => toast.loi(moTaLoi(e)),
  })

  return (
    <>
      <PageHeader
        crumb="Trợ lý AI · Cấu hình Chatbot"
        tieuDe="Cấu hình chatbot AI"
        moTa="Một bot ở đây là một bản khai, không phải một tiến trình đang chạy: nó ghi lại bot nói giọng nào, tra ở đâu, và câu nào đã có sẵn câu trả lời."
        gocKey="chatbot"
        mau="#4A48C4"
        hanhDong={
          suaDuoc ? (
            <Button
              variant="primary"
              onPress={() => {
                setChon(null)
                setTaoMoi(true)
              }}
            >
              <Plus className="size-4" />
              Thêm chatbot
            </Button>
          ) : null
        }
      />

      {/* Nói ra bot ĐI ĐÂU sau khi tạo — không có câu này thì người vừa lưu không biết "rồi sao nữa". */}
      <p className="mb-4 flex items-start gap-1.5 rounded-[9px] bg-nen px-3 py-2 text-[0.74rem] leading-relaxed text-body shadow-card">
        <MessageSquare className="mt-0.5 size-3.5 flex-none" />
        Bot đang bật và trả lời được sẽ hiện ở mục “Trò chuyện với Chatbot”.
      </p>

      {ds.error ? (
        <ErrorState loi={new Error(moTaLoi(ds.error))} thuLai={() => void ds.refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[268px_minmax(0,1fr)]">
          <div className="grid content-start gap-2">
            {ds.isPending
              ? [0, 1].map((i) => <div key={i} className="h-[74px] animate-pulse rounded-card bg-line-2" />)
              : ds.data.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-card border bg-nen transition-colors ${
                      chon === b.id ? 'border-brand ring-1 ring-brand' : 'border-line hover:bg-nav-hover'
                    }`}
                  >
                    <button
                      type="button"
                      aria-current={chon === b.id ? 'true' : undefined}
                      onClick={() => {
                        setTaoMoi(false)
                        setChon(b.id)
                      }}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-tint-brand p-1.5 text-brand">
                          <Bot className="size-3.5" />
                        </span>
                        <p className="min-w-0 flex-1 truncate text-[0.78rem] font-medium text-ink">
                          {b.name}
                        </p>
                        {!b.active && (
                          <span className="rounded-full bg-line-2 px-2 py-0.5 text-[0.62rem] font-bold text-chu-phu">
                            tắt
                          </span>
                        )}
                      </div>
                      {/* Chỉ "tắt VÀ không trả lời được" mới đáng cảnh báo — cố ý tắt bot lành thì không. */}
                      {b.active && b.answerable ? (
                        <p className="mt-1 flex items-center gap-1 text-[0.72rem] text-ok-tx">
                          <CircleCheck className="size-3.5" /> Đang chạy
                        </p>
                      ) : !b.active && !b.answerable ? (
                        <p className="mt-1 flex items-start gap-1 text-[0.72rem] leading-snug text-warn-tx">
                          <TriangleAlert className="mt-px size-3.5 flex-none" />
                          Đang tắt vì không còn nguồn nào để tra.
                        </p>
                      ) : (
                        <p className="mt-1 text-[0.72rem] text-faint">
                          {b.knowledgeBaseIds.length + b.sourceIds.length} nguồn · đang tắt
                        </p>
                      )}
                    </button>

                    {/* Bot chưa trả lời được thì không cho vào — nói trước khi bấm, không phải sau. */}
                    {b.answerable ? (
                      <Link
                        to="/$chucNang"
                        params={{ chucNang: 'tl-tro-chuyen' }}
                        search={{ ma: b.id }}
                        aria-label={`Mở cuộc trò chuyện với ${b.name}`}
                        className="flex items-center gap-1.5 rounded-b-card border-t border-line px-3 py-2 text-[0.72rem] font-medium text-brand hover:bg-tint-brand"
                      >
                        <MessageSquare className="size-3.5" />
                        Trò chuyện
                      </Link>
                    ) : (
                      <p className="border-t border-line px-3 py-2 text-[0.72rem] leading-snug text-faint">
                        Bot chưa trả lời được câu nào — gắn nguồn rồi bật lên đã.
                      </p>
                    )}
                  </div>
                ))}

            {!ds.isPending && !ds.data.length && !taoMoi && (
              <div className="grid justify-items-center gap-2 rounded-card bg-nen p-6 text-center shadow-card">
                <Bot className="size-6 text-faint" />
                <p className="text-[0.74rem] text-body">
                  Chưa có chatbot nào. {suaDuoc ? 'Thêm bot đầu tiên.' : 'Quản trị hệ thống tạo bot.'}
                </p>
              </div>
            )}
          </div>

          {taoMoi || dangSua ? (
            <FormBot
              key={dangSua?.id ?? 'moi'}
              bot={dangSua}
              boTriThuc={(bo.data ?? []).map((c) => ({ id: c.id, ten: c.name }))}
              nguonDuLieu={(nguon.data ?? []).map((s) => ({ id: s.id, ten: s.name, phu: s.status }))}
              suaDuoc={suaDuoc}
              xong={(b) => {
                void qc.invalidateQueries({ queryKey: KHOA_TL.chatbot }).then(() => {
                  setTaoMoi(false)
                  setChon(b.id)
                })
              }}
              huy={() => {
                setTaoMoi(false)
                setChon(null)
              }}
              xoa={dangSua ? () => setDangXoa(dangSua) : undefined}
            />
          ) : (
            <div className="grid place-items-center rounded-card bg-nen p-12 text-center shadow-card">
              <div className="grid justify-items-center gap-2">
                <Bot className="size-8 text-faint" />
                <p className="text-[0.74rem] text-body">Chọn một chatbot bên trái để xem cấu hình.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {dangXoa && (
        <XacNhanXoa
          tieuDe={`Xoá chatbot “${dangXoa.name}”?`}
          noiDung="Bản khai bị xoá. Tài liệu và dữ liệu của nó không bị đụng tới."
          nhanNut="Xoá chatbot"
          dangXoa={xoa.isPending}
          dong={() => setDangXoa(null)}
          xacNhan={() => xoa.mutate(dangXoa)}
        />
      )}
    </>
  )
}
