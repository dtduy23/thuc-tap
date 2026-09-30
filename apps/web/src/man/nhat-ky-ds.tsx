import { TEN_BANG, TEN_HANH_DONG_NHAT_KY, type NhatKyDong } from '@gdos/shared'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { doiTuongCua, nguoiLamCua, thayDoiCua } from '@/lib/nhat-ky'
import { truyVanNhatKy, type LocNhatKy } from '@/lib/quan-tri'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, OChon, ONhap, ThongBao } from '@/ui/co-ban'

const MAU_HANH_DONG: Record<string, 'ok' | 'brand' | 'danger' | 'warn' | 'xam'> = {
  INSERT: 'ok',
  UPDATE: 'brand',
  XOA_MEM: 'danger',
  DOI_MAT_KHAU: 'warn',
}

/**
 * Nhật ký thao tác — chỉ đọc. Database tự ghi mọi thay đổi (trigger), không ai
 * sửa hay xóa được, kể cả quản trị viên.
 */
/** `duAnId`: dùng lại chính màn này làm thẻ Nhật ký trong hồ sơ dự án (một chủ — nhiều lối vào). */
export default function NhatKyDs({ duAnId }: { duAnId?: string }) {
  const [loc, datLoc] = useState<LocNhatKy>(duAnId ? { duAnId } : {})
  const [mo, datMo] = useState<number>()
  const tv = useInfiniteQuery({ ...truyVanNhatKy(loc), placeholderData: keepPreviousData })
  const ds = tv.data?.pages.flatMap((t) => t.dong) ?? []
  const doi = (k: keyof LocNhatKy, v: string) => datLoc((c) => ({ ...c, [k]: v || undefined }))

  return (
    <>
      <div className="mb-1 grid gap-x-3 sm:grid-cols-2 lg:grid-cols-4">
        <OChon
          id="nk-bang"
          nhan="Đối tượng"
          value={loc.bang ?? ''}
          onChange={(e) => doi('bang', e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(TEN_BANG).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </OChon>
        <OChon
          id="nk-hanh-dong"
          nhan="Hành động"
          value={loc.hanhDong ?? ''}
          onChange={(e) => doi('hanhDong', e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(TEN_HANH_DONG_NHAT_KY)
            .filter(([k]) => k !== 'DELETE')
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </OChon>
        <ONhap
          id="nk-tu"
          nhan="Từ ngày"
          type="date"
          value={loc.tu ?? ''}
          onChange={(e) => doi('tu', e.target.value)}
        />
        <ONhap
          id="nk-den"
          nhan="Đến ngày"
          type="date"
          value={loc.den ?? ''}
          onChange={(e) => doi('den', e.target.value)}
        />
      </div>

      {tv.error && (
        <ThongBao kieu="loi">
          {tv.error instanceof LoiApi ? tv.error.message : 'Không tải được nhật ký.'}
        </ThongBao>
      )}

      <KhungBang nhan="Nhật ký thao tác">
        <thead>
          <tr>
            <th className={LOP_TH}>Lúc</th>
            <th className={LOP_TH}>Người làm</th>
            <th className={LOP_TH}>Hành động</th>
            <th className={LOP_TH}>Đối tượng</th>
            <th className={LOP_TH}>Đơn vị</th>
            <th className={LOP_TH}>
              <span className="sr-only">Chi tiết</span>
            </th>
          </tr>
        </thead>
        <tbody className={tv.isPlaceholderData ? 'opacity-60' : undefined}>
          {ds.map((d) => (
            <Fragment key={d.id}>
              <tr>
                <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>{ngayGio(d.luc)}</td>
                <td className={LOP_TD}>
                  {d.nguoiLam ? d.nguoiLam : <span className="text-faint">{nguoiLamCua(d)}</span>}
                </td>
                <td className={LOP_TD}>
                  <Chip mau={MAU_HANH_DONG[d.hanhDong] ?? 'xam'}>
                    {TEN_HANH_DONG_NHAT_KY[d.hanhDong] ?? d.hanhDong}
                  </Chip>
                </td>
                <td className={LOP_TD}>
                  <span className="text-faint">{TEN_BANG[d.bang] ?? d.bang} · </span>
                  {doiTuongCua(d)}
                </td>
                <td className={LOP_TD}>{d.donViTen ?? '—'}</td>
                <td className={`${LOP_TD} text-right`}>
                  <Nut aria-expanded={mo === d.id} onClick={() => datMo(mo === d.id ? undefined : d.id)}>
                    {mo === d.id ? 'Thu gọn' : 'Xem'}
                  </Nut>
                </td>
              </tr>
              {mo === d.id && (
                <tr>
                  <td colSpan={6} className={`${LOP_TD} bg-nen-2`}>
                    <ChiTiet d={d} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {!tv.isPending && ds.length === 0 && (
            <tr>
              <td colSpan={6} className={`${LOP_TD} text-center text-faint`}>
                Không có thao tác nào khớp bộ lọc.
              </td>
            </tr>
          )}
          {tv.isPending && (
            <tr>
              <td colSpan={6} className={`${LOP_TD} text-center text-faint`}>
                Đang tải…
              </td>
            </tr>
          )}
        </tbody>
      </KhungBang>

      {tv.hasNextPage && (
        <div className="mt-3 text-center">
          <Nut disabled={tv.isFetchingNextPage} onClick={() => void tv.fetchNextPage()}>
            {tv.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm'}
          </Nut>
        </div>
      )}
    </>
  )
}

function ChiTiet({ d }: { d: NhatKyDong }) {
  const ds = thayDoiCua(d)
  if (ds.length === 0) return <p className="m-0 text-[12.5px] text-faint">Không có trường nào thay đổi.</p>
  return (
    <table className="text-[12.5px]" aria-label="Các trường thay đổi">
      <tbody>
        {ds.map((t) => (
          <tr key={t.truong}>
            <th scope="row" className="py-0.5 pr-4 text-left font-semibold text-body">
              {t.truong}
            </th>
            {d.giaTriCu && <td className="py-0.5 pr-3 text-faint line-through">{t.cu}</td>}
            <td className="py-0.5 text-ink">{t.moi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
