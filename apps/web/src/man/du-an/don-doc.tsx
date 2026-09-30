import { congNgay, homNay, NGUONG_LAU_CAP_NHAT, type DotDonDoc, type DuAnDong } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent } from 'react'
import { guiDonDoc, KHOA_DU_AN, truyVanDanhSachDuAn, truyVanLichSuDonDoc } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { Nut, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { ChipSucKhoe } from './chung'

/** Lý do một dự án cần đôn đốc — cột lọc được. */
const LY_DO = [
  { giaTri: 'tre', nhan: 'Có bước trễ hạn' },
  { giaTri: 'lau', nhan: 'Lâu không cập nhật' },
  { giaTri: 'vuong', nhan: 'Có vướng mắc' },
] as const

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

  const lyDo = (d: DuAnDong): string =>
    d.thongKe.quaHan > 0 ? 'tre' : !d.capNhatNgay || d.capNhatNgay < moc ? 'lau' : 'vuong'
  // Dự án đang thực hiện mà có vấn đề (chậm, lâu không cập nhật, vướng).
  const canDonDoc = useMemo(
    () =>
      ds.filter(
        (d) =>
          d.trangThai === 'dang-thuc-hien' &&
          (d.thongKe.quaHan > 0 || !d.capNhatNgay || d.capNhatNgay < moc || d.vuongMacMo > 0),
      ),
    [ds, moc],
  )
  const ganNhat = (id: string) => lichSu.find((l) => l.duAn.some((x) => x.id === id))?.ngay ?? null

  const cot: CotLuoi<DuAnDong>[] = [
    {
      id: 'ten',
      nhan: 'Dự án',
      kieu: 'chu',
      rong: 280,
      batBuoc: true,
      giaTri: (d) => d.ten,
      hien: (d) => (
        <Link to="/du-an/$id" params={{ id: d.id }} className="font-semibold text-ink hover:text-brand">
          {d.ten}
        </Link>
      ),
    },
    { id: 'donVi', nhan: 'Chủ đầu tư', kieu: 'danh-muc', rong: 160, giaTri: (d) => d.donViTen },
    {
      id: 'canBo',
      nhan: 'Cán bộ phụ trách',
      kieu: 'danh-muc',
      rong: 160,
      giaTri: (d) => d.canBo?.hoTen ?? null,
    },
    { id: 'lyDo', nhan: 'Lý do', kieu: 'danh-muc', rong: 160, giaTri: lyDo, luaChon: LY_DO },
    {
      id: 'tinhTrang',
      nhan: 'Tình trạng',
      kieu: 'danh-muc',
      rong: 130,
      giaTri: (d) => d.thongKe.sucKhoe,
      luaChon: [
        { giaTri: 'qua-han', nhan: 'Quá hạn' },
        { giaTri: 'sap-han', nhan: 'Sắp đến hạn' },
        { giaTri: 'trong-han', nhan: 'Trong hạn' },
        { giaTri: 'xong', nhan: 'Xong các bước' },
      ],
      hien: (d) => <ChipSucKhoe sk={d.thongKe.sucKhoe} />,
    },
    { id: 'buocTre', nhan: 'Bước trễ', kieu: 'so', rong: 90, giaTri: (d) => d.thongKe.quaHan || null },
    { id: 'vuongMac', nhan: 'Vướng mắc', kieu: 'so', rong: 100, giaTri: (d) => d.vuongMacMo || null },
    { id: 'capNhat', nhan: 'Cập nhật', kieu: 'ngay', giaTri: (d) => d.capNhatNgay },
    { id: 'donDoc', nhan: 'Đôn đốc gần nhất', kieu: 'ngay', rong: 140, giaTri: (d) => ganNhat(d.id) },
  ]

  const cotLichSu: CotLuoi<DotDonDoc>[] = [
    { id: 'ngay', nhan: 'Ngày', kieu: 'ngay', giaTri: (l) => l.ngay },
    { id: 'noiDung', nhan: 'Nội dung', kieu: 'chu', rong: 360, batBuoc: true, giaTri: (l) => l.noiDung },
    { id: 'duAn', nhan: 'Dự án', kieu: 'chu', rong: 220, giaTri: (l) => l.duAn.map((d) => d.ma).join(', ') },
    { id: 'soDuAn', nhan: 'Số dự án', kieu: 'so', rong: 100, cong: true, giaTri: (l) => l.duAn.length },
    { id: 'nguoiGui', nhan: 'Người gửi', kieu: 'danh-muc', rong: 170, giaTri: (l) => l.nguoiGui },
  ]

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

  const nopForm = (e: FormEvent) => {
    e.preventDefault()
    gui.mutate()
  }
  const coQuyen = toi.quyen.includes('DU_AN.ASSIGN')

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
        <Luoi
          ma="don-doc"
          tieuDe="Dự án cần đôn đốc"
          cot={cot}
          dong={canDonDoc}
          khoa={(d) => d.id}
          rong="Không có dự án nào đang chậm, vướng hay lâu không cập nhật."
          chon={
            coQuyen
              ? {
                  ds: chon,
                  doi: (ids, co) =>
                    datChon((c) => {
                      const m = new Set(c)
                      for (const id of ids) {
                        if (co) m.add(id)
                        else m.delete(id)
                      }
                      return m
                    }),
                }
              : undefined
          }
        />

        <h2 className="tieu-de-phan mt-6">Lịch sử đôn đốc</h2>
        <Luoi
          ma="don-doc-lich-su"
          tieuDe="Lịch sử đôn đốc"
          cot={cotLichSu}
          dong={lichSu}
          khoa={(l) => l.dot}
          rong="Chưa gửi đôn đốc lần nào."
        />
      </div>

      {coQuyen && (
        <div className="xl:sticky xl:top-0 xl:self-start">
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
                className="mb-3 w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] outline-none focus:border-brand focus:bg-nen"
              />
              <Nut type="submit" kieu="chinh" disabled={gui.isPending || chon.size === 0 || !noiDung.trim()}>
                {gui.isPending ? 'Đang gửi…' : 'Gửi đôn đốc'}
              </Nut>
            </form>
          </The>
        </div>
      )}
    </div>
  )
}
