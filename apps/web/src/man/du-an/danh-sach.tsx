import { GIAI_DOAN, type DuAnDong, type GiaiDoan, type LocDuAn, type SucKhoe } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { truyVanDanhSachDuAn } from '@/lib/du-an'
import { ngayVn } from '@/lib/ngay'
import { truyVanToi } from '@/lib/phien'
import { KhungBang, LOP_TD, LOP_TH } from '@/ui/co-ban'
import { ChipSucKhoe, ChipTrangThai, tenGiaiDoan, ThanhTienDo } from './chung'

const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

const LOC_SUC_KHOE: [SucKhoe | '', string][] = [
  ['', 'Tất cả'],
  ['qua-han', 'Quá hạn'],
  ['sap-han', 'Sắp đến hạn'],
  ['trong-han', 'Trong hạn'],
  ['xong', 'Hoàn thành'],
]

const TRONG: Record<LocDuAn, string> = {
  'tat-ca': 'Chưa có dự án nào trong phạm vi của bạn.',
  'cua-toi': 'Bạn chưa phụ trách hay tham gia dự án nào.',
  'cho-xac-nhan': 'Không có cập nhật nào đang chờ xác nhận.',
}

function Chon<T extends string>({
  gt,
  dat,
  ds: cac,
  nhan,
}: {
  gt: T
  dat: (x: T) => void
  ds: [T, string][]
  nhan: string
}) {
  return (
    <div role="group" aria-label={nhan} className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-[11.5px] text-faint">{nhan}:</span>
      {cac.map(([v, n]) => (
        <button
          key={v || 'tat-ca'}
          type="button"
          aria-pressed={gt === v}
          onClick={() => dat(v)}
          className={`rounded-full border px-2.5 py-0.5 text-[12px] ${gt === v ? 'border-brand bg-tint-brand font-semibold text-brand' : 'border-line text-body hover:bg-nav-hover'}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/**
 * Danh sách dự án — MỘT màn cho ba cấp 4 (Tất cả · Tôi phụ trách · Chờ xác nhận),
 * khác nhau ở bộ lọc do API áp. Giai đoạn, sức khỏe là bộ lọc TRONG màn, không lên cây.
 */
export function DanhSachDuAn({ loc }: { loc: LocDuAn }) {
  const { data: ds } = useSuspenseQuery(truyVanDanhSachDuAn(loc))
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const di = useNavigate()
  const [tim, datTim] = useState('')
  const [sk, datSk] = useState<SucKhoe | ''>('')
  const [gd, datGd] = useState<GiaiDoan | 'xong' | ''>('')

  const loc2 = useMemo(() => {
    const t = boDau(tim.trim())
    return ds.filter(
      (d: DuAnDong) =>
        (!t || boDau(`${d.ma} ${d.ten} ${d.donViTen} ${d.linhVucTen ?? ''}`).includes(t)) &&
        (!sk || d.thongKe.sucKhoe === sk) &&
        (!gd || (gd === 'xong' ? d.thongKe.giaiDoan === null : d.thongKe.giaiDoan === gd)),
    )
  }, [ds, tim, sk, gd])

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Tìm dự án"
          placeholder="Tìm theo mã, tên, chủ đầu tư, lĩnh vực…"
          value={tim}
          onChange={(e) => datTim(e.target.value)}
          className="w-full max-w-[340px] rounded-lg border border-line bg-nen px-3 py-1.5 text-[13px]"
        />
        <span className="text-[12px] text-faint">
          {loc2.length}/{ds.length} dự án
        </span>
        {toi.quyen.includes('DU_AN.CREATE') && (
          <Link
            to="/$chucNang"
            params={{ chucNang: 'da-tao' }}
            className="ml-auto rounded-lg border border-brand bg-brand px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-dim"
          >
            + Tạo dự án
          </Link>
        )}
      </div>
      <div className="mb-3 flex flex-col gap-2">
        <Chon nhan="Sức khỏe" gt={sk} dat={datSk} ds={LOC_SUC_KHOE} />
        <Chon
          nhan="Giai đoạn"
          gt={gd}
          dat={datGd}
          ds={[
            ['', 'Tất cả'],
            ...(Object.keys(GIAI_DOAN) as GiaiDoan[]).map((g): [GiaiDoan, string] => [
              g,
              `${g} — ${GIAI_DOAN[g]}`,
            ]),
            ['xong', 'Đã xong'],
          ]}
        />
      </div>

      <KhungBang nhan="Danh sách dự án">
        <thead>
          <tr>
            <th className={LOP_TH}>Dự án</th>
            <th className={LOP_TH}>Lĩnh vực</th>
            <th className={LOP_TH}>Giai đoạn · đang ở</th>
            <th className={LOP_TH}>Tiến độ</th>
            <th className={LOP_TH}>Tình trạng</th>
            <th className={LOP_TH}>Cập nhật</th>
          </tr>
        </thead>
        <tbody>
          {loc2.map((d) => (
            <tr
              key={d.id}
              onClick={() => void di({ to: '/du-an/$id', params: { id: d.id } })}
              className="cursor-pointer hover:bg-nav-hover"
            >
              <td className={`${LOP_TD} min-w-[260px]`}>
                <Link
                  to="/du-an/$id"
                  params={{ id: d.id }}
                  className="font-semibold text-ink hover:text-brand"
                  onClick={(e) => e.stopPropagation()}
                >
                  {d.ten}
                </Link>
                <span className="block text-[12px] text-faint">
                  <code>{d.ma}</code> · {d.donViTen}
                  {d.canBo ? ` · ${d.canBo.hoTen}` : ''}
                </span>
              </td>
              <td className={LOP_TD}>{d.linhVucTen ?? '—'}</td>
              <td className={`${LOP_TD} min-w-[200px]`}>
                {tenGiaiDoan(d.thongKe.giaiDoan)}
                {d.thongKe.buocHienTai && (
                  <span className="block text-[11.5px] text-faint">
                    {d.thongKe.buocHienTai.stt}. {d.thongKe.buocHienTai.ten}
                  </span>
                )}
              </td>
              <td className={LOP_TD}>
                <ThanhTienDo phanTram={d.thongKe.phanTram} nho />
                <span className="text-[11px] text-faint">
                  {d.thongKe.xong}/{d.thongKe.tong} bước
                </span>
              </td>
              <td className={LOP_TD}>
                <span className="flex flex-wrap gap-1">
                  {d.trangThai === 'dang-thuc-hien' ? (
                    <ChipSucKhoe sk={d.thongKe.sucKhoe} />
                  ) : (
                    <ChipTrangThai tt={d.trangThai} />
                  )}
                  {d.thongKe.quaHan > 0 && (
                    <span className="text-[11.5px] text-danger">trễ {d.thongKe.treNhat} ngày</span>
                  )}
                  {d.thongKe.choXacNhan > 0 && (
                    <span className="text-[11.5px] text-tim">{d.thongKe.choXacNhan} chờ xác nhận</span>
                  )}
                </span>
              </td>
              <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>{ngayVn(d.capNhatNgay)}</td>
            </tr>
          ))}
          {loc2.length === 0 && (
            <tr>
              <td colSpan={6} className={`${LOP_TD} text-center text-faint`}>
                {ds.length ? 'Không có dự án nào khớp bộ lọc.' : TRONG[loc]}
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>
    </>
  )
}

export const TatCaDuAn = () => <DanhSachDuAn loc="tat-ca" />
export const DuAnCuaToi = () => <DanhSachDuAn loc="cua-toi" />
export const DuAnChoXacNhan = () => <DanhSachDuAn loc="cho-xac-nhan" />
