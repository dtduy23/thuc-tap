import { congNgay, homNay, NGUONG_LAU_CAP_NHAT } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent } from 'react'
import { guiDonDoc, KHOA_DU_AN, truyVanDanhSachDuAn, truyVanLichSuDonDoc } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { ngayVn } from '@/lib/ngay'
import { truyVanToi } from '@/lib/phien'
import { KhungBang, LOP_TD, LOP_TH, Nut, The, ThongBao } from '@/ui/co-ban'
import { ChipSucKhoe } from './chung'

/**
 * Đôn đốc (Điều 36 NĐ 45) — chọn các dự án đang chậm hoặc lâu không cập nhật, gửi
 * một lời đôn đốc. Mỗi lần gửi là một đợt, lưu vết; cán bộ phụ trách thấy ngay ở
 * "Việc của tôi".
 */
export default function DonDoc() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: ds } = useSuspenseQuery(truyVanDanhSachDuAn('tat-ca'))
  const { data: lichSu } = useSuspenseQuery(truyVanLichSuDonDoc)
  // Mốc "lâu không cập nhật" tính một lần khi mở màn — không gọi đồng hồ trong lúc vẽ.
  const [moc] = useState(() => congNgay(homNay(), -NGUONG_LAU_CAP_NHAT))
  const [chon, datChon] = useState<Set<string>>(new Set())
  const [noiDung, datNoiDung] = useState('')
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()

  // Dự án của đơn vị trong phạm vi (không đôn đốc dự án chỉ tham gia làm thành viên), đang thực hiện, có vấn đề.
  const canDonDoc = useMemo(() => {
    return ds.filter(
      (d) =>
        d.trangThai === 'dang-thuc-hien' &&
        (d.thongKe.quaHan > 0 || !d.capNhatNgay || d.capNhatNgay < moc || d.vuongMacMo > 0),
    )
  }, [ds, moc])

  const gui = useMutation({
    mutationFn: () => guiDonDoc([...chon], noiDung.trim()),
    onSuccess: async (r) => {
      datKq({ ok: true, cau: `Đã gửi đôn đốc tới ${r.soDuAn} dự án.` })
      datChon(new Set())
      datNoiDung('')
      await qc.invalidateQueries({ queryKey: KHOA_DU_AN })
    },
    onError: (e) => datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không gửi được.' }),
  })

  const doi = (id: string) =>
    datChon((c) => {
      const m = new Set(c)
      if (m.has(id)) m.delete(id)
      else m.add(id)
      return m
    })

  const nopForm = (e: FormEvent) => {
    e.preventDefault()
    gui.mutate()
  }
  const coQuyen = toi.quyen.includes('DU_AN.ASSIGN')

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div>
        {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
        <KhungBang nhan="Dự án cần đôn đốc">
          <thead>
            <tr>
              <th className={LOP_TH}>
                <span className="sr-only">Chọn</span>
              </th>
              <th className={LOP_TH}>Dự án</th>
              <th className={LOP_TH}>Tình trạng</th>
              <th className={LOP_TH}>Cập nhật</th>
              <th className={LOP_TH}>Đôn đốc gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {canDonDoc.map((d) => (
              <tr key={d.id} className={chon.has(d.id) ? 'bg-tint-brand' : undefined}>
                <td className={LOP_TD}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${d.ten}`}
                    className="accent-brand"
                    disabled={!coQuyen}
                    checked={chon.has(d.id)}
                    onChange={() => doi(d.id)}
                  />
                </td>
                <td className={`${LOP_TD} min-w-[220px]`}>
                  <Link
                    to="/du-an/$id"
                    params={{ id: d.id }}
                    className="font-semibold text-ink hover:text-brand"
                  >
                    {d.ten}
                  </Link>
                  <span className="block text-[11.5px] text-faint">
                    {d.donViTen}
                    {d.canBo ? ` · ${d.canBo.hoTen}` : ''}
                  </span>
                </td>
                <td className={LOP_TD}>
                  <span className="flex flex-wrap items-center gap-1 text-[12px]">
                    <ChipSucKhoe sk={d.thongKe.sucKhoe} />
                    {d.thongKe.quaHan > 0 && <span className="text-danger">{d.thongKe.quaHan} bước trễ</span>}
                    {d.vuongMacMo > 0 && <span className="text-danger">{d.vuongMacMo} vướng mắc</span>}
                  </span>
                </td>
                <td className={`${LOP_TD} tabular-nums`}>{ngayVn(d.capNhatNgay)}</td>
                <td className={`${LOP_TD} tabular-nums text-faint`}>
                  {ngayVn(lichSu.find((l) => l.duAn.some((x) => x.id === d.id))?.ngay)}
                </td>
              </tr>
            ))}
            {canDonDoc.length === 0 && (
              <tr>
                <td colSpan={5} className={`${LOP_TD} text-center text-faint`}>
                  Không có dự án nào đang chậm, vướng hay lâu không cập nhật.
                </td>
              </tr>
            )}
          </tbody>
        </KhungBang>

        <h2 className="mt-5 mb-2 text-[14px] font-semibold">Lịch sử đôn đốc</h2>
        <KhungBang nhan="Lịch sử đôn đốc">
          <thead>
            <tr>
              <th className={LOP_TH}>Ngày</th>
              <th className={LOP_TH}>Nội dung</th>
              <th className={LOP_TH}>Dự án</th>
              <th className={LOP_TH}>Người gửi</th>
            </tr>
          </thead>
          <tbody>
            {lichSu.map((l) => (
              <tr key={l.dot}>
                <td className={`${LOP_TD} tabular-nums`}>{ngayVn(l.ngay)}</td>
                <td className={LOP_TD}>{l.noiDung}</td>
                <td className={`${LOP_TD} text-[12px]`}>{l.duAn.map((d) => d.ma).join(', ')}</td>
                <td className={LOP_TD}>{l.nguoiGui ?? '—'}</td>
              </tr>
            ))}
            {lichSu.length === 0 && (
              <tr>
                <td colSpan={4} className={`${LOP_TD} text-center text-faint`}>
                  Chưa gửi đôn đốc lần nào.
                </td>
              </tr>
            )}
          </tbody>
        </KhungBang>
      </div>

      {coQuyen && (
        <The tieuDe="Gửi đôn đốc" phu={`${chon.size} dự án đã chọn`}>
          <form onSubmit={nopForm}>
            <label htmlFor="dd-noi-dung" className="mb-1.5 block text-[12.5px] font-semibold text-body">
              Nội dung đôn đốc
            </label>
            <textarea
              id="dd-noi-dung"
              rows={5}
              required
              maxLength={2000}
              placeholder="VD: Đề nghị chủ đầu tư đẩy nhanh các bước đang chậm và cập nhật tiến độ trước ngày …"
              value={noiDung}
              onChange={(e) => datNoiDung(e.target.value)}
              className="mb-3 w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px]"
            />
            <Nut type="submit" kieu="chinh" disabled={gui.isPending || chon.size === 0 || !noiDung.trim()}>
              {gui.isPending ? 'Đang gửi…' : 'Gửi đôn đốc'}
            </Nut>
          </form>
        </The>
      )}
    </div>
  )
}
