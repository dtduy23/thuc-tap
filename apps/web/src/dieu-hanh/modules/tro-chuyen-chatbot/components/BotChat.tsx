import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ListBox, Popover, Select, Spinner } from '@heroui/react'
import { ArrowUp, Bot, Mic, Plus, Trash2, TriangleAlert } from 'lucide-react'
import {
  KHOA_TL,
  ghiTinNhan,
  khoaMacDinh,
  khoaModel,
  layBoTriThucGon,
  layChatbot,
  layDoanChat,
  laySucKhoeTroLy,
  moDoanChat,
  moTaLoi,
  taoDoanChat,
  tenCongKhai,
  tenCongKhaiMacDinh,
  xoaDoanChat,
  type Conversation,
} from '@/dieu-hanh/lib/api-tro-ly'
import { useAskTurns } from '@/dieu-hanh/hooks/use-ask-turns'
import { coNhanGiong, useDanhSachGiong, useDocTo, useNghe } from '@/dieu-hanh/hooks/use-giong'
import { ghiNho, nho } from '@/dieu-hanh/lib/ghi-nho'
import { goiSoLieu } from '@/dieu-hanh/lib/luu-so-lieu'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { XacNhanXoa } from '@/dieu-hanh/components/overlay/XacNhanXoa'
import { ChonGiong } from '@/dieu-hanh/components/ai/ChonGiong'
import { LoiVan } from '@/dieu-hanh/components/ai/LoiVan'
import { BAC_WEB, NutTraWeb } from '@/dieu-hanh/components/ai/NutTraWeb'
import { TuyChonTraLoi } from '@/dieu-hanh/components/ai/TuyChonTraLoi'
import { ErrorState } from '@/dieu-hanh/components/ui/StateViews'
import { toast } from '@/dieu-hanh/store/toast'
import { DongCu, LuotChat } from './LuotChat'

const KHOI = 'rounded-card bg-nen shadow-card'

const Nhan = ({
  children,
  mau = 'xam',
  title,
}: {
  children: React.ReactNode
  mau?: 'xam' | 'warn' | 'ok'
  title?: string
}) => (
  <span
    title={title}
    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
      mau === 'warn'
        ? 'bg-warn-bg text-warn-tx'
        : mau === 'ok'
          ? 'bg-tint-ok text-ok-tx'
          : 'bg-line-2 text-chu-phu'
    }`}
  >
    {children}
  </span>
)

function MucDoanChat({
  cv,
  dangChon,
  chon,
  xoa,
}: {
  cv: Conversation
  dangChon: boolean
  chon: () => void
  xoa: () => void
}) {
  const ten = cv.title || 'Đoạn chat mới'
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg transition-colors ${
        dangChon ? 'bg-nav-active font-semibold text-brand' : 'text-body hover:bg-nav-hover'
      }`}
    >
      <button
        type="button"
        onClick={chon}
        aria-current={dangChon ? 'true' : undefined}
        className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[0.74rem]"
      >
        {ten}
      </button>
      <button
        type="button"
        aria-label={`Xoá đoạn chat ${ten}`}
        className="mr-1 flex-none rounded-lg p-1 text-faint opacity-0 transition hover:bg-canh-bao-bg hover:text-canh-bao focus-visible:opacity-100 group-hover:opacity-100"
        onClick={xoa}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

/** Port `BotChatView` — chat với một bot đã cấu hình, dùng chung engine SSE với Hỏi đáp AI. */
export function BotChat({ id, gon = false }: { id: string; gon?: boolean }) {
  const qc = useQueryClient()
  const [cvId, setCvId] = useState<string | null>(null)
  const [model, setModel] = useState('')
  // Công tắc nhớ RIÊNG cho màn này: dùng chung khoá với Hỏi đáp AI thì đổi ở đây làm đổi luôn màn kia.
  const [mucVan, setMucVan] = useState(() => nho('bot.mucVan', 'gon'))
  const [doDai, setDoDai] = useState(() => nho('bot.doDai', 'vua'))
  const [bieuDo, setBieuDo] = useState(() => nho('bot.bieuDo', 'tu_dong'))
  // Mặc định KHÔNG tra web: `tu_dong` nổ ở mọi lượt kho tri thức không khớp.
  const [web, setWeb] = useState(() => nho('bot.web', 'khong'))
  const [cauHoi, setCauHoi] = useState('')
  const [dangXoa, setDangXoa] = useState<Conversation | null>(null)
  const cuoi = useRef<HTMLDivElement>(null)
  const nghe = useNghe(setCauHoi)

  const sucKhoe = useQuery({
    queryKey: KHOA_TL.sucKhoe,
    queryFn: laySucKhoeTroLy,
    retry: false,
    staleTime: 5 * 60_000,
  })
  const llmTat = sucKhoe.data && !sucKhoe.data.llmConfigured

  const dsBot = useQuery({ queryKey: KHOA_TL.chatbot, queryFn: () => layChatbot() })
  const bot = dsBot.data?.find((b) => b.id === id)
  const coWeb = !!bot?.webDomains?.length

  // Kênh đọc từ bản khai của bot: `van_ban` không dựng mic, không gửi `giong`.
  const kenh = bot?.cheDoGiaoTiep ?? 'van_ban'
  const coTieng = kenh !== 'van_ban'
  const [batDoc, setBatDoc] = useState(() => nho('bot.doc') === '1')
  const doc = useDocTo()
  const dsGiong = useDanhSachGiong()
  const [giong, setGiong] = useState(() => nho('bot.giong', ''))
  const giongDung = (giong && dsGiong.some((g) => g.ma === giong) ? giong : dsGiong[0]?.ma) ?? null
  const coNghe = useMemo(() => coNhanGiong(), [])

  // Đọc được từ trong closure SSE — tắt loa giữa lượt phải có tác dụng ngay.
  const phatRef = useRef(false)
  useEffect(() => {
    phatRef.current = kenh === 'giong_noi' || (kenh === 'ca_hai' && batDoc)
  }, [kenh, batDoc])

  const cols = useQuery({ queryKey: KHOA_TL.boTriThuc, queryFn: layBoTriThucGon, staleTime: 5 * 60_000 })
  const boTen = useMemo(
    () =>
      (bot?.knowledgeBaseIds ?? [])
        .map((k) => cols.data?.find((c) => c.id === k)?.name)
        .filter((x): x is string => !!x),
    [bot, cols.data],
  )

  const danhSach = useQuery({ queryKey: KHOA_TL.doanChat(id), queryFn: () => layDoanChat(id) })
  const dangMo = useQuery({
    queryKey: KHOA_TL.moDoan(id, cvId),
    queryFn: () => moDoanChat(id, cvId ?? ''),
    enabled: !!cvId,
  })

  const { turns, running, ask, stop, clear } = useAskTurns({
    onTieng: (stt, goi) => {
      if (phatRef.current) doc.them(stt, goi)
    },
    onXongTieng: () => doc.xong(),
  })

  // Tin nhắn CHÍNH phiên này vừa ghi — `turns` đang vẽ chúng rồi, đừng vẽ hai lần.
  const [daGhi, setDaGhi] = useState<Set<string>>(new Set())

  const chuyenDoan = useCallback(
    (moi: string | null) => {
      if (moi !== cvId) {
        clear()
        setDaGhi(new Set())
      }
      setCvId(moi)
    },
    [cvId, clear],
  )

  useEffect(() => {
    cuoi.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, dangMo.data])

  const xoa = useMutation({
    mutationFn: (x: string) => xoaDoanChat(id, x),
    onSuccess: async (_r, x) => {
      setDangXoa(null)
      await qc.invalidateQueries({ queryKey: KHOA_TL.doanChat(id) })
      if (cvId === x) chuyenDoan(null)
    },
    onError: (e) => toast.loi(moTaLoi(e)),
  })

  const gui = async (q = cauHoi) => {
    if (!q.trim() || !bot || running) return
    setCauHoi('')
    // Lượt mới: im ngay và đặt lại con trỏ đọc — không thì mẩu đầu lượt sau bị bỏ.
    doc.dung()

    let dung = cvId
    // Đoạn chỉ ra đời khi có câu đầu — bấm "Đoạn chat mới" rồi đổi ý không để lại dòng rỗng.
    if (!dung && bot.saveHistory) {
      try {
        dung = (await taoDoanChat(id)).id
        setCvId(dung)
        void qc.invalidateQueries({ queryKey: KHOA_TL.doanChat(id) })
      } catch {
        // Lưu hỏng KHÔNG chặn việc hỏi.
        dung = null
      }
    }

    const kq = await ask({
      question: q,
      chatbotId: id,
      maxRows: 200,
      model: model || undefined,
      mucVan,
      doDai,
      bieuDo,
      // `auto` khi danh sách giọng chưa về — không thì lượt đầu im lặng không lý do.
      giong: coTieng ? (giongDung ?? 'auto') : undefined,
      tiengDan: true,
      web: coWeb ? ((BAC_WEB as readonly string[]).includes(web) ? web : 'khong') : undefined,
    })

    if (!dung || !kq?.answer) return
    try {
      const mUser = await ghiTinNhan(id, dung, { author: 'user', text: q })
      const mBot = await ghiTinNhan(id, dung, {
        author: 'bot',
        text: kq.answer,
        payload: { sql: kq.sql, rowCount: kq.rowCount, kind: kq.kind, ...(goiSoLieu(kq) ?? {}) },
      })
      setDaGhi((p) => new Set(p).add(mUser.id).add(mBot.id))
      void qc.invalidateQueries({ queryKey: KHOA_TL.doanChat(id) })
    } catch {
      /* lưu hỏng thì thôi — câu trả lời vẫn ở trên màn hình */
    }
  }

  if (dsBot.error)
    return <ErrorState loi={new Error(moTaLoi(dsBot.error))} thuLai={() => void dsBot.refetch()} />
  if (!dsBot.isPending && !bot) {
    return (
      <div className={`${KHOI} p-10 text-center text-[0.8rem] text-body`}>
        Không có chatbot nào mang mã {id}. Có thể nó vừa bị xoá.
      </div>
    )
  }

  const trong = !dangMo.data?.messages.length && !turns.length
  // Lời chào dùng chung với khung nhúng; không lưu thành tin nhắn.
  const loiChao = bot?.active === false ? '' : (bot?.widget?.greeting ?? '').trim()
  const models = sucKhoe.data?.models ?? []

  return (
    <>
      {!gon && (
        <PageHeader
          crumb="Trợ lý AI · Trò chuyện với Chatbot"
          tieuDe={bot?.name ?? 'Chatbot AI'}
          moTa={bot?.shortDescription || 'Trò chuyện với chatbot đã được cấu hình ngữ cảnh và bộ canh cổng.'}
          gocKey="trochuyen"
          mau="#4A48C4"
        />
      )}

      <div className={gon ? 'flex h-full gap-3' : 'flex h-[calc(100dvh-240px)] min-h-[520px] gap-3'}>
        <aside className={`hidden w-64 flex-none flex-col overflow-hidden ${gon ? '' : 'md:flex'} ${KHOI}`}>
          <div className="flex h-14 flex-none items-center border-b border-line-2 px-3">
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              isDisabled={!bot?.saveHistory}
              onPress={() => chuyenDoan(null)}
            >
              <Plus className="size-3.5" /> Đoạn chat mới
            </Button>
          </div>
          <p className="px-3 pb-1 pt-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-faint">
            Gần đây
          </p>
          <div className="grid flex-1 content-start gap-0.5 overflow-y-auto px-2 pb-3">
            {!bot?.saveHistory ? (
              <p className="px-2 py-4 text-[0.72rem] leading-relaxed text-faint">
                Bot này tắt lưu lịch sử, nên không có đoạn chat nào được ghi. Bật ở màn Cấu hình chatbot nếu
                muốn xem lại.
              </p>
            ) : danhSach.isPending ? (
              <div className="mt-4 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : danhSach.data?.length ? (
              danhSach.data.map((c) => (
                <MucDoanChat
                  key={c.id}
                  cv={c}
                  dangChon={c.id === cvId}
                  chon={() => chuyenDoan(c.id)}
                  xoa={() => setDangXoa(c)}
                />
              ))
            ) : (
              <p className="px-2 py-4 text-[0.72rem] text-faint">Chưa có đoạn chat nào.</p>
            )}
          </div>
          <p className="border-t border-line-2 px-3 py-2.5 text-[0.72rem] leading-relaxed text-faint">
            Đoạn chat riêng theo quyền của bạn.
          </p>
        </aside>

        <div className={`flex min-w-0 flex-1 flex-col overflow-hidden ${KHOI}`}>
          <header className="flex min-h-14 flex-none flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-7 flex-none place-items-center rounded-lg bg-tint-brand text-brand">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.84rem] font-semibold text-ink">{bot?.name ?? '…'}</p>
                {bot?.shortDescription && (
                  <p className="truncate text-[0.72rem] text-body">{bot.shortDescription}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Giọng là trạng thái của cả đoạn chat — chọn ở header, cùng chỗ với Hỏi đáp AI. */}
              {coTieng ? (
                <ChonGiong
                  danhSach={dsGiong}
                  giong={giongDung}
                  doiGiong={(v) => {
                    setGiong(v)
                    ghiNho('bot.giong', v)
                  }}
                  // Kênh `giong_noi` đọc mọi câu theo bản khai — công tắc tắt được sẽ mâu thuẫn.
                  bat={kenh === 'giong_noi' ? true : batDoc}
                  doiBat={(v) => {
                    if (kenh === 'giong_noi') return
                    setBatDoc(v)
                    ghiNho('bot.doc', v ? '1' : '0')
                    if (!v) doc.dung()
                  }}
                  dangDoc={doc.dangDoc}
                  dangTam={doc.dangTam}
                  tam={doc.bamTam}
                />
              ) : (
                <Nhan title="Bot này khai kênh giao tiếp là “Văn bản”, nên không đọc thành tiếng. Đổi ở màn Cấu hình chatbot.">
                  Chỉ văn bản
                </Nhan>
              )}
              {boTen.map((n) => (
                <Nhan key={n}>{n}</Nhan>
              ))}
              {bot?.active === false && <Nhan mau="warn">Bot đang tắt</Nhan>}
              {bot && (
                <Nhan mau={bot.mode === 'open' ? 'warn' : 'ok'}>
                  {bot.mode === 'open' ? 'Được trả lời ngoài phạm vi' : 'Chỉ trả lời trong phạm vi tài liệu'}
                </Nhan>
              )}
              {bot && (bot.sourceIds?.length ?? 0) > 1 && (
                <Nhan title="Mỗi câu hỏi chạy một lượt tra riêng trên TỪNG nguồn đã gắn; câu trả lời ghi rõ con số nào của nguồn nào.">
                  {bot.sourceIds.length} nguồn
                </Nhan>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-6" aria-live="polite">
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6">
              {dangMo.data?.messages
                .filter((m) => !daGhi.has(m.id))
                .map((m) => (
                  <DongCu key={m.id} m={m} />
                ))}
              {turns.map((t) => (
                <LuotChat
                  key={t.id}
                  turn={t}
                  hoiTiep={(q) => void gui(q)}
                  chiGiongNoi={kenh === 'giong_noi'}
                />
              ))}
              {trong && loiChao && (
                <LoiVan text={loiChao} className="text-[0.86rem] leading-relaxed text-ink" />
              )}
              {trong && !loiChao && (
                <div className="m-auto grid max-w-md justify-items-center gap-3 p-6 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-tint-brand text-brand">
                    <Bot className="size-6" />
                  </span>
                  <h3 className="text-base font-semibold text-ink">{bot?.name ?? 'Chatbot AI'}</h3>
                  {/* Không hiện `systemPrompt`: đó là lời nhắc cho mô hình, không phải lời giới thiệu. */}
                  <p className="text-[0.74rem] leading-relaxed text-body">
                    {bot?.active === false
                      ? 'Bot này đang tắt. Bật ở màn Cấu hình chatbot để mở lại cho người dùng.'
                      : bot?.shortDescription || 'Hỏi một câu để bắt đầu cuộc trò chuyện.'}
                  </p>
                </div>
              )}
              <div ref={cuoi} />
            </div>
          </div>

          <div className="flex-none px-4 pb-4 pt-2 lg:px-6">
            <div className="mx-auto w-full max-w-5xl">
              {bot?.active === false && (
                <p className="mb-2 flex items-center gap-1.5 text-[0.72rem] text-warn-tx">
                  <TriangleAlert className="size-3.5 flex-none" /> Bot đang tắt — câu hỏi vẫn chạy được ở đây
                  để thử nghiệm, nhưng người dùng chưa thể tương tác.
                </p>
              )}
              {llmTat && (
                <p className="mb-2 flex items-start gap-1.5 text-[0.72rem] text-warn-tx">
                  <TriangleAlert className="mt-0.5 size-3.5 flex-none" />
                  Chưa cấu hình API Key cho mô hình AI ({tenCongKhaiMacDinh(sucKhoe.data?.model, models)}).
                </p>
              )}

              <div className="rounded-[16px] border border-line bg-nen px-3.5 py-2.5 transition-shadow focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                <textarea
                  aria-label="Câu hỏi"
                  rows={1}
                  value={cauHoi}
                  onChange={(e) => setCauHoi(e.target.value)}
                  placeholder={`Hỏi ${bot?.name ?? 'bot'}…`}
                  className="max-h-40 w-full resize-none bg-transparent text-[0.86rem] text-ink outline-none [field-sizing:content] placeholder:text-faint"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void gui()
                    }
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {/* Ba công tắc trình bày gom vào nút `+` — cùng hình dạng với Hỏi đáp AI. */}
                  <Popover>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="secondary"
                      isDisabled={running}
                      aria-label="Tuỳ chọn trả lời"
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Popover.Content placement="top start" className="w-[300px]">
                      <Popover.Dialog aria-label="Tuỳ chọn trả lời">
                        <TuyChonTraLoi
                          mucVan={mucVan}
                          doDai={doDai}
                          bieuDo={bieuDo}
                          doiMucVan={(v) => {
                            setMucVan(v)
                            ghiNho('bot.mucVan', v)
                          }}
                          doiDoDai={(v) => {
                            setDoDai(v)
                            ghiNho('bot.doDai', v)
                          }}
                          doiBieuDo={(v) => {
                            setBieuDo(v)
                            ghiNho('bot.bieuDo', v)
                          }}
                        />
                      </Popover.Dialog>
                    </Popover.Content>
                  </Popover>

                  {coWeb && (
                    <NutTraWeb
                      web={web}
                      khoa={running}
                      doi={(v) => {
                        setWeb(v)
                        ghiNho('bot.web', v)
                      }}
                    />
                  )}

                  {sucKhoe.isPending ? (
                    <Spinner size="sm" />
                  ) : sucKhoe.isError ? (
                    <Nhan mau="warn" title={moTaLoi(sucKhoe.error)}>
                      Không tải được danh sách mô hình
                    </Nhan>
                  ) : models.length ? (
                    <Select
                      aria-label="Mô hình"
                      className="w-44"
                      // Hiện sẵn mục đang là mặc định như một lựa chọn thật; chọn lại đúng mục ấy
                      // thì trả về '' — lượt hỏi đi theo mặc định máy chủ.
                      selectedKey={model || khoaMacDinh(sucKhoe.data.model, models) || null}
                      placeholder={tenCongKhaiMacDinh(sucKhoe.data.model, models)}
                      disabledKeys={models.filter((m) => !m.available).map(khoaModel)}
                      onSelectionChange={(k) =>
                        setModel(
                          k === null || k === khoaMacDinh(sucKhoe.data?.model, models) ? '' : String(k),
                        )
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {models.map((m) => (
                            <ListBox.Item key={khoaModel(m)} id={khoaModel(m)} textValue={tenCongKhai(m)}>
                              {/* Không hiện `m.model`/`m.note`: cả hai mang tên nhà cung cấp. */}
                              <span title={m.available ? undefined : 'chưa cấu hình'}>{tenCongKhai(m)}</span>
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  ) : sucKhoe.data?.model ? (
                    <Nhan mau={llmTat ? 'warn' : 'xam'}>
                      {tenCongKhaiMacDinh(sucKhoe.data.model, models)}
                    </Nhan>
                  ) : null}

                  <span className="flex-1" />

                  {running ? (
                    <Button size="sm" variant="danger" onPress={stop}>
                      {/* Ô vuông ĐẶC — quy ước của mọi khung chat cho nút dừng. */}
                      <span aria-hidden="true" className="block size-2.5 rounded-[2px] bg-current" />
                      Dừng
                    </Button>
                  ) : (
                    <>
                      {/* Mic chỉ khi trình duyệt có API nhận giọng — nút mờ chỉ tạo ra một câu hỏi. */}
                      {coTieng && coNghe && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant={nghe.dangNghe ? 'danger' : 'secondary'}
                          aria-label={nghe.dangNghe ? 'Dừng nghe' : 'Hỏi bằng giọng nói'}
                          aria-pressed={nghe.dangNghe}
                          onPress={nghe.batDau}
                        >
                          <Mic className="size-4" />
                        </Button>
                      )}
                      {cauHoi.trim() && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="primary"
                          aria-label="Gửi câu hỏi"
                          onPress={() => void gui()}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-faint">Enter để gửi · Shift+Enter xuống dòng</p>
            </div>
          </div>
        </div>
      </div>

      {dangXoa && (
        <XacNhanXoa
          tieuDe="Xoá đoạn chat?"
          noiDung={`“${dangXoa.title || 'Đoạn chat mới'}” và mọi lượt hỏi trong đó sẽ bị xoá.`}
          nhanNut="Xoá"
          dangXoa={xoa.isPending}
          dong={() => setDangXoa(null)}
          xacNhan={() => xoa.mutate(dangXoa.id)}
        />
      )}
    </>
  )
}
