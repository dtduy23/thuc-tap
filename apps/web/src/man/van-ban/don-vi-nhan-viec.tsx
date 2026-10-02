/**
 * Xử lý văn bản › Đơn vị nhận việc — cơ quan, phòng ban, cá nhân mà AI của FOXAI Native
 * chọn khi phân công nhiệm vụ từ văn bản (`/processing-units`, màn "Vai trò các cấp xử lý"
 * cũ ở GDOS cũ). Mô tả chức năng càng rõ, AI giao việc càng trúng.
 */
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import {
  KHOA_NATIVE_VB,
  NHAN_LOAI_DON_VI,
  suaDonVi,
  taoDonVi,
  truyVanDonViChon,
  truyVanDonViXuLy,
  xoaDonVi,
  type DonViXuLy,
  type LoaiDonVi,
  type ThamSoDonVi,
} from '@/lib/native-vb'
import { truyVanToi } from '@/lib/phien'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { BieuTuong, HopThoai, LOP_NHAN, LOP_O_NHO, LuoiKpi, NutIcon, TheKpi, useSanSangNative } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const MAU_LOAI: Record<LoaiDonVi, 'brand' | 'ok' | 'tim'> = {
  CO_QUAN: 'brand',
  PHONG_BAN: 'ok',
  CA_NHAN: 'tim',
}

export default function DonViNhanViec() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { san, canhBao } = useSanSangNative()
  const q = useQuery({ ...truyVanDonViXuLy, enabled: san })
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const [sua, datSua] = useState<DonViXuLy | 'moi'>()
  const coSua = toi.quyen.includes('VAN_BAN.UPDATE')
  const ds = q.data?.data ?? []
  const dem = (l: LoaiDonVi) => ds.filter((d) => d.type === l).length

  const cot: CotLuoi<DonViXuLy>[] = [
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
      nhan: 'Tên đơn vị / cá nhân',
      kieu: 'chu',
      rong: 260,
      batBuoc: true,
      giaTri: (d) => d.name,
      hien: (d) => <b className="text-ink">{d.name}</b>,
    },
    {
      id: 'loai',
      nhan: 'Loại',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (d) => d.type,
      luaChon: Object.entries(NHAN_LOAI_DON_VI).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (d) => (
        <Chip mau={MAU_LOAI[d.type as LoaiDonVi] ?? 'xam'}>
          {NHAN_LOAI_DON_VI[d.type as LoaiDonVi] ?? d.type}
        </Chip>
      ),
    },
    { id: 'cha', nhan: 'Trực thuộc', kieu: 'danh-muc', rong: 200, giaTri: (d) => d.parent_name },
    { id: 'phuTrach', nhan: 'Người phụ trách', kieu: 'chu', rong: 170, giaTri: (d) => d.supervisor },
    {
      id: 'chucNang',
      nhan: 'Chức năng, nhiệm vụ',
      kieu: 'chu',
      rong: 340,
      giaTri: (d) => d.functions,
      hien: (d) => <span className="line-clamp-2 text-[12.5px] text-body">{d.functions}</span>,
    },
    { id: 'diem', nhan: 'Mức ưu tiên', kieu: 'so', rong: 110, an: true, giaTri: (d) => d.score },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 100,
      khongLoc: true,
      giaTri: () => null,
      hien: (d) =>
        coSua && (
          <span className="flex items-center gap-0.5">
            <NutIcon nhan="Sửa" ten="sua" onClick={() => datSua(d)} />
            <NutIcon
              nhan="Xóa"
              ten="xoa"
              nguyHiem
              onClick={() => {
                if (
                  !confirm(
                    `Xóa "${d.name}"? Đơn vị trực thuộc không bị xóa theo — chỉ mất liên kết trực thuộc.`,
                  )
                )
                  return
                datTb(undefined)
                xoaDonVi(d.id)
                  .then(async () => {
                    datTb({ ok: true, cau: `Đã xóa "${d.name}".` })
                    await qc.invalidateQueries({ queryKey: [...KHOA_NATIVE_VB, 'don-vi'] })
                  })
                  .catch((e: unknown) => datTb({ ok: false, cau: loiCua(e, 'Không xóa được.') }))
              }}
            />
          </span>
        ),
    },
  ]

  return (
    <>
      <p className="mt-0 mb-4 text-[13px] text-faint">
        Danh sách cơ quan, phòng ban, cá nhân để AI chọn khi phân công nhiệm vụ từ văn bản — mô tả chức năng
        càng rõ, AI giao việc càng trúng.
      </p>
      {canhBao}
      {q.error && <ThongBao kieu="loi">{loiCua(q.error, 'Không tải được danh sách.')}</ThongBao>}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <LuoiKpi>
        <TheKpi nhan="Tổng số" giaTri={q.data ? ds.length : '—'} bieuTuong="viec" mau="brand" />
        <TheKpi nhan="Cơ quan" giaTri={q.data ? dem('CO_QUAN') : '—'} bieuTuong="nhom" mau="tim" />
        <TheKpi nhan="Phòng ban" giaTri={q.data ? dem('PHONG_BAN') : '—'} bieuTuong="mau" mau="ok" />
        <TheKpi nhan="Cá nhân" giaTri={q.data ? dem('CA_NHAN') : '—'} bieuTuong="nguoi" mau="warn" />
      </LuoiKpi>

      <Luoi
        ma="native-don-vi-nhan-viec"
        tieuDe="Đơn vị nhận việc"
        cot={cot}
        dong={ds}
        khoa={(d) => d.id}
        moDong={coSua ? (d) => datSua(d) : undefined}
        rong={
          !san
            ? 'Chưa dùng được — xem thông báo phía trên.'
            : q.isPending
              ? 'Đang tải…'
              : 'Chưa khai báo đơn vị nào.'
        }
        congCu={
          san &&
          coSua && (
            <Nut kieu="chinh" onClick={() => datSua('moi')}>
              <BieuTuong ten="cong" co={16} /> Thêm đơn vị
            </Nut>
          )
        }
      />

      {sua && (
        <FormDonVi
          sua={sua === 'moi' ? null : sua}
          dong={() => datSua(undefined)}
          xong={async (cau) => {
            datSua(undefined)
            datTb({ ok: true, cau })
            await qc.invalidateQueries({ queryKey: [...KHOA_NATIVE_VB, 'don-vi'] })
          }}
        />
      )}
    </>
  )
}

function FormDonVi({
  sua,
  dong,
  xong,
}: {
  sua: DonViXuLy | null
  dong: () => void
  xong: (cau: string) => Promise<void>
}) {
  const { data: chon } = useQuery(truyVanDonViChon)
  const [ten, datTen] = useState(sua?.name ?? '')
  const [loai, datLoai] = useState<LoaiDonVi>((sua?.type as LoaiDonVi) ?? 'PHONG_BAN')
  const [cha, datCha] = useState(sua?.parent_id ?? '')
  const [phuTrach, datPhuTrach] = useState(sua?.supervisor ?? '')
  const [diem, datDiem] = useState(sua?.score ?? 8)
  const [chucNang, datChucNang] = useState(sua?.functions ?? '')
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    if (!ten.trim()) return datLoi('Chưa nhập tên.')
    if (!chucNang.trim()) return datLoi('Chưa mô tả chức năng, nhiệm vụ — AI dựa vào đây để giao việc.')
    const ts: ThamSoDonVi = {
      name: ten.trim(),
      type: loai,
      score: Math.min(10, Math.max(0, diem)),
      // Cá nhân không có người phụ trách.
      supervisor: loai === 'CA_NHAN' ? null : phuTrach.trim() || null,
      parent_id: cha || null,
      functions: chucNang.trim(),
    }
    datLoi(undefined)
    datDangGui(true)
    try {
      if (sua) await suaDonVi(sua.id, ts)
      else await taoDonVi(ts)
      await xong(sua ? `Đã lưu "${ts.name}".` : `Đã thêm "${ts.name}".`)
    } catch (e) {
      datLoi(loiCua(e, 'Không lưu được.'))
      datDangGui(false)
    }
  }

  return (
    <HopThoai
      tieuDe={sua ? 'Sửa đơn vị nhận việc' : 'Thêm đơn vị nhận việc'}
      dong={dong}
      khoa={dangGui}
      rong="max-w-[600px]"
      chan={
        <>
          <Nut onClick={dong} disabled={dangGui}>
            Hủy
          </Nut>
          <Nut type="submit" form="form-dvnv" kieu="chinh" disabled={dangGui}>
            <BieuTuong ten="tich" co={16} /> {dangGui ? 'Đang lưu…' : sua ? 'Lưu thay đổi' : 'Thêm'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <form id="form-dvnv" onSubmit={(e) => void gui(e)} noValidate>
        <div className="grid gap-x-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="mb-3.5">
            <label htmlFor="dv-ten" className={LOP_NHAN}>
              Tên đơn vị / cá nhân <span className="text-danger">*</span>
            </label>
            <input
              id="dv-ten"
              value={ten}
              maxLength={200}
              disabled={dangGui}
              onChange={(e) => datTen(e.target.value)}
              className={LOP_O_NHO}
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="dv-loai" className={LOP_NHAN}>
              Loại
            </label>
            <select
              id="dv-loai"
              value={loai}
              disabled={dangGui}
              onChange={(e) => datLoai(e.target.value as LoaiDonVi)}
              className={LOP_O_NHO}
            >
              {Object.entries(NHAN_LOAI_DON_VI).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <div className="mb-3.5">
            <label htmlFor="dv-cha" className={LOP_NHAN}>
              Trực thuộc
            </label>
            <select
              id="dv-cha"
              value={cha}
              disabled={dangGui}
              onChange={(e) => datCha(e.target.value)}
              className={LOP_O_NHO}
            >
              <option value="">— Không —</option>
              {(chon ?? [])
                .filter((d) => d.id !== sua?.id && d.type !== 'CA_NHAN')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label htmlFor="dv-diem" className={LOP_NHAN}>
              Mức ưu tiên (0–10)
            </label>
            <input
              id="dv-diem"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={diem}
              disabled={dangGui}
              onChange={(e) => datDiem(Number(e.target.value))}
              className={LOP_O_NHO}
            />
          </div>
        </div>
        {loai !== 'CA_NHAN' && (
          <div className="mb-3.5">
            <label htmlFor="dv-pt" className={LOP_NHAN}>
              Người phụ trách
            </label>
            <input
              id="dv-pt"
              value={phuTrach}
              maxLength={200}
              disabled={dangGui}
              onChange={(e) => datPhuTrach(e.target.value)}
              className={LOP_O_NHO}
            />
          </div>
        )}
        <label htmlFor="dv-cn" className={LOP_NHAN}>
          Chức năng, nhiệm vụ <span className="text-danger">*</span>
        </label>
        <textarea
          id="dv-cn"
          rows={5}
          value={chucNang}
          disabled={dangGui}
          placeholder="Mô tả lĩnh vực, việc đơn vị này phụ trách — AI dựa vào đây để giao việc."
          onChange={(e) => datChucNang(e.target.value)}
          className={LOP_O_NHO}
        />
      </form>
    </HopThoai>
  )
}
