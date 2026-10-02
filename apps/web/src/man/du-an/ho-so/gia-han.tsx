/**
 * Xin gia hạn bước — thể hiện của luồng phê duyệt (định nghĩa ở Quản trị › Luồng phê duyệt).
 *   BangGiaHan  : mọi yêu cầu của dự án, kèm nút Duyệt / Từ chối / Rút theo đúng quyền.
 *   FormXinGiaHan: gửi yêu cầu cho MỘT bước (dùng trong hộp chi tiết bước).
 */
import {
  TRANG_THAI_YEU_CAU,
  VAI_DUYET,
  soNgayGiua,
  type BuocDuAn,
  type HoSoDuAn,
  type TrangThaiYeuCau,
  type YeuCauGiaHan,
} from '@gdos/shared'
import { useState } from 'react'
import { duyetGiaHan, rutGiaHan, xinGiaHan } from '@/lib/du-an'
import { ngayGio, ngayVn } from '@/lib/ngay'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, The, ThongBao } from '@/ui/co-ban'
import { useGhiHoSo } from './ghi-ho-so'

const MAU: Record<TrangThaiYeuCau, 'warn' | 'ok' | 'danger' | 'xam'> = {
  'cho-duyet': 'warn',
  'da-duyet': 'ok',
  'tu-choi': 'danger',
  'da-rut': 'xam',
}

export const ChipYeuCau = ({ tt }: { tt: TrangThaiYeuCau }) => (
  <Chip mau={MAU[tt]}>{TRANG_THAI_YEU_CAU[tt]}</Chip>
)

/** Các cấp duyệt dạng "① Thẩm định → ② Phê duyệt"; cấp đang chờ in đậm. */
export function DongCap({ y }: { y: Pick<YeuCauGiaHan, 'cacCap' | 'capHienTai' | 'daQua'> }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
      {y.cacCap.map((c, i) => {
        const qua = y.daQua.find((d) => d.cap === i + 1)
        const dang = y.capHienTai === i + 1
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <span className="text-faint">→</span>}
            <span
              title={VAI_DUYET[c.vai].ten}
              className={
                qua ? (qua.dongY ? 'text-ok' : 'text-danger') : dang ? 'font-bold text-warn' : 'text-faint'
              }
            >
              {qua ? (qua.dongY ? '✓' : '✗') : `${i + 1}.`} {c.ten}
            </span>
          </span>
        )
      })}
    </span>
  )
}

const LOP_O = 'rounded-md border border-line bg-nen px-2 py-1 text-[13px] text-ink'

function HangYeuCau({ hs, y }: { hs: HoSoDuAn; y: YeuCauGiaHan }) {
  const ghi = useGhiHoSo()
  const [yKien, datYKien] = useState('')
  const b = hs.buoc.find((x) => x.id === y.buocId)
  const them = y.hanCu ? soNgayGiua(y.hanCu, y.hanMoi) : null
  return (
    <tr>
      <td className={`${LOP_TD} min-w-[220px]`}>
        <b className="text-ink">{b ? `${b.stt}. ${b.ten}` : 'Bước đã xóa'}</b>
        <span className="block text-[12px] text-body">{y.lyDo}</span>
        {y.canCu && <span className="block text-[11.5px] text-faint">Căn cứ: {y.canCu}</span>}
      </td>
      <td className={`${LOP_TD} whitespace-nowrap tabular-nums`}>
        {ngayVn(y.hanCu)} → <b>{ngayVn(y.hanMoi)}</b>
        {them !== null && <span className="block text-[11.5px] text-danger">+{them} ngày</span>}
      </td>
      <td className={`${LOP_TD} whitespace-nowrap text-[12.5px]`}>
        {y.nguoiXinTen ?? '—'}
        <span className="block text-[11.5px] text-faint">{ngayVn(y.ngayXin)}</span>
      </td>
      <td className={LOP_TD}>
        <ChipYeuCau tt={y.trangThai} />
        <span className="mt-1 block">
          <DongCap y={y} />
        </span>
        {y.daQua.map((d) => (
          <span key={`${d.cap}-${d.luc}`} className="block text-[11.5px] text-faint">
            {d.tenCap}: {d.nguoiTen ?? '—'} {d.dongY ? 'đồng ý' : 'từ chối'}
            {d.yKien ? ` — “${d.yKien}”` : ''} · {ngayGio(d.luc)}
          </span>
        ))}
      </td>
      <td className={`${LOP_TD} min-w-[230px]`}>
        {ghi.loi && <span className="mb-1 block text-[12px] text-danger">{ghi.loi}</span>}
        {y.duocDuyet && (
          <span className="flex flex-wrap items-center gap-1.5">
            <input
              aria-label="Ý kiến duyệt"
              placeholder="Ý kiến (bắt buộc khi từ chối)"
              value={yKien}
              maxLength={1000}
              onChange={(e) => datYKien(e.target.value)}
              className={`${LOP_O} min-w-[150px] flex-1`}
            />
            <Nut
              kieu="chinh"
              className="!py-1"
              disabled={ghi.dangChay}
              onClick={() => ghi.chay(() => duyetGiaHan(hs.id, y.id, true, yKien.trim()))}
            >
              Đồng ý
            </Nut>
            <Nut
              kieu="nguy-hiem"
              className="!py-1"
              disabled={ghi.dangChay || !yKien.trim()}
              onClick={() => ghi.chay(() => duyetGiaHan(hs.id, y.id, false, yKien.trim()))}
            >
              Từ chối
            </Nut>
          </span>
        )}
        {y.duocRut && (
          <Nut
            className="!py-1"
            disabled={ghi.dangChay}
            onClick={() => ghi.chay(() => rutGiaHan(hs.id, y.id))}
          >
            Rút yêu cầu
          </Nut>
        )}
        {!y.duocDuyet && !y.duocRut && y.trangThai === 'cho-duyet' && (
          <span className="text-[12px] text-faint">
            Chờ {VAI_DUYET[y.cacCap[(y.capHienTai ?? 1) - 1]?.vai ?? 'lanh-dao'].ten.toLowerCase()}
          </span>
        )}
      </td>
    </tr>
  )
}

/** Bảng yêu cầu gia hạn của dự án. `chiCho`: chỉ hiện yêu cầu đang chờ duyệt. */
export function BangGiaHan({ hs, chiCho = false }: { hs: HoSoDuAn; chiCho?: boolean }) {
  const ds = chiCho ? hs.giaHan.filter((y) => y.trangThai === 'cho-duyet') : hs.giaHan
  const cho = hs.giaHan.filter((y) => y.trangThai === 'cho-duyet').length
  if (chiCho && ds.length === 0) return null
  return (
    <The
      tieuDe="Yêu cầu gia hạn bước"
      phu={
        cho ? `${cho} yêu cầu chờ duyệt` : hs.luongGiaHan.bat ? 'không có yêu cầu chờ' : 'chức năng đang tắt'
      }
    >
      <p className="mt-0 mb-3 text-[12.5px] text-faint">
        Luồng duyệt đang áp dụng: {hs.luongGiaHan.cap.map((c, i) => `${i + 1}. ${c.ten}`).join(' → ')}. Duyệt
        xong cấp cuối thì hạn bước đổi theo, các bước sau dời theo và kế hoạch chốt thành phiên bản mới. Gửi
        yêu cầu ở thẻ Checklist — bấm vào bước cần gia hạn.
      </p>
      {ds.length === 0 ? (
        <p className="m-0 text-[13px] text-faint">Chưa có yêu cầu gia hạn nào.</p>
      ) : (
        <KhungBang nhan="Yêu cầu gia hạn">
          <thead>
            <tr>
              <th className={LOP_TH}>Bước · lý do</th>
              <th className={LOP_TH}>Hạn cũ → hạn xin</th>
              <th className={LOP_TH}>Người xin</th>
              <th className={LOP_TH}>Tình trạng duyệt</th>
              <th className={LOP_TH}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ds.map((y) => (
              <HangYeuCau key={y.id} hs={hs} y={y} />
            ))}
          </tbody>
        </KhungBang>
      )}
    </The>
  )
}

/** Form xin gia hạn cho một bước; đã có yêu cầu chờ thì hiện tình trạng thay cho form. */
export function FormXinGiaHan({ hs, b }: { hs: HoSoDuAn; b: BuocDuAn }) {
  const ghi = useGhiHoSo()
  const [hanMoi, datHanMoi] = useState('')
  const [lyDo, datLyDo] = useState('')
  const [canCu, datCanCu] = useState('')
  const cuaBuoc = hs.giaHan.filter((y) => y.buocId === b.id)
  const dangCho = cuaBuoc.find((y) => y.trangThai === 'cho-duyet')
  const them = hanMoi && b.han ? soNgayGiua(b.han, hanMoi) : null

  return (
    <div>
      {ghi.loi && <ThongBao kieu="loi">{ghi.loi}</ThongBao>}
      {!hs.luongGiaHan.bat && !dangCho && (
        <ThongBao>
          Chức năng xin gia hạn đang tắt — quản trị bật ở Quản trị hệ thống › Luồng phê duyệt.
        </ThongBao>
      )}
      {dangCho ? (
        <div className="rounded-lg border border-line bg-nen-2 p-3 text-[13px]">
          <p className="m-0">
            Đang chờ duyệt: xin lùi hạn tới <b>{ngayVn(dangCho.hanMoi)}</b> — {dangCho.lyDo}
          </p>
          <p className="mt-1.5 mb-0">
            <DongCap y={dangCho} />
          </p>
          {dangCho.duocRut && (
            <p className="mt-2 mb-0">
              <Nut disabled={ghi.dangChay} onClick={() => ghi.chay(() => rutGiaHan(hs.id, dangCho.id))}>
                Rút yêu cầu
              </Nut>
            </p>
          )}
        </div>
      ) : (
        hs.luongGiaHan.bat &&
        hs.quyen.xinGiaHan && (
          <>
            <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
              <label className="text-[12px] text-faint">
                Hạn mới xin (hạn hiện tại {ngayVn(b.han)})
                <input
                  type="date"
                  value={hanMoi}
                  min={b.han ?? undefined}
                  onChange={(e) => datHanMoi(e.target.value)}
                  className={`${LOP_O} mt-1 block w-full`}
                />
                {them !== null && them > 0 && <span className="text-danger">lùi {them} ngày</span>}
              </label>
              <label className="text-[12px] text-faint">
                Lý do xin gia hạn
                <input
                  value={lyDo}
                  maxLength={1000}
                  onChange={(e) => datLyDo(e.target.value)}
                  className={`${LOP_O} mt-1 block w-full`}
                />
              </label>
            </div>
            <label className="mt-3 block text-[12px] text-faint">
              Căn cứ (văn bản đề nghị, nếu có)
              <input
                value={canCu}
                maxLength={500}
                placeholder="VD: Tờ trình số …"
                onChange={(e) => datCanCu(e.target.value)}
                className={`${LOP_O} mt-1 block w-full`}
              />
            </label>
            <p className="mt-2 mb-2 text-[12px] text-faint">
              Sẽ qua: {hs.luongGiaHan.cap.map((c, i) => `${i + 1}. ${c.ten}`).join(' → ')}. Hạn chỉ đổi khi
              cấp cuối đồng ý.
            </p>
            <Nut
              kieu="chinh"
              disabled={ghi.dangChay || !hanMoi || !lyDo.trim() || (them !== null && them <= 0)}
              onClick={() =>
                ghi.chay(
                  () =>
                    xinGiaHan(hs.id, b.id, { hanMoi, lyDo: lyDo.trim(), canCu: canCu.trim() || undefined }),
                  () => {
                    datHanMoi('')
                    datLyDo('')
                    datCanCu('')
                  },
                )
              }
            >
              Gửi yêu cầu gia hạn
            </Nut>
          </>
        )
      )}
      {cuaBuoc.filter((y) => y.trangThai !== 'cho-duyet').length > 0 && (
        <ul className="mt-3 mb-0 list-none p-0 text-[12px] text-faint">
          {cuaBuoc
            .filter((y) => y.trangThai !== 'cho-duyet')
            .map((y) => (
              <li key={y.id}>
                {ngayVn(y.ngayXin)}: xin tới {ngayVn(y.hanMoi)} —{' '}
                {TRANG_THAI_YEU_CAU[y.trangThai].toLowerCase()}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
