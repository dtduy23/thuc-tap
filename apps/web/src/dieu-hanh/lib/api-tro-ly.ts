import { goiApi, LoiApi, type TuyChon } from '@/dieu-hanh/lib/http'

/**
 * Nhóm endpoint Trợ lý AI — port từ `lib/repositories/context.repository.ts`,
 * `assistant.repository.ts` và `lib/collections-api.ts` của FOXAINATIVE.
 *
 * Ba tiền tố, ba service:
 *   /api/context/v1  nền tảng: nguồn, bản sao, chatbot, phân quyền (không gọi mô hình)
 *   /api/assistant   phần DUY NHẤT gọi mô hình: hỏi, giọng đọc, danh mục mô hình
 *   /api/index       index-service: bộ tri thức (collection)
 */

const goiVoi =
  (tienTo: string) =>
  <T>(duongDan: string, tuyChon: Omit<TuyChon, 'token' | 'tienTo'> = {}) =>
    goiApi<T>(duongDan, { ...tuyChon, tienTo })

const ctx = goiVoi('/api/context/v1')
const tl = goiVoi('/api/assistant')
const idx = goiVoi('/api/index')

const truyVan = (tv: Record<string, string | number | boolean | string[] | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(tv)) {
    if (v === undefined || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x))
    else p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const KHOA_TL = {
  chatbot: ['tro-ly-ai', 'chatbots'] as const,
  boTriThuc: ['tro-ly-ai', 'collections'] as const,
  nguon: ['tro-ly-ai', 'sources'] as const,
  sucKhoe: ['tro-ly-ai', 'assistant-health'] as const,
  vai: ['tro-ly-ai', 'perm-accounts'] as const,
  quyenHieuLuc: (vai: string) => ['tro-ly-ai', 'quyen-hieu-luc', vai] as const,
  maTranQuyen: (nguon: string) => ['tro-ly-ai', 'perm-matrix', nguon] as const,
  doanChat: (botId: string) => ['tro-ly-ai', 'bot-cv', botId] as const,
  moDoan: (botId: string, cvId: string | null) => ['tro-ly-ai', 'bot-cv-mo', botId, cvId] as const,
  hoiThoai: (khoaNguon: string) => ['tro-ly-ai', 'hoi-thoai', khoaNguon] as const,
  moHoiThoai: (cvId: string | null) => ['tro-ly-ai', 'hoi-thoai-mo', cvId] as const,
  goiY: (nguon: string) => ['tro-ly-ai', 'goi-y', nguon] as const,
  congCu: ['tro-ly-ai', 'cong-cu-api'] as const,
}

/**
 * Câu mô tả lỗi có nêu ĐƯỢC CHỖ SAI khi máy chủ nói được: "Dữ liệu gửi lên
 * không hợp lệ" không sửa được gì, còn `details.fields` nói thẳng tên trường.
 */
export function moTaLoi(e: unknown): string {
  if (!(e instanceof Error)) return String(e)
  if (!(e instanceof LoiApi)) return e.message
  const tuChoi = e.chiTiet.refusals
  if (Array.isArray(tuChoi) && tuChoi.length) {
    return (tuChoi as { code: string; message: string }[]).map((r) => `${r.code}: ${r.message}`).join(' · ')
  }
  const truong = e.chiTiet.fields
  if (!Array.isArray(truong) || !truong.length) return e.message
  const ds = (truong as { loc?: unknown[]; msg?: string }[])
    .map((t) => {
      // `loc` là ["body", "<tên trường>", …] — "body" đúng với mọi dòng nên bỏ.
      const duong = (t.loc ?? []).filter((x) => x !== 'body').join('.')
      return duong ? `${duong}: ${t.msg ?? ''}`.trim() : (t.msg ?? '')
    })
    .filter(Boolean)
  return ds.length ? `${e.message} — ${ds.join(' · ')}` : e.message
}

/* ── Chatbot ─────────────────────────────────────────────────────────────── */

export type ChatbotMode = 'knowledge_only' | 'open'

/** van_ban: không mic, không tiếng · giong_noi: có mic, tự đọc · ca_hai: có mic, bấm loa mới đọc. */
export type CheDoGiaoTiep = 'van_ban' | 'giong_noi' | 'ca_hai'
export const CHE_DO_GIAO_TIEP: CheDoGiaoTiep[] = ['van_ban', 'giong_noi', 'ca_hai']

/** Khớp `TRAN_NGUON` của context-service — vượt trần máy chủ trả 422. */
export const TRAN_NGUON = 15

export type WidgetPosition = 'bottom-right' | 'bottom-left'

export interface Faq {
  question: string
  answer: string
}

/** `van_ban` = không kiểm. Không có kiểu "tên người": không luật nào đúng cho mọi cái tên. */
export type KieuTruong = 'van_ban' | 'so' | 'dien_thoai' | 'email' | 'ngay'

export interface TruongBatBuoc {
  ten: string
  kieu: KieuTruong
}

export interface BuocHoiThoai {
  ten: string
  thuThap: boolean
  kieu: KieuTruong
}

/** `trigger`/`reply`/`requiredFields` là hình dạng CŨ, giữ để bản khai cũ vẫn đọc được. */
export interface Scenario {
  name: string
  trigger: string
  reply: string
  requiredFields: (string | TruongBatBuoc)[]
  steps: (string | BuocHoiThoai)[]
  rules: string[]
}

export interface Widget {
  title: string
  greeting: string
  primaryColor: string
  position: WidgetPosition
  avatarUrl: string | null
  /** TÁCH khỏi `active` của bot: bật bot không có nghĩa công khai nó. */
  enabled: boolean
  /** Định danh CÔNG KHAI của khung — không phải bí mật. */
  embedKey: string
  /** RỖNG = không gốc nào, không phải "mọi gốc". */
  allowedOrigins: string[]
  rateLimitPerMinute: number
  rateLimitPerIpPerMinute: number
  /** RỖNG = bot nhúng không đọc được số liệu. */
  vai: string
  /** RỖNG = mô hình mặc định của trợ lí. */
  model: string
}

export interface NguonGon {
  id: string
  name: string
}

export interface Chatbot {
  id: string
  name: string
  active: boolean
  /** Nền tảng TÍNH — đọc, đừng tự suy. */
  answerable: boolean
  shortDescription: string
  purpose: string
  mode: ChatbotMode
  systemPrompt: string
  knowledgeBaseIds: string[]
  sourceIds: string[]
  /** CHỈ ĐỌC — `chiPhanGuiLen` lọc ra khỏi thân PATCH. */
  sources: NguonGon[]
  cheDoGiaoTiep: CheDoGiaoTiep
  /** Mã giọng, ví dụ `gemini:Zephyr`. Rỗng = máy chủ lấy giọng đầu danh sách. */
  giong: string
  webDomains: string[]
  faqs: Faq[]
  scenariosEnabled: boolean
  scenarios: Scenario[]
  saveHistory: boolean
  widget: Widget
  createdAt: string
  updatedAt: string
}

/** Máy chủ khai `extra="forbid"` — gửi kèm trường chỉ-đọc là 422. */
export type ChatbotInput = Omit<Chatbot, 'id' | 'createdAt' | 'updatedAt' | 'answerable' | 'sources'>

export const WIDGET_MAU_MAC_DINH = '#2563EB'

export const WIDGET_MAC_DINH: Widget = {
  title: '',
  greeting: '',
  primaryColor: WIDGET_MAU_MAC_DINH,
  position: 'bottom-right',
  avatarUrl: null,
  enabled: false,
  embedKey: '',
  allowedOrigins: [],
  rateLimitPerMinute: 20,
  rateLimitPerIpPerMinute: 6,
  vai: '',
  model: '',
}

export const BOT_MAC_DINH: ChatbotInput = {
  name: '',
  active: false,
  shortDescription: '',
  purpose: '',
  mode: 'knowledge_only',
  systemPrompt: '',
  knowledgeBaseIds: [],
  sourceIds: [],
  cheDoGiaoTiep: 'van_ban',
  giong: '',
  webDomains: [],
  faqs: [],
  scenariosEnabled: false,
  scenarios: [],
  saveHistory: true,
  widget: WIDGET_MAC_DINH,
}

/** Lấy THEO DANH SÁCH khoá được phép gửi, không trừ dần — trường chỉ-đọc mới thêm sẽ không lọt. */
export function chiPhanGuiLen(b: Chatbot): ChatbotInput {
  const khoa = Object.keys(BOT_MAC_DINH) as (keyof ChatbotInput)[]
  return Object.fromEntries(khoa.map((k) => [k, b[k] ?? BOT_MAC_DINH[k]])) as ChatbotInput
}

export const docTruong = (t: string | TruongBatBuoc): TruongBatBuoc =>
  typeof t === 'string' ? { ten: t, kieu: 'van_ban' } : t

export const docBuoc = (b: string | BuocHoiThoai): BuocHoiThoai =>
  typeof b === 'string' ? { ten: b, thuThap: false, kieu: 'van_ban' } : b

export const layChatbot = (activeOnly = false) =>
  ctx<Chatbot[]>(`/chatbots${truyVan({ active_only: activeOnly || undefined })}`) as Promise<Chatbot[]>

export const layMotChatbot = (id: string) => ctx<Chatbot>(`/chatbots/${id}`) as Promise<Chatbot>

export const taoChatbot = (dto: ChatbotInput) =>
  ctx<Chatbot>('/chatbots', { method: 'POST', body: dto }) as Promise<Chatbot>

export const suaChatbot = (id: string, dto: Partial<ChatbotInput>) =>
  ctx<Chatbot>(`/chatbots/${id}`, { method: 'PATCH', body: dto }) as Promise<Chatbot>

export const xoaChatbot = (id: string) => ctx<null>(`/chatbots/${id}`, { method: 'DELETE' })

/** Khoá cũ LUÔN thắng giá trị gửi qua PATCH — xoay khoá chỉ đi đường này. */
export const xoayKhoaNhung = (id: string) =>
  ctx<Chatbot>(`/chatbots/${id}/xoay-khoa-nhung`, { method: 'POST' }) as Promise<Chatbot>

/* ── Nguồn, phân quyền ───────────────────────────────────────────────────── */

export type AccessMode = 'copy' | 'live'

/** Chỉ phần các màn đang dùng; màn Nguồn dữ liệu sẽ mở rộng khi port. */
export interface GraphqlSource {
  id: string
  name: string
  kind?: string
  status: string
  [khac: string]: unknown
}

export const layNguon = async () =>
  (await ctx<{ sources: GraphqlSource[] }>('/replica/sources'))?.sources ?? []

export type PermLevel = 'none' | 'tables' | 'full'

export interface PermAccounts {
  role: string
  canManage: boolean
  accounts: { role: string; label: string; canManage: boolean }[]
  levels: string[]
}

export interface PermTable {
  name: string
  title: string
  enabled: boolean
  columns: { name: string; label: string }[]
}

/** Lưu cột bị CẤM, không lưu cột được xem — cột mới đồng bộ về mặc định hiện ra. */
export interface PermGrant {
  role: string
  level: PermLevel
  tables: { table: string; deniedColumns: string[] }[]
}

export interface QuyenHieuLuc {
  role: string
  sources: (PermGrant & { sourceId: string })[]
}

export const layMaTranQuyen = (sourceId: string) =>
  ctx<{ sourceId: string; tables: PermTable[]; grants: PermGrant[] }>(
    `/permissions/sources/${encodeURIComponent(sourceId)}`,
  ) as Promise<{ sourceId: string; tables: PermTable[]; grants: PermGrant[] }>

/** `MatrixIn` khai `extra="forbid"` — chỉ gửi đúng khoá được phép, không gửi lại nguyên bản đọc về. */
export const luuMaTranQuyen = (sourceId: string, grants: PermGrant[]) =>
  ctx<null>(`/permissions/sources/${encodeURIComponent(sourceId)}`, {
    method: 'PUT',
    body: {
      grants: grants.map((g) => ({
        role: g.role,
        level: g.level,
        tables: g.tables.map((t) => ({ table: t.table, deniedColumns: t.deniedColumns })),
      })),
    },
  })

export const layVaiQuyen = () => ctx<PermAccounts>('/permissions/accounts') as Promise<PermAccounts>

export const layQuyenHieuLuc = (vai?: string) =>
  ctx<QuyenHieuLuc>(`/permissions/effective${truyVan({ for_role: vai })}`) as Promise<QuyenHieuLuc>

/* ── Trợ lí: mô hình, giọng ──────────────────────────────────────────────── */

/** `provider` là nhà cung cấp, `id` là thứ gửi lên — một provider có thể có nhiều mô hình. */
export interface MucModel {
  id?: string
  provider: string
  model: string
  available: boolean
  note: string
  /** Tên thật (mã mô hình) — chỉ dùng ở màn Cấu hình chatbot. */
  nhan?: string
  /** Tên hiển thị trong danh mục "Thiết lập Model AI" — thứ người dùng cuối được thấy. */
  tenCongKhai?: string
  /** Mục chạy khi lượt hỏi không nêu mô hình. Vắng ở máy chủ cũ — khi ấy dò theo `model`. */
  macDinh?: boolean
}

export interface AssistantHealth {
  ok: boolean
  /** Nhà cung cấp của mặc định máy chủ — để gọi tên được cả khi danh mục `models` vắng. */
  provider?: string
  model: string
  llmConfigured: boolean
  models?: MucModel[]
  giong?: { ma: string; nhan: string; ngon_ngu: string }[]
}

export const laySucKhoeTroLy = () => tl<AssistantHealth>('/health') as Promise<AssistantHealth>

export const ngheThuGiong = async (giong: string) =>
  (
    (await tl<{ wavB64: string }>('/tieng/nghe-thu', { method: 'POST', body: { giong } })) as {
      wavB64: string
    }
  ).wavB64

/* ── Bộ tri thức (index-service) ─────────────────────────────────────────── */

export interface BoTriThucGon {
  id: string
  name: string
  description: string
}

interface TrangCollection {
  collections?: { id: string; collection_name: string; description?: string | null }[]
  items?: { id: string; collection_name: string; description?: string | null }[]
  total_pages?: number
}

/** Gộp mọi trang — máy chủ giới hạn 100 mục một trang. */
export async function layBoTriThucGon(): Promise<BoTriThucGon[]> {
  const trang = async (p: number): Promise<TrangCollection> => {
    const json = await idx<{ info?: { data?: TrangCollection }; data?: TrangCollection } & TrangCollection>(
      `/v1/collections/collections?page=${p}&page_size=100`,
    )
    return json?.info?.data ?? json?.data ?? json ?? {}
  }
  const dau = await trang(1)
  const tho = [...(dau.collections ?? dau.items ?? [])]
  if ((dau.total_pages ?? 1) > 1) {
    const con = await Promise.all(Array.from({ length: (dau.total_pages ?? 1) - 1 }, (_, i) => trang(i + 2)))
    for (const t of con) tho.push(...(t.collections ?? t.items ?? []))
  }
  return tho.map((c) => ({ id: c.id, name: c.collection_name, description: c.description ?? '' }))
}

/* ── Tên mô hình để hiện ─────────────────────────────────────────────────── */

const TEN_NCC: Record<string, string> = {
  foxai: 'FoxAI',
  gemini: 'Gemini',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
}

/** Bảng tên chứ không `toUpperCase()`: viết hoa máy móc cho ra `FOXAI`, sai tên riêng. */
export function tenNhaCungCap(provider: string): string {
  const k = (provider || '').trim().toLowerCase()
  if (!k) return ''
  return TEN_NCC[k] ?? k.charAt(0).toUpperCase() + k.slice(1)
}

export const khoaModel = (m: { id?: string; provider: string }) => m.id || m.provider

/** `gemini@gemini-3.6-flash` → `Gemini 3.6` — dùng khi danh mục chưa về để không hiện khoá thô. */
export function nhanTuKhoa(khoa: string): string {
  const [provider = '', model = ''] = (khoa || '').split('@')
  const ten = tenNhaCungCap(provider)
  const ban = model.match(/\d+(?:\.\d+)?/)?.[0]
  return ban ? `${ten} ${ban}` : ten
}

export const nhanModel = (m: { nhan?: string; provider: string; id?: string }) =>
  m.nhan || nhanTuKhoa(khoaModel(m))

/**
 * Mã mô hình → tên hiển thị, tra trong danh mục `/health`. Nhận cả dạng
 * `gemini · gemini-3.7-flash` mà kết quả một lượt ghi lại (mô hình ĐÃ DÙNG thật).
 *
 * Nhiều mục cùng mã thì ưu tiên mục trơn — nó mang nhãn máy chủ đặt cho mặc định.
 * Dò không ra thì chỉ nói tên nhà cung cấp chứ không bịa số bản; không có cả
 * nhà cung cấp mới đành trả mã.
 */
export function tenModel(ma: string | undefined, models: MucModel[] | undefined, provider?: string): string {
  if (!ma) return ''
  const [a = '', b] = ma.split(' · ')
  const [ncc, model] = b ? [a.trim(), b.trim()] : [provider ?? '', ma.trim()]
  const trung = (models ?? []).filter((x) => x.model === model && (!ncc || x.provider === ncc))
  const m = trung.find((x) => !khoaModel(x).includes('@')) ?? trung[0]
  if (m) return nhanModel(m)
  return tenNhaCungCap(ncc) || model
}

/**
 * Khoá của mục ĐANG LÀ mặc định máy chủ — để ô chọn hiện nó như một lựa chọn thật,
 * thay vì thêm một dòng "Mặc định" riêng trùng tên với chính mục ấy. Ưu tiên mục trơn
 * (`gemini`) vì nó không ghim bản: mặc định máy chủ đổi thì lượt hỏi đổi theo.
 */
export function khoaMacDinh(model: string | undefined, models: MucModel[] | undefined): string {
  const co = models?.find((x) => x.macDinh)
  if (co) return khoaModel(co)
  if (!model || !models) return ''
  const trung = models.filter((x) => x.model === model)
  const m = trung.find((x) => !khoaModel(x).includes('@')) ?? trung[0]
  return m ? khoaModel(m) : ''
}

const TEN_CONG_KHAI_MAC_DINH = 'FoxAI'

/**
 * Tên hiện cho NGƯỜI DÙNG CUỐI (Hỏi đáp AI, Trò chuyện chatbot): Tên hiển thị trong
 * danh mục "Thiết lập Model AI" mà máy chủ đọc hộ. Vắng thì rơi về tên chung,
 * KHÔNG rơi về `nhanModel` — tên thật là đúng thứ phải giấu khỏi người dùng cuối.
 */
export const tenCongKhai = (m: { tenCongKhai?: string } | undefined) =>
  m?.tenCongKhai || TEN_CONG_KHAI_MAC_DINH

/** Tên công khai của mục đang là mặc định máy chủ; dò không ra thì cũng không trả mã thô. */
export const tenCongKhaiMacDinh = (model: string | undefined, models: MucModel[] | undefined) =>
  tenCongKhai(models?.find((x) => x.macDinh) ?? models?.find((x) => x.model === model))

/* ── Hỏi đáp: kết quả một lượt ───────────────────────────────────────────── */

export interface Refusal {
  code: string
  message: string
  /** Bảng/cột lời từ chối nói tới — để dựng đường đi tới đúng ô khai báo còn trống. */
  bang?: string
  cot?: string
}

export type Freshness = 'live' | 'replica'

export interface NodeTiming {
  node: string
  ms: number
  llm: boolean
  tokensIn?: number
  tokensOut?: number
  cached?: number
  /** Chạy CHỒNG LẤN với các chặng cùng cờ — không cộng dồn thời gian. */
  songSong?: boolean
  /** Riêng chặng đọc: bao lâu thì mẩu ĐẦU ra tới tai. */
  msMauDau?: number
}

export type AskKind =
  | 'data'
  | 'analysis'
  | 'knowledge'
  | 'clarify'
  | 'capability'
  | 'freshness'
  | 'greeting'
  | 'kich_ban'
  | 'unsupported'

export interface AskDisplay {
  dang: string
  x?: string | null
  y?: string | null
  loat?: string | null
  kich_thuoc?: string | null
  chi_tieu?: string[]
  vi_sao?: string
  theoYeuCau?: boolean
  /** Dạng VẼ ĐƯỢC với dữ liệu này — giao diện không dựng bản thứ hai của luật ấy. */
  hopLe?: string[]
  truc?: Record<string, { x?: string | null; y?: string | null; loat?: string | null }>
}

/** `null` ở mọi lượt hỏi thường. `trangThai` PHẢI gửi lại ở lượt sau — trợ lí không có phiên. */
export interface KichBanTienDo {
  ten: string
  buoc: number
  tongBuoc: number
  conThieu: string[]
  xong: boolean
  loi?: string | null
  trangThai: { kichBan: string; daThu: Record<string, string>; buoc: number }
}

export interface Passage {
  fileName: string
  collectionName: string
  text: string
  score: number
  chunkIndex: number
  /** `"web"` = đoạn lấy từ trang web của tổ chức. */
  nguon?: string
  url?: string
}

export interface KetQuaNguon {
  sourceId: string
  ten: string
  biDanh: string
  sql: string
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  truncated: boolean
  syncedAt?: string | null
  freshness?: Freshness | null
  warnings: string[]
  attempts: number
  /** Vì sao nguồn này không có số liệu. Rỗng = có. */
  loi: string
}

export interface AskResult {
  question: string
  nguon?: KetQuaNguon[]
  hoiDanhSach?: boolean
  nodes?: NodeTiming[]
  soLanGoiLlm?: number
  model?: string
  /** Tên hiện cho người dùng cuối — `model` lộ nhà cung cấp. */
  tenCongKhai?: string
  answer: string
  kind?: AskKind
  display?: AskDisplay
  kichBan?: KichBanTienDo | null
  /** RỖNG nghĩa là mọi chữ số đều có nguồn, KHÔNG phải câu trả lời đã được kiểm. */
  unsourcedNumbers: string[]
  derivedNumbers?: string[]
  /** Đừng vẽ: đã nằm trong `answer` sau `render_nhan()`. */
  labelled?: { kind: string; text: string }[]
  anomalies?: { loai: string; message: string; column?: string; label?: string }[]
  checks?: { loai: string; message: string; rieng?: boolean }[]
  proseIssues?: string[]
  quaTran?: boolean
  /** SUY LUẬN của mô hình — phải đánh dấu là đề xuất. */
  suggestions?: string[]
  followUps?: string[]
  sql: string
  explanation: string
  assumptions: string[]
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  truncated: boolean
  syncedAt: string | null
  freshness?: Freshness | null
  warnings: string[]
  passages?: Passage[]
  steps: { step: string; detail: string }[]
  attempts: number
  elapsedMs: number
}

/* ── Đoạn chat của một bot ───────────────────────────────────────────────── */

export interface ChatMessage {
  id: string
  turn: number
  author: 'user' | 'bot'
  text: string
  payload: Record<string, unknown> | null
  createdAt: string
}

export interface Conversation {
  id: string
  chatbotId: string
  /** Đoạn chat khoá theo VAI ở tầng kho — vai khác đọc ra 404. */
  role: string
  title: string
  createdAt: string
  updatedAt: string
  /** LUÔN rỗng ở đường liệt kê — mở một đoạn thì gọi `moDoanChat`. */
  messages: ChatMessage[]
}

export const layDoanChat = (botId: string, limit = 50) =>
  ctx<Conversation[]>(`/chatbots/${botId}/conversations?limit=${limit}`) as Promise<Conversation[]>

export const moDoanChat = (botId: string, cvId: string) =>
  ctx<Conversation>(`/chatbots/${botId}/conversations/${cvId}`) as Promise<Conversation>

export const taoDoanChat = (botId: string) =>
  ctx<Conversation>(`/chatbots/${botId}/conversations`, { method: 'POST', body: {} }) as Promise<Conversation>

export const ghiTinNhan = (
  botId: string,
  cvId: string,
  body: { author: 'user' | 'bot'; text: string; payload?: Record<string, unknown> },
) =>
  ctx<ChatMessage>(`/chatbots/${botId}/conversations/${cvId}/messages`, {
    method: 'POST',
    body,
  }) as Promise<ChatMessage>

export const xoaDoanChat = (botId: string, cvId: string) =>
  ctx<null>(`/chatbots/${botId}/conversations/${cvId}`, { method: 'DELETE' })

/* ── Hỏi đáp AI: đoạn hỏi theo nguồn, câu gợi ý ──────────────────────────── */

export interface HoiThoaiMessage {
  id: string
  author: string
  text: string
  turn?: number
  payload?: Record<string, unknown>
}

export interface HoiThoai {
  id: string
  title: string
  /** Nguồn của đoạn — mở lại đoạn cũ thì khôi phục lựa chọn nguồn từ đây. */
  scopeIds?: string[]
  createdAt?: string
  updatedAt?: string
  messages?: HoiThoaiMessage[]
}

/** Đoạn GIAO với tập nguồn đang chọn, không phải trùng khít. */
export const layHoiThoai = async (nguon: string[]) =>
  (await ctx<{ hoiThoai: HoiThoai[] }>(`/replica/hoi-thoai${truyVan({ nguon })}`))?.hoiThoai ?? []

export const moHoiThoai = (cvId: string) => ctx<HoiThoai>(`/replica/hoi-thoai/${cvId}`) as Promise<HoiThoai>

export const taoHoiThoai = (nguon: string[]) =>
  ctx<HoiThoai>('/replica/hoi-thoai', { method: 'POST', body: { nguon } }) as Promise<HoiThoai>

export const ghiLuotHoi = (
  cvId: string,
  body: { author: string; text: string; turn?: number; payload?: Record<string, unknown> },
) =>
  ctx<{ id: string }>(`/replica/hoi-thoai/${cvId}/luot`, { method: 'POST', body }) as Promise<{ id: string }>

export const xoaHoiThoai = (cvId: string) => ctx<null>(`/replica/hoi-thoai/${cvId}`, { method: 'DELETE' })

export const layCauHoiChot = async (id: string) =>
  (await ctx<{ questions: { question: string }[] }>(`/replica/sources/${id}/questions`))?.questions ?? []

export const layCauMau = async (id: string) =>
  (await ctx<{ samples: { question: string }[] }>(`/replica/samples${truyVan({ source_id: id })}`))
    ?.samples ?? []

export const sinhCauHoi = async (id: string) =>
  (
    await ctx<{ candidates: { question: string }[] }>(`/replica/sources/${id}/questions/generate`, {
      method: 'POST',
    })
  )?.candidates ?? []

/* ── Công cụ API — nguồn `kind: 'api'`, được GỌI lúc hỏi, không chép về kho ─ */

/** Danh sách TRẮNG những gì nền tảng được điền vào lời gọi. */
export interface ThamSoApi {
  name: string
  in: 'query' | 'path' | 'body' | 'bind'
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description?: string
  enum?: string[] | null
}

export interface XacThucApi {
  type: 'none' | 'api_key' | 'bearer' | 'basic'
  location?: 'header' | 'query' | null
  keyName?: string | null
  username?: string | null
  secretRef?: string | null
}

export interface NghiaMaApi {
  value: string
  meaning: string
}

/** Một CỘT API trả về và nghĩa của nó — khác hẳn `ThamSoApi`, cố ý không gộp. */
export interface CotApi {
  name: string
  type: 'STRING' | 'DATE' | 'DECIMAL' | 'INTEGER' | 'BOOLEAN'
  in: 'query' | 'none'
  label?: string | null
  unit?: string | null
  unitField?: string | null
  description?: string
  enum?: NghiaMaApi[] | null
  /** BA trạng thái: `null` = chưa ai khai — gộp vào `false` là mất khoảng cách để nền tảng từ chối. */
  additive?: boolean | null
  filterable?: boolean | null
  filterNote?: string | null
  operator?: 'like' | 'eq' | 'gte' | 'lte' | 'between' | null
  dependsOn?: string | null
}

export interface CauHinhCongCuApi {
  transport: 'http'
  baseUrl: string
  method: 'GET' | 'POST'
  path: string
  params: ThamSoApi[]
  fixed: Record<string, string>
  auth: XacThucApi
  limits: { timeoutMs: number; maxItems: number; maxChars: number }
  choHoiDap: boolean
  /** JMESPath rút gọn câu trả lời. Rỗng = giữ nguyên. */
  responseTransform?: string | null
  fields?: CotApi[]
  fieldsDeclaredAt?: string | null
  cacheTtlSeconds?: number | null
}

export interface ChuDeCongCu {
  domain?: string
  aliases?: string[]
  grain?: string
  sampleQuestions?: string[]
  timeField?: string | null
}

export interface CongCuApi {
  id: string
  tenantId: string
  name: string
  kind: 'api'
  status: 'active' | 'paused' | 'error'
  config: CauHinhCongCuApi
  business?: ChuDeCongCu | null
  hasSecret: boolean
  createdAt: string
  updatedAt: string
}

export interface KetQuaGoiThu {
  soDong: number
  dong: Record<string, unknown>[]
  cot: string[]
  msDaChay: number
  daGui: Record<string, string>
  daBo: Record<string, string>
  catBot: boolean
  /** Vì sao phép rút gọn không chạy. Rỗng = không khai, hoặc đã chạy xong. */
  loiRutGon: string
}

export const layCongCuApi = () => ctx<CongCuApi[]>('/sources?kind=api') as Promise<CongCuApi[]>

/** `biMat` là write-only: máy chủ mã hoá rồi không bao giờ trả lại. */
export const taoCongCuApi = (ts: {
  name: string
  config: CauHinhCongCuApi
  business?: ChuDeCongCu | null
  biMat?: string
}) =>
  ctx<CongCuApi>('/sources', {
    method: 'POST',
    body: {
      name: ts.name,
      kind: 'api',
      config: ts.config,
      ...(ts.business ? { business: ts.business } : {}),
      ...(ts.biMat ? { password: ts.biMat } : {}),
    },
  }) as Promise<CongCuApi>

/** Vắng mặt = giữ nguyên. `password: ''` KHÔNG xoá khoá cũ — đừng gửi chuỗi rỗng. */
export const suaCongCuApi = (
  id: string,
  ts: {
    name?: string
    status?: 'active' | 'paused'
    config?: CauHinhCongCuApi
    business?: ChuDeCongCu | null
    biMat?: string
  },
) =>
  ctx<CongCuApi>(`/sources/${id}`, {
    method: 'PATCH',
    body: {
      ...(ts.name !== undefined ? { name: ts.name } : {}),
      ...(ts.status !== undefined ? { status: ts.status } : {}),
      ...(ts.config !== undefined ? { config: ts.config } : {}),
      ...(ts.business !== undefined ? { business: ts.business } : {}),
      ...(ts.biMat ? { password: ts.biMat } : {}),
    },
  }) as Promise<CongCuApi>

export const xoaCongCuApi = (id: string) => ctx<null>(`/sources/${id}`, { method: 'DELETE' })

/** Trả 200 kèm `ok:false` khi không nối được — kết luận được là hỏng cũng là kiểm thành công. */
export const kiemNoiCongCu = (id: string) =>
  ctx<{ ok: boolean; latencyMs?: number; status?: number; error?: string }>(`/sources/${id}/check`, {
    method: 'POST',
  }) as Promise<{
    ok: boolean
    latencyMs?: number
    status?: number
    error?: string
  }>

/** Gọi THẬT với tham số người vận hành điền. Không ghi gì. */
export const goiThuCongCu = (id: string, thamSo: Record<string, string>, toiDa = 5) =>
  ctx<KetQuaGoiThu>(`/sources/${id}/goi-thu`, {
    method: 'POST',
    body: { thamSo, toiDa },
  }) as Promise<KetQuaGoiThu>
