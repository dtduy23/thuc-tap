import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, Checkbox, ListBox, Select } from '@heroui/react'
import {
  BookOpen,
  CircleCheck,
  CircleHelp,
  MessageSquare,
  Network,
  Plus,
  Bot,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  BOT_MAC_DINH,
  CHE_DO_GIAO_TIEP,
  KHOA_TL,
  TRAN_NGUON,
  WIDGET_MAU_MAC_DINH,
  chiPhanGuiLen,
  khoaModel,
  laySucKhoeTroLy,
  layQuyenHieuLuc,
  layVaiQuyen,
  moTaLoi,
  nhanModel,
  nhanTuKhoa,
  suaChatbot,
  taoChatbot,
  tenModel,
  type Chatbot,
  type ChatbotInput,
  type ChatbotMode,
  type CheDoGiaoTiep,
  type Widget,
  type WidgetPosition,
} from '@/dieu-hanh/lib/api-tro-ly'
import { toast } from '@/dieu-hanh/store/toast'
import { ChonGiongBot } from './ChonGiongBot'
import { OChu } from '@/dieu-hanh/components/ui/OChu'
import { ChonThe, CongTac, Muc } from './Chung'
import { KhoiNhung } from './KhoiNhung'
import { KICH_BAN_RONG, KichBanDialog, soThuThap } from './KichBanDialog'

const MAU_HOP_LE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * `<input type="color">` chỉ nhận dạng sáu chữ số; đưa gì khác vào nó lặng lẽ
 * hoá đen trong khi ô chữ vẫn hiện chuỗi đang gõ.
 */
function mauSauChuSo(mau: string): string {
  const v = (MAU_HOP_LE.exec(mau.trim())?.[0] ?? WIDGET_MAU_MAC_DINH).slice(1).toLowerCase()
  return v.length === 3 ? `#${[...v].map((c) => c + c).join('')}` : `#${v}`
}

const PHAM_VI: { ma: ChatbotMode; nhan: string; mo: string }[] = [
  {
    ma: 'knowledge_only',
    nhan: 'Chỉ trả lời trong phạm vi tài liệu',
    mo: 'Không tìm thấy trong tài liệu hay số liệu thì bot nói không biết, không đoán.',
  },
  {
    ma: 'open',
    nhan: 'Được trả lời ngoài phạm vi',
    mo: 'Bot được trả lời bằng kiến thức chung của mô hình. Câu trả lời khi ấy không quy về được tài liệu nào.',
  },
]

const KENH: Record<CheDoGiaoTiep, { nhan: string; mo: string }> = {
  van_ban: { nhan: 'Chỉ văn bản', mo: 'Gõ và đọc. Không mic, không phát tiếng.' },
  giong_noi: { nhan: 'Giọng nói', mo: 'Có mic, và tự đọc câu trả lời thành tiếng.' },
  ca_hai: { nhan: 'Giọng nói + văn bản', mo: 'Có mic, có nút loa — bấm mới đọc.' },
}

const MAU_CHU = { xam: 'text-faint', warn: 'text-warn-tx', loi: 'text-canh-bao' } as const
type LoiNhan = { chu: string; mau: keyof typeof MAU_CHU }

const KHONG_CHON = '__khong__'

/** Nút gọn cho thao tác trong danh sách (xoá câu hỏi, xoá kịch bản). */
const NUT_XOA =
  'h-8 flex-none rounded-lg p-1.5 text-faint transition-colors hover:bg-canh-bao-bg hover:text-canh-bao'

function Tick({
  chon,
  doi,
  khoa,
  children,
}: {
  chon: boolean
  doi: () => void
  khoa?: boolean
  children: React.ReactNode
}) {
  return (
    <Checkbox isSelected={chon} onChange={doi} isDisabled={khoa}>
      <Checkbox.Content className="flex items-start gap-2">
        <Checkbox.Control className="mt-0.5 size-4 flex-none rounded-[4px]">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span className="text-[0.74rem] leading-snug text-ink">{children}</span>
      </Checkbox.Content>
    </Checkbox>
  )
}

function ChonDon({
  nhan,
  giaTri,
  doi,
  khoa,
  muc,
  trong,
}: {
  nhan: string
  giaTri: string
  doi: (v: string) => void
  khoa?: boolean
  muc: { id: string; nhan: string }[]
  /** Nhãn của lựa chọn "để trống". */
  trong: string
}) {
  return (
    <Select
      aria-label={nhan}
      isDisabled={khoa}
      selectedKey={giaTri || KHONG_CHON}
      onSelectionChange={(k) => doi(k === KHONG_CHON || k === null ? '' : String(k))}
      className="w-full"
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={KHONG_CHON}>{trong}</ListBox.Item>
          {muc.map((m) => (
            <ListBox.Item key={m.id} id={m.id}>
              {m.nhan}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

/**
 * Còn thiếu gì trước khi bật được bot — ở ĐẦU biểu mẫu: điều kiện biết được
 * ngay lúc mở, bắt điền xong mới nói là giấu một thứ đã biết.
 */
function ConThieu({
  f,
  batTat,
  suaDuoc,
  botTuTat,
}: {
  f: ChatbotInput
  batTat: (v: boolean) => void
  suaDuoc: boolean
  botTuTat: boolean
}) {
  const thieu = [
    { xong: !!f.name.trim(), chu: 'Đặt tên bot' },
    {
      xong: f.knowledgeBaseIds.length + f.sourceIds.length > 0,
      chu: 'Gắn ít nhất một bộ tri thức hoặc một nguồn dữ liệu',
    },
  ].filter((m) => !m.xong)

  if (!thieu.length) {
    return (
      <div
        className={`rounded-[11px] border px-4 py-2.5 ${f.active ? 'border-ok bg-tint-ok' : 'border-line bg-bg'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[0.74rem] text-ink">
            <CircleCheck className={`size-4 ${f.active ? 'text-ok-tx' : 'text-faint'}`} />
            {f.active ? 'Đủ điều kiện, và bot đang bật.' : 'Đủ điều kiện để bật.'}
          </p>
          <CongTac bat={f.active} doi={batTat} khoa={!suaDuoc}>
            {f.active ? 'Đang bật' : 'Đang tắt'}
          </CongTac>
        </div>
        {botTuTat && (
          // Nền tảng tự tắt bot khi nguồn cuối bị xoá — không nói thì người mở ra không hiểu vì sao.
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warn-bg p-2 text-[0.72rem] leading-relaxed text-warn-tx">
            <TriangleAlert className="mt-px size-3.5 flex-none" />
            <span>
              Bot này <b>đã bị tắt tự động</b> vì nguồn cuối cùng của nó bị xoá. Gắn một bộ tri thức hoặc một
              nguồn dữ liệu ở mục dưới rồi bật lại.
            </span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-[11px] border border-warn bg-warn-bg px-4 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 text-[0.74rem] font-medium text-warn-tx">
        <TriangleAlert className="size-3.5" />
        Còn {thieu.length} việc trước khi bật được bot
      </p>
      <ul className="grid gap-0.5">
        {thieu.map((m) => (
          <li key={m.chu} className="text-[0.72rem] text-warn-tx">
            · {m.chu}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Port FormBot — biểu mẫu tám mục của một chatbot. */
export function FormBot({
  bot,
  boTriThuc,
  nguonDuLieu,
  suaDuoc,
  xong,
  huy,
  xoa,
}: {
  bot: Chatbot | null
  boTriThuc: { id: string; ten: string }[]
  nguonDuLieu: { id: string; ten: string; phu: string }[]
  suaDuoc: boolean
  xong: (b: Chatbot) => void
  huy: () => void
  xoa?: () => void
}) {
  const navigate = useNavigate()
  const [f, setF] = useState<ChatbotInput>(() => (bot ? chiPhanGuiLen(bot) : BOT_MAC_DINH))
  // `null` = đóng · `'moi'` = thêm mới · số = chỉ mục đang sửa.
  const [suaKb, setSuaKb] = useState<number | 'moi' | null>(null)
  // Giữ nguyên văn ô tên miền trong lúc gõ: lọc dòng rỗng ngay thì Enter bị nuốt,
  // không gõ được dòng thứ hai.
  const [webNhap, setWebNhap] = useState<string | null>(null)
  const [gocNhap, setGocNhap] = useState<string | null>(null)

  const dat = <K extends keyof ChatbotInput>(k: K, v: ChatbotInput[K]) => setF((cu) => ({ ...cu, [k]: v }))
  const datW = <K extends keyof Widget>(k: K, v: Widget[K]) =>
    setF((cu) => ({ ...cu, widget: { ...cu.widget, [k]: v } }))
  const bat = (k: 'knowledgeBaseIds' | 'sourceIds', id: string) =>
    setF((cu) => ({ ...cu, [k]: cu[k].includes(id) ? cu[k].filter((x) => x !== id) : [...cu[k], id] }))

  // Danh mục giọng cùng nguồn với danh mục mô hình — một bộ nhớ đệm.
  const sucKhoe = useQuery({
    queryKey: KHOA_TL.sucKhoe,
    queryFn: laySucKhoeTroLy,
    retry: false,
    staleTime: 5 * 60_000,
  })
  const dsGiong = (sucKhoe.data?.giong ?? []).map((g) => ({ ma: g.ma, nhan: g.nhan }))

  const luu = useMutation({
    mutationFn: () => (bot ? suaChatbot(bot.id, f) : taoChatbot(f)),
    onSuccess: (b) => {
      toast.thanhCong(bot ? 'Đã lưu cấu hình' : 'Đã tạo chatbot')
      xong(b)
    },
    onError: (e) => toast.loi(moTaLoi(e)),
  })

  const khongNguon = !f.knowledgeBaseIds.length && !f.sourceIds.length
  // Cùng phép so với máy chủ — `.trim() === '*'` — để màn hình không nói một đằng.
  const moMoiGoc = f.widget.allowedOrigins.some((x) => x.trim() === '*')

  // Vai quản trị bị loại: gán cho khung nhúng là mở mọi bảng cho bất kỳ ai xem trang.
  const danhMucVai = useQuery({ queryKey: KHOA_TL.vai, queryFn: layVaiQuyen, enabled: f.widget.enabled })
  const vaiChonDuoc = (danhMucVai.data?.accounts ?? [])
    .filter((a) => !a.canManage)
    .map((a) => ({ id: a.role, nhan: a.label || a.role }))

  const modelChonDuoc = (() => {
    const ds = (sucKhoe.data?.models ?? []).map((m) => ({ id: khoaModel(m), nhan: nhanModel(m) }))
    // Danh mục chưa về thì dựng mục tạm từ chính khoá, để không hiện chuỗi khoá thô.
    const dang = f.widget.model
    return dang && !ds.some((o) => o.id === dang) ? [...ds, { id: dang, nhan: nhanTuKhoa(dang) }] : ds
  })()

  const canhBaoModel = ((): LoiNhan => {
    if (!f.widget.model) return { chu: 'Để trống: bot nhúng dùng mô hình mặc định của máy chủ.', mau: 'xam' }
    if (sucKhoe.isLoading) return { chu: '', mau: 'xam' }
    if (sucKhoe.isError) {
      return {
        chu: 'Chưa tra được danh mục mô hình. Bot nhúng vẫn chạy — không kết luận được là mô hình này còn dùng được hay không.',
        mau: 'xam',
      }
    }
    // So bằng KHOÁ, không bằng provider: hai mục cùng provider là hai lựa chọn khác nhau.
    const m = sucKhoe.data?.models?.find((x) => khoaModel(x) === f.widget.model)
    if (!m) {
      return {
        chu: `Máy chủ không còn liệt kê “${nhanTuKhoa(f.widget.model)}”. Bot nhúng vẫn trả lời, nhưng bằng mô hình mặc định chứ không phải mô hình ghi ở đây. Chọn lại một bên trong danh sách.`,
        mau: 'warn',
      }
    }
    if (!m.available) {
      return {
        chu: `“${nhanModel(m)}” chưa có khoá API trên máy chủ — chọn nó thì bot nhúng KHÔNG trả lời được. Chọn bên khác, hoặc để trống để chạy bằng mặc định.`,
        mau: 'loi',
      }
    }
    return { chu: `Đang dùng ${nhanModel(m)}.`, mau: 'xam' }
  })()

  // Quyền khoá theo CẶP (vai, nguồn): tick ở nguồn A không có tác dụng ở nguồn B.
  const quyen = useQuery({
    queryKey: KHOA_TL.quyenHieuLuc(f.widget.vai),
    queryFn: () => layQuyenHieuLuc(f.widget.vai),
    enabled: f.widget.enabled && !!f.widget.vai,
  })

  const quyenVai = ((): LoiNhan => {
    const vai = f.widget.vai
    if (!vai)
      return {
        chu: 'Để trống: bot chỉ trả lời từ bộ tri thức, câu hỏi thường gặp và kịch bản — không chạm tới số liệu.',
        mau: 'xam',
      }
    if (!f.sourceIds.length) {
      return {
        chu: 'Bot này chưa gắn nguồn dữ liệu, nên chọn vai chưa có tác dụng gì. Gắn nguồn ở phần Nguồn dữ liệu phía trên.',
        mau: 'loi',
      }
    }
    const ten = (id: string) => nguonDuLieu.find((n) => n.id === id)?.ten ?? id
    if (quyen.isLoading) return { chu: 'Đang tra quyền của vai này trên nguồn của bot…', mau: 'xam' }
    if (quyen.isError)
      return { chu: 'Chưa tra được quyền của vai này. Kiểm lại ở màn Phân quyền dữ liệu.', mau: 'xam' }

    // Đọc `level` trước: mức `full` có `tables` RỖNG theo thiết kế, đếm bảng là báo sai.
    const ds = f.sourceIds.map((id) => {
      const g = (quyen.data?.sources ?? []).find((x) => x.sourceId === id)
      return { id, muc: g?.level ?? 'none', soBang: g?.tables.length ?? 0 }
    })
    const [x] = ds
    if (ds.length === 1 && x) {
      const nguon = ten(x.id)
      if (x.muc === 'none') {
        return {
          chu: `Vai “${vai}” chưa được cấp bảng nào trên nguồn “${nguon}” — bot nhúng sẽ không đọc được số liệu. Mở màn Phân quyền dữ liệu, chọn đúng nguồn này rồi cấp quyền.`,
          mau: 'loi',
        }
      }
      if (x.muc === 'full') {
        return {
          chu: `Vai “${vai}” đang mở TOÀN BỘ nguồn “${nguon}” — khách trên trang công khai đọc được mọi bảng, kể cả bảng thêm về sau. Cân nhắc chuyển sang mức “Theo bảng”.`,
          mau: 'loi',
        }
      }
      return {
        chu: `Vai “${vai}” đọc được ${x.soBang} bảng trên nguồn “${nguon}”. Khách trên trang công khai sẽ đọc được đúng những bảng đó.`,
        mau: 'warn',
      }
    }
    // Nhiều nguồn: một dòng tóm tắt, rồi chỉ gọi tên nguồn có vấn đề.
    const coVanDe = ds.filter((y) => y.muc === 'none' || y.muc === 'full')
    const dong = coVanDe
      .slice(0, 3)
      .map((y) =>
        y.muc === 'none'
          ? `“${ten(y.id)}”: chưa tick bảng nào — bot nhúng sẽ KHÔNG đọc được nguồn này.`
          : `“${ten(y.id)}”: mức TOÀN BỘ NGUỒN — khách vãng lai đọc được MỌI bảng, kể cả bảng đồng bộ về sau.`,
      )
    if (coVanDe.length > 3) dong.push(`…và ${coVanDe.length - 3} nguồn nữa.`)
    const ok = ds.length - ds.filter((y) => y.muc === 'none').length
    return {
      chu: [`Vai “${vai}” đọc được số liệu ở ${ok}/${ds.length} nguồn của bot.`, ...dong].join(' '),
      mau: coVanDe.length ? 'loi' : 'warn',
    }
  })()

  return (
    <div className="grid gap-5 rounded-card bg-nen p-5 shadow-card">
      <ConThieu
        f={f}
        batTat={(v) => dat('active', v)}
        suaDuoc={suaDuoc}
        botTuTat={!!bot && !bot.active && !bot.answerable}
      />

      <Muc ten="Thông tin cơ bản" icon={<Bot />} tone="brand">
        <OChu
          nhan="Tên chatbot *"
          giaTri={f.name}
          doi={(v) => dat('name', v)}
          khoa={!suaDuoc}
          goiY="Trợ lí vận hành nước sạch"
        />
        <OChu
          nhan="Mô tả ngắn"
          giaTri={f.shortDescription}
          doi={(v) => dat('shortDescription', v)}
          khoa={!suaDuoc}
          goiY="Trả lời câu hỏi vận hành và tra quy định nội bộ."
        />
        {/* Lời chào ở mục cơ bản: màn Trò chuyện với bot cũng vẽ trường này, không riêng khung nhúng. */}
        <OChu
          nhan="Lời chào"
          dong={2}
          giaTri={f.widget.greeting}
          doi={(v) => datW('greeting', v)}
          khoa={!suaDuoc}
          goiY="Xin chào! Tôi có thể giúp gì cho bạn?"
        />
        <OChu
          nhan="Mục đích sử dụng"
          dong={2}
          giaTri={f.purpose}
          doi={(v) => dat('purpose', v)}
          khoa={!suaDuoc}
          goiY="Phục vụ đội vận hành: tra số liệu thất thoát theo tháng và tra quy định bảo hành thiết bị."
        />
        <div>
          <p className="mb-1.5 text-[0.74rem] font-medium text-body">Phạm vi trả lời</p>
          <ChonThe giaTri={f.mode} doi={(v) => dat('mode', v)} khoa={!suaDuoc} muc={PHAM_VI} />
        </div>
        {/* Một công tắc, hai chiều tiếng: tách mic và loa cho ra hai tổ hợp không ai muốn. */}
        <div>
          <p className="mb-1.5 text-[0.74rem] font-medium text-body">Kênh giao tiếp</p>
          <ChonThe
            cot={3}
            giaTri={f.cheDoGiaoTiep}
            doi={(v) => dat('cheDoGiaoTiep', v)}
            khoa={!suaDuoc}
            muc={CHE_DO_GIAO_TIEP.map((m) => ({ ma: m, ...KENH[m] }))}
          />
          <p className="mt-1 text-[0.72rem] text-faint">
            Áp cho cả khung nhúng lẫn màn Trò chuyện với bot. Chữ luôn hiện ở cả ba lựa chọn.
          </p>
        </div>
        {/* Giọng nằm ở bản khai bot: khách vãng lai của khung nhúng không có chỗ nào để chọn. */}
        {f.cheDoGiaoTiep !== 'van_ban' && (
          <div>
            <p className="mb-1.5 text-[0.74rem] font-medium text-body">Giọng đọc</p>
            <ChonGiongBot
              danhSach={dsGiong}
              giong={f.giong ?? ''}
              doi={(v) => dat('giong', v)}
              khoa={!suaDuoc}
            />
            <p className="mt-1.5 text-[0.72rem] text-faint">
              {dsGiong.length
                ? 'Người xem khung nhúng không chọn được giọng, nên chọn ở đây.'
                : 'Máy chủ chưa có giọng nào — cần khoá Gemini.'}
            </p>
          </div>
        )}
      </Muc>

      <Muc
        icon={<Network />}
        tone="teal"
        ten="Nguồn tri thức đầu vào"
        mo="Bỏ trống cả hai nghĩa là bot không tra được gì — không phải tra tất cả."
      >
        {khongNguon && (
          <p className="flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-warn-tx">
            <TriangleAlert className="mt-px size-3.5 flex-none" />
            {f.mode === 'knowledge_only'
              ? 'Chưa chọn nguồn nào. Bot ở chế độ “trong phạm vi” sẽ trả lời “không tìm thấy” cho mọi câu, nên không bật được.'
              : 'Chưa chọn nguồn nào. Bot vẫn trả lời bằng kiến thức chung của mô hình, nhưng không câu nào quy về được tài liệu hay số liệu của tổ chức.'}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[0.74rem] font-medium text-body">Bộ tri thức (tài liệu)</p>
            <div className="flex flex-col items-start gap-2">
              {boTriThuc.length ? (
                boTriThuc.map((c) => (
                  <Tick
                    key={c.id}
                    chon={f.knowledgeBaseIds.includes(c.id)}
                    doi={() => bat('knowledgeBaseIds', c.id)}
                    khoa={!suaDuoc}
                  >
                    {c.ten}
                  </Tick>
                ))
              ) : (
                <p className="text-[0.72rem] text-faint">Chưa có bộ nào.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[0.74rem] font-medium text-body">
              Nguồn dữ liệu (số liệu)
              <span className="ml-1.5 font-normal text-faint">chọn một hoặc nhiều</span>
            </p>
            {/* Mỗi nguồn là một CSDL riêng: một lượt hỏi chạy một câu SQL trên TỪNG nguồn đã tích. */}
            <div className="flex flex-col items-start gap-2">
              {nguonDuLieu.length ? (
                nguonDuLieu.map((s) => (
                  <Tick
                    key={s.id}
                    chon={f.sourceIds.includes(s.id)}
                    doi={() => bat('sourceIds', s.id)}
                    khoa={!suaDuoc || (!f.sourceIds.includes(s.id) && f.sourceIds.length >= TRAN_NGUON)}
                  >
                    {s.ten} <span className="text-faint">({s.phu})</span>
                  </Tick>
                ))
              ) : (
                <p className="text-[0.72rem] text-faint">Chưa có nguồn nào.</p>
              )}
            </div>
            {f.sourceIds.length >= TRAN_NGUON && (
              <p className="mt-1.5 text-[0.72rem] text-faint">
                Tối đa {TRAN_NGUON} nguồn — mỗi nguồn là một lượt tra riêng cho MỖI câu hỏi.
              </p>
            )}
          </div>
        </div>

        <div className="mt-2">
          <p className="mb-1 text-[0.74rem] font-medium text-body">
            Trang web của tổ chức
            {!f.webDomains.length && (
              <span className="ml-2 font-normal text-faint">chưa khai — bot không tra web</span>
            )}
          </p>
          <p className="mb-1.5 text-[0.72rem] leading-relaxed text-faint">
            Dùng khi số liệu và tài liệu không trả lời được — ví dụ “bên bạn có giao hàng tỉnh không”.
          </p>
          <OChu
            nhan="Trang web của tổ chức"
            anNhan
            dong={2}
            khoa={!suaDuoc}
            goiY={'congty.com\ntin.congty.com'}
            giaTri={webNhap ?? f.webDomains.join('\n')}
            doi={(v) => {
              setWebNhap(v)
              dat(
                'webDomains',
                v
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }}
            onBlur={() => setWebNhap(null)}
          />
          <p className="mt-1 text-[0.72rem] text-faint">
            Mỗi dòng một tên miền, không kèm https:// và đường dẫn. Tên miền gốc gồm cả tên miền con. Tối đa
            20.
          </p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-faint">
            Khác với “Gốc được phép nhúng”: ô kia nói ai được NHÚNG khung chat, ô này nói bot được ĐỌC trang
            nào.
          </p>
        </div>
      </Muc>

      <Muc
        icon={<BookOpen />}
        tone="tim"
        gapDuoc
        tomTat={
          f.systemPrompt.trim()
            ? `${f.systemPrompt.trim().slice(0, 70)}…`
            : 'Chưa đặt — bot dùng giọng mặc định.'
        }
        ten="Hướng dẫn hệ thống"
        mo="Giọng điệu và phạm vi. Đây KHÔNG phải chỗ khai số liệu — số liệu tới từ bản sao, và một con số viết vào đây sẽ cũ đi mà không ai biết."
      >
        <OChu
          nhan="Hướng dẫn hệ thống"
          anNhan
          dong={5}
          giaTri={f.systemPrompt}
          doi={(v) => dat('systemPrompt', v)}
          khoa={!suaDuoc}
          goiY="Trả lời ngắn gọn, xưng “tôi”. Câu nào không có trong tài liệu hay số liệu thì nói thẳng là không biết."
        />
      </Muc>

      <Muc
        icon={<CircleHelp />}
        tone="brand"
        gapDuoc
        tomTat={f.faqs.length ? `${f.faqs.length} câu đã soạn sẵn.` : 'Chưa có câu nào.'}
        ten="Câu hỏi thường gặp"
        mo="Câu có sẵn câu trả lời, không cần tra. Dùng cho câu hỏi mà tra sẽ ra kết quả kém hơn một câu người viết."
      >
        <div className="grid gap-2">
          {f.faqs.map((q, i) => (
            <div key={i} className="flex gap-2">
              <div className="grid flex-1 gap-1.5">
                <OChu
                  nhan={`Câu hỏi ${i + 1}`}
                  anNhan
                  giaTri={q.question}
                  goiY="Câu hỏi"
                  khoa={!suaDuoc}
                  doi={(v) =>
                    dat(
                      'faqs',
                      f.faqs.map((x, j) => (j === i ? { ...x, question: v } : x)),
                    )
                  }
                />
                <OChu
                  nhan={`Câu trả lời ${i + 1}`}
                  anNhan
                  dong={2}
                  giaTri={q.answer}
                  goiY="Câu trả lời"
                  khoa={!suaDuoc}
                  doi={(v) =>
                    dat(
                      'faqs',
                      f.faqs.map((x, j) => (j === i ? { ...x, answer: v } : x)),
                    )
                  }
                />
              </div>
              {suaDuoc && (
                <button
                  type="button"
                  aria-label={`Xoá câu hỏi ${i + 1}`}
                  className={NUT_XOA}
                  onClick={() =>
                    dat(
                      'faqs',
                      f.faqs.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
          {suaDuoc && (
            <Button
              size="sm"
              variant="secondary"
              onPress={() => dat('faqs', [...f.faqs, { question: '', answer: '' }])}
              className="w-fit"
            >
              <Plus className="size-3.5" /> Thêm câu hỏi
            </Button>
          )}
        </div>
      </Muc>

      <Muc
        icon={<BookOpen />}
        tone="warn"
        gapDuoc
        tomTat={f.scenariosEnabled ? `${f.scenarios.length} kịch bản đang bật.` : 'Đang tắt.'}
        ten="Kịch bản"
        mo="Câu vào khớp thì đi theo một quy trình nhiều bước. Khác câu hỏi thường gặp ở chỗ nó khớp theo tình huống chứ không theo một câu."
      >
        <CongTac bat={f.scenariosEnabled} doi={(v) => dat('scenariosEnabled', v)} khoa={!suaDuoc}>
          Bật kịch bản cho bot này
        </CongTac>
        {f.scenariosEnabled && (
          <div className="grid gap-2">
            {/* Thẻ TÓM TẮT chứ không mở sẵn: một kịch bản có tới năm phần. */}
            {f.scenarios.map((k, i) => (
              <div key={i} className="flex items-start gap-2 rounded-[9px] border border-line p-2.5">
                <button
                  type="button"
                  disabled={!suaDuoc}
                  onClick={() => setSuaKb(i)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[0.74rem] font-medium text-ink">
                    {k.name || <span className="text-faint">(chưa đặt tên)</span>}
                  </p>
                  {k.trigger && <p className="truncate text-[0.72rem] text-body">{k.trigger}</p>}
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-[0.72rem] text-faint">
                    <span>{soThuThap(k)} thông tin bắt buộc</span>
                    <span>· {k.steps?.length ?? 0} bước</span>
                    <span>· {k.rules?.length ?? 0} quy tắc</span>
                    {!k.steps?.length && !k.reply && <span className="text-warn-tx">· chưa có bước nào</span>}
                  </p>
                </button>
                {suaDuoc && (
                  <button
                    type="button"
                    aria-label={`Xoá kịch bản ${k.name || i + 1}`}
                    className={NUT_XOA}
                    onClick={() =>
                      dat(
                        'scenarios',
                        f.scenarios.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {suaDuoc && (
              <Button size="sm" variant="secondary" onPress={() => setSuaKb('moi')} className="w-fit">
                <Plus className="size-3.5" /> Thêm kịch bản
              </Button>
            )}
          </div>
        )}
      </Muc>

      <Muc
        ten="Khác"
        gapDuoc
        tomTat={f.saveHistory ? 'Có lưu lịch sử hội thoại.' : 'KHÔNG lưu lịch sử hội thoại.'}
      >
        <CongTac bat={f.saveHistory} doi={(v) => dat('saveHistory', v)} khoa={!suaDuoc}>
          Lưu lịch sử hội thoại
        </CongTac>
      </Muc>

      <Muc
        ten="Khung chat nhúng"
        gapDuoc
        tomTat={
          f.widget.enabled
            ? moMoiGoc
              ? 'Đang bật · MỌI gốc nhúng được'
              : `Đang bật · ${f.widget.allowedOrigins.length} gốc được phép`
            : 'Đang tắt'
        }
      >
        <div className="rounded-[9px] border border-warn bg-warn-bg p-3">
          <p className="flex items-center gap-1.5 text-[0.74rem] font-medium text-warn-tx">
            <TriangleAlert className="size-3.5" />
            Chưa hoạt động
          </p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-body">
            Bong bóng chat chỉ hiện khi đủ ba thứ: khung nhúng đang mở, gốc của trang có trong danh sách dưới
            đây, và đoạn mã dán đúng nguyên văn.
          </p>
        </div>

        {/* Công tắc RIÊNG với `active`: bot chạy trong hệ thống ≠ bot trả lời cả internet. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[9px] border border-line p-3">
          <div>
            <p className="text-[0.74rem] font-medium text-ink">Mở khung nhúng ra ngoài</p>
            <p className="text-[0.72rem] leading-relaxed text-body">
              Bot đang chạy trong hệ thống vẫn có thể chưa mở ra internet.
            </p>
          </div>
          <CongTac bat={f.widget.enabled} doi={(v) => datW('enabled', v)} khoa={!suaDuoc}>
            {f.widget.enabled ? 'Đang mở' : 'Đang đóng'}
          </CongTac>
        </div>

        <div className="rounded-[9px] border border-line bg-bg p-3 text-[0.72rem] leading-relaxed text-body">
          <p className="mb-1 font-medium text-ink">Khoá nhúng không phải mật khẩu</p>
          Nó nằm trong mã trang nên ai xem nguồn cũng đọc được.
          <ul className="mt-1 grid gap-0.5 pl-4">
            <li className="list-disc">
              <b>Danh sách gốc</b> chặn trang khác nhúng bot, nhưng không cản được người gọi bằng công cụ dòng
              lệnh.
            </li>
            <li className="list-disc">
              <b>Giới hạn mỗi phút</b> là hàng rào duy nhất còn tác dụng với những người ấy.
            </li>
          </ul>
        </div>

        {f.widget.embedKey ? (
          <KhoiNhung
            khoa={f.widget.embedKey}
            botId={bot?.id ?? null}
            suaDuoc={suaDuoc}
            daXoay={(moi) => datW('embedKey', moi)}
          />
        ) : (
          <p className="rounded-[9px] bg-bg px-3 py-2 text-[0.72rem] text-body">
            Khoá nhúng được sinh khi lưu lần đầu với khung nhúng đang mở.
          </p>
        )}

        {/* rỗng = chưa ai khai · `*` = cố tình mở · danh sách = đóng trừ những gốc này. */}
        <div>
          <p className="mb-1 text-[0.74rem] font-medium text-body">
            Gốc được phép nhúng
            {moMoiGoc ? (
              <span className="ml-2 font-normal text-canh-bao">
                đang là * — MỌI trang trên internet nhúng được
              </span>
            ) : !f.widget.allowedOrigins.length ? (
              <span className="ml-2 font-normal text-warn-tx">
                đang rỗng — nghĩa là KHÔNG gốc nào nhúng được
              </span>
            ) : null}
          </p>
          <OChu
            nhan="Gốc được phép nhúng"
            anNhan
            dong={3}
            khoa={!suaDuoc}
            goiY={'https://congty.com\nhttps://tra-cuu.congty.com\n\nhoặc một dòng *  để mở cho mọi gốc'}
            giaTri={gocNhap ?? f.widget.allowedOrigins.join('\n')}
            doi={(v) => {
              setGocNhap(v)
              datW(
                'allowedOrigins',
                v
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }}
            onBlur={() => setGocNhap(null)}
          />
          <p className="mt-1 text-[0.72rem] text-faint">
            Mỗi dòng một gốc, dạng https://tenmien.com. Một dòng * mở cho mọi gốc.
          </p>
          {moMoiGoc && (
            <div className="mt-2 flex items-start gap-1.5 rounded-[9px] border border-canh-bao bg-canh-bao-bg px-3 py-2 text-[0.72rem] leading-relaxed text-canh-bao">
              <TriangleAlert className="mt-px size-3.5 flex-none" />
              <span>
                <b>Đang mở cho mọi gốc.</b> Bất kỳ trang nào trên internet cũng nhúng được bot này. Hàng rào
                còn lại chỉ là giới hạn mỗi phút bên dưới.
              </span>
            </div>
          )}
        </div>

        {/* Vai của bot nhúng — không gợi ý, không chọn nhanh: chọn một vai là mở số liệu cho khách vãng lai. */}
        <div className="grid gap-1">
          <p className="text-[0.74rem] font-medium text-body">Vai của bot nhúng</p>
          <ChonDon
            nhan="Vai của bot nhúng"
            giaTri={f.widget.vai}
            doi={(v) => datW('vai', v)}
            khoa={!suaDuoc}
            muc={vaiChonDuoc}
            trong="Không đọc số liệu (khuyến nghị)"
          />
          <span className={`text-[0.72rem] ${MAU_CHU[quyenVai.mau]}`}>{quyenVai.chu}</span>
        </div>

        {/* Mô hình đứng cạnh vai và trần: ba quyết định về giá và rủi ro của một điểm cuối công khai. */}
        <div className="grid gap-1">
          <p className="text-[0.74rem] font-medium text-body">Mô hình trả lời cho bot nhúng</p>
          <ChonDon
            nhan="Mô hình trả lời cho bot nhúng"
            giaTri={f.widget.model}
            doi={(v) => datW('model', v)}
            khoa={!suaDuoc}
            muc={modelChonDuoc}
            trong={
              tenModel(sucKhoe.data?.model, sucKhoe.data?.models, sucKhoe.data?.provider) ||
              'Mặc định của máy chủ'
            }
          />
          {canhBaoModel.chu && (
            <span className={`text-[0.72rem] ${MAU_CHU[canhBaoModel.mau]}`}>{canhBaoModel.chu}</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <OChu
            nhan="Số câu hỏi mỗi phút — tất cả khách"
            kieu="number"
            khoa={!suaDuoc}
            giaTri={String(f.widget.rateLimitPerMinute)}
            doi={(v) => datW('rateLimitPerMinute', Math.max(1, Number(v) || 1))}
          />
          <div>
            <OChu
              nhan="Số câu hỏi mỗi phút — mỗi khách"
              kieu="number"
              khoa={!suaDuoc}
              giaTri={String(f.widget.rateLimitPerIpPerMinute)}
              doi={(v) => datW('rateLimitPerIpPerMinute', Math.max(1, Number(v) || 1))}
            />
            <span className="mt-0.5 block text-[0.72rem] text-faint">
              Cần cả hai: thiếu giới hạn cho mỗi khách thì một người dùng hết phần chung.
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <OChu
            nhan="Tiêu đề khung"
            giaTri={f.widget.title}
            doi={(v) => datW('title', v)}
            khoa={!suaDuoc}
            goiY="Trợ lí vận hành"
          />
          <div className="text-[0.74rem] font-medium text-body">
            <p>Màu chủ đạo</p>
            <div className="mt-1 flex items-center gap-2">
              {/* Ô chọn màu gốc của trình duyệt: có ống hút màu và bộ chọn hệ điều hành. */}
              <input
                type="color"
                disabled={!suaDuoc}
                aria-label="Chọn màu chủ đạo"
                value={mauSauChuSo(f.widget.primaryColor)}
                onChange={(e) => datW('primaryColor', e.target.value)}
                className="size-9 flex-none cursor-pointer rounded border border-line bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {/* Ô chữ ở lại: mã hex dán được từ hướng dẫn thương hiệu. */}
              <OChu
                nhan="Màu chủ đạo"
                anNhan
                giaTri={f.widget.primaryColor}
                doi={(v) => datW('primaryColor', v)}
                khoa={!suaDuoc}
                goiY={WIDGET_MAU_MAC_DINH}
                className="flex-1"
              />
            </div>
            {f.widget.primaryColor && !MAU_HOP_LE.test(f.widget.primaryColor.trim()) && (
              <span className="mt-0.5 block font-normal text-canh-bao">
                Mã màu phải dạng #2563EB hoặc #25B. Máy chủ từ chối dạng khác.
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(['bottom-right', 'bottom-left'] as WidgetPosition[]).map((v) => (
            <button
              key={v}
              type="button"
              disabled={!suaDuoc}
              aria-pressed={f.widget.position === v}
              onClick={() => datW('position', v)}
              className={`rounded-[9px] border px-3 py-1.5 text-[0.74rem] transition-colors disabled:opacity-60 ${
                f.widget.position === v
                  ? 'border-brand bg-tint-brand font-medium text-brand'
                  : 'border-line text-body hover:bg-nav-hover'
              }`}
            >
              {v === 'bottom-right' ? 'Góc dưới phải' : 'Góc dưới trái'}
            </button>
          ))}
        </div>
      </Muc>

      {suaDuoc && (
        // Ghim đáy: biểu mẫu dài hơn một màn hình, nút Lưu ở cuối luồng là dễ quên lưu.
        // Lề phải rộng để nút Lưu không nằm dưới nút trợ lý nổi của portal.
        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap items-center justify-between gap-2 rounded-b-card border-t border-line bg-nen/95 py-3 pl-5 pr-5 backdrop-blur sm:pr-20">
          {xoa ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="danger" onPress={xoa}>
                Xoá chatbot
              </Button>
              {bot?.answerable && (
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    void navigate({
                      to: '/$chucNang',
                      params: { chucNang: 'tl-tro-chuyen' },
                      search: { ma: bot.id },
                    })
                  }
                >
                  <MessageSquare className="size-3.5" /> Thử trò chuyện
                </Button>
              )}
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onPress={huy}>
              Huỷ
            </Button>
            <Button
              size="sm"
              variant="primary"
              isDisabled={!f.name.trim()}
              isPending={luu.isPending}
              onPress={() => luu.mutate()}
            >
              {bot ? 'Lưu' : 'Tạo chatbot'}
            </Button>
          </div>
        </div>
      )}

      {suaKb !== null && (
        <KichBanDialog
          key={String(suaKb)}
          khoa={!suaDuoc}
          banDau={suaKb === 'moi' ? null : { ...KICH_BAN_RONG, ...f.scenarios[suaKb] }}
          dong={() => setSuaKb(null)}
          luu={(k) => {
            dat(
              'scenarios',
              suaKb === 'moi' ? [...f.scenarios, k] : f.scenarios.map((x, j) => (j === suaKb ? k : x)),
            )
            setSuaKb(null)
          }}
        />
      )}
    </div>
  )
}
