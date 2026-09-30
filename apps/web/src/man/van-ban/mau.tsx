/**
 * Xử lý văn bản › Mẫu văn bản — mẫu hành chính theo thể thức NĐ 30/2020/NĐ-CP, dùng cho
 * Soạn thảo văn bản. Dữ liệu là của FOXAI Native (`/document-templates`), GDOS gọi qua
 * cổng chuyển tiếp bằng tài khoản Native của chính người dùng (ADR-0009). Bố cục theo màn
 * cũ ở gdos.fox.ai.vn; lọc theo chuẩn lưới.
 */
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NATIVE_VB,
  NHAN_KIEU_TRUONG,
  NHAN_NGUON_MAU,
  NHAN_TRANG_THAI_MAU,
  suaMau,
  taoMau,
  taoXemTruocMau,
  truyVanChiTietMau,
  truyVanMau,
  xoaMau,
  type KieuTruong,
  type MauVanBan,
  type NguonMau,
  type ThamSoMau,
  type TrangThaiMau,
  type TruongMau,
} from '@/lib/native-vb'
import { truyVanToi } from '@/lib/phien'
import {
  THE_THUC_RONG,
  coTheThuc,
  khoaDuyNhat,
  khoaMoCoi,
  sangTheThucDung,
  sangTheThucMau,
  thanSangMau,
  xemTruocMau,
  type TheThucDung,
} from '@/lib/the-thuc-nd30'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { HtmlSach } from '@/ui/html-sach'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import {
  BieuTuong,
  HopThoai,
  LOP_NHAN,
  LOP_O_NHO,
  LuoiKpi,
  NutIcon,
  TheKpi,
  TieuDeKhoi,
  useSanSangNative,
} from './chung'
import { KhoiTheThuc } from './soan-giay'
import { SoanThanMau } from './soan-than-mau'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)

export default function MauVanBanMan() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { san, canhBao } = useSanSangNative()
  const q = useQuery({ ...truyVanMau, enabled: san })
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const [xem, datXem] = useState<MauVanBan>()
  const [sua, datSua] = useState<MauVanBan | 'moi'>()
  const coTao = toi.quyen.includes('VAN_BAN.CREATE')
  const coSua = toi.quyen.includes('VAN_BAN.UPDATE')
  const coXoa = toi.quyen.includes('VAN_BAN.DELETE')
  const ds = q.data?.data ?? []
  const tk = q.data?.stats

  const xoa = (m: MauVanBan) => {
    const cau =
      m.source === 'NGHI_DINH_30'
        ? `Xóa mẫu "${m.name}"? Đây là mẫu gốc theo Nghị định 30 — xóa sẽ ảnh hưởng mọi người đang dùng.`
        : `Xóa mẫu "${m.name}"? Thao tác không hoàn tác được.`
    if (!confirm(cau)) return
    datTb(undefined)
    xoaMau(m.id)
      .then(async () => {
        datTb({ ok: true, cau: `Đã xóa mẫu "${m.name}".` })
        await qc.invalidateQueries({ queryKey: KHOA_NATIVE_VB })
      })
      .catch((e: unknown) => datTb({ ok: false, cau: loiCua(e, 'Không xóa được mẫu.') }))
  }

  const cot: CotLuoi<MauVanBan>[] = [
    {
      id: 'stt',
      nhan: 'STT',
      kieu: 'so',
      rong: 64,
      khongLoc: true,
      giaTri: () => null,
      hien: (_d, s) => <span className="text-faint">{s}</span>,
    },
    {
      id: 'ten',
      nhan: 'Tên mẫu văn bản',
      kieu: 'chu',
      rong: 360,
      batBuoc: true,
      giaTri: (m) => m.name,
      hien: (m) => (
        <span className="block">
          <b className="block truncate text-ink">{m.name}</b>
          <span className="block truncate text-[11.5px] text-faint">{m.description || '—'}</span>
        </span>
      ),
    },
    {
      id: 'kyHieu',
      nhan: 'Ký hiệu',
      kieu: 'chu',
      rong: 150,
      giaTri: (m) => m.symbol_code,
      hien: (m) => (
        <code className="rounded border border-line bg-nen-2 px-1.5 py-0.5 text-[12px] whitespace-nowrap text-body">
          Số: …/{m.symbol_code}-…
        </code>
      ),
    },
    {
      id: 'nguon',
      nhan: 'Nguồn',
      kieu: 'danh-muc',
      rong: 140,
      giaTri: (m) => m.source,
      luaChon: Object.entries(NHAN_NGUON_MAU).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (m) => (
        <Chip mau={m.source === 'NGHI_DINH_30' ? 'brand' : 'warn'}>
          {NHAN_NGUON_MAU[m.source as NguonMau] ?? m.source_label}
        </Chip>
      ),
    },
    {
      id: 'soTruong',
      nhan: 'Số trường',
      kieu: 'so',
      rong: 110,
      an: true,
      giaTri: (m) => m.fields?.length ?? 0,
    },
    {
      id: 'luong',
      nhan: 'Cách soạn',
      kieu: 'danh-muc',
      rong: 150,
      an: true,
      giaTri: (m) => (m.compose_mode === 'FIELD_FILL' ? 'Điền trường' : 'AI viết thân'),
    },
    {
      id: 'trangThai',
      nhan: 'Trạng thái',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (m) => m.status,
      luaChon: Object.entries(NHAN_TRANG_THAI_MAU).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (m) => (
        <Chip mau={m.status === 'DANG_DUNG' ? 'ok' : 'xam'}>
          {NHAN_TRANG_THAI_MAU[m.status as TrangThaiMau] ?? m.status_label}
        </Chip>
      ),
    },
    {
      id: 'capNhat',
      nhan: 'Cập nhật',
      kieu: 'ngay',
      rong: 120,
      an: true,
      giaTri: (m) => m.updated_at.slice(0, 10),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 130,
      khongLoc: true,
      giaTri: () => null,
      hien: (m) => (
        <span className="flex items-center gap-0.5">
          <NutIcon nhan={`Xem mẫu "${m.name}"`} ten="xem" onClick={() => datXem(m)} />
          {coSua && <NutIcon nhan={`Sửa mẫu "${m.name}"`} ten="sua" onClick={() => datSua(m)} />}
          {coXoa && <NutIcon nhan={`Xóa mẫu "${m.name}"`} ten="xoa" nguyHiem onClick={() => xoa(m)} />}
        </span>
      ),
    },
  ]

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Mẫu văn bản hành chính theo thể thức Nghị định 30/2020/NĐ-CP — dùng cho chức năng Soạn thảo văn bản.
      </p>
      {canhBao}
      {q.error && <ThongBao kieu="loi">{loiCua(q.error, 'Không tải được danh sách mẫu.')}</ThongBao>}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <LuoiKpi>
        <TheKpi nhan="Tổng số mẫu" giaTri={tk?.total ?? '—'} bieuTuong="mau" mau="brand" />
        <TheKpi nhan="Theo Nghị định 30" giaTri={tk?.nghi_dinh_30 ?? '—'} bieuTuong="van" mau="tim" />
        <TheKpi nhan="Mẫu tùy chỉnh" giaTri={tk?.tuy_chinh ?? '—'} bieuTuong="sua" mau="warn" />
        <TheKpi nhan="Đang sử dụng" giaTri={tk?.dang_dung ?? '—'} bieuTuong="xong" mau="ok" />
      </LuoiKpi>

      <Luoi
        ma="native-mau-van-ban"
        tieuDe="Danh sách mẫu văn bản"
        cot={cot}
        dong={ds}
        khoa={(m) => m.id}
        moDong={(m) => datXem(m)}
        rong={
          !san
            ? 'Chưa dùng được — xem thông báo phía trên.'
            : q.isPending
              ? 'Đang tải…'
              : 'Chưa có mẫu văn bản nào.'
        }
        congCu={
          san &&
          coTao && (
            <Nut kieu="chinh" onClick={() => datSua('moi')}>
              <BieuTuong ten="cong" co={16} /> Thêm mẫu văn bản
            </Nut>
          )
        }
      />

      {xem && <XemMau mau={xem} coSua={coSua} dong={() => datXem(undefined)} />}
      {sua && (
        <FormMau
          sua={sua === 'moi' ? null : sua}
          dong={() => datSua(undefined)}
          xong={async (cau) => {
            datSua(undefined)
            datTb({ ok: true, cau })
            await qc.invalidateQueries({ queryKey: KHOA_NATIVE_VB })
          }}
        />
      )}
    </>
  )
}

/* ── Xem mẫu ───────────────────────────────────────────────────────────────── */

function XemMau({ mau, coSua, dong }: { mau: MauVanBan; coSua: boolean; dong: () => void }) {
  const qc = useQueryClient()
  const q = useQuery(truyVanChiTietMau(mau.id))
  const m = q.data ?? mau
  const [dangTao, datDangTao] = useState(false)
  const [loi, datLoi] = useState<string>()

  const taoXemTruoc = () => {
    datDangTao(true)
    datLoi(undefined)
    taoXemTruocMau(m.id)
      .then(() => qc.invalidateQueries({ queryKey: truyVanChiTietMau(m.id).queryKey }))
      .catch((e: unknown) => datLoi(loiCua(e, 'Không tạo được bản xem trước.')))
      .finally(() => datDangTao(false))
  }

  return (
    <HopThoai
      tieuDe={m.name}
      phu={`${NHAN_NGUON_MAU[m.source as NguonMau] ?? m.source_label} · ${NHAN_TRANG_THAI_MAU[m.status as TrangThaiMau] ?? m.status_label}`}
      dong={dong}
      rong="max-w-[900px]"
      chan={<Nut onClick={dong}>Đóng</Nut>}
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <dl className="mt-0 mb-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-faint">Mã ký hiệu</dt>
          <dd className="m-0 text-ink">{m.symbol_code}</dd>
        </div>
        <div>
          <dt className="text-faint">Cách soạn</dt>
          <dd className="m-0 text-ink">
            {m.compose_mode === 'FIELD_FILL'
              ? 'Điền giá trị vào các trường có sẵn'
              : 'AI viết thân văn bản theo thể thức'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-faint">Mô tả</dt>
          <dd className="m-0 text-body">{m.description || 'Chưa có mô tả.'}</dd>
        </div>
      </dl>

      {!!m.structure?.length && (
        <section className="mb-4">
          <TieuDeKhoi>Thể thức theo Điều 8 NĐ 30/2020/NĐ-CP</TieuDeKhoi>
          <ol className="m-0 grid list-decimal gap-0.5 pl-5 text-[13px] text-body">
            {m.structure.map((y) => (
              <li key={y}>{y}</li>
            ))}
          </ol>
        </section>
      )}

      {!!m.fields?.length && (
        <section className="mb-4">
          <TieuDeKhoi>Các trường thông tin</TieuDeKhoi>
          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="bg-nen-2">
                  {['Tên trường', 'Mã trường', 'Kiểu', 'Bắt buộc', 'AI điền'].map((c) => (
                    <th
                      key={c}
                      className="px-3 py-2 text-[11px] font-bold tracking-[.06em] whitespace-nowrap text-faint uppercase"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.fields.map((t) => (
                  <tr key={t.key} className="border-t border-line-2">
                    <td className="px-3 py-2 text-ink">{t.label}</td>
                    <td className="px-3 py-2">
                      <code className="text-[12px] text-faint">{`{{${t.key}}}`}</code>
                    </td>
                    <td className="px-3 py-2 text-body">{NHAN_KIEU_TRUONG[t.type ?? 'TEXT'] ?? t.type}</td>
                    <td className="px-3 py-2 text-body">{t.required ? 'Có' : '—'}</td>
                    <td className="px-3 py-2 text-body">{t.ai_fill === false ? '—' : 'Có'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {m.body_template && (
        <section className="mb-4">
          <TieuDeKhoi>Bố cục mẫu</TieuDeKhoi>
          <div className="rounded-[10px] bg-bg p-4">
            <HtmlSach
              className="giay-a4 min-h-0"
              html={xemTruocMau(
                m.body_template,
                m.fields ?? [],
                sangTheThucDung(m.default_meta),
                m.name,
                m.symbol_code,
              )}
            />
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <TieuDeKhoi>Bản minh họa</TieuDeKhoi>
          {coSua && (
            <Nut onClick={taoXemTruoc} disabled={dangTao}>
              <BieuTuong ten="ai" co={16} />
              {dangTao ? 'Đang tạo…' : m.preview_content ? 'Tạo lại bản minh họa' : 'Tạo bản minh họa'}
            </Nut>
          )}
        </div>
        {m.preview_content ? (
          <pre className="m-0 max-h-72 overflow-auto rounded-[10px] border border-line bg-nen-2 px-4 py-3 font-serif text-[13px] leading-relaxed whitespace-pre-wrap text-ink">
            {m.preview_content}
          </pre>
        ) : (
          <p className="m-0 rounded-[10px] border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
            {m.source === 'NGHI_DINH_30'
              ? 'Chưa có bản minh họa. Bấm nút trên để AI dựng một văn bản minh họa từ thể thức của mẫu.'
              : 'Chưa có bản minh họa. Bấm nút trên để dựng bản minh họa từ thân mẫu — thao tác này không gọi AI.'}
          </p>
        )}
      </section>
    </HopThoai>
  )
}

/* ── Thêm / sửa mẫu ───────────────────────────────────────────────────────── */

const KIEU: KieuTruong[] = ['TEXT', 'TEXTAREA', 'DATE', 'NUMBER', 'SELECT']

function FormMau({
  sua,
  dong,
  xong,
}: {
  sua: MauVanBan | null
  dong: () => void
  xong: (cau: string) => Promise<void>
}) {
  const [ten, datTen] = useState(sua?.name ?? '')
  const [kyHieu, datKyHieu] = useState(sua?.symbol_code ?? '')
  const [trangThai, datTrangThai] = useState<TrangThaiMau>((sua?.status as TrangThaiMau) ?? 'DANG_DUNG')
  const [moTa, datMoTa] = useState(sua?.description ?? '')
  const [tho, datTho] = useState<TheThucDung>(sua ? sangTheThucDung(sua.default_meta) : THE_THUC_RONG)
  const [truong, datTruong] = useState<TruongMau[]>(sua?.fields ?? [])
  /** Thân dạng `{{key}}` — tính lại từ HTML trình soạn sau mỗi lần gõ. */
  const [than, datThan] = useState(sua?.body_template ?? '')
  const [daGui, datDaGui] = useState(false)
  const [dangGui, datDangGui] = useState(false)
  const [loi, datLoi] = useState<string>()

  const khoaDangDung = useMemo(
    () => [...new Set([...than.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]!))],
    [than],
  )
  const moCoi = useMemo(() => khoaMoCoi(than, truong), [than, truong])
  const thieuNhan = truong.some((t) => t.label.trim() === '')
  const coNhan = useMemo(() => truong.filter((t) => t.label.trim() !== ''), [truong])

  const suaTruong = (i: number, moi: Partial<TruongMau>) =>
    datTruong((ds) => ds.map((t, j) => (i === j ? { ...t, ...moi } : t)))
  /** Mã trường bám theo nhãn — trừ khi đã chèn vào thân (đổi mã lúc đó để lại chỗ chèn mồ côi). */
  const doiNhan = (i: number, nhan: string) => {
    const t = truong[i]!
    if (khoaDangDung.includes(t.key)) return suaTruong(i, { label: nhan })
    suaTruong(i, {
      label: nhan,
      key: khoaDuyNhat(
        nhan,
        truong.filter((_, j) => j !== i).map((x) => x.key),
      ),
    })
  }

  const canTro = !daGui
    ? null
    : ten.trim() === ''
      ? 'Chưa nhập tên mẫu văn bản.'
      : kyHieu.trim() === ''
        ? 'Chưa nhập mã ký hiệu.'
        : thieuNhan
          ? 'Mỗi trường thông tin phải có tên.'
          : moCoi.length
            ? `Thân văn bản còn trường chưa khai báo: ${moCoi.map((k) => `{{${k}}}`).join(', ')} — khai báo lại hoặc xóa chỗ chèn.`
            : null

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    datDaGui(true)
    if (ten.trim() === '' || kyHieu.trim() === '' || thieuNhan || moCoi.length) return
    const ts: ThamSoMau = {
      name: ten.trim(),
      symbol_code: kyHieu.trim(),
      status: trangThai,
      description: moTa.trim() || null,
      // Native thay nguyên cặp này và bắt khớp nhau — luôn gửi cả hai.
      fields: truong.length ? truong : null,
      body_template: than.trim() || null,
      default_meta: coTheThuc(tho) ? sangTheThucMau(tho) : null,
    }
    datLoi(undefined)
    datDangGui(true)
    try {
      if (sua) await suaMau(sua.id, ts)
      else await taoMau(ts)
      await xong(sua ? `Đã lưu mẫu "${ts.name}".` : `Đã thêm mẫu "${ts.name}".`)
    } catch (e) {
      datLoi(loiCua(e, 'Không lưu được mẫu.'))
      datDangGui(false)
    }
  }

  return (
    <HopThoai
      tieuDe={sua ? 'Sửa mẫu văn bản' : 'Thêm mẫu văn bản'}
      phu="Khai báo bên trái — soạn thân và xem trước bên phải."
      dong={dong}
      khoa={dangGui}
      rong="max-w-[1280px]"
      chan={
        <>
          <Nut onClick={dong} disabled={dangGui}>
            Hủy
          </Nut>
          <Nut type="submit" form="form-mau" kieu="chinh" disabled={dangGui}>
            <BieuTuong ten="tich" co={16} /> {dangGui ? 'Đang lưu…' : sua ? 'Lưu thay đổi' : 'Thêm mẫu'}
          </Nut>
        </>
      }
    >
      {(loi || canTro) && <ThongBao kieu="loi">{loi ?? canTro}</ThongBao>}
      <form id="form-mau" onSubmit={(e) => void gui(e)} noValidate>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <div className="grid content-start gap-5 xl:max-h-[66vh] xl:overflow-y-auto xl:pr-2">
            <section>
              <TieuDeKhoi>Thông tin chung</TieuDeKhoi>
              <div className="mb-3">
                <label htmlFor="mau-ten" className={LOP_NHAN}>
                  Tên mẫu văn bản <span className="text-danger">*</span>
                </label>
                <input
                  id="mau-ten"
                  value={ten}
                  maxLength={300}
                  disabled={dangGui}
                  placeholder="VD: Công văn, Tờ trình, Giấy mời…"
                  onChange={(e) => datTen(e.target.value)}
                  className={LOP_O_NHO}
                />
              </div>
              <div className="grid gap-x-3 sm:grid-cols-2">
                <div className="mb-3">
                  <label htmlFor="mau-ky-hieu" className={LOP_NHAN}>
                    Mã ký hiệu <span className="text-danger">*</span>
                  </label>
                  <input
                    id="mau-ky-hieu"
                    value={kyHieu}
                    maxLength={30}
                    disabled={dangGui}
                    placeholder="VD: CV, TTr, GM"
                    onChange={(e) => datKyHieu(e.target.value)}
                    className={LOP_O_NHO}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="mau-tt" className={LOP_NHAN}>
                    Trạng thái
                  </label>
                  <select
                    id="mau-tt"
                    value={trangThai}
                    disabled={dangGui}
                    onChange={(e) => datTrangThai(e.target.value as TrangThaiMau)}
                    className={LOP_O_NHO}
                  >
                    {Object.entries(NHAN_TRANG_THAI_MAU).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label htmlFor="mau-mo-ta" className={LOP_NHAN}>
                Mô tả công dụng
              </label>
              <textarea
                id="mau-mo-ta"
                rows={2}
                value={moTa}
                disabled={dangGui}
                placeholder="Mục đích, phạm vi áp dụng của mẫu…"
                onChange={(e) => datMoTa(e.target.value)}
                className={LOP_O_NHO}
              />
            </section>

            <section>
              <TieuDeKhoi phu="Dựng phần đầu (cơ quan, số/ký hiệu, địa danh) và phần ký — hiện ngay bên phải.">
                Thể thức mặc định (Điều 8, NĐ 30/2020/NĐ-CP)
              </TieuDeKhoi>
              <KhoiTheThuc
                tho={tho}
                doi={(k, v) => datTho((t) => ({ ...t, [k]: v }))}
                khoa={dangGui}
                tienTo="mau"
              />
            </section>

            <section>
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <TieuDeKhoi phu="Khai báo trường → bấm chip ở khung bên phải để chèn vào văn bản.">
                  Các trường thông tin
                </TieuDeKhoi>
                <Nut
                  disabled={dangGui}
                  onClick={() =>
                    datTruong((ds) => [
                      ...ds,
                      {
                        key: khoaDuyNhat(
                          '',
                          ds.map((t) => t.key),
                        ),
                        label: '',
                        type: 'TEXT',
                        hint: '',
                        required: false,
                        ai_fill: true,
                      },
                    ])
                  }
                >
                  <BieuTuong ten="cong" co={15} /> Thêm trường
                </Nut>
              </div>
              {truong.length === 0 ? (
                <p className="m-0 rounded-[10px] border border-dashed border-line px-3 py-5 text-center text-[12.5px] text-faint">
                  Chưa khai báo trường nào. Mẫu không có trường thì AI tự viết toàn bộ thân văn bản theo thể
                  thức.
                </p>
              ) : (
                <ul className="m-0 grid list-none gap-2.5 p-0">
                  {truong.map((t, i) => {
                    const dangDung = khoaDangDung.includes(t.key)
                    return (
                      <li key={i} className="rounded-[10px] border border-line p-3">
                        <div className="flex items-center gap-2">
                          <span className="grid size-5 flex-none place-items-center rounded-full bg-tint-brand text-[11px] font-bold text-brand">
                            {i + 1}
                          </span>
                          <input
                            aria-label={`Tên trường thứ ${i + 1}`}
                            value={t.label}
                            disabled={dangGui}
                            placeholder="Tên trường (VD: Kính gửi)"
                            onChange={(e) => doiNhan(i, e.target.value)}
                            className={`${LOP_O_NHO} min-w-0 flex-1`}
                          />
                          <NutIcon
                            nhan={
                              dangDung
                                ? 'Trường đang chèn trong văn bản — xóa thì xóa cả chỗ chèn'
                                : 'Xóa trường'
                            }
                            ten="xoa"
                            nguyHiem
                            disabled={dangGui}
                            onClick={() => datTruong((ds) => ds.filter((_, j) => j !== i))}
                          />
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                          <select
                            aria-label={`Kiểu dữ liệu trường thứ ${i + 1}`}
                            value={t.type ?? 'TEXT'}
                            disabled={dangGui}
                            onChange={(e) => suaTruong(i, { type: e.target.value as KieuTruong })}
                            className={LOP_O_NHO}
                          >
                            {KIEU.map((k) => (
                              <option key={k} value={k}>
                                {NHAN_KIEU_TRUONG[k]}
                              </option>
                            ))}
                          </select>
                          <input
                            aria-label={`Gợi ý cho AI của trường thứ ${i + 1}`}
                            value={t.hint ?? ''}
                            disabled={dangGui}
                            placeholder="Mô tả / gợi ý cho AI (không bắt buộc)"
                            onChange={(e) => suaTruong(i, { hint: e.target.value })}
                            className={LOP_O_NHO}
                          />
                        </div>
                        {t.type === 'SELECT' && (
                          <input
                            aria-label={`Các lựa chọn của trường thứ ${i + 1}`}
                            value={(t.options ?? []).join(', ')}
                            disabled={dangGui}
                            placeholder="Các lựa chọn, cách nhau bởi dấu phẩy"
                            onChange={(e) =>
                              suaTruong(i, {
                                options: e.target.value
                                  .split(',')
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              })
                            }
                            className={`${LOP_O_NHO} mt-2`}
                          />
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-body">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={t.required === true}
                              disabled={dangGui}
                              onChange={(e) => suaTruong(i, { required: e.target.checked })}
                              className="size-3.5 accent-brand"
                            />
                            Bắt buộc nhập
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={t.ai_fill !== false}
                              disabled={dangGui}
                              onChange={(e) => suaTruong(i, { ai_fill: e.target.checked })}
                              className="size-3.5 accent-brand"
                            />
                            AI tự điền từ văn bản nguồn
                          </label>
                        </div>
                        {t.label.trim() !== '' && (
                          <p className="mt-1.5 mb-0 text-[11.5px] text-faint">
                            Mã trường:{' '}
                            <code className="rounded bg-line-2 px-1 text-body">{`{{${t.key}}}`}</code>
                            {dangDung && ' · đang dùng trong văn bản nên mã không đổi theo tên'}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="flex min-h-[520px] flex-col xl:max-h-[66vh]">
            <SoanThanMau
              tenMau={ten}
              kyHieu={kyHieu}
              tho={tho}
              truong={coNhan}
              thanBanDau={sua?.body_template ?? ''}
              khoaNap={sua?.id ?? 'moi'}
              doiThan={(html) => datThan(thanSangMau(html))}
              khoa={dangGui}
            />
          </div>
        </div>
      </form>
    </HopThoai>
  )
}
