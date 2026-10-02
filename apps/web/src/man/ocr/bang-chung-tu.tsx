/**
 * BẢNG CHỨNG TỪ OCR — thành phần DÙNG LẠI. Trang nào cũng gọi được:
 *
 *   <BangChungTuOcr loai="CHUNGTU" />
 *
 * Không khai cứng cột nào: cột dựng theo ĐỊNH NGHĨA của loại (trường do Native khai), nên
 * loại nào cũng hiện đúng, Native thêm trường thì cột tự thêm. Bấm một dòng mở chi tiết
 * (trường, các bảng dòng hàng, chuỗi JSON gốc); truyền `khiChon` để trang gọi tự xử lý.
 */
import {
  TRANG_THAI_CHUNG_TU_OCR,
  dinhNghiaCho,
  type ChungTuOcr,
  type DinhNghiaOcr,
  type GiaTriOcr,
  type TruongOcr,
} from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ngayGio } from '@/lib/ngay'
import { truyVanChungTuOcr, truyVanLoaiOcr } from '@/lib/ocr'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { HopThoai, TieuDeKhoi } from '../van-ban/chung'

/** Số trường hiện sẵn thành cột; còn lại ẩn, người dùng tự bật ở "Cột". */
const SO_COT_HIEN = 8

const so = (v: number) => v.toLocaleString('vi-VN')

/** Giá trị để HIỆN. */
export function hienGiaTriOcr(v: GiaTriOcr): string {
  if (v === null) return '—'
  if (typeof v === 'number') return so(v)
  if (typeof v === 'boolean') return v ? 'Có' : 'Không'
  return v
}

/** Giá trị để lọc / sắp / xuất Excel. */
const tho = (v: GiaTriOcr | undefined): string | number | null =>
  v === undefined || v === null ? null : typeof v === 'boolean' ? (v ? 'Có' : 'Không') : v

const phanTram = (v: number | null) => (v === null ? null : Math.round(v * 100))

function cotTruong(t: TruongOcr, ds: readonly ChungTuOcr[], an: boolean): CotLuoi<ChungTuOcr> {
  // Chỉ coi là cột số khi MỌI giá trị đều là số — OCR hay trả số dưới dạng chữ.
  const laSo =
    t.kieu === 'so' && ds.every((c) => c.duLieu[t.khoa] == null || typeof c.duLieu[t.khoa] === 'number')
  return {
    id: `t:${t.khoa}`,
    nhan: t.nhan,
    kieu: laSo ? 'so' : 'chu',
    rong: laSo ? 150 : 200,
    an,
    giaTri: (c) => tho(c.duLieu[t.khoa]),
    hien: (c) => {
      const v = c.duLieu[t.khoa] ?? null
      return v === null ? <span className="text-faint">—</span> : hienGiaTriOcr(v)
    },
  }
}

export function BangChungTuOcr({
  loai,
  tieuDe,
  congCu,
  khiChon,
}: {
  /** Mã loại chứng từ phía Native, vd "CHUNGTU". */
  loai: string
  tieuDe?: string
  /** Nút thêm trên thanh công cụ của lưới. */
  congCu?: ReactNode
  /** Trang gọi tự xử lý khi bấm một dòng (vắng: mở hộp chi tiết). */
  khiChon?: (c: ChungTuOcr) => void
}) {
  const { data: dsLoai } = useSuspenseQuery(truyVanLoaiOcr)
  const { data: ds } = useSuspenseQuery(truyVanChungTuOcr(loai))
  const [mo, datMo] = useState<ChungTuOcr>()

  const l = dsLoai.find((x) => x.ma === loai)
  const dn = dinhNghiaCho(l, ds)

  const cot: CotLuoi<ChungTuOcr>[] = [
    {
      id: 'tenTep',
      nhan: 'Tệp',
      kieu: 'chu',
      rong: 240,
      batBuoc: true,
      giaTri: (c) => c.tenTep,
      hien: (c) => <b className="text-ink">{c.tenTep}</b>,
    },
    ...dn.truong.map((t, i) => cotTruong(t, ds, i >= SO_COT_HIEN)),
    ...dn.bang.map((b): CotLuoi<ChungTuOcr> => ({
      id: `b:${b.khoa}`,
      nhan: `${b.ten} (số dòng)`,
      kieu: 'so',
      rong: 150,
      giaTri: (c) => c.bang[b.khoa]?.length ?? 0,
    })),
    {
      id: 'trangThai',
      nhan: 'Trạng thái',
      kieu: 'danh-muc',
      rong: 140,
      giaTri: (c) => c.trangThai,
      luaChon: Object.entries(TRANG_THAI_CHUNG_TU_OCR).map(([giaTri, nhan]) => ({ giaTri, nhan })),
      hien: (c) => (
        <Chip mau={c.trangThai === 'da-xac-nhan' ? 'ok' : 'brand'}>
          {TRANG_THAI_CHUNG_TU_OCR[c.trangThai]}
        </Chip>
      ),
    },
    {
      id: 'doTinCay',
      nhan: 'Độ tin cậy (%)',
      kieu: 'so',
      rong: 130,
      giaTri: (c) => phanTram(c.doTinCay),
    },
    {
      id: 'capNhatLuc',
      nhan: 'Cập nhật trên Native',
      kieu: 'ngay',
      rong: 170,
      giaTri: (c) => c.capNhatLuc?.slice(0, 10) ?? null,
      hien: (c) => (c.capNhatLuc ? ngayGio(c.capNhatLuc) : '—'),
    },
    {
      id: 'layVeLuc',
      nhan: 'Lấy về lúc',
      kieu: 'ngay',
      rong: 170,
      an: true,
      giaTri: (c) => c.layVeLuc.slice(0, 10),
      hien: (c) => ngayGio(c.layVeLuc),
    },
  ]

  return (
    <>
      <Luoi
        ma={`ocr-${loai}`}
        tieuDe={tieuDe ?? l?.ten ?? loai}
        cot={cot}
        dong={ds}
        khoa={(c) => c.id}
        moDong={khiChon ?? datMo}
        congCu={congCu}
        rong="Chưa có chứng từ nào của loại này được lấy về."
      />
      {mo && <ChiTietChungTuOcr chungTu={mo} dinhNghia={dn} dong={() => datMo(undefined)} />}
    </>
  )
}

/** Hộp chi tiết một chứng từ: trường, các bảng, chuỗi JSON gốc. Dùng riêng cũng được. */
export function ChiTietChungTuOcr({
  chungTu: c,
  dinhNghia: dn,
  dong,
}: {
  chungTu: ChungTuOcr
  dinhNghia: DinhNghiaOcr
  dong: () => void
}) {
  const [daChep, datDaChep] = useState(false)
  const json = JSON.stringify({ data: c.duLieu, tables: c.bang }, null, 2)
  const chep = async () => {
    try {
      await navigator.clipboard.writeText(json)
      datDaChep(true)
    } catch {
      datDaChep(false)
    }
  }
  const tin = phanTram(c.doTinCay)

  return (
    <HopThoai
      tieuDe={c.tenTep}
      phu={`${c.tenLoai} · ${TRANG_THAI_CHUNG_TU_OCR[c.trangThai]}${tin === null ? '' : ` · độ tin cậy ${tin}%`}`}
      dong={dong}
      rong="max-w-[920px]"
      chan={<Nut onClick={dong}>Đóng</Nut>}
    >
      <dl className="m-0 grid min-w-0 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {dn.truong.map((t) => (
          <div key={t.khoa} className="min-w-0 border-b border-line-2 pb-2">
            <dt className="text-[11.5px] font-semibold text-faint">{t.nhan}</dt>
            <dd className="m-0 text-[13.5px] break-words text-ink">
              {hienGiaTriOcr(c.duLieu[t.khoa] ?? null)}
            </dd>
          </div>
        ))}
      </dl>

      {dn.bang.map((b) => {
        const cacDong = c.bang[b.khoa] ?? []
        return (
          <div key={b.khoa} className="mt-5">
            <TieuDeKhoi phu={`${cacDong.length} dòng`}>{b.ten}</TieuDeKhoi>
            {cacDong.length === 0 ? (
              <p className="m-0 text-[12.5px] text-faint">Không có dòng nào.</p>
            ) : (
              <KhungBang nhan={b.ten}>
                <thead>
                  <tr>
                    {b.cot.map((k) => (
                      <th key={k.khoa} scope="col" className={LOP_TH}>
                        {k.nhan}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cacDong.map((d, i) => (
                    <tr key={i}>
                      {b.cot.map((k) => (
                        <td
                          key={k.khoa}
                          className={`${LOP_TD} ${typeof d[k.khoa] === 'number' ? 'text-right tabular-nums' : ''}`}
                        >
                          {hienGiaTriOcr(d[k.khoa] ?? null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </KhungBang>
            )}
          </div>
        )
      })}

      <details className="mt-5">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-body">
          Chuỗi JSON gốc từ Native
        </summary>
        <div className="mt-2 mb-2">
          <Nut onClick={() => void chep()}>{daChep ? 'Đã sao chép' : 'Sao chép JSON'}</Nut>
        </div>
        <pre className="m-0 max-h-[320px] overflow-auto rounded-lg border border-line bg-nen-2 p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-body">
          {json}
        </pre>
      </details>
    </HopThoai>
  )
}
