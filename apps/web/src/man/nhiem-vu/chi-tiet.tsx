/** Ngăn chi tiết nhiệm vụ (bên phải): thông tin, người thực hiện, việc con, tiến độ & trao đổi. */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NHIEM_VU,
  NHAN_TRANG_THAI,
  NHAN_VAI_TRO,
  SAC_THAI,
  TEP_TOI_DA,
  TRANG_THAI_NV,
  VAI_TRO,
  docJson,
  ngayGio,
  taiTepHoatDong,
  taiTepNhiemVu,
  themHoatDong,
  tomTatHoatDong,
  trangThaiHien,
  truyVanHoatDong,
  type HoatDong,
  type NutNhiemVu,
  type TrangThaiNV,
  type VaiTroThamGia,
} from '@/lib/nhiem-vu'
import { Nut, ThongBao } from '@/ui/co-ban'
import { BieuTuong, ChonCheDo, LOP_O_NHO, NutIcon } from '../van-ban/chung'
import { AnhDaiDien, HanXuLy, NhanTrangThai, TieuDeMuc } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)

export interface ThaoTacNV {
  mo: (n: NutNhiemVu) => void
  themCon: (cha: NutNhiemVu) => void
  phanRa: (cha: NutNhiemVu) => void
  sua: (n: NutNhiemVu) => void
  xoa: (n: NutNhiemVu) => void
  doiTrangThai: (n: NutNhiemVu, tt: TrangThaiNV) => void
}

const SAC_VAI: Record<VaiTroThamGia, string> = {
  CHU_TRI: 'bg-tint-brand text-brand',
  PHOI_HOP: 'bg-tint-tim text-tim',
  XEM_DE_BIET: 'bg-line-2 text-body',
}

export function ChiTietNhiemVu({
  nut,
  tieuDeCha,
  coGiao,
  dangTai,
  dong,
  tt,
}: {
  nut: NutNhiemVu | null
  tieuDeCha: string | null
  /** Người xem được giao việc / sửa / xóa (quyền GDOS). */
  coGiao: boolean
  dangTai: boolean
  dong: () => void
  tt: ThaoTacNV
}) {
  useEffect(() => {
    const nghe = (e: KeyboardEvent) =>
      e.key === 'Escape' && !document.querySelector('[aria-modal="true"]') && dong()
    document.addEventListener('keydown', nghe)
    return () => document.removeEventListener('keydown', nghe)
  }, [dong])

  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && dong()}
      className="fixed inset-0 z-40 bg-[rgba(10,22,44,.35)]"
    >
      <aside
        aria-label="Chi tiết nhiệm vụ"
        className="hien-dan absolute inset-y-0 right-0 flex w-full max-w-[580px] flex-col bg-nen shadow-[-12px_0_38px_rgba(4,14,33,.22)]"
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <h2 className="m-0 flex-1 text-[16px] font-extrabold text-ink">Chi tiết nhiệm vụ</h2>
          {nut && coGiao && (
            <>
              <NutIcon nhan="Sửa nhiệm vụ" ten="sua" onClick={() => tt.sua(nut)} />
              <NutIcon nhan="Xóa nhiệm vụ" ten="xoa" nguyHiem onClick={() => tt.xoa(nut)} />
            </>
          )}
          <NutIcon nhan="Đóng" ten="dong" onClick={dong} />
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">
          {nut ? (
            <NoiDung key={nut.id} nut={nut} tieuDeCha={tieuDeCha} coGiao={coGiao} tt={tt} />
          ) : (
            <p className="text-[13px] text-faint">
              {dangTai ? 'Đang tải…' : 'Không mở được nhiệm vụ này (đã xóa hoặc bạn không tham gia).'}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

function NoiDung({
  nut,
  tieuDeCha,
  coGiao,
  tt,
}: {
  nut: NutNhiemVu
  tieuDeCha: string | null
  coGiao: boolean
  tt: ThaoTacNV
}) {
  const conDo = nut.child_total - nut.child_done
  const [loi, datLoi] = useState<string>()

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 [&>*]:min-w-0">
      <header className="grid grid-cols-1 gap-2 [&>*]:min-w-0">
        {tieuDeCha && (
          <p className="m-0 text-[12px] text-faint">
            Thuộc nhiệm vụ: <span className="text-body">{tieuDeCha}</span>
          </p>
        )}
        <h3 className="m-0 text-[15px] leading-snug font-bold break-words text-ink">{nut.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <NhanTrangThai tt={trangThaiHien(nut)} />
          <HanXuLy nut={nut} />
        </div>
        {nut.progress > 0 && nut.child_total === 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-2">
              <div className="h-full rounded-full bg-brand" style={{ width: `${nut.progress}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-body tabular-nums">{nut.progress}%</span>
          </div>
        )}
      </header>

      <section aria-label="Đổi trạng thái" className="flex flex-wrap gap-2">
        {TRANG_THAI_NV.map((s) => {
          const khoa = s === 'HOAN_THANH' && conDo > 0
          return (
            <Nut
              key={s}
              kieu={s === nut.status ? 'chinh' : 'phu'}
              disabled={khoa || s === nut.status}
              aria-pressed={s === nut.status}
              onClick={() => tt.doiTrangThai(nut, s)}
            >
              {khoa ? `Hoàn thành (còn ${conDo} việc con)` : NHAN_TRANG_THAI[s]}
            </Nut>
          )
        })}
      </section>

      <section>
        <TieuDeMuc>Mô tả / chỉ đạo</TieuDeMuc>
        <p className="m-0 text-[13px] whitespace-pre-line text-body">
          {nut.description || <span className="text-faint">Không có mô tả</span>}
        </p>
      </section>

      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <ThongTin nhan="Đơn vị chủ trì" giaTri={nut.lead_org_name ?? 'Chưa có đơn vị'} />
        <ThongTin nhan="Người giao" giaTri={nut.created_by_name ?? 'Không rõ'} />
        <ThongTin nhan="Ngày giao" giaTri={ngayGio(nut.created_at)} />
        {nut.completed_at && <ThongTin nhan="Hoàn thành lúc" giaTri={ngayGio(nut.completed_at)} />}
        {nut.related_document && <ThongTin nhan="Văn bản liên quan" giaTri={nut.related_document} />}
        {nut.attachment_filename && (
          <div className="col-span-2">
            <dt className="text-[12px] text-faint">Tệp đính kèm</dt>
            <dd className="m-0">
              <button
                type="button"
                onClick={() =>
                  void taiTepNhiemVu(nut).catch((e: unknown) => datLoi(loiCua(e, 'Không tải được tệp.')))
                }
                className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12.5px] text-brand hover:border-brand"
              >
                <BieuTuong ten="kep" co={13} />
                <span className="truncate">{nut.attachment_filename}</span>
              </button>
            </dd>
          </div>
        )}
      </dl>

      <section>
        <TieuDeMuc>Người thực hiện</TieuDeMuc>
        {nut.participants.length === 0 ? (
          <p className="m-0 text-[13px] text-faint">Chưa có người thực hiện</p>
        ) : (
          <div className="grid gap-3">
            {VAI_TRO.map((r) => {
              const ds = nut.participants.filter((p) => p.role === r)
              if (!ds.length) return null
              return (
                <div key={r}>
                  <span
                    className={`mb-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${SAC_VAI[r]}`}
                  >
                    {NHAN_VAI_TRO[r]}
                  </span>
                  <ul className="m-0 grid list-none gap-1.5 p-0">
                    {ds.map((p) => (
                      <li key={p.user_id} className="flex items-center gap-2">
                        <AnhDaiDien ten={p.user_name} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-ink">{p.user_name}</span>
                          <span className="block truncate text-[11.5px] text-faint">
                            {[p.org_name, p.user_email].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
          <TieuDeMuc>{`Nhiệm vụ con (${nut.child_done}/${nut.child_total})`}</TieuDeMuc>
          {coGiao && (
            <span className="flex gap-1.5">
              <Nut onClick={() => tt.phanRa(nut)}>
                <BieuTuong ten="ai" co={14} /> AI phân rã
              </Nut>
              <Nut onClick={() => tt.themCon(nut)}>
                <BieuTuong ten="cong" co={14} /> Giao việc con
              </Nut>
            </span>
          )}
        </div>
        {nut.children.length === 0 ? (
          <p className="m-0 text-[13px] text-faint">Chưa phân rã nhiệm vụ con</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-line-2 rounded-[10px] border border-line p-0">
            {nut.children.map((c) => {
              const cs = trangThaiHien(c)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => tt.mo(c)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-nav-hover"
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 flex-none rounded-full ${SAC_THAI[cs].cham}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{c.title}</span>
                    <NhanTrangThai tt={cs} nho />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <HoatDongNV nut={nut} />
    </div>
  )
}

const ThongTin = ({ nhan, giaTri }: { nhan: string; giaTri: ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-[12px] text-faint">{nhan}</dt>
    <dd className="m-0 truncate text-ink" title={typeof giaTri === 'string' ? giaTri : undefined}>
      {giaTri}
    </dd>
  </div>
)

/* ── Tiến độ & trao đổi ───────────────────────────────────────────────────── */

function HoatDongNV({ nut }: { nut: NutNhiemVu }) {
  const q = useQuery(truyVanHoatDong(nut.id))
  const ds = q.data ?? []
  return (
    <section>
      <TieuDeMuc>Tiến độ &amp; trao đổi</TieuDeMuc>
      <OSoan nut={nut} />
      <div className="mt-4">
        {q.isPending ? (
          <p className="m-0 text-[13px] text-faint">Đang tải dòng thời gian…</p>
        ) : q.error ? (
          <p className="m-0 text-[13px] text-danger">Không tải được dòng thời gian.</p>
        ) : ds.length === 0 ? (
          <p className="m-0 text-[13px] text-faint">Chưa có hoạt động nào</p>
        ) : (
          <ol className="m-0 grid list-none gap-4 p-0">
            {ds.map((a) => (
              <MucHoatDong key={a.id} taskId={nut.id} a={a} />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

type CheDo = 'PROGRESS' | 'COMMENT'

function OSoan({ nut }: { nut: NutNhiemVu }) {
  const qc = useQueryClient()
  const oTep = useRef<HTMLInputElement>(null)
  // Việc có việc con thì tiến độ suy ra từ các việc con — chỉ còn gửi ý kiến.
  const baoDuoc = nut.child_total === 0
  const [cheDo, datCheDo] = useState<CheDo>(baoDuoc ? 'PROGRESS' : 'COMMENT')
  const [tienDo, datTienDo] = useState(nut.progress)
  const [noiDung, datNoiDung] = useState('')
  const [dangGui, datDangGui] = useState(false)
  const [loi, datLoi] = useState<string>()

  const gui = async () => {
    const tep = oTep.current?.files?.[0] ?? null
    if (tep && tep.size > TEP_TOI_DA) return datLoi('Tệp đính kèm tối đa 20 MB.')
    if (cheDo === 'COMMENT' && !noiDung.trim() && !tep) return datLoi('Nhập nội dung hoặc đính kèm tệp.')
    datLoi(undefined)
    datDangGui(true)
    try {
      await themHoatDong(nut.id, {
        kind: cheDo,
        content: noiDung,
        progress: cheDo === 'PROGRESS' ? tienDo : undefined,
        file: tep,
      })
      datNoiDung('')
      if (oTep.current) oTep.current.value = ''
      // Báo tiến độ có thể đổi trạng thái việc và cả việc cha — nạp lại cả cây lẫn dòng thời gian.
      await qc.invalidateQueries({ queryKey: KHOA_NHIEM_VU })
    } catch (e) {
      datLoi(loiCua(e, 'Không gửi được.'))
    } finally {
      datDangGui(false)
    }
  }

  return (
    <div className="grid gap-3 rounded-[12px] border border-line p-3">
      {loi && <p className="m-0 text-[12.5px] text-danger">{loi}</p>}
      {baoDuoc && (
        <ChonCheDo<CheDo>
          giaTri={cheDo}
          doi={datCheDo}
          muc={[
            { id: 'PROGRESS', nhan: 'Cập nhật tiến độ' },
            { id: 'COMMENT', nhan: 'Gửi ý kiến' },
          ]}
        />
      )}
      {cheDo === 'PROGRESS' && (
        <div>
          <label htmlFor="nv-tien-do" className="flex items-center justify-between text-[12.5px] text-body">
            Tiến độ hiện tại <b className="text-ink tabular-nums">{tienDo}%</b>
          </label>
          <input
            id="nv-tien-do"
            type="range"
            min={0}
            max={100}
            step={5}
            value={tienDo}
            onChange={(e) => datTienDo(Number(e.target.value))}
            className="w-full accent-brand"
          />
          {nut.status === 'MOI_PHAN_CONG' && (
            <p className="m-0 text-[11.5px] text-faint">
              Báo tiến độ trên việc chưa bắt đầu sẽ tự chuyển sang Đang thực hiện.
            </p>
          )}
        </div>
      )}
      <textarea
        aria-label={cheDo === 'PROGRESS' ? 'Ghi chú tiến độ' : 'Nội dung ý kiến'}
        rows={2}
        maxLength={5000}
        value={noiDung}
        placeholder={
          cheDo === 'PROGRESS'
            ? 'Kết quả đã làm, vướng mắc (không bắt buộc)'
            : 'Ý kiến chỉ đạo, trao đổi, đề xuất…'
        }
        onChange={(e) => datNoiDung(e.target.value)}
        className={LOP_O_NHO}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={oTep}
          type="file"
          aria-label="Đính kèm tệp kết quả"
          className="min-w-0 flex-1 text-[12.5px]"
        />
        <Nut kieu="chinh" disabled={dangGui} onClick={() => void gui()}>
          {dangGui ? 'Đang gửi…' : cheDo === 'PROGRESS' ? 'Lưu tiến độ' : 'Gửi'}
        </Nut>
      </div>
    </div>
  )
}

interface DoiNguoi {
  name: string
  role: string
}

function MucHoatDong({ taskId, a }: { taskId: string; a: HoatDong }) {
  const nguoi = a.actor_name ?? 'Hệ thống'
  const cuaNguoi = a.kind === 'COMMENT' || a.kind === 'PROGRESS'
  const d =
    a.kind === 'PARTICIPANTS_CHANGED'
      ? docJson<{ added: DoiNguoi[]; removed: DoiNguoi[]; role_changed: DoiNguoi[] }>(a.content)
      : null
  const vt = (r: string) => NHAN_VAI_TRO[r as VaiTroThamGia] ?? r
  const dongDoi = d
    ? [
        ...(d.added ?? []).map((p) => `Thêm ${p.name} (${vt(p.role)})`),
        ...(d.removed ?? []).map((p) => `Bỏ ${p.name} (${vt(p.role)})`),
        ...(d.role_changed ?? []).map((p) => `${p.name} → ${vt(p.role)}`),
      ]
    : []

  return (
    <li className="flex items-start gap-2">
      {cuaNguoi ? (
        <AnhDaiDien ten={nguoi} nho />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-6 flex-none place-items-center rounded-full bg-line-2 text-faint"
        >
          <BieuTuong ten="moi" co={12} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] text-body">
          <b className="font-semibold text-ink">{nguoi}</b> {tomTatHoatDong(a)}
        </p>
        {a.kind === 'PROGRESS' && a.progress !== null && (
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-line-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${a.progress}%` }} />
          </div>
        )}
        {dongDoi.length > 0 && (
          <ul className="m-0 mt-1 grid list-none gap-0.5 p-0 text-[12px] text-faint">
            {dongDoi.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        {a.content && cuaNguoi && (
          <p className="mt-1 mb-0 rounded-lg bg-nen-2 px-3 py-2 text-[13px] whitespace-pre-line text-ink">
            {a.content}
          </p>
        )}
        {a.attachment_filename && (
          <button
            type="button"
            onClick={() => void taiTepHoatDong(taskId, a).catch(() => undefined)}
            className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] text-brand hover:underline"
          >
            <BieuTuong ten="kep" co={12} />
            <span className="truncate">{a.attachment_filename}</span>
          </button>
        )}
        <p className="mt-0.5 mb-0 text-[11px] text-faint tabular-nums">{ngayGio(a.created_at)}</p>
      </div>
    </li>
  )
}
