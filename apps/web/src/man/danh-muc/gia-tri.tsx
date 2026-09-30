import type { DanhMucQuanLy, DongDanhMucQuanLy, GiaTriDanhMuc } from '@gdos/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { capNhatDanhMuc, suaGiaTri, themGiaTri, truyVanQuanLyDanhMuc, xoaGiaTri } from '@/lib/danh-muc'
import { LoiApi } from '@/lib/http'
import { KhungBang, LOP_TD, LOP_TH, Nut, ONhap, The, ThongBao } from '@/ui/co-ban'

const TEN: Record<GiaTriDanhMuc['loai'], string> = {
  'linh-vuc': 'lĩnh vực',
  'loai-van-ban': 'loại văn bản',
  'nguon-von': 'nguồn vốn',
}

/** Mã gợi ý từ tên: "Y tế — Dân số" → "y-te-dan-so". */
export const maTuTen = (ten: string) =>
  ten
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * MỘT màn cho mọi loại giá trị danh mục (lĩnh vực, loại văn bản, nguồn vốn). Sửa được
 * chỉ khi ở đơn vị gốc; giá trị đang dùng (đếm toàn hệ thống) thì không xóa.
 */
function QuanLyGiaTri({ loai }: { loai: GiaTriDanhMuc['loai'] }) {
  const qc = useQueryClient()
  const { data } = useSuspenseQuery(truyVanQuanLyDanhMuc(loai))
  const [moi, datMoi] = useState({ ten: '', ma: '', maTay: false })
  const [dangSua, datDangSua] = useState<{ id: string; ten: string }>()
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()
  const [ban, datBan] = useState(false)

  const chay = async (viec: () => Promise<DanhMucQuanLy>, cau: string) => {
    datKq(undefined)
    datBan(true)
    try {
      await capNhatDanhMuc(qc, loai, await viec())
      datKq({ ok: true, cau })
      return true
    } catch (e) {
      datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không thực hiện được.' })
      return false
    } finally {
      datBan(false)
    }
  }
  const them = async (e: FormEvent) => {
    e.preventDefault()
    if (await chay(() => themGiaTri(loai, moi.ma, moi.ten.trim()), `Đã thêm “${moi.ten.trim()}”.`))
      datMoi({ ten: '', ma: '', maTay: false })
  }
  const doiCho = (d: DongDanhMucQuanLy, huong: -1 | 1) => {
    const i = data.ds.indexOf(d)
    const ben = data.ds[i + huong]
    if (!ben) return
    // Đánh lại thứ tự cả danh sách theo vị trí mới — không phụ thuộc số thứ tự cũ.
    const thu = data.ds.map((x) => x.id)
    thu[i] = ben.id
    thu[i + huong] = d.id
    void chay(async () => {
      let kq = data
      for (const [k, id] of thu.entries())
        if (data.ds.find((x) => x.id === id)!.thuTu !== k + 1) kq = await suaGiaTri(id, { thuTu: k + 1 })
      return kq
    }, 'Đã đổi thứ tự.')
  }

  const sua = data.suaDuoc
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div>
        {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
        {!sua && (
          <ThongBao>
            Danh mục dùng chung toàn hệ thống — chỉ tài khoản ở đơn vị gốc có quyền mới sửa được. Bạn đang
            xem.
          </ThongBao>
        )}
        <KhungBang nhan={`Danh sách ${TEN[loai]}`}>
          <thead>
            <tr>
              <th className={LOP_TH}>Tên</th>
              <th className={LOP_TH}>Mã</th>
              <th className={`${LOP_TH} text-right`}>Đang dùng</th>
              {sua && <th className={`${LOP_TH} text-right`}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {data.ds.map((d, i) => (
              <tr key={d.id}>
                <td className={`${LOP_TD} min-w-[220px]`}>
                  {dangSua?.id === d.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void chay(() => suaGiaTri(d.id, { ten: dangSua.ten.trim() }), 'Đã đổi tên.').then(
                          (ok) => ok && datDangSua(undefined),
                        )
                      }}
                    >
                      <input
                        aria-label="Tên mới"
                        required
                        maxLength={200}
                        value={dangSua.ten}
                        onChange={(e) => datDangSua({ id: d.id, ten: e.target.value })}
                        className="w-full rounded-lg border border-line bg-nen-2 px-2 py-1 text-[13px]"
                      />
                      <Nut type="submit" kieu="chinh" disabled={ban}>
                        Lưu
                      </Nut>
                      <Nut onClick={() => datDangSua(undefined)}>Hủy</Nut>
                    </form>
                  ) : (
                    <b className="text-ink">{d.ten}</b>
                  )}
                </td>
                <td className={`${LOP_TD} text-[12px] text-faint`}>
                  <code>{d.ma}</code>
                </td>
                <td className={`${LOP_TD} text-right tabular-nums`}>{d.soDung || '—'}</td>
                {sua && (
                  <td className={`${LOP_TD} text-right whitespace-nowrap`}>
                    <span className="inline-flex gap-1">
                      <Nut aria-label="Lên" disabled={ban || i === 0} onClick={() => doiCho(d, -1)}>
                        ↑
                      </Nut>
                      <Nut
                        aria-label="Xuống"
                        disabled={ban || i === data.ds.length - 1}
                        onClick={() => doiCho(d, 1)}
                      >
                        ↓
                      </Nut>
                      <Nut disabled={ban} onClick={() => datDangSua({ id: d.id, ten: d.ten })}>
                        Đổi tên
                      </Nut>
                      <Nut
                        kieu="nguy-hiem"
                        disabled={ban || d.soDung > 0}
                        title={d.soDung > 0 ? 'Đang được dùng — không xóa được' : undefined}
                        onClick={() => {
                          if (confirm(`Xóa “${d.ten}”?`))
                            void chay(() => xoaGiaTri(d.id), `Đã xóa “${d.ten}”.`)
                        }}
                      >
                        Xóa
                      </Nut>
                    </span>
                  </td>
                )}
              </tr>
            ))}
            {data.ds.length === 0 && (
              <tr>
                <td colSpan={4} className={`${LOP_TD} text-center text-faint`}>
                  Chưa có {TEN[loai]} nào.
                </td>
              </tr>
            )}
          </tbody>
        </KhungBang>
      </div>

      {sua && (
        <The tieuDe={`Thêm ${TEN[loai]}`}>
          <form onSubmit={(e) => void them(e)}>
            <ONhap
              id={`dm-ten-${loai}`}
              nhan="Tên"
              required
              maxLength={200}
              value={moi.ten}
              onChange={(e) =>
                datMoi((c) => ({ ...c, ten: e.target.value, ma: c.maTay ? c.ma : maTuTen(e.target.value) }))
              }
            />
            <ONhap
              id={`dm-ma-${loai}`}
              nhan="Mã"
              required
              maxLength={60}
              pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
              goiY="Chữ thường không dấu, số, gạch nối. Không đổi được sau khi tạo."
              value={moi.ma}
              onChange={(e) => datMoi((c) => ({ ...c, ma: e.target.value, maTay: true }))}
            />
            <Nut type="submit" kieu="chinh" disabled={ban || !moi.ten.trim() || !moi.ma}>
              Thêm
            </Nut>
          </form>
        </The>
      )}
    </div>
  )
}

export const LinhVuc = () => <QuanLyGiaTri loai="linh-vuc" />
export const LoaiVanBan = () => <QuanLyGiaTri loai="loai-van-ban" />
export const NguonVon = () => <QuanLyGiaTri loai="nguon-von" />
