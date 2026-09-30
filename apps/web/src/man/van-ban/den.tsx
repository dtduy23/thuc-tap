/**
 * Xử lý văn bản › Văn bản đến — văn bản từ hệ thống bên ngoài (QLVB&ĐH, Cổng dịch vụ công,
 * Email công vụ) đổ vào FOXAI Native qua cổng tích hợp, GDOS kéo về hồ sơ `van_ban` của
 * mình (ADR-0009). Văn bản tự tải lên nằm ở "Tóm tắt văn bản". Từ đây: xem, tóm tắt, soạn
 * văn bản trả lời, giao việc — bố cục theo màn cũ ở gdos.fox.ai.vn.
 */
import {
  LOAI_VAN_BAN,
  NGUON_VAN_BAN,
  TRANG_THAI_VAN_BAN,
  type NguonVanBan,
  type VanBanDong,
} from '@gdos/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LoiApi } from '@/lib/http'
import { phanCongTuTomTat } from '@/lib/native-vb'
import { truyVanToi } from '@/lib/phien'
import { KHOA_VAN_BAN, chayLaiVanBan, truyVanTrangThaiVanBan, truyVanVanBan } from '@/lib/van-ban'
import { Chip, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { ChipVanBan, LuoiKpi, NutIcon, TheKpi } from './chung'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const MAU_NGUON: Partial<Record<NguonVanBan, 'brand' | 'ok' | 'tim' | 'warn'>> = {
  qlvb: 'brand',
  'cong-dvc': 'ok',
  email: 'tim',
  khac: 'warn',
}

export default function VanBanDen() {
  const qc = useQueryClient()
  const di = useNavigate()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: tatCa } = useSuspenseQuery(truyVanVanBan)
  const { data: tt } = useSuspenseQuery(truyVanTrangThaiVanBan)
  const [tb, datTb] = useState<{ ok: boolean; cau: string }>()
  const ds = tatCa.filter((v) => v.nguon !== 'tai-len')
  const coSua = toi.quyen.includes('VAN_BAN.UPDATE')
  const coSoan = toi.quyen.includes('VAN_BAN.CREATE')
  const coGiao = toi.quyen.includes('VAN_BAN.ASSIGN')
  const dem = (n: NguonVanBan) => ds.filter((v) => v.nguon === n).length

  const lam = (viec: () => Promise<unknown>, cau: string) => {
    datTb(undefined)
    viec()
      .then(async () => {
        datTb({ ok: true, cau })
        await qc.invalidateQueries({ queryKey: KHOA_VAN_BAN })
      })
      .catch((e: unknown) => datTb({ ok: false, cau: loiCua(e, 'Không thực hiện được.') }))
  }
  const moVb = (v: VanBanDong) => void di({ to: '/van-ban/$id', params: { id: v.id } })

  const cot: CotLuoi<VanBanDong>[] = [
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
      nhan: 'Trích yếu văn bản',
      kieu: 'chu',
      rong: 380,
      batBuoc: true,
      giaTri: (v) => v.ten,
      hien: (v) => (
        <span className="block">
          <b className="block truncate text-ink">{v.ten}</b>
          <span className="text-[11.5px] text-faint">
            {v.soKyTuGoc !== null ? `${v.soKyTuGoc.toLocaleString('vi-VN')} ký tự` : 'Chưa trích nội dung'}
            {v.tenTep && ` • ${v.tenTep}`}
          </span>
        </span>
      ),
    },
    {
      id: 'nguon',
      nhan: 'Nguồn',
      kieu: 'danh-muc',
      rong: 170,
      giaTri: (v) => v.nguon,
      luaChon: Object.entries(NGUON_VAN_BAN)
        .filter(([k]) => k !== 'tai-len')
        .map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (v) => <Chip mau={MAU_NGUON[v.nguon] ?? 'xam'}>{NGUON_VAN_BAN[v.nguon]}</Chip>,
    },
    {
      id: 'loai',
      nhan: 'Loại',
      kieu: 'danh-muc',
      rong: 120,
      giaTri: (v) => v.loai,
      luaChon: LOAI_VAN_BAN.map((l) => ({ giaTri: l, nhan: l })),
    },
    { id: 'nhan', nhan: 'Ngày nhận', kieu: 'ngay', rong: 120, giaTri: (v) => v.taoLuc.slice(0, 10) },
    { id: 'gui', nhan: 'Người nhập / gửi', kieu: 'danh-muc', rong: 160, an: true, giaTri: (v) => v.nguoiTao },
    {
      id: 'trangThai',
      nhan: 'Tóm tắt',
      kieu: 'danh-muc',
      rong: 150,
      giaTri: (v) => v.trangThai,
      luaChon: Object.entries(TRANG_THAI_VAN_BAN).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (v) => <ChipVanBan tt={v.trangThai} />,
    },
    { id: 'donVi', nhan: 'Đơn vị', kieu: 'danh-muc', rong: 150, an: true, giaTri: (v) => v.donViTen },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 170,
      khongLoc: true,
      giaTri: () => null,
      hien: (v) => (
        <span className="flex items-center gap-0.5">
          <NutIcon nhan="Xem văn bản và bản tóm tắt" ten="xem" onClick={() => moVb(v)} />
          {coSua && v.trangThai !== 'xong' && v.trangThai !== 'dang-xu-ly' && v.trangThai !== 'cho' && (
            <NutIcon
              nhan="AI tóm tắt văn bản này"
              ten="ai"
              disabled={!tt.daLienKet}
              onClick={() => lam(() => chayLaiVanBan(v.id), `Đã gửi "${v.ten}" cho AI tóm tắt.`)}
            />
          )}
          {coSoan && v.trangThai === 'xong' && (
            <NutIcon
              nhan="Soạn văn bản trả lời"
              ten="sua"
              onClick={() =>
                void di({ to: '/$chucNang', params: { chucNang: 'vb-soan-thao' }, search: { nguon: v.id } })
              }
            />
          )}
          {coGiao && v.trangThai === 'xong' && v.nativeId && (
            <NutIcon
              nhan="AI phân công nhiệm vụ từ văn bản này"
              ten="viec"
              onClick={() => {
                const ma = v.nativeId!
                if (confirm(`AI đọc bản tóm tắt "${v.ten}" rồi giao việc cho các đơn vị nhận việc?`))
                  lam(() => phanCongTuTomTat(ma), 'AI đã phân công — xem ở "Phân công từ văn bản".')
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
        Văn bản đến từ hệ thống QLVB&ĐH, Cổng dịch vụ công, Email công vụ — đổ vào FOXAI Native qua cổng tích
        hợp, GDOS kéo về theo tài khoản Native của bạn. Văn bản tự tải lên nằm ở{' '}
        <Link
          to="/$chucNang"
          params={{ chucNang: 'vb-tom-tat' }}
          className="font-semibold text-brand underline"
        >
          Tóm tắt văn bản
        </Link>
        .
      </p>
      {tt.cheDo === 'chua' && (
        <ThongBao kieu="loi">
          <b>Chưa kết nối FOXAI Native.</b> {tt.moTa}
        </ThongBao>
      )}
      {tt.cheDo !== 'chua' && !tt.daLienKet && (
        <ThongBao kieu="loi">
          Tài khoản của bạn chưa liên kết FOXAI Native —{' '}
          <Link to="/cai-dat" className="font-semibold underline">
            liên kết ở Cài đặt cá nhân
          </Link>{' '}
          để nhận văn bản đến của bạn.
        </ThongBao>
      )}
      {tb && <ThongBao kieu={tb.ok ? 'ok' : 'loi'}>{tb.cau}</ThongBao>}

      <LuoiKpi>
        <TheKpi nhan="Văn bản đến" giaTri={ds.length} bieuTuong="den" mau="brand" />
        <TheKpi nhan="Từ QLVB&ĐH" giaTri={dem('qlvb')} bieuTuong="van" mau="tim" />
        <TheKpi nhan="Cổng DVC · Email" giaTri={dem('cong-dvc') + dem('email')} bieuTuong="nhom" mau="ok" />
        <TheKpi
          nhan="Chưa tóm tắt"
          giaTri={ds.filter((v) => v.trangThai !== 'xong').length}
          bieuTuong="cho"
          mau="warn"
        />
      </LuoiKpi>

      <Luoi
        ma="van-ban-den"
        tieuDe="Danh sách văn bản đến"
        cot={cot}
        dong={ds}
        khoa={(v) => v.id}
        moDong={moVb}
        rong={
          tt.daLienKet
            ? 'Chưa có văn bản đến. Văn bản từ QLVB, Cổng DVC, Email sẽ hiện ở đây khi cổng tích hợp trên Native gửi vào.'
            : 'Chưa có văn bản đến.'
        }
      />
    </>
  )
}
