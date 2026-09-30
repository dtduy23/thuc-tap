/**
 * Xử lý văn bản › Soạn thảo văn bản — soạn văn bản hành chính theo mẫu NĐ30 bằng AI của
 * FOXAI Native (`/compose`). Nguồn: văn bản đã tóm tắt trong GDOS, hoặc tệp tải lên (Native
 * trích chữ). Mẫu "điền trường" xem trước ngay khi gõ; mẫu "AI viết thân" bấm nút để soạn.
 * Vào từ màn Tóm tắt qua `?nguon=<mã văn bản>`. Bố cục theo màn cũ ở gdos.fox.ai.vn.
 */
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ganHtmlSach } from '@/lib/html-sach'
import { LoiApi } from '@/lib/http'
import { goiYTruong, soanThao, trichChu, truyVanMau, type TruongMau } from '@/lib/native-vb'
import {
  THE_THUC_RONG,
  ghepKhung,
  giaTriHienThi,
  locHtml,
  sangTheThucDung,
  thoatHtml,
  xuatDoc,
  type TheThucDung,
} from '@/lib/the-thuc-nd30'
import { truyVanChiTietVanBan, truyVanVanBan } from '@/lib/van-ban'
import { Nut, ThongBao } from '@/ui/co-ban'
import { BieuTuong, ChonCheDo, LOP_NHAN, LOP_O_NHO, useSanSangNative } from './chung'
import { KhoiTheThuc, MatBan, ThanhDinhDang } from './soan-giay'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const TOI_DA_BYTE = 20 * 1024 * 1024

/** Bảy yếu tố thể thức phải có trước khi nhờ AI viết thân. */
const BAT_BUOC: [keyof TheThucDung, string][] = [
  ['cqch', 'Cơ quan chủ quản'],
  ['cq', 'Tên cơ quan ban hành'],
  ['so', 'Số văn bản'],
  ['kyhieu', 'Ký hiệu cơ quan'],
  ['dd', 'Địa danh'],
  ['ky', 'Người ký'],
  ['cv', 'Chức vụ'],
]

/** "HUONG_DAN_Giao_viec(1).pdf" → "HUONG DAN Giao viec" — Native lấy làm trích yếu. */
const donTenTep = (ten: string) =>
  ten
    .replace(/\.[^.]+$/, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || ten

interface Nguon {
  tieuDe: string
  noiDung: string
}

type CheDo = 'danh-sach' | 'tai-len'

export default function SoanThaoVanBan() {
  const tv: { nguon?: string } = useSearch({ strict: false })
  const { san, canhBao } = useSanSangNative()
  const [cheDo, datCheDo] = useState<CheDo>('danh-sach')
  const [maNguon, datMaNguon] = useState(tv.nguon ?? '')
  const [tepNguon, datTepNguon] = useState<Nguon | null>(null)
  const [dangTrich, datDangTrich] = useState(false)
  const [maMau, datMaMau] = useState('')
  const [tho, datTho] = useState<TheThucDung>(THE_THUC_RONG)
  const [giaTri, datGiaTri] = useState<Record<string, string>>({})
  /** Bản Native trả về (hoặc bản đã "đóng băng" để sửa tay). */
  const [banSinh, datBanSinh] = useState<string | null>(null)
  const [dangSua, datDangSua] = useState(false)
  const [dangChay, datDangChay] = useState<'soan' | 'goi-y' | null>(null)
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const luotTrich = useRef(0)

  const qVb = useQuery(truyVanVanBan)
  const dsNguon = (qVb.data ?? []).filter((v) => v.trangThai === 'xong')
  const qChiTiet = useQuery({
    ...truyVanChiTietVanBan(maNguon),
    enabled: cheDo === 'danh-sach' && maNguon !== '',
  })
  const qMau = useQuery({ ...truyVanMau, enabled: san })
  const dsMau = (qMau.data?.data ?? []).filter((m) => m.status === 'DANG_DUNG')
  const mau = dsMau.find((m) => m.id === maMau) ?? null
  const truong: TruongMau[] = mau?.fields ?? []
  const ghepTruong = mau?.compose_mode === 'FIELD_FILL'
  const aiDienDuoc = truong.some((t) => t.ai_fill !== false)

  const nguon: Nguon | null =
    cheDo === 'tai-len'
      ? tepNguon
      : qChiTiet.data
        ? { tieuDe: qChiTiet.data.ten, noiDung: qChiTiet.data.tomTat || qChiTiet.data.noiDungGoc || '' }
        : null
  /** Bản tóm tắt ngắn và sạch hơn bản gốc nên ưu tiên làm đầu vào cho AI. */
  const chuNguon = (nguon?.noiDung ?? '').trim()

  /** Bỏ bản đã soạn — khi đổi nguồn hoặc đổi mẫu, bản cũ không còn đúng. */
  const boBanSinh = () => {
    datBanSinh(null)
    datDangSua(false)
  }
  /** Chọn mẫu → đổ thể thức mặc định, dựng bộ giá trị trống theo trường. */
  const chonMau = (id: string) => {
    datMaMau(id)
    const m = dsMau.find((x) => x.id === id)
    datTho(m ? sangTheThucDung(m.default_meta) : THE_THUC_RONG)
    datGiaTri(Object.fromEntries((m?.fields ?? []).map((t) => [t.key, ''])))
    boBanSinh()
  }

  /** Mẫu điền trường: ghép `{{key}}` tại chỗ + khung thể thức, như Native làm. */
  let xemTaiCho: string | null = null
  if (ghepTruong && mau?.body_template) {
    const hien = giaTriHienThi(giaTri, truong)
    const than = locHtml(mau.body_template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k: string) =>
      thoatHtml(hien[k] ?? '').replace(/\n/g, '<br>'),
    )
    xemTaiCho = ghepKhung(than, tho, mau.name, mau.symbol_code)
  }
  const xemTruoc = banSinh ?? xemTaiCho

  /** Đổi ô bên trái → bỏ bản đóng băng, về xem trước tại chỗ (chỉ mẫu điền trường). */
  const boDongBang = () => {
    if (!ghepTruong) return
    datBanSinh(null)
    datDangSua(false)
  }

  const docTep = async (tep: File) => {
    const luot = ++luotTrich.current
    const that = (cau: string) => {
      if (luot !== luotTrich.current) return
      datDangTrich(false)
      datTepNguon(null)
      datTb({ ok: false, cau })
    }
    if (!/\.(txt|md|pdf|docx)$/i.test(tep.name))
      return that('Định dạng không hỗ trợ. Chỉ nhận PDF, DOCX, TXT, MD.')
    if (tep.size > TOI_DA_BYTE) return that('Tệp vượt quá 20 MB.')
    datTb(undefined)
    datTepNguon(null)
    datDangTrich(true)
    const xong = (chu: string) => {
      if (luot !== luotTrich.current) return
      datDangTrich(false)
      if (!chu.trim()) return that('Không đọc được nội dung tệp. PDF scan cần bản nhận dạng được chữ.')
      datTepNguon({ tieuDe: donTenTep(tep.name), noiDung: chu })
      boBanSinh()
    }
    try {
      if (/\.(txt|md)$/i.test(tep.name)) return xong(await tep.text())
      const du = new FormData()
      du.append('file', tep)
      xong((await trichChu(du)).text)
    } catch (e) {
      that(loiCua(e, 'Không đọc được tệp.'))
    }
  }

  const goiY = async () => {
    if (!mau || !chuNguon) return
    datDangChay('goi-y')
    datTb(undefined)
    try {
      const kq = await goiYTruong(mau.id, chuNguon)
      datGiaTri((g) => ({ ...g, ...kq.values }))
      boDongBang()
      datTb({ ok: true, cau: 'AI đã gợi ý giá trị các trường — bạn có thể chỉnh lại.' })
    } catch (e) {
      datTb({ ok: false, cau: loiCua(e, 'AI chưa gợi ý được.') })
    } finally {
      datDangChay(null)
    }
  }

  const chay = async () => {
    datTb(undefined)
    if (!mau) return datTb({ ok: false, cau: 'Chọn mẫu văn bản trước khi soạn.' })
    if (dangTrich) return datTb({ ok: false, cau: 'Đang đọc nội dung tệp, vui lòng đợi.' })
    if (!ghepTruong) {
      if (chuNguon.length < 10)
        return datTb({ ok: false, cau: 'Chọn văn bản nguồn có nội dung đủ dài để AI soạn thảo.' })
      const thieu = BAT_BUOC.filter(([k]) => String(tho[k]).trim() === '').map(([, n]) => n)
      if (thieu.length) return datTb({ ok: false, cau: `Nhập đủ thông tin thể thức: ${thieu.join(', ')}.` })
    } else {
      const thieu = truong.filter((t) => t.required && !(giaTri[t.key] ?? '').trim()).map((t) => t.label)
      if (thieu.length) return datTb({ ok: false, cau: `Điền các trường bắt buộc: ${thieu.join(', ')}.` })
    }
    datDangChay('soan')
    try {
      const kq = await soanThao({
        template_id: mau.id,
        ...(chuNguon ? { source_content: chuNguon } : {}),
        ...(nguon?.tieuDe ? { source_title: nguon.tieuDe } : {}),
        ...(truong.length ? { values: giaTri } : {}),
        // Luôn gửi thể thức: trống thì Native lấy `default_meta` của mẫu.
        cqch: tho.cqch.trim(),
        cq: tho.cq.trim(),
        so: tho.so.trim(),
        kyhieu: tho.kyhieu.trim(),
        dd: tho.dd.trim(),
        ky: tho.ky.trim(),
        cv: tho.cv.trim(),
        noinhan: tho.noinhan.trim(),
      })
      datBanSinh(locHtml(kq.html))
      datDangSua(false)
      datTb(
        kq.missing_keys?.length
          ? { ok: false, cau: `Văn bản còn trường chưa điền: ${kq.missing_keys.join(', ')}.` }
          : { ok: true, cau: 'Đã soạn xong — xem và chỉnh ở khung bên phải.' },
      )
    } catch (e) {
      datTb({ ok: false, cau: loiCua(e, 'Chưa soạn được văn bản.') })
    } finally {
      datDangChay(null)
    }
  }

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Soạn văn bản hành chính theo mẫu thể thức Nghị định 30/2020/NĐ-CP bằng AI của FOXAI Native.
      </p>
      {canhBao}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,410px)_minmax(0,1fr)]">
        <div className="grid content-start gap-4 xl:max-h-[calc(100vh-190px)] xl:overflow-y-auto xl:pr-1">
          <KhungThe tieuDe="Thiết lập soạn thảo" bieuTuong="ai">
            <ChonCheDo<CheDo>
              giaTri={cheDo}
              doi={(c) => {
                datCheDo(c)
                boBanSinh()
              }}
              muc={[
                { id: 'danh-sach', nhan: 'Chọn từ Tóm tắt văn bản' },
                { id: 'tai-len', nhan: 'Tải tệp lên' },
              ]}
            />
            <div className="mt-3">
              {cheDo === 'danh-sach' ? (
                <>
                  <label htmlFor="st-nguon" className={LOP_NHAN}>
                    Văn bản nguồn
                  </label>
                  <select
                    id="st-nguon"
                    value={maNguon}
                    onChange={(e) => {
                      datMaNguon(e.target.value)
                      boBanSinh()
                    }}
                    className={LOP_O_NHO}
                  >
                    <option value="">— Chọn văn bản đã tóm tắt —</option>
                    {dsNguon.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.ten}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 mb-0 text-[11.5px] text-faint">
                    Chỉ liệt kê văn bản đã tóm tắt xong. Bản tóm tắt được dùng làm đầu vào cho AI vì ngắn và
                    sạch hơn.
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="st-tep" className={LOP_NHAN}>
                    Tệp nguồn (PDF, DOCX, TXT, MD — tối đa 20 MB)
                  </label>
                  <input
                    id="st-tep"
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    disabled={!san}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void docTep(f)
                    }}
                    className="w-full text-[13px]"
                  />
                  {dangTrich && <p className="mt-1 mb-0 text-[12px] text-brand">Đang đọc nội dung tệp…</p>}
                  {tepNguon && (
                    <p className="mt-1.5 mb-0 flex items-center gap-1.5 text-[12px] text-brand">
                      <BieuTuong ten="kep" co={14} /> {tepNguon.tieuDe}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-3">
              <label htmlFor="st-mau" className={LOP_NHAN}>
                Mẫu văn bản
              </label>
              <select
                id="st-mau"
                value={maMau}
                disabled={!san || qMau.isPending}
                onChange={(e) => chonMau(e.target.value)}
                className={LOP_O_NHO}
              >
                <option value="">{qMau.isPending && san ? 'Đang tải mẫu…' : '— Chọn mẫu văn bản —'}</option>
                {dsMau.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {mau && (
                <p className="mt-1 mb-0 text-[11.5px] text-faint">
                  {ghepTruong
                    ? 'Mẫu điền theo trường — xem trước cập nhật ngay khi gõ.'
                    : 'Mẫu để AI viết thân văn bản theo thể thức — cần văn bản nguồn rồi bấm nút soạn.'}
                </p>
              )}
            </div>

            {nguon && (
              <div className="mt-3">
                <span className={LOP_NHAN}>Nội dung nguồn đang dùng</span>
                <p className="m-0 max-h-28 overflow-y-auto rounded-lg border border-line bg-nen-2 px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap text-body">
                  {nguon.noiDung || 'Chưa đọc được nội dung.'}
                </p>
              </div>
            )}
          </KhungThe>

          {mau && (
            <KhungThe tieuDe="Thông tin thể thức" bieuTuong="van">
              <KhoiTheThuc
                tho={tho}
                doi={(k, v) => {
                  datTho((t) => ({ ...t, [k]: v }))
                  boDongBang()
                }}
                khoa={dangChay !== null}
                batBuoc={!ghepTruong}
                tienTo="st"
              />
            </KhungThe>
          )}

          {mau && truong.length > 0 && (
            <KhungThe tieuDe="Nội dung cần điền theo mẫu" bieuTuong="viec">
              {aiDienDuoc && (
                <Nut
                  className="mb-3 w-full"
                  disabled={!nguon || dangChay !== null}
                  onClick={() => void goiY()}
                >
                  <BieuTuong ten="ai" co={16} />{' '}
                  {dangChay === 'goi-y' ? 'AI đang gợi ý…' : 'AI gợi ý giá trị các trường'}
                </Nut>
              )}
              {truong.map((t) => (
                <ODienTruong
                  key={t.key}
                  t={t}
                  giaTri={giaTri[t.key] ?? ''}
                  doi={(v) => {
                    datGiaTri((g) => ({ ...g, [t.key]: v }))
                    boDongBang()
                  }}
                />
              ))}
            </KhungThe>
          )}

          <Nut
            kieu="chinh"
            className="w-full py-2.5"
            disabled={!san || dangChay !== null || dangTrich}
            onClick={() => void chay()}
          >
            <BieuTuong ten={ghepTruong ? 'tich' : 'ai'} co={16} />
            {dangChay === 'soan'
              ? 'AI đang soạn thảo…'
              : dangTrich
                ? 'Đang đọc tệp…'
                : ghepTruong
                  ? 'Tạo văn bản hoàn chỉnh'
                  : 'AI xử lý — Soạn thảo văn bản'}
          </Nut>
        </div>

        <KhungXemTruoc
          html={xemTruoc}
          tenMau={mau?.name ?? 'Văn bản'}
          dangSua={dangSua}
          batDauSua={() => {
            if (banSinh === null && xemTaiCho !== null) datBanSinh(xemTaiCho)
            datDangSua(true)
          }}
          xongSua={(html) => {
            datBanSinh(locHtml(html))
            datDangSua(false)
          }}
          bao={datTb}
        />
      </div>
    </>
  )
}

function KhungThe({
  tieuDe,
  bieuTuong,
  children,
}: {
  tieuDe: string
  bieuTuong: 'ai' | 'van' | 'viec'
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[12px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)]">
      <h2 className="m-0 flex items-center gap-2 border-b border-line px-4 py-2.5 text-[13.5px] font-bold text-ink">
        <span className="text-brand">
          <BieuTuong ten={bieuTuong} co={16} />
        </span>
        {tieuDe}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  )
}

function ODienTruong({ t, giaTri, doi }: { t: TruongMau; giaTri: string; doi: (v: string) => void }) {
  const id = `st-truong-${t.key}`
  const kieu = t.type ?? 'TEXT'
  return (
    <div className="mb-3">
      <label htmlFor={id} className={LOP_NHAN}>
        {t.label}
        {t.required && <span className="text-danger"> *</span>}
      </label>
      {kieu === 'SELECT' ? (
        <select id={id} value={giaTri} onChange={(e) => doi(e.target.value)} className={LOP_O_NHO}>
          <option value="">— Chọn —</option>
          {(t.options ?? []).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ) : kieu === 'TEXTAREA' ? (
        <textarea
          id={id}
          rows={3}
          value={giaTri}
          placeholder={t.hint ?? ''}
          onChange={(e) => doi(e.target.value)}
          className={LOP_O_NHO}
        />
      ) : (
        <input
          id={id}
          type={kieu === 'DATE' ? 'date' : kieu === 'NUMBER' ? 'number' : 'text'}
          value={giaTri}
          placeholder={kieu === 'DATE' ? undefined : (t.hint ?? '')}
          onChange={(e) => doi(e.target.value)}
          className={LOP_O_NHO}
        />
      )}
      {t.hint && kieu !== 'TEXT' && kieu !== 'TEXTAREA' && (
        <p className="mt-1 mb-0 text-[11.5px] text-faint">{t.hint}</p>
      )}
    </div>
  )
}

/** Khung phải — tờ A4 hiện bản đã soạn; sửa tay được, sao chép, xuất .doc. */
function KhungXemTruoc({
  html,
  tenMau,
  dangSua,
  batDauSua,
  xongSua,
  bao,
}: {
  html: string | null
  tenMau: string
  dangSua: boolean
  batDauSua: () => void
  xongSua: (html: string) => void
  bao: (tb: { ok: boolean; cau: string }) => void
}) {
  const giay = useRef<HTMLDivElement>(null)
  // contentEditable là uncontrolled — chỉ gán lại khi nội dung nguồn đổi.
  useEffect(() => {
    if (giay.current && html !== null && giay.current.innerHTML !== html) ganHtmlSach(giay.current, html)
  }, [html])

  const chep = async () => {
    try {
      await navigator.clipboard.writeText(giay.current?.innerText ?? '')
      bao({ ok: true, cau: 'Đã sao chép nội dung văn bản.' })
    } catch {
      bao({ ok: false, cau: 'Trình duyệt không cho sao chép tự động — bôi đen rồi sao chép thủ công.' })
    }
  }

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[12px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,30,54,.06),0_4px_14px_rgba(16,30,54,.05)] xl:max-h-[calc(100vh-190px)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-nen-2 px-4 py-2.5">
        <b className="flex items-center gap-2 text-[13.5px] text-ink">
          <span className="text-brand">
            <BieuTuong ten="van" co={16} />
          </span>
          Văn bản sau khi soạn thảo
        </b>
        {html !== null && (
          <span className="flex flex-wrap gap-2">
            {dangSua ? (
              <Nut kieu="chinh" onClick={() => xongSua(giay.current?.innerHTML ?? '')}>
                <BieuTuong ten="tich" co={15} /> Hoàn tất sửa
              </Nut>
            ) : (
              <Nut onClick={batDauSua}>
                <BieuTuong ten="sua" co={15} /> Sửa văn bản
              </Nut>
            )}
            <Nut onClick={() => void chep()}>
              <BieuTuong ten="chep" co={15} /> Sao chép
            </Nut>
            <Nut
              kieu="chinh"
              onClick={() =>
                xuatDoc(
                  `${tenMau} - ${new Date().toISOString().slice(0, 10)}`,
                  tenMau,
                  giay.current?.innerHTML ?? '',
                )
              }
            >
              <BieuTuong ten="tai" co={15} /> Xuất tệp .doc
            </Nut>
          </span>
        )}
      </div>
      {dangSua && <ThanhDinhDang />}
      {html === null ? (
        <div className="grid flex-1 place-items-center p-10 text-center text-[13px] leading-relaxed text-faint">
          <p className="m-0 max-w-sm">
            Chọn <b className="text-body">mẫu văn bản</b> ở bên trái. Mẫu{' '}
            <b className="text-body">điền theo trường</b> xem trước ngay khi gõ; mẫu{' '}
            <b className="text-body">AI soạn</b> cần chọn văn bản nguồn rồi bấm nút soạn.
          </p>
        </div>
      ) : (
        <MatBan>
          <div
            ref={giay}
            contentEditable={dangSua}
            suppressContentEditableWarning
            spellCheck={false}
            role={dangSua ? 'textbox' : undefined}
            aria-multiline={dangSua ? 'true' : undefined}
            aria-label={dangSua ? 'Nội dung văn bản đã soạn' : undefined}
            className={`giay-a4 ${dangSua ? 'ring-2 ring-brand/40' : ''}`}
          />
        </MatBan>
      )}
    </section>
  )
}
