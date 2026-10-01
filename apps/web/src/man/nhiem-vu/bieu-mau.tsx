/** Hộp thoại của màn Nhiệm vụ: giao việc / sửa, và AI phân rã việc con. */
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NHIEM_VU,
  NHAN_VAI_TRO,
  TEP_TOI_DA,
  goiYPhanRa,
  ngayVN,
  suaNhiemVu,
  taoNhiemVu,
  taoViecCon,
  thanhNguoiThamGia,
  truyVanNguoiDanhBa,
  type DonViDanhBa,
  type GoiYViecCon,
  type NguoiThamGiaNhap,
  type NutNhiemVu,
  type ThamSoTao,
  type VaiTroThamGia,
  type ViecConNhap,
} from '@/lib/nhiem-vu'
import { Nut, ThongBao } from '@/ui/co-ban'
import { BieuTuong, HopThoai, LOP_NHAN, LOP_O_NHO } from '../van-ban/chung'
import { AnhDaiDien, ChonNguoiThamGia, ChonVaiTro, OTimNguoi } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)

export type CheDoForm = { kind: 'tao' } | { kind: 'con'; cha: NutNhiemVu } | { kind: 'sua'; nut: NutNhiemVu }

/** Giao mới, giao việc con, hoặc sửa. */
export function FormNhiemVu({
  cheDo,
  donVi,
  dong,
  xong,
}: {
  cheDo: CheDoForm
  donVi: readonly DonViDanhBa[]
  dong: () => void
  xong: (cau: string) => void
}) {
  const qc = useQueryClient()
  const cu = cheDo.kind === 'sua' ? cheDo.nut : null
  const cha = cheDo.kind === 'con' ? cheDo.cha : null
  const [tieuDe, datTieuDe] = useState(cu?.title ?? '')
  const [moTa, datMoTa] = useState(cu?.description ?? '')
  // Việc con kế thừa hạn và đơn vị chủ trì của việc cha — thường đúng, sửa khi cần.
  const [han, datHan] = useState(cu?.deadline ?? cha?.deadline ?? '')
  const [maDonVi, datMaDonVi] = useState(cu?.lead_org_id ?? cha?.lead_org_id ?? '')
  const [nguoi, datNguoi] = useState<NguoiThamGiaNhap[]>(
    cu ? cu.participants.map(({ id: _id, ...p }): NguoiThamGiaNhap => p) : [],
  )
  const oTep = useRef<HTMLInputElement>(null)
  const [daGui, datDaGui] = useState(false)
  const [dangLuu, datDangLuu] = useState(false)
  const [loi, datLoi] = useState<string>()

  const thieuTieuDe = daGui && !tieuDe.trim()
  const thieuChuTri = daGui && !nguoi.some((p) => p.role === 'CHU_TRI')

  const gui = async () => {
    datDaGui(true)
    const tep = oTep.current?.files?.[0] ?? null
    if (!tieuDe.trim() || !nguoi.some((p) => p.role === 'CHU_TRI')) return
    if (tep && tep.size > TEP_TOI_DA) return datLoi('Tệp đính kèm tối đa 20 MB.')
    const ts: ThamSoTao = {
      title: tieuDe.trim(),
      description: moTa.trim(),
      deadline: han,
      leadOrgId: maDonVi,
      leadOrgName: donVi.find((o) => o.id === maDonVi)?.name ?? '',
      file: tep,
      participants: nguoi,
      parentId: cha?.id,
    }
    datLoi(undefined)
    datDangLuu(true)
    try {
      if (cu) await suaNhiemVu(cu.id, ts)
      else await taoNhiemVu(ts)
      await qc.invalidateQueries({ queryKey: KHOA_NHIEM_VU })
      xong(cu ? 'Đã lưu nhiệm vụ.' : 'Đã giao nhiệm vụ.')
    } catch (e) {
      // Bước sửa trường có thể đã lưu trước khi bước người tham gia lỗi — nạp lại cho khớp máy chủ.
      void qc.invalidateQueries({ queryKey: KHOA_NHIEM_VU })
      datLoi(loiCua(e, 'Không lưu được nhiệm vụ.'))
      datDangLuu(false)
    }
  }

  return (
    <HopThoai
      tieuDe={cu ? 'Sửa nhiệm vụ' : cha ? 'Giao nhiệm vụ con' : 'Giao nhiệm vụ mới'}
      dong={dong}
      khoa={dangLuu}
      rong="max-w-[640px]"
      chan={
        <>
          <Nut onClick={dong} disabled={dangLuu}>
            Hủy
          </Nut>
          <Nut kieu="chinh" onClick={() => void gui()} disabled={dangLuu}>
            <BieuTuong ten="tich" co={16} /> {dangLuu ? 'Đang lưu…' : cu ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {cha && (
        <p className="mt-0 mb-3.5 rounded-lg bg-nen-2 px-3 py-2 text-[12.5px] text-body">
          Thuộc nhiệm vụ: <b className="text-ink">{cha.title}</b>
          <br />
          Trạng thái việc cha tự cập nhật theo các việc con.
        </p>
      )}
      <label htmlFor="nv-tieu-de" className={LOP_NHAN}>
        Nội dung nhiệm vụ <span className="text-danger">*</span>
      </label>
      <textarea
        id="nv-tieu-de"
        rows={2}
        maxLength={2000}
        value={tieuDe}
        disabled={dangLuu}
        placeholder="VD: Rà soát, cập nhật danh sách hộ nghèo, hộ cận nghèo"
        onChange={(e) => datTieuDe(e.target.value)}
        className={`${LOP_O_NHO} ${thieuTieuDe ? 'border-danger' : ''}`}
      />
      {thieuTieuDe && <p className="mt-1 mb-0 text-[12px] text-danger">Nhập nội dung nhiệm vụ.</p>}

      <label htmlFor="nv-mo-ta" className={`${LOP_NHAN} mt-3.5`}>
        Mô tả / chỉ đạo
      </label>
      <textarea
        id="nv-mo-ta"
        rows={3}
        maxLength={5000}
        value={moTa}
        disabled={dangLuu}
        placeholder="Yêu cầu cụ thể, kết quả cần đạt…"
        onChange={(e) => datMoTa(e.target.value)}
        className={LOP_O_NHO}
      />

      <div className="mt-3.5 grid gap-x-3 gap-y-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="nv-don-vi" className={LOP_NHAN}>
            Đơn vị chủ trì
          </label>
          <select
            id="nv-don-vi"
            value={maDonVi}
            disabled={dangLuu}
            onChange={(e) => datMaDonVi(e.target.value)}
            className={LOP_O_NHO}
          >
            <option value="">Chọn đơn vị…</option>
            {donVi.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nv-han-xl" className={LOP_NHAN}>
            Hạn xử lý
          </label>
          <input
            id="nv-han-xl"
            type="date"
            value={han}
            disabled={dangLuu}
            onChange={(e) => datHan(e.target.value)}
            className={LOP_O_NHO}
          />
        </div>
      </div>

      <span className={`${LOP_NHAN} mt-3.5`}>
        Người thực hiện <span className="text-danger">*</span>
      </span>
      <ChonNguoiThamGia giaTri={nguoi} doi={datNguoi} donVi={donVi} loi={thieuChuTri} />
      <p className={`mt-1 mb-0 text-[12px] ${thieuChuTri ? 'text-danger' : 'text-faint'}`}>
        {thieuChuTri
          ? 'Chọn ít nhất một người chủ trì.'
          : 'Cần ít nhất một người chủ trì. Người phối hợp và xem để biết là tùy chọn.'}
      </p>

      <label htmlFor="nv-tep-dk" className={`${LOP_NHAN} mt-3.5`}>
        Tệp đính kèm
      </label>
      <input id="nv-tep-dk" ref={oTep} type="file" disabled={dangLuu} className="w-full text-[13px]" />
      <p className="mt-1 mb-0 text-[12px] text-faint">
        Tối đa 20 MB.
        {cu?.attachment_filename && ` Tệp hiện tại: ${cu.attachment_filename} — chọn tệp mới sẽ thay tệp cũ.`}
      </p>
    </HopThoai>
  )
}

/* ── AI phân rã ───────────────────────────────────────────────────────────── */

interface Dong {
  khoa: number
  chon: boolean
  tieuDe: string
  han: string
  maDonVi: string
  nguoi: NguoiThamGiaNhap | null
  /** Người dùng đã tự chọn / bỏ người — không để kết quả khớp tên ghi đè. */
  daCham: boolean
  vaiTro: VaiTroThamGia
  maDonViXuLy: string | null
  aiChon: string
  aiLoai: GoiYViecCon['assignee_type']
}

let dem = 0

function khopDonVi(ten: string, donVi: readonly DonViDanhBa[]): string {
  const can = ten.trim().toLocaleLowerCase('vi')
  if (!can) return ''
  const dung = donVi.find((o) => o.name.toLocaleLowerCase('vi') === can)
  const gan = donVi.find((o) => {
    const n = o.name.toLocaleLowerCase('vi')
    return n.includes(can) || can.includes(n)
  })
  return (dung ?? gan)?.id ?? ''
}

const tuGoiY = (s: GoiYViecCon, cha: NutNhiemVu, donVi: readonly DonViDanhBa[]): Dong => ({
  khoa: ++dem,
  chon: true,
  tieuDe: s.title,
  han: s.deadline,
  // Giao cho cá nhân: đơn vị chủ trì kế thừa việc cha, người đó vào danh sách thực hiện.
  maDonVi:
    s.assignee_type === 'CA_NHAN'
      ? (cha.lead_org_id ?? '')
      : khopDonVi(s.assignee_name, donVi) || (cha.lead_org_id ?? ''),
  nguoi: null,
  daCham: false,
  vaiTro: s.role,
  maDonViXuLy: s.processing_unit_id,
  aiChon: s.assignee_name,
  aiLoai: s.assignee_type,
})

/** AI đề xuất việc con; người dùng soát lại rồi tạo hàng loạt. Gợi ý chưa lưu gì trên Native. */
export function PhanRaAi({
  cha,
  donVi,
  dong,
  xong,
}: {
  cha: NutNhiemVu
  donVi: readonly DonViDanhBa[]
  dong: () => void
  xong: (cau: string) => void
}) {
  const qc = useQueryClient()
  const [ds, datDs] = useState<Dong[]>([])
  const [tt, datTt] = useState<'dang-goi-y' | 'xong' | 'loi'>('dang-goi-y')
  const [dungTep, datDungTep] = useState<boolean>()
  const [loi, datLoi] = useState<string>()
  const [dangTao, datDangTao] = useState(false)
  const [luot, datLuot] = useState(0)

  // Gọi AI khi mở và mỗi lần bấm "Gợi ý lại".
  useEffect(() => {
    let bo = false
    goiYPhanRa(cha.id)
      .then((kq) => {
        if (bo) return
        datDs(kq.items.map((s) => tuGoiY(s, cha, donVi)))
        datDungTep(kq.used_attachment)
        datTt('xong')
      })
      .catch((e: unknown) => {
        if (bo) return
        datLoi(loiCua(e, 'Không lấy được gợi ý từ AI.'))
        datTt('loi')
      })
    return () => {
      bo = true
    }
    // Chỉ theo lượt gợi ý: phụ thuộc cha/donVi sẽ xóa mất chỉnh sửa của người dùng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luot])

  // Khớp tên cá nhân AI chọn với tài khoản danh bạ — chỉ nhận khi trùng TÊN ĐẦY ĐỦ và duy nhất.
  const tenCanKhop = [...new Set(ds.filter((r) => r.aiLoai === 'CA_NHAN' && r.aiChon).map((r) => r.aiChon))]
  const kqKhop = useQueries({ queries: tenCanKhop.map((t) => truyVanNguoiDanhBa(t)) })
  const khop = new Map(
    tenCanKhop.map((t, i) => {
      const can = t.trim().toLocaleLowerCase('vi')
      const trung = (kqKhop[i]?.data ?? []).filter((u) => u.fullName.trim().toLocaleLowerCase('vi') === can)
      return [t, trung.length === 1 ? trung[0]! : null] as const
    }),
  )
  const nguoiCua = (r: Dong): NguoiThamGiaNhap | null => {
    if (r.nguoi || r.daCham || r.aiLoai !== 'CA_NHAN') return r.nguoi
    const u = khop.get(r.aiChon)
    return u ? thanhNguoiThamGia(u, donVi, r.vaiTro) : null
  }

  const sua = (khoa: number, doi: Partial<Dong>) =>
    datDs((cu) => cu.map((r) => (r.khoa === khoa ? { ...r, ...doi } : r)))
  const daChon = ds.filter((r) => r.chon)

  const gui = async () => {
    if (daChon.some((r) => !r.tieuDe.trim())) return datLoi('Nhập nội dung cho mọi việc được chọn.')
    if (cha.deadline && daChon.some((r) => r.han && r.han > cha.deadline!))
      return datLoi(`Có việc con hạn vượt hạn nhiệm vụ cha (${ngayVN(cha.deadline)}).`)
    const children: ViecConNhap[] = daChon.map((r) => {
      const n = nguoiCua(r)
      return {
        title: r.tieuDe.trim(),
        deadline: r.han || null,
        lead_org_id: r.maDonVi || null,
        lead_org_name: donVi.find((o) => o.id === r.maDonVi)?.name ?? null,
        processing_unit_id: r.maDonViXuLy,
        participants: n ? [n] : [],
      }
    })
    datLoi(undefined)
    datDangTao(true)
    try {
      await taoViecCon(cha.id, children)
      await qc.invalidateQueries({ queryKey: KHOA_NHIEM_VU })
      xong(`Đã tạo ${children.length} việc con.`)
    } catch (e) {
      datLoi(loiCua(e, 'Không tạo được việc con.'))
      datDangTao(false)
    }
  }

  const goiYLai = () => {
    datTt('dang-goi-y')
    datLoi(undefined)
    datLuot((n) => n + 1)
  }

  return (
    <HopThoai
      tieuDe="AI phân rã nhiệm vụ con"
      phu={`Nhiệm vụ cha: ${cha.title}${cha.deadline ? ` · hạn ${ngayVN(cha.deadline)}` : ''}`}
      dong={dong}
      khoa={dangTao}
      rong="max-w-[1000px]"
      chan={
        <>
          <span className="mr-auto flex gap-2">
            <Nut onClick={goiYLai} disabled={tt === 'dang-goi-y' || dangTao}>
              <BieuTuong ten="moi" co={15} /> Gợi ý lại
            </Nut>
            <Nut
              disabled={tt === 'dang-goi-y' || dangTao}
              onClick={() =>
                datDs((cu) => [
                  ...cu,
                  {
                    khoa: ++dem,
                    chon: true,
                    tieuDe: '',
                    han: cha.deadline ?? '',
                    maDonVi: cha.lead_org_id ?? '',
                    nguoi: null,
                    daCham: true,
                    vaiTro: 'CHU_TRI',
                    maDonViXuLy: null,
                    aiChon: '',
                    aiLoai: null,
                  },
                ])
              }
            >
              <BieuTuong ten="cong" co={15} /> Thêm việc con
            </Nut>
          </span>
          <Nut onClick={dong} disabled={dangTao}>
            Hủy
          </Nut>
          <Nut
            kieu="chinh"
            onClick={() => void gui()}
            disabled={tt === 'dang-goi-y' || dangTao || daChon.length === 0}
          >
            {dangTao ? 'Đang tạo…' : `Tạo ${daChon.length} việc con`}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {tt === 'dang-goi-y' ? (
        <p className="m-0 flex items-center gap-2 py-8 text-[13px] text-body">
          <BieuTuong ten="ai" co={16} className="animate-pulse text-brand" />
          AI đang đọc nhiệm vụ, chỉ đạo và văn bản đính kèm để đề xuất việc con… thường mất 10–40 giây.
        </p>
      ) : tt === 'xong' && ds.length === 0 ? (
        <p className="m-0 text-[13px] text-faint">
          AI cho rằng nhiệm vụ này đã đủ cụ thể, không cần phân rã. Bạn vẫn có thể thêm việc con thủ công.
        </p>
      ) : (
        dungTep !== undefined && (
          <p className="mt-0 mb-3 text-[12px] text-faint">
            {dungTep
              ? 'AI đã đọc văn bản đính kèm của nhiệm vụ.'
              : 'Nhiệm vụ không có văn bản đính kèm đọc được — AI chỉ dựa vào nội dung và chỉ đạo.'}
          </p>
        )
      )}

      <ul className="m-0 grid list-none gap-2 p-0">
        {ds.map((r, i) => {
          const n = nguoiCua(r)
          const vuotHan = !!cha.deadline && !!r.han && r.han > cha.deadline
          return (
            <li
              key={r.khoa}
              className={`grid items-start gap-3 rounded-[10px] border border-line p-3 md:grid-cols-[1.25rem_minmax(0,1fr)_15rem_9.5rem_2rem] ${r.chon ? 'bg-nen' : 'bg-nen-2 opacity-60'}`}
            >
              <input
                type="checkbox"
                aria-label="Tạo việc này"
                checked={r.chon}
                onChange={(e) => sua(r.khoa, { chon: e.target.checked })}
                className="mt-2 size-3.5 accent-brand"
              />
              <div className="min-w-0">
                <textarea
                  aria-label={`${i + 1}. Nội dung việc con`}
                  rows={2}
                  maxLength={2000}
                  value={r.tieuDe}
                  placeholder="Nội dung việc con"
                  onChange={(e) => sua(r.khoa, { tieuDe: e.target.value })}
                  className={LOP_O_NHO}
                />
                {r.aiChon && (
                  <p className={`mt-1 mb-0 text-[11px] ${r.aiLoai ? 'text-faint' : 'text-warn'}`}>
                    {r.aiLoai
                      ? `AI chọn: ${r.aiChon}`
                      : `AI chọn “${r.aiChon}” — không có trong Đơn vị nhận việc, hãy chọn tay`}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <select
                  aria-label="Đơn vị chủ trì"
                  value={r.maDonVi}
                  onChange={(e) => sua(r.khoa, { maDonVi: e.target.value })}
                  className={LOP_O_NHO}
                >
                  <option value="">Đơn vị chủ trì</option>
                  {donVi.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {n ? (
                  <div className="flex items-center gap-1.5">
                    <AnhDaiDien ten={n.user_name} nho />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{n.user_name}</span>
                    <ChonVaiTro
                      giaTri={r.vaiTro === 'XEM_DE_BIET' ? 'PHOI_HOP' : r.vaiTro}
                      chi={['CHU_TRI', 'PHOI_HOP']}
                      doi={(v) => sua(r.khoa, { vaiTro: v, nguoi: { ...n, role: v }, daCham: true })}
                    />
                    <button
                      type="button"
                      aria-label={`Bỏ ${n.user_name}`}
                      onClick={() => sua(r.khoa, { nguoi: null, daCham: true })}
                      className="text-faint hover:text-danger"
                    >
                      <BieuTuong ten="dong" co={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <OTimNguoi
                      boQua={[]}
                      chon={(u) =>
                        sua(r.khoa, { nguoi: thanhNguoiThamGia(u, donVi, r.vaiTro), daCham: true })
                      }
                    />
                    {r.aiLoai === 'CA_NHAN' && !r.daCham && (
                      <p className="m-0 text-[11px] text-faint">
                        Chưa khớp tài khoản “{r.aiChon}” ({NHAN_VAI_TRO[r.vaiTro]}) — chọn người
                      </p>
                    )}
                  </>
                )}
              </div>
              <div>
                <input
                  type="date"
                  aria-label="Hạn"
                  value={r.han}
                  max={cha.deadline ?? undefined}
                  onChange={(e) => sua(r.khoa, { han: e.target.value })}
                  className={`${LOP_O_NHO} ${vuotHan ? 'border-danger' : ''}`}
                />
                {vuotHan && <p className="mt-1 mb-0 text-[11px] text-danger">Vượt hạn nhiệm vụ cha</p>}
              </div>
              <button
                type="button"
                aria-label="Bỏ dòng"
                onClick={() => datDs((cu) => cu.filter((x) => x.khoa !== r.khoa))}
                className="grid size-8 place-items-center rounded-md text-faint hover:bg-nav-hover hover:text-danger"
              >
                <BieuTuong ten="xoa" co={16} />
              </button>
            </li>
          )
        })}
      </ul>
    </HopThoai>
  )
}
