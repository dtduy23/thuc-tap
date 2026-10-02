/**
 * Nguồn dữ liệu vào › Kết quả lấy về — hai góc nhìn của cùng một kho:
 *   Số liệu đang dùng — từng (chỉ tiêu, kỳ) đang có trong kho, đến từ kênh / nguồn nào.
 *   Lịch sử nạp       — từng lần nạp qua API hay Excel: ai, lúc nào, bao nhiêu dòng, lỗi gì.
 */
import { KENH_NAP, LINH_VUC_CHI_TIEU, kyHien, timChiTieu, type LanNap, type SoLieuDaNap } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { KHOA_NGUON_VAO, truyVanLanNap, truyVanSoLieuNap, xoaSoLieuNap } from '@/lib/nguon-vao'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { ChonCheDo, HopThoai, LuoiKpi, TheKpi } from '../van-ban/chung'
import { soVn } from './chung'

const KENH = Object.entries(KENH_NAP).map(([giaTri, nhan]) => ({ giaTri, nhan }))

function SoLieu() {
  const qc = useQueryClient()
  const { data: ds } = useSuspenseQuery(truyVanSoLieuNap)
  const [loi, datLoi] = useState<string>()
  const xoa = useMutation({
    mutationFn: (d: SoLieuDaNap) => xoaSoLieuNap(d.id),
    onSuccess: async () => {
      datLoi(undefined)
      await qc.invalidateQueries({ queryKey: KHOA_NGUON_VAO })
      await qc.invalidateQueries({ queryKey: ['chi-tieu'] })
    },
    onError: (e) => datLoi(e instanceof LoiApi ? e.message : 'Không bỏ được.'),
  })

  const cot: CotLuoi<SoLieuDaNap>[] = [
    {
      id: 'ma',
      nhan: 'Mã',
      kieu: 'chu',
      rong: 110,
      batBuoc: true,
      giaTri: (d) => d.maChiTieu,
      hien: (d) => <code className="text-[12px]">{d.maChiTieu}</code>,
    },
    {
      id: 'ten',
      nhan: 'Chỉ tiêu',
      kieu: 'chu',
      rong: 320,
      giaTri: (d) => timChiTieu(d.maChiTieu)?.ten ?? '',
      hien: (d) => <b className="text-ink">{timChiTieu(d.maChiTieu)?.ten ?? '—'}</b>,
    },
    {
      id: 'linhVuc',
      nhan: 'Lĩnh vực',
      kieu: 'danh-muc',
      rong: 190,
      giaTri: (d) => {
        const c = timChiTieu(d.maChiTieu)
        return c ? LINH_VUC_CHI_TIEU[c.linhVuc] : null
      },
    },
    {
      id: 'ky',
      nhan: 'Kỳ',
      kieu: 'danh-muc',
      rong: 110,
      giaTri: (d) => d.ky,
      luaChon: [...new Set(ds.map((d) => d.ky))].map((k) => ({ giaTri: k, nhan: kyHien(k) })),
      hien: (d) => kyHien(d.ky),
    },
    {
      id: 'giaTri',
      nhan: 'Giá trị',
      kieu: 'so',
      rong: 130,
      giaTri: (d) => d.giaTri,
      hien: (d) => soVn(d.giaTri),
    },
    {
      id: 'donVi',
      nhan: 'Đơn vị tính',
      kieu: 'danh-muc',
      rong: 120,
      giaTri: (d) => timChiTieu(d.maChiTieu)?.donVi ?? null,
    },
    {
      id: 'kenh',
      nhan: 'Kênh',
      kieu: 'danh-muc',
      rong: 100,
      giaTri: (d) => d.kenh,
      luaChon: KENH,
      hien: (d) => <Chip mau={d.kenh === 'api' ? 'brand' : 'tim'}>{KENH_NAP[d.kenh]}</Chip>,
    },
    { id: 'tenNguon', nhan: 'Nguồn / tệp', kieu: 'chu', rong: 230, giaTri: (d) => d.tenNguon },
    {
      id: 'luc',
      nhan: 'Nạp lúc',
      kieu: 'ngay',
      rong: 170,
      giaTri: (d) => d.luc.slice(0, 10),
      hien: (d) => ngayGio(d.luc),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 90,
      khongLoc: true,
      giaTri: () => null,
      hien: (d) => (
        <Nut
          kieu="nguy-hiem"
          disabled={xoa.isPending}
          onClick={() =>
            window.confirm(
              `Bỏ số ${d.maChiTieu} kỳ ${kyHien(d.ky)} khỏi kho? Điều hành sẽ không dùng số này nữa.`,
            ) && xoa.mutate(d)
          }
        >
          Bỏ
        </Nut>
      ),
    },
  ]

  return (
    <>
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <LuoiKpi>
        <TheKpi nhan="Số liệu trong kho" giaTri={ds.length} bieuTuong="van" mau="brand" />
        <TheKpi
          nhan="Chỉ tiêu có số"
          giaTri={new Set(ds.map((d) => d.maChiTieu)).size}
          bieuTuong="xong"
          mau="ok"
        />
        <TheKpi nhan="Số kỳ" giaTri={new Set(ds.map((d) => d.ky)).size} bieuTuong="cho" mau="tim" />
      </LuoiKpi>
      <Luoi
        ma="nguon-vao-so-lieu"
        tieuDe="Số liệu đang dùng"
        cot={cot}
        dong={ds}
        khoa={(d) => d.id}
        rong="Kho chưa có số nào — nạp qua “Nguồn API” hoặc “Nạp từ Excel”."
      />
    </>
  )
}

function LichSu() {
  const { data: ds } = useSuspenseQuery(truyVanLanNap)
  const [mo, datMo] = useState<LanNap>()

  const cot: CotLuoi<LanNap>[] = [
    {
      id: 'luc',
      nhan: 'Lúc nạp',
      kieu: 'ngay',
      rong: 170,
      batBuoc: true,
      giaTri: (l) => l.luc.slice(0, 10),
      hien: (l) => ngayGio(l.luc),
    },
    {
      id: 'kenh',
      nhan: 'Kênh',
      kieu: 'danh-muc',
      rong: 100,
      giaTri: (l) => l.kenh,
      luaChon: KENH,
      hien: (l) => <Chip mau={l.kenh === 'api' ? 'brand' : 'tim'}>{KENH_NAP[l.kenh]}</Chip>,
    },
    {
      id: 'tenNguon',
      nhan: 'Nguồn / tệp',
      kieu: 'chu',
      rong: 260,
      giaTri: (l) => l.tenNguon,
      hien: (l) => <b className="text-ink">{l.tenNguon}</b>,
    },
    {
      id: 'trangThai',
      nhan: 'Kết quả',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (l) => (l.trangThai === 'xong' ? 'Đã ghi' : 'Không ghi được'),
      hien: (l) => (
        <Chip mau={l.trangThai === 'loi' ? 'danger' : l.soLoi ? 'warn' : 'ok'}>
          {l.trangThai === 'xong' ? 'Đã ghi' : 'Không ghi được'}
        </Chip>
      ),
    },
    { id: 'soDong', nhan: 'Số đã ghi', kieu: 'so', rong: 110, cong: true, giaTri: (l) => l.soDong },
    { id: 'soLoi', nhan: 'Dòng lỗi', kieu: 'so', rong: 100, cong: true, giaTri: (l) => l.soLoi },
    { id: 'nguoiNap', nhan: 'Người nạp', kieu: 'chu', rong: 190, giaTri: (l) => l.nguoiNap },
    {
      id: 'loi',
      nhan: 'Lỗi đầu tiên',
      kieu: 'chu',
      rong: 340,
      giaTri: (l) => l.loi[0] ?? null,
      hien: (l) => <span className="line-clamp-2 text-[12.5px] text-danger">{l.loi[0] ?? ''}</span>,
    },
  ]

  return (
    <>
      <Luoi
        ma="nguon-vao-lan-nap"
        tieuDe="Lịch sử nạp"
        cot={cot}
        dong={ds}
        khoa={(l) => l.id}
        moDong={datMo}
        mauDong={(l) => (l.trangThai === 'loi' ? 'danger' : l.soLoi ? 'warn' : undefined)}
        rong="Chưa có lần nạp nào."
      />
      {mo && (
        <HopThoai
          tieuDe={mo.tenNguon}
          phu={`${KENH_NAP[mo.kenh]} · ${ngayGio(mo.luc)}${mo.nguoiNap ? ` · ${mo.nguoiNap}` : ''}`}
          dong={() => datMo(undefined)}
          rong="max-w-[680px]"
          chan={<Nut onClick={() => datMo(undefined)}>Đóng</Nut>}
        >
          <p className="mt-0 text-[13px]">
            Đã ghi <b>{mo.soDong}</b> số liệu · <b>{mo.soLoi}</b> dòng lỗi.
          </p>
          {mo.loi.length === 0 ? (
            <p className="m-0 text-[13px] text-ok">Không có lỗi.</p>
          ) : (
            <ul className="m-0 list-disc pl-5 text-[12.5px] text-danger">
              {mo.loi.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </HopThoai>
      )}
    </>
  )
}

export default function KetQuaNap() {
  const [xem, datXem] = useState<'so-lieu' | 'lich-su'>('so-lieu')
  return (
    <>
      <div className="mb-3 max-w-[420px]">
        <ChonCheDo
          giaTri={xem}
          doi={datXem}
          muc={[
            { id: 'so-lieu', nhan: 'Số liệu đang dùng' },
            { id: 'lich-su', nhan: 'Lịch sử nạp' },
          ]}
        />
      </div>
      {xem === 'so-lieu' ? <SoLieu /> : <LichSu />}
    </>
  )
}
