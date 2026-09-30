import {
  DUOI_TEP_VAN_BAN,
  LOAI_VAN_BAN,
  NGUON_VAN_BAN,
  TRANG_THAI_VAN_BAN,
  type VanBanDong,
} from '@gdos/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useRef, useState, type FormEvent } from 'react'
import { LoiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import {
  KHOA_VAN_BAN,
  taiLenVanBan,
  taiTomTatDoc,
  truyVanTrangThaiVanBan,
  truyVanVanBan,
  xoaVanBan,
} from '@/lib/van-ban'
import { phanCongTuTomTat } from '@/lib/native-vb'
import { Nut, OChon, ONhap, ODanhDau, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { BieuTuong, ChipVanBan, LuoiKpi, NutIcon, TheKpi } from './chung'

/**
 * Xử lý văn bản › Tóm tắt văn bản — bố cục theo màn cũ ở gdos.fox.ai.vn: thẻ số liệu,
 * "Thêm văn bản", bảng có thao tác từng dòng; lọc theo chuẩn lưới (ô lọc dưới mỗi cột).
 * Văn bản trong tài khoản FOXAI Native của người dùng được kéo về đây (ADR-0009).
 */
export default function TomTatVanBan() {
  const qc = useQueryClient()
  const di = useNavigate()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: ds } = useSuspenseQuery(truyVanVanBan)
  const { data: tt } = useSuspenseQuery(truyVanTrangThaiVanBan)
  const [moThem, datMoThem] = useState(false)
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const coTao = toi.quyen.includes('VAN_BAN.CREATE') && tt.cheDo !== 'chua' && tt.daLienKet
  const coSua = toi.quyen.includes('VAN_BAN.UPDATE')
  const coXoa = toi.quyen.includes('VAN_BAN.DELETE')
  const coGiao = toi.quyen.includes('VAN_BAN.ASSIGN')
  const coSoan = toi.quyen.includes('VAN_BAN.CREATE') && tt.cheDo === 'that'

  const daTomTat = ds.filter((d) => d.trangThai === 'xong')
  const tyLe = daTomTat.filter((d) => d.tyLeRutGon !== null)
  const tyLeTb = tyLe.length ? Math.round(tyLe.reduce((t, d) => t + d.tyLeRutGon!, 0) / tyLe.length) : null

  const moVb = (d: VanBanDong, sua = false) =>
    void di({ to: '/van-ban/$id', params: { id: d.id }, search: sua ? { sua: true } : {} })
  const lam = (viec: () => Promise<unknown>, cau: string) => {
    datTb(undefined)
    viec()
      .then(async () => {
        datTb({ ok: true, cau })
        await qc.invalidateQueries({ queryKey: KHOA_VAN_BAN })
      })
      .catch((e: unknown) =>
        datTb({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không thực hiện được.' }),
      )
  }

  const cot: CotLuoi<VanBanDong>[] = [
    {
      id: 'stt',
      nhan: 'STT',
      kieu: 'so',
      rong: 64,
      khongLoc: true,
      giaTri: () => null,
      hien: (_d, stt) => <span className="text-faint">{stt}</span>,
    },
    {
      id: 'ten',
      nhan: 'Tên văn bản',
      kieu: 'chu',
      rong: 380,
      batBuoc: true,
      giaTri: (d) => d.ten,
      hien: (d) => (
        <span className="block">
          <b className="block truncate text-ink">{d.ten}</b>
          <span className="text-[11.5px] text-faint">
            {d.soKyTuGoc !== null
              ? `${d.soKyTuGoc.toLocaleString('vi-VN')} ký tự gốc`
              : 'Chưa trích nội dung'}
            {d.tyLeRutGon !== null && ` • Đã rút gọn ${Math.round(d.tyLeRutGon)}%`}
          </span>
        </span>
      ),
    },
    {
      id: 'loai',
      nhan: 'Loại',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (d) => d.loai,
      luaChon: LOAI_VAN_BAN.map((l) => ({ giaTri: l, nhan: l })),
      hien: (d) => (
        <span className="rounded-md border border-line px-2 py-0.5 text-[12px] text-body">{d.loai}</span>
      ),
    },
    { id: 'taoLuc', nhan: 'Ngày tạo', kieu: 'ngay', rong: 120, giaTri: (d) => d.taoLuc.slice(0, 10) },
    { id: 'nguoiTao', nhan: 'Người tạo', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.nguoiTao },
    {
      id: 'trangThai',
      nhan: 'Trạng thái',
      kieu: 'danh-muc',
      rong: 150,
      giaTri: (d) => d.trangThai,
      luaChon: Object.entries(TRANG_THAI_VAN_BAN).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (d) => <ChipVanBan tt={d.trangThai} />,
    },
    {
      id: 'nguon',
      nhan: 'Nguồn',
      kieu: 'danh-muc',
      rong: 130,
      an: true,
      giaTri: (d) => d.nguon,
      luaChon: Object.entries(NGUON_VAN_BAN).map(([giaTri, nhan]) => ({ giaTri, nhan })),
    },
    { id: 'rutGon', nhan: 'Rút gọn (%)', kieu: 'so', rong: 110, an: true, giaTri: (d) => d.tyLeRutGon },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 150, an: true, giaTri: (d) => d.donViTen },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 240,
      khongLoc: true,
      giaTri: () => null,
      hien: (d) => (
        <span className="flex items-center gap-0.5">
          <NutIcon nhan="Xem so sánh bản gốc / bản tóm tắt" ten="xem" onClick={() => moVb(d)} />
          {coSua && <NutIcon nhan="Sửa bản tóm tắt" ten="sua" onClick={() => moVb(d, true)} />}
          <NutIcon
            nhan="Tải bản tóm tắt (.doc)"
            ten="tai"
            onClick={() =>
              void taiTomTatDoc(d.id)
                .then(
                  (kq) =>
                    kq === 'chua-co' && datTb({ ok: false, cau: 'Văn bản chưa có bản tóm tắt để tải.' }),
                )
                .catch((e: unknown) =>
                  datTb({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không tải được.' }),
                )
            }
          />
          {coSoan && d.trangThai === 'xong' && (
            <NutIcon
              nhan="Soạn văn bản từ bản tóm tắt"
              ten="van"
              onClick={() =>
                void di({ to: '/$chucNang', params: { chucNang: 'vb-soan-thao' }, search: { nguon: d.id } })
              }
            />
          )}
          {coGiao && d.trangThai === 'xong' && d.nativeId && (
            <NutIcon
              nhan="AI phân công nhiệm vụ từ văn bản này"
              ten="viec"
              onClick={() => {
                const ma = d.nativeId!
                if (confirm(`AI đọc bản tóm tắt "${d.ten}" rồi giao việc cho các đơn vị nhận việc?`))
                  lam(() => phanCongTuTomTat(ma), 'AI đã phân công — xem ở "Phân công từ văn bản".')
              }}
            />
          )}
          {coXoa && (
            <NutIcon
              nhan="Xóa văn bản"
              ten="xoa"
              nguyHiem
              onClick={() => {
                if (confirm(`Xóa văn bản "${d.ten}"? Văn bản cũng bị xóa bên FOXAI Native.`))
                  lam(() => xoaVanBan(d.id), `Đã xóa "${d.ten}".`)
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
        Tự động tóm tắt nội dung văn bản bằng AI — bấm vào một văn bản để xem so sánh bản gốc / bản tóm tắt.
      </p>

      {tt.cheDo === 'gia' && (
        <ThongBao>
          <b>Bản giả.</b> {tt.moTa}
        </ThongBao>
      )}
      {tt.cheDo === 'chua' && (
        <ThongBao kieu="loi">
          <b>Chưa kết nối FOXAI Native.</b> {tt.moTa} Văn bản cũ vẫn xem được.
        </ThongBao>
      )}
      {tt.cheDo !== 'chua' && !tt.daLienKet && (
        <ThongBao kieu="loi">
          Tài khoản của bạn chưa liên kết FOXAI Native —{' '}
          <Link to="/cai-dat" className="font-semibold underline">
            liên kết ở Cài đặt cá nhân
          </Link>{' '}
          để thấy văn bản của bạn trên Native và gửi tóm tắt mới.
        </ThongBao>
      )}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <LuoiKpi>
        <TheKpi nhan="Tổng văn bản" giaTri={ds.length} bieuTuong="van" mau="brand" />
        <TheKpi nhan="Đã tóm tắt" giaTri={daTomTat.length} bieuTuong="xong" mau="ok" />
        <TheKpi nhan="Chưa tóm tắt" giaTri={ds.length - daTomTat.length} bieuTuong="cho" mau="warn" />
        <TheKpi
          nhan="Tỷ lệ rút gọn TB"
          giaTri={tyLeTb === null ? '—' : `${tyLeTb}%`}
          bieuTuong="gon"
          mau="tim"
        />
      </LuoiKpi>

      <Luoi
        ma="van-ban-tom-tat-v2"
        tieuDe="Văn bản tóm tắt"
        cot={cot}
        dong={ds}
        khoa={(d) => d.id}
        moDong={(d) => moVb(d)}
        rong={tt.daLienKet ? 'Chưa có văn bản nào — bấm "Thêm văn bản".' : 'Chưa có văn bản nào.'}
        congCu={
          coTao && (
            <Nut kieu="chinh" onClick={() => datMoThem(true)}>
              <BieuTuong ten="them" co={16} /> Thêm văn bản
            </Nut>
          )
        }
      />

      {moThem && <HopThemVanBan dong={() => datMoThem(false)} />}
    </>
  )
}

/** Hộp "Thêm văn bản" — như màn cũ: tệp, tên, loại, tự tóm tắt ngay. */
function HopThemVanBan({ dong }: { dong: () => void }) {
  const qc = useQueryClient()
  const oTep = useRef<HTMLInputElement>(null)
  const [ten, datTen] = useState('')
  const [loai, datLoai] = useState<string>(LOAI_VAN_BAN[0])
  const [loi, datLoi] = useState<string>()
  const [dangGui, datDangGui] = useState(false)

  const gui = async (e: FormEvent) => {
    e.preventDefault()
    const tep = oTep.current?.files?.[0]
    if (!tep) return datLoi('Chưa chọn tệp.')
    const du = new FormData()
    du.append('tep', tep)
    du.append('loai', loai)
    if (ten.trim()) du.append('ten', ten.trim())
    datLoi(undefined)
    datDangGui(true)
    try {
      await taiLenVanBan(du)
      await qc.invalidateQueries({ queryKey: KHOA_VAN_BAN })
      dong()
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không tải lên được.')
      datDangGui(false)
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !dangGui && dong()}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,22,44,.45)] p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="them-vb-tieu-de"
        className="hien-dan w-full max-w-[480px] rounded-[12px] bg-nen p-5 shadow-[0_18px_44px_rgba(4,14,33,.3)]"
      >
        <h2 id="them-vb-tieu-de" className="m-0 mb-1 text-[17px] font-extrabold text-ink">
          Thêm văn bản
        </h2>
        <p className="mt-0 mb-4 text-[12.5px] text-faint">
          {DUOI_TEP_VAN_BAN.join(', ').toUpperCase()} — tối đa 20 MB. AI tóm tắt ngay sau khi tải lên; bảng tự
          cập nhật khi xong.
        </p>
        {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
        <form onSubmit={(e) => void gui(e)}>
          <div className="mb-3.5">
            <label htmlFor="vbm-tep" className="mb-1.5 block text-[12.5px] font-semibold text-body">
              Tệp văn bản
            </label>
            <input
              id="vbm-tep"
              ref={oTep}
              type="file"
              accept={DUOI_TEP_VAN_BAN.map((d) => `.${d}`).join(',')}
              className="w-full text-[13px]"
            />
          </div>
          <ONhap
            id="vbm-ten"
            nhan="Tên văn bản"
            maxLength={500}
            goiY="Để trống — lấy theo tên tệp."
            value={ten}
            onChange={(e) => datTen(e.target.value)}
          />
          <OChon id="vbm-loai" nhan="Loại văn bản" value={loai} onChange={(e) => datLoai(e.target.value)}>
            {LOAI_VAN_BAN.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </OChon>
          <ODanhDau
            id="vbm-tu-dong"
            nhan="Tự động tóm tắt ngay"
            checked
            readOnly
            disabled
            mo="GDOS luôn gửi tóm tắt ngay khi tải lên."
          />
          <div className="mt-4 flex justify-end gap-2">
            <Nut onClick={dong} disabled={dangGui}>
              Hủy
            </Nut>
            <Nut type="submit" kieu="chinh" disabled={dangGui}>
              {dangGui ? 'Đang gửi…' : 'Thêm & tóm tắt'}
            </Nut>
          </div>
        </form>
      </div>
    </div>
  )
}
