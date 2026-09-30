import { NGUON_VAN_BAN } from '@gdos/shared'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChipVanBan } from '@/man/van-ban/tom-tat'
import { LoiApi, taiVeTep } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import { chayLaiVanBan, suaTomTat, truyVanChiTietVanBan } from '@/lib/van-ban'
import { Chip, Nut, ThongBao } from '@/ui/co-ban'

const KHUNG =
  'min-h-[360px] rounded-[10px] border border-line bg-nen shadow-[0_1px_2px_rgba(16,34,54,.06),0_4px_14px_rgba(16,34,54,.05)]'

/** Một văn bản: bản gốc và bản tóm tắt SONG SONG để đối chiếu; sửa lại tóm tắt được. */
export function TrangVanBan({ id }: { id: string }) {
  const qc = useQueryClient()
  const { data: vb } = useSuspenseQuery(truyVanChiTietVanBan(id))
  const [sua, datSua] = useState<string>()
  const [loi, datLoi] = useState<string>()
  const [ban, datBan] = useState(false)
  const dangChay = vb.trangThai === 'cho' || vb.trangThai === 'dang-xu-ly'

  const lam = async (viec: () => Promise<unknown>) => {
    datLoi(undefined)
    datBan(true)
    try {
      qc.setQueryData(truyVanChiTietVanBan(id).queryKey, (await viec()) as typeof vb)
      await qc.invalidateQueries({ queryKey: ['van-ban', 'ds'] })
      return true
    } catch (e) {
      datLoi(e instanceof LoiApi ? e.message : 'Không thực hiện được.')
      return false
    } finally {
      datBan(false)
    }
  }

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 text-[12px] text-faint">
        Tác nghiệp › Xử lý văn bản ›{' '}
        <Link to="/$chucNang" params={{ chucNang: 'vb-tom-tat' }} className="hover:text-brand">
          Tóm tắt văn bản
        </Link>
      </nav>
      <h1 className="mt-0 mb-1 text-[20px] leading-snug font-extrabold tracking-[-.01em] text-ink">
        {vb.ten}
      </h1>
      <p className="mt-0 mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
        <ChipVanBan tt={vb.trangThai} />
        <span>
          {vb.loai} · {NGUON_VAN_BAN[vb.nguon]} · {vb.donViTen} · {vb.nguoiTao ?? '—'} · {ngayGio(vb.taoLuc)}
        </span>
        {vb.daHieuChinh && <Chip mau="tim">Đã hiệu chỉnh</Chip>}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <Nut
          onClick={() =>
            void taiVeTep(`/van-ban/${vb.id}/tep`, vb.tenTep).catch((e: unknown) =>
              datLoi(e instanceof LoiApi ? e.message : 'Không tải được tệp.'),
            )
          }
        >
          ⬇ Tệp gốc ({vb.tenTep})
        </Nut>
        {vb.quyen.xuLy && !dangChay && (
          <Nut disabled={ban} onClick={() => void lam(() => chayLaiVanBan(vb.id))}>
            {vb.trangThai === 'chua-gui' || vb.trangThai === 'loi' ? 'Gửi lại tóm tắt' : 'Tóm tắt lại'}
          </Nut>
        )}
        {vb.quyen.sua && sua === undefined && !dangChay && (
          <Nut onClick={() => datSua(vb.tomTat ?? '')}>Sửa tóm tắt</Nut>
        )}
      </div>

      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      {vb.trangThai === 'loi' && vb.loi && <ThongBao kieu="loi">{vb.loi}</ThongBao>}
      {dangChay && <ThongBao>FOXAI Native đang tóm tắt — trang tự cập nhật khi xong.</ThongBao>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={KHUNG} aria-label="Nội dung gốc">
          <h2 className="m-0 flex items-center gap-2 border-b border-line px-4 py-2.5 text-[13.5px] font-bold">
            Nội dung gốc
            {vb.soKyTuGoc !== null && (
              <span className="text-[11.5px] font-normal text-faint">
                {vb.soKyTuGoc.toLocaleString('vi-VN')} ký tự
              </span>
            )}
          </h2>
          <div className="max-h-[62vh] overflow-auto px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-body">
            {vb.noiDungGoc ?? <span className="text-faint">Chưa có — Native trích nội dung khi xử lý.</span>}
          </div>
        </section>

        <section className={KHUNG} aria-label="Bản tóm tắt">
          <h2 className="m-0 flex items-center gap-2 border-b border-line px-4 py-2.5 text-[13.5px] font-bold">
            Bản tóm tắt
            {vb.tyLeRutGon !== null && (
              <span className="text-[11.5px] font-normal text-faint">
                rút gọn {vb.tyLeRutGon.toLocaleString('vi-VN')}%
              </span>
            )}
            {vb.moHinh && <span className="ml-auto text-[11px] font-normal text-faint">{vb.moHinh}</span>}
          </h2>
          {sua !== undefined ? (
            <div className="p-3">
              <label htmlFor="vb-sua" className="sr-only">
                Bản tóm tắt
              </label>
              <textarea
                id="vb-sua"
                rows={14}
                maxLength={50_000}
                value={sua}
                onChange={(e) => datSua(e.target.value)}
                className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-brand focus:bg-nen"
              />
              <div className="mt-2 flex gap-2">
                <Nut
                  kieu="chinh"
                  disabled={ban || !sua.trim()}
                  onClick={() =>
                    void lam(() => suaTomTat(vb.id, sua.trim())).then((ok) => ok && datSua(undefined))
                  }
                >
                  {ban ? 'Đang lưu…' : 'Lưu tóm tắt'}
                </Nut>
                <Nut onClick={() => datSua(undefined)}>Hủy</Nut>
              </div>
            </div>
          ) : (
            <div className="max-h-[62vh] overflow-auto px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink">
              {vb.tomTat ?? (
                <span className="text-faint">{dangChay ? 'Đang tóm tắt…' : 'Chưa có bản tóm tắt.'}</span>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
