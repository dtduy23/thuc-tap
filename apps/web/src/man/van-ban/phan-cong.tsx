/**
 * Xử lý văn bản › Phân công từ văn bản — nhiệm vụ AI của FOXAI Native tách từ văn bản và
 * giao cho đơn vị nhận việc (`/task-assignments`). Ba đường tạo nhiệm vụ như màn của
 * GDOS cũ: AI đọc văn bản đã tóm tắt, AI đọc tệp (chạy nền), hoặc tự thêm tay.
 */
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NATIVE_VB,
  NHAN_LOAI_DON_VI,
  NHAN_TRANG_THAI_NV,
  NHAN_UU_TIEN,
  doiTrangThaiNhiemVu,
  phanCongTuTep,
  phanCongTuTomTat,
  suaNhiemVu,
  taiTepNhiemVu,
  taoNhiemVu,
  tienDoJob,
  truyVanDonViChon,
  truyVanNhiemVu,
  xoaNhiemVu,
  type LoaiDonVi,
  type NhiemVu,
  type TrangThaiNhiemVu,
  type UuTienGiao,
} from '@/lib/native-vb'
import { truyVanToi } from '@/lib/phien'
import { truyVanVanBan } from '@/lib/van-ban'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { BieuTuong, HopThoai, LOP_NHAN, LOP_O_NHO, LuoiKpi, NutIcon, TheKpi, useSanSangNative } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const homNay = () => new Date().toLocaleDateString('sv-SE')
const ngayVN = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')
const MAU_TT: Record<TrangThaiNhiemVu, 'brand' | 'warn' | 'ok'> = {
  MOI_PHAN_CONG: 'brand',
  DANG_THUC_HIEN: 'warn',
  HOAN_THANH: 'ok',
}
const MAU_LOAI: Record<LoaiDonVi, 'brand' | 'ok' | 'tim'> = {
  CO_QUAN: 'brand',
  PHONG_BAN: 'ok',
  CA_NHAN: 'tim',
}
/** Nhịp hỏi tiến độ việc AI phân công từ tệp. */
const NHIP_HOI_MS = 2500

type Hop = 'them' | 'tep' | 'van-ban' | NhiemVu

export default function PhanCongTuVanBan() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { san, canhBao } = useSanSangNative()
  const q = useQuery({ ...truyVanNhiemVu, enabled: san })
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const [hop, datHop] = useState<Hop>()
  const [maJob, datMaJob] = useState<string | null>(null)
  const coGiao = toi.quyen.includes('VAN_BAN.ASSIGN')
  const ds = q.data?.data ?? []
  const tk = q.data?.stats
  const lamMoi = () => qc.invalidateQueries({ queryKey: [...KHOA_NATIVE_VB, 'nhiem-vu'] })

  // Việc AI phân công từ tệp chạy nền: hỏi tiến độ tới khi xong rồi nạp lại bảng.
  useEffect(() => {
    if (!maJob) return
    let dung = false
    const hoi = async () => {
      try {
        const td = await tienDoJob(maJob)
        if (dung) return
        if (!td.done) return void setTimeout(() => void hoi(), NHIP_HOI_MS)
        datMaJob(null)
        await lamMoi()
        datTb(
          td.status === 'complete'
            ? { ok: true, cau: td.message ?? `AI đã tạo ${td.created_count ?? 0} nhiệm vụ.` }
            : { ok: false, cau: td.message ?? 'AI phân công chưa thành công, vui lòng thử lại.' },
        )
      } catch (e) {
        if (!dung) {
          datMaJob(null)
          datTb({ ok: false, cau: loiCua(e, 'Không theo dõi được tiến độ phân công.') })
        }
      }
    }
    void hoi()
    return () => {
      dung = true
    }
    // lamMoi chỉ gọi invalidate — không cần theo dõi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maJob])

  const lam = (viec: () => Promise<unknown>, cau: string) => {
    datTb(undefined)
    viec()
      .then(async () => {
        datTb({ ok: true, cau })
        await lamMoi()
      })
      .catch((e: unknown) => datTb({ ok: false, cau: loiCua(e, 'Không thực hiện được.') }))
  }

  const cot: CotLuoi<NhiemVu>[] = [
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
      id: 'noiDung',
      nhan: 'Nội dung nhiệm vụ',
      kieu: 'chu',
      rong: 400,
      batBuoc: true,
      giaTri: (n) => n.task_content,
      hien: (n) => (
        <span className="block">
          <span className="line-clamp-2 text-ink">{n.task_content}</span>
          {n.attachment_filename && (
            <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-faint">
              <BieuTuong ten="kep" co={12} /> {n.attachment_filename}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'donVi',
      nhan: 'Đơn vị nhận',
      kieu: 'danh-muc',
      rong: 200,
      giaTri: (n) => n.unit_name,
      hien: (n) => (
        <span className="block">
          <span className="block text-body">{n.unit_name || '—'}</span>
          {n.unit_type && (
            <Chip mau={MAU_LOAI[n.unit_type as LoaiDonVi] ?? 'xam'}>
              {NHAN_LOAI_DON_VI[n.unit_type as LoaiDonVi] ?? n.unit_type}
            </Chip>
          )}
        </span>
      ),
    },
    {
      id: 'loaiDonVi',
      nhan: 'Loại đơn vị',
      kieu: 'danh-muc',
      rong: 130,
      an: true,
      giaTri: (n) => n.unit_type,
      luaChon: Object.entries(NHAN_LOAI_DON_VI).map(([giaTri, nhan]) => ({ giaTri, nhan })),
    },
    {
      id: 'vanBan',
      nhan: 'Văn bản liên quan',
      kieu: 'chu',
      rong: 220,
      giaTri: (n) => n.summarization_name || n.related_document,
      hien: (n) => (
        <span className="line-clamp-2 text-[12.5px] text-faint">
          {n.summarization_name || n.related_document || '—'}
        </span>
      ),
    },
    {
      id: 'han',
      nhan: 'Hạn xử lý',
      kieu: 'ngay',
      rong: 130,
      giaTri: (n) => n.deadline,
      hien: (n) => {
        if (!n.deadline) return <span className="text-faint">—</span>
        const qua = n.deadline < homNay() && n.status !== 'HOAN_THANH'
        return (
          <span
            className={`tabular-nums ${qua ? 'font-bold text-danger' : 'text-body'}`}
            title={qua ? 'Đã quá hạn' : undefined}
          >
            {ngayVN(n.deadline)}
          </span>
        )
      },
    },
    {
      id: 'trangThai',
      nhan: 'Trạng thái',
      kieu: 'danh-muc',
      rong: 170,
      giaTri: (n) => n.status,
      luaChon: Object.entries(NHAN_TRANG_THAI_NV).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      // Đổi trạng thái ngay tại bảng — thao tác hay dùng nhất.
      hien: (n) =>
        coGiao ? (
          <select
            aria-label="Đổi trạng thái nhiệm vụ"
            value={n.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const tt = e.target.value as TrangThaiNhiemVu
              lam(() => doiTrangThaiNhiemVu(n.id, tt), `Đã chuyển sang "${NHAN_TRANG_THAI_NV[tt]}".`)
            }}
            className={`rounded-full border-0 px-2.5 py-1 text-[12px] font-bold ${
              { brand: 'bg-tint-brand text-brand', warn: 'bg-tint-warn text-warn', ok: 'bg-tint-ok text-ok' }[
                MAU_TT[n.status as TrangThaiNhiemVu] ?? 'brand'
              ]
            }`}
          >
            {Object.entries(NHAN_TRANG_THAI_NV).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        ) : (
          <Chip mau={MAU_TT[n.status as TrangThaiNhiemVu] ?? 'xam'}>{n.status_label}</Chip>
        ),
    },
    {
      id: 'tao',
      nhan: 'Ngày giao',
      kieu: 'ngay',
      rong: 120,
      an: true,
      giaTri: (n) => n.created_at.slice(0, 10),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 130,
      khongLoc: true,
      giaTri: () => null,
      hien: (n) => (
        <span className="flex items-center gap-0.5">
          {n.attachment_filename && (
            <NutIcon
              nhan="Tải tệp đính kèm"
              ten="tai"
              onClick={() =>
                void taiTepNhiemVu(n).catch((e: unknown) =>
                  datTb({ ok: false, cau: loiCua(e, 'Không tải được tệp.') }),
                )
              }
            />
          )}
          {coGiao && <NutIcon nhan="Sửa nhiệm vụ" ten="sua" onClick={() => datHop(n)} />}
          {coGiao && (
            <NutIcon
              nhan="Xóa nhiệm vụ"
              ten="xoa"
              nguyHiem
              onClick={() => {
                if (confirm('Xóa nhiệm vụ này? Văn bản nguồn không bị ảnh hưởng.'))
                  lam(() => xoaNhiemVu(n.id), 'Đã xóa nhiệm vụ.')
              }}
            />
          )}
        </span>
      ),
    },
  ]

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Theo dõi nhiệm vụ AI phân công từ văn bản, hoặc tự giao việc cho phòng ban, cá nhân.
      </p>
      {canhBao}
      {q.error && <ThongBao kieu="loi">{loiCua(q.error, 'Không tải được danh sách nhiệm vụ.')}</ThongBao>}
      {maJob && (
        <ThongBao>
          <span className="inline-flex items-center gap-2">
            <BieuTuong ten="ai" co={16} className="animate-pulse text-brand" />
            AI đang đọc tệp và phân công nhiệm vụ. Bảng tự cập nhật khi xong — bạn có thể làm việc khác trong
            lúc chờ.
          </span>
        </ThongBao>
      )}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <LuoiKpi>
        <TheKpi nhan="Tổng nhiệm vụ" giaTri={tk?.total ?? '—'} bieuTuong="viec" mau="brand" />
        <TheKpi nhan="Giao phòng ban" giaTri={tk?.phong_ban ?? '—'} bieuTuong="nhom" mau="ok" />
        <TheKpi nhan="Giao cá nhân" giaTri={tk?.ca_nhan ?? '—'} bieuTuong="nguoi" mau="warn" />
        <TheKpi nhan="Đã hoàn thành" giaTri={tk?.completed ?? '—'} bieuTuong="xong" mau="tim" />
      </LuoiKpi>

      <Luoi
        ma="native-nhiem-vu"
        tieuDe="Nhiệm vụ đã phân công"
        cot={cot}
        dong={ds}
        khoa={(n) => n.id}
        moDong={coGiao ? (n) => datHop(n) : undefined}
        rong={
          !san
            ? 'Chưa dùng được — xem thông báo phía trên.'
            : q.isPending
              ? 'Đang tải…'
              : 'Chưa có nhiệm vụ nào.'
        }
        congCu={
          san &&
          coGiao && (
            <>
              <Nut onClick={() => datHop('van-ban')}>
                <BieuTuong ten="ai" co={16} /> AI phân công từ văn bản
              </Nut>
              <Nut onClick={() => datHop('tep')} disabled={!!maJob}>
                <BieuTuong ten="kep" co={16} /> AI phân công từ tệp
              </Nut>
              <Nut kieu="chinh" onClick={() => datHop('them')}>
                <BieuTuong ten="cong" co={16} /> Thêm nhiệm vụ
              </Nut>
            </>
          )
        }
      />

      {(hop === 'them' || (typeof hop === 'object' && hop)) && (
        <FormNhiemVu
          sua={typeof hop === 'object' ? hop : null}
          dong={() => datHop(undefined)}
          xong={async (cau) => {
            datHop(undefined)
            datTb({ ok: true, cau })
            await lamMoi()
          }}
        />
      )}
      {hop === 'tep' && (
        <FormPhanCongTep
          dong={() => datHop(undefined)}
          batDau={(job, cau) => {
            datHop(undefined)
            datTb({ ok: true, cau })
            datMaJob(job)
          }}
        />
      )}
      {hop === 'van-ban' && (
        <HopPhanCongVanBan
          dong={() => datHop(undefined)}
          xong={async (cau) => {
            datHop(undefined)
            datTb({ ok: true, cau })
            await lamMoi()
          }}
        />
      )}
    </>
  )
}

/* ── AI phân công từ văn bản đã tóm tắt ────────────────────────────────────── */

function HopPhanCongVanBan({ dong, xong }: { dong: () => void; xong: (cau: string) => Promise<void> }) {
  const { data: vb } = useQuery(truyVanVanBan)
  const ds = (vb ?? []).filter((v) => v.trangThai === 'xong' && v.nativeId)
  const [ma, datMa] = useState('')
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)
  const gui = async () => {
    const v = ds.find((x) => x.id === ma)
    if (!v?.nativeId) return datLoi('Chọn một văn bản đã tóm tắt.')
    datLoi(undefined)
    datDangGui(true)
    try {
      const kq = await phanCongTuTomTat(v.nativeId)
      await xong(kq.message || `AI đã tạo ${kq.created_count} nhiệm vụ từ "${v.ten}".`)
    } catch (e) {
      datLoi(
        e instanceof LoiApi && e.ma === 409
          ? 'Văn bản này đã được phân công. Xóa nhiệm vụ cũ trước khi phân công lại.'
          : e instanceof LoiApi && e.ma === 422
            ? 'Chưa phân công được: văn bản phải tóm tắt xong, và phải có danh sách Đơn vị nhận việc để AI chọn.'
            : loiCua(e, 'AI chưa phân công được.'),
      )
      datDangGui(false)
    }
  }
  return (
    <HopThoai
      tieuDe="AI phân công từ văn bản"
      phu="AI đọc bản tóm tắt, tách việc và giao cho đơn vị nhận việc phù hợp."
      dong={dong}
      khoa={dangGui}
      chan={
        <>
          <Nut onClick={dong} disabled={dangGui}>
            Hủy
          </Nut>
          <Nut kieu="chinh" onClick={() => void gui()} disabled={dangGui || !ma}>
            <BieuTuong ten="ai" co={16} /> {dangGui ? 'AI đang phân công…' : 'Bắt đầu phân công'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <label htmlFor="pc-vb" className={LOP_NHAN}>
        Văn bản đã tóm tắt
      </label>
      <select id="pc-vb" value={ma} onChange={(e) => datMa(e.target.value)} className={LOP_O_NHO}>
        <option value="">— Chọn văn bản —</option>
        {ds.map((v) => (
          <option key={v.id} value={v.id}>
            {v.ten}
          </option>
        ))}
      </select>
      <p className="mt-1.5 mb-0 text-[11.5px] text-faint">
        Mỗi văn bản phân công được một lần. Chỉ liệt kê văn bản đã tóm tắt trên FOXAI Native.
      </p>
    </HopThoai>
  )
}

/* ── Thêm / sửa nhiệm vụ ──────────────────────────────────────────────────── */

function FormNhiemVu({
  sua,
  dong,
  xong,
}: {
  sua: NhiemVu | null
  dong: () => void
  xong: (cau: string) => Promise<void>
}) {
  const { data: dv } = useQuery(truyVanDonViChon)
  // Cơ quan không trực tiếp nhận việc.
  const donVi = (dv ?? []).filter((d) => d.type !== 'CO_QUAN')
  const [noiDung, datNoiDung] = useState(sua?.task_content ?? '')
  const [maDonVi, datMaDonVi] = useState(sua?.unit_id ?? '')
  const [han, datHan] = useState(sua?.deadline ?? '')
  const [lienQuan, datLienQuan] = useState(sua?.related_document ?? '')
  const oTep = useRef<HTMLInputElement>(null)
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    if (!noiDung.trim()) return datLoi('Chưa nhập nội dung nhiệm vụ.')
    if (!maDonVi) return datLoi('Chưa chọn đơn vị nhận việc.')
    const du = new FormData()
    du.append('task_content', noiDung.trim())
    du.append('unit_id', maDonVi)
    if (han) du.append('deadline', han)
    if (lienQuan.trim()) du.append('related_document', lienQuan.trim())
    // Sửa mà không chọn tệp mới thì không gửi `file` — giữ tệp đang có.
    const tep = oTep.current?.files?.[0]
    if (tep) du.append('file', tep)
    datLoi(undefined)
    datDangGui(true)
    try {
      if (sua) await suaNhiemVu(sua.id, du)
      else await taoNhiemVu(du)
      await xong(sua ? 'Đã lưu nhiệm vụ.' : 'Đã thêm nhiệm vụ.')
    } catch (e) {
      datLoi(loiCua(e, 'Không lưu được nhiệm vụ.'))
      datDangGui(false)
    }
  }

  return (
    <HopThoai
      tieuDe={sua ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ'}
      dong={dong}
      khoa={dangGui}
      chan={
        <>
          <Nut onClick={dong} disabled={dangGui}>
            Hủy
          </Nut>
          <Nut type="submit" form="form-nv" kieu="chinh" disabled={dangGui}>
            <BieuTuong ten="tich" co={16} /> {dangGui ? 'Đang lưu…' : sua ? 'Lưu thay đổi' : 'Thêm nhiệm vụ'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {dv && donVi.length === 0 && (
        <ThongBao kieu="loi">
          Chưa có đơn vị nhận việc nào — khai báo ở chức năng “Đơn vị nhận việc”.
        </ThongBao>
      )}
      <form id="form-nv" onSubmit={(e) => void gui(e)} noValidate>
        <label htmlFor="nv-nd" className={LOP_NHAN}>
          Nội dung nhiệm vụ <span className="text-danger">*</span>
        </label>
        <textarea
          id="nv-nd"
          rows={4}
          value={noiDung}
          disabled={dangGui}
          placeholder="Mô tả công việc cần thực hiện…"
          onChange={(e) => datNoiDung(e.target.value)}
          className={`${LOP_O_NHO} mb-3.5`}
        />
        <label htmlFor="nv-dv" className={LOP_NHAN}>
          Đơn vị nhận <span className="text-danger">*</span>
        </label>
        <select
          id="nv-dv"
          value={maDonVi}
          disabled={dangGui}
          onChange={(e) => datMaDonVi(e.target.value)}
          className={`${LOP_O_NHO} mb-3.5`}
        >
          <option value="">— Chọn đơn vị nhận —</option>
          {donVi.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {NHAN_LOAI_DON_VI[d.type as LoaiDonVi] ?? d.type}
            </option>
          ))}
        </select>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <div className="mb-3.5">
            <label htmlFor="nv-han" className={LOP_NHAN}>
              Hạn xử lý
            </label>
            <input
              id="nv-han"
              type="date"
              value={han}
              disabled={dangGui}
              onChange={(e) => datHan(e.target.value)}
              className={LOP_O_NHO}
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="nv-lq" className={LOP_NHAN}>
              Văn bản / tài liệu liên quan
            </label>
            <input
              id="nv-lq"
              value={lienQuan}
              disabled={dangGui}
              placeholder="VD: Kế hoạch số …/KH-UBND"
              onChange={(e) => datLienQuan(e.target.value)}
              className={LOP_O_NHO}
            />
          </div>
        </div>
        <label htmlFor="nv-tep" className={LOP_NHAN}>
          Tệp đính kèm
        </label>
        <input id="nv-tep" ref={oTep} type="file" disabled={dangGui} className="w-full text-[13px]" />
        {sua?.attachment_filename && (
          <p className="mt-1 mb-0 text-[11.5px] text-faint">
            Đang đính kèm: {sua.attachment_filename}. Chọn tệp mới để thay.
          </p>
        )}
      </form>
    </HopThoai>
  )
}

/* ── AI phân công từ tệp (chạy nền) ───────────────────────────────────────── */

function FormPhanCongTep({ dong, batDau }: { dong: () => void; batDau: (job: string, cau: string) => void }) {
  const oTep = useRef<HTMLInputElement>(null)
  const [uuTien, datUuTien] = useState<UuTienGiao>('AUTO')
  const [soNgay, datSoNgay] = useState(14)
  const [ghiChu, datGhiChu] = useState('')
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    const tep = oTep.current?.files?.[0]
    if (!tep) return datLoi('Chưa chọn tệp văn bản.')
    const du = new FormData()
    du.append('file', tep)
    du.append('priority', uuTien)
    du.append('default_deadline_days', String(Math.min(365, Math.max(1, soNgay || 14))))
    if (ghiChu.trim()) du.append('description', ghiChu.trim())
    datLoi(undefined)
    datDangGui(true)
    try {
      const job = await phanCongTuTep(du)
      batDau(job.job_id, job.message || 'Đã gửi tệp — AI đang phân công.')
    } catch (e) {
      datLoi(
        e instanceof LoiApi && e.ma === 422
          ? 'Chưa phân công được: phải có danh sách Đơn vị nhận việc để AI chọn.'
          : loiCua(e, 'Không gửi được tệp.'),
      )
      datDangGui(false)
    }
  }

  return (
    <HopThoai
      tieuDe="AI phân công từ tệp"
      phu="AI đọc tệp, tự tách việc và giao cho đơn vị phù hợp."
      dong={dong}
      khoa={dangGui}
      chan={
        <>
          <Nut onClick={dong} disabled={dangGui}>
            Hủy
          </Nut>
          <Nut type="submit" form="form-pc-tep" kieu="chinh" disabled={dangGui}>
            <BieuTuong ten="ai" co={16} /> {dangGui ? 'Đang gửi…' : 'Bắt đầu phân công'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <form id="form-pc-tep" onSubmit={(e) => void gui(e)} noValidate>
        <label htmlFor="pct-tep" className={LOP_NHAN}>
          Tệp văn bản (PDF, DOCX, TXT, MD — tối đa 20 MB)
        </label>
        <input
          id="pct-tep"
          ref={oTep}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          disabled={dangGui}
          className="w-full text-[13px]"
        />
        <p className="mt-1 mb-3.5 text-[11.5px] text-faint">
          PDF scan vẫn nhận — AI vừa nhận dạng chữ vừa phân công. Tệp nguồn được đính kèm vào mọi nhiệm vụ AI
          tạo ra.
        </p>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <div className="mb-3.5">
            <label htmlFor="pct-ut" className={LOP_NHAN}>
              Ưu tiên giao cho
            </label>
            <select
              id="pct-ut"
              value={uuTien}
              disabled={dangGui}
              onChange={(e) => datUuTien(e.target.value as UuTienGiao)}
              className={LOP_O_NHO}
            >
              {Object.entries(NHAN_UU_TIEN).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label htmlFor="pct-han" className={LOP_NHAN}>
              Hạn xử lý mặc định (ngày)
            </label>
            <input
              id="pct-han"
              type="number"
              min={1}
              max={365}
              value={soNgay}
              disabled={dangGui}
              onChange={(e) => datSoNgay(Number(e.target.value))}
              className={LOP_O_NHO}
            />
          </div>
        </div>
        <label htmlFor="pct-gc" className={LOP_NHAN}>
          Ghi chú thêm cho AI
        </label>
        <textarea
          id="pct-gc"
          rows={3}
          value={ghiChu}
          disabled={dangGui}
          placeholder="VD: Chỉ giao việc thuộc mảng công nghệ thông tin…"
          onChange={(e) => datGhiChu(e.target.value)}
          className={LOP_O_NHO}
        />
      </form>
    </HopThoai>
  )
}
