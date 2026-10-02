/**
 * Quản trị › Người dùng & Phân quyền › Luồng phê duyệt › Luồng theo nghiệp vụ.
 * Mỗi nghiệp vụ có luồng (khai ở NGHIEP_VU_DUYET, @gdos/shared) là một thẻ: bật / tắt, số cấp,
 * tên từng cấp và AI duyệt cấp đó (theo vai trên chính hồ sơ, không khai tên người).
 * Sửa luồng không đổi các yêu cầu đang chạy — chúng giữ các cấp đã chụp lúc gửi.
 */
import {
  MA_LUONG_DUYET,
  NGHIEP_VU_DUYET,
  SO_CAP_DUYET_TOI_DA,
  VAI_DUYET,
  kiemLuongDuyet,
  type LuongDuyet,
  type MaLuongDuyet,
  type VaiDuyet,
} from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { KHOA_CAU_HINH, luuLuongDuyet, truyVanCauHinh } from '@/lib/cau-hinh'
import { LoiApi } from '@/lib/http'
import { Chip, Nut, ODanhDau, The, ThongBao } from '@/ui/co-ban'
import { ChiXem } from './cau-hinh-bao-mat'

const LOP_O = 'rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px] text-ink disabled:opacity-60'

function MotLuong({ ma, dau, suaDuoc }: { ma: MaLuongDuyet; dau: LuongDuyet; suaDuoc: boolean }) {
  const qc = useQueryClient()
  const [l, datL] = useState<LuongDuyet>(dau)
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()
  const nv = NGHIEP_VU_DUYET[ma]
  const loi = kiemLuongDuyet(l)
  const doiCap = (i: number, moi: Partial<LuongDuyet['cap'][number]>) =>
    datL((c) => ({ ...c, cap: c.cap.map((x, j) => (j === i ? { ...x, ...moi } : x)) }))

  const luu = useMutation({
    mutationFn: () => luuLuongDuyet(ma, { ...l, cap: l.cap.map((c) => ({ ...c, ten: c.ten.trim() })) }),
    onSuccess: async (moi) => {
      qc.setQueryData(KHOA_CAU_HINH, moi)
      // Hồ sơ dự án mang theo luồng đang áp dụng — nạp lại để màn dự án thấy ngay.
      await qc.invalidateQueries({ queryKey: ['du-an'] })
      datKq({
        ok: true,
        cau: 'Đã lưu. Áp dụng cho các yêu cầu gửi từ bây giờ; yêu cầu đang chờ giữ luồng cũ.',
      })
    },
    onError: (e) => datKq({ ok: false, cau: e instanceof LoiApi ? e.message : 'Không lưu được.' }),
  })

  return (
    <The tieuDe={nv.ten} phu={`Phân hệ ${nv.phanHe}`}>
      <p className="mt-0 mb-3 text-[12.5px] text-faint">{nv.mo}</p>
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <ODanhDau
          id={`ld-bat-${ma}`}
          nhan="Cho phép gửi yêu cầu"
          checked={l.bat}
          disabled={!suaDuoc}
          onChange={(e) => datL({ ...l, bat: e.target.checked })}
        />
        <Chip mau={l.bat ? 'ok' : 'xam'}>{l.bat ? 'Đang mở' : 'Đang tắt'}</Chip>
      </div>

      <p className="mt-3 mb-2 text-[12.5px] font-semibold text-body">Các cấp duyệt (theo thứ tự)</p>
      <ol className="m-0 mb-2 list-none space-y-2 p-0">
        {l.cap.map((c, i) => (
          <li key={i} className="grid items-center gap-2 sm:grid-cols-[34px_1fr_260px_auto]">
            <span className="grid size-7 place-items-center rounded-full bg-tint-brand text-[12px] font-bold text-brand">
              {i + 1}
            </span>
            <input
              aria-label={`Tên cấp ${i + 1}`}
              value={c.ten}
              maxLength={120}
              disabled={!suaDuoc}
              placeholder="VD: Thẩm định, Phê duyệt"
              onChange={(e) => doiCap(i, { ten: e.target.value })}
              className={LOP_O}
            />
            <select
              aria-label={`Người duyệt cấp ${i + 1}`}
              value={c.vai}
              disabled={!suaDuoc}
              onChange={(e) => doiCap(i, { vai: e.target.value as VaiDuyet })}
              className={LOP_O}
              title={VAI_DUYET[c.vai].mo}
            >
              {Object.entries(VAI_DUYET).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.ten}
                </option>
              ))}
            </select>
            {suaDuoc && (
              <Nut
                disabled={l.cap.length <= 1}
                onClick={() => datL({ ...l, cap: l.cap.filter((_, j) => j !== i) })}
              >
                Bỏ
              </Nut>
            )}
          </li>
        ))}
      </ol>
      {suaDuoc && (
        <Nut
          disabled={l.cap.length >= SO_CAP_DUYET_TOI_DA}
          onClick={() => datL({ ...l, cap: [...l.cap, { ten: '', vai: 'lanh-dao' }] })}
        >
          + Thêm cấp duyệt
        </Nut>
      )}

      <div className="mt-4">
        <ODanhDau
          id={`ld-tu-duyet-${ma}`}
          nhan="Cho người gửi yêu cầu tự duyệt"
          mo="Chỉ bật ở đơn vị ít người, khi người xin cũng là người duyệt. Mặc định tắt."
          checked={l.choTuDuyet}
          disabled={!suaDuoc}
          onChange={(e) => datL({ ...l, choTuDuyet: e.target.checked })}
        />
      </div>

      {loi.map((x) => (
        <p key={x} className="m-0 mb-1 text-[12px] text-danger">
          {x}
        </p>
      ))}
      {suaDuoc && (
        <p className="mt-3 mb-0">
          <Nut kieu="chinh" disabled={loi.length > 0 || luu.isPending} onClick={() => luu.mutate()}>
            {luu.isPending ? 'Đang lưu…' : 'Lưu luồng'}
          </Nut>
        </p>
      )}
    </The>
  )
}

export default function LuongDuyetMan() {
  const { data: ch } = useSuspenseQuery(truyVanCauHinh)
  return (
    <div className="max-w-[860px]">
      <ChiXem ch={ch} />
      <ThongBao>
        Luồng là <b>quy tắc</b>: việc gì, qua mấy cấp, ai duyệt. Người duyệt khai theo{' '}
        <b>vai trên chính hồ sơ</b> (cán bộ / lãnh đạo đơn vị chủ đầu tư) nên đổi nhân sự không phải sửa
        luồng. Yêu cầu đang chờ duyệt nằm ở hồ sơ dự án › Kế hoạch & điều chỉnh.
      </ThongBao>
      {MA_LUONG_DUYET.map((ma) => (
        <MotLuong key={ma} ma={ma} dau={ch.luongDuyet[ma]} suaDuoc={ch.coTheSua} />
      ))}
    </div>
  )
}
