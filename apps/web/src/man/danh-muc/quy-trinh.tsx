import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  HINH_THUC,
  type BuocMau,
  type HinhThuc,
  type QuyTrinhMauChiTiet,
} from '@gdos/shared'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { nhanBanQuyTrinh, suaQuyTrinh, truyVanChiTietQuyTrinh, xoaQuyTrinh } from '@/lib/danh-muc'
import { truyVanQuyTrinhMau } from '@/lib/du-an'
import { LoiApi } from '@/lib/http'
import { truyVanToi } from '@/lib/phien'
import { Chip, KhungBang, LOP_TD, LOP_TH, Nut, ONhap, The, ThongBao } from '@/ui/co-ban'
import { maTuTen } from './gia-tri'

const loiCua = (e: unknown) => (e instanceof LoiApi ? e.message : 'Không thực hiện được.')

/**
 * Danh mục › Quy trình mẫu. Quy trình theo luật (khóa) chỉ xem và nhân bản; bản
 * sao sửa được mọi bước. Sửa mẫu KHÔNG đụng dự án đã tạo — mỗi dự án giữ bản chép.
 */
export default function QuyTrinhMau() {
  const { data: ds } = useSuspenseQuery(truyVanQuyTrinhMau)
  const [chon, datChon] = useState(ds[0]?.ma)
  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <nav aria-label="Quy trình mẫu" className="flex flex-col gap-1.5">
        {ds.map((q) => (
          <button
            key={q.ma}
            type="button"
            aria-current={q.ma === chon}
            onClick={() => datChon(q.ma)}
            className={`rounded-[10px] border px-3 py-2 text-left ${q.ma === chon ? 'border-brand bg-tint-brand' : 'border-line bg-nen hover:border-brand'}`}
          >
            <b className="block text-[13px] text-ink">{q.ten}</b>
            <span className="text-[11.5px] text-faint">
              {q.soBuoc} bước · {HINH_THUC[q.hinhThuc]}
              {q.khoa ? ' · theo luật' : ''}
            </span>
          </button>
        ))}
      </nav>
      {chon ? (
        <ChiTiet key={chon} ma={chon} chonMa={datChon} />
      ) : (
        <p className="text-faint">Chưa có quy trình.</p>
      )}
    </div>
  )
}

function ChiTiet({ ma, chonMa }: { ma: string; chonMa: (ma: string | undefined) => void }) {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: q, error } = useQuery(truyVanChiTietQuyTrinh(ma))
  const [sua, datSua] = useState(false)
  const [banSao, datBanSao] = useState<{ ma: string; ten: string }>()
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()
  const [ban, datBan] = useState(false)

  if (error) return <ThongBao kieu="loi">{loiCua(error)}</ThongBao>
  if (!q) return <p className="text-faint">Đang tải…</p>

  const chay = async (viec: () => Promise<void>, cau: string) => {
    datKq(undefined)
    datBan(true)
    try {
      await viec()
      datKq({ ok: true, cau })
      await qc.invalidateQueries({ queryKey: truyVanQuyTrinhMau.queryKey })
    } catch (e) {
      datKq({ ok: false, cau: loiCua(e) })
    } finally {
      datBan(false)
    }
  }

  return (
    <div>
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="min-w-[260px] flex-1">
          <h2 className="m-0 text-[17px] font-bold">{q.ten}</h2>
          <p className="mt-0.5 mb-0 text-[12.5px] text-faint">
            <code>{q.ma}</code> · {HINH_THUC[q.hinhThuc]} · {q.soBuoc} bước
            {q.canCu ? ` · ${q.canCu}` : ''}
          </p>
          <span className="mt-1.5 flex flex-wrap gap-1">
            {q.khoa && <Chip mau="tim">Theo luật — không sửa, chỉ nhân bản</Chip>}
            <Chip>{q.soDung ? `${q.soDung} dự án đang theo` : 'Chưa dự án nào theo'}</Chip>
          </span>
        </div>
        {!sua && (
          <span className="flex flex-wrap gap-2">
            {toi.quyen.includes('DM_NGHIEP_VU.CREATE') && (
              <Nut onClick={() => datBanSao({ ma: `${q.ma}-ban-sao`, ten: `${q.ten} (bản sao)` })}>
                Nhân bản
              </Nut>
            )}
            {q.suaDuoc && (
              <Nut kieu="chinh" onClick={() => datSua(true)}>
                Sửa
              </Nut>
            )}
            {q.suaDuoc && q.soDung === 0 && (
              <Nut
                kieu="nguy-hiem"
                disabled={ban}
                onClick={() => {
                  if (confirm(`Xóa quy trình “${q.ten}”?`))
                    void chay(async () => {
                      await xoaQuyTrinh(q.ma)
                      chonMa(undefined)
                    }, 'Đã xóa quy trình.')
                }}
              >
                Xóa
              </Nut>
            )}
          </span>
        )}
      </div>

      {banSao && (
        <The tieuDe="Nhân bản quy trình" phu="bản sao sửa được mọi bước">
          <form
            className="grid gap-x-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              void chay(async () => {
                const moi = await nhanBanQuyTrinh(q.ma, banSao.ma, banSao.ten.trim())
                datBanSao(undefined)
                chonMa(moi.ma)
              }, 'Đã nhân bản — đang mở bản sao.')
            }}
          >
            <ONhap
              id="qt-ten-moi"
              nhan="Tên bản sao"
              required
              maxLength={300}
              value={banSao.ten}
              onChange={(e) => datBanSao({ ten: e.target.value, ma: maTuTen(e.target.value) })}
            />
            <ONhap
              id="qt-ma-moi"
              nhan="Mã"
              required
              maxLength={60}
              value={banSao.ma}
              onChange={(e) => datBanSao({ ...banSao, ma: e.target.value })}
            />
            <span className="mb-3.5 flex gap-2">
              <Nut type="submit" kieu="chinh" disabled={ban}>
                Nhân bản
              </Nut>
              <Nut onClick={() => datBanSao(undefined)}>Hủy</Nut>
            </span>
          </form>
        </The>
      )}

      {sua ? (
        <SuaBuoc
          q={q}
          ban={ban}
          huy={() => datSua(false)}
          luu={(dl) =>
            void chay(async () => {
              qc.setQueryData(truyVanChiTietQuyTrinh(q.ma).queryKey, await suaQuyTrinh(q.ma, dl))
              datSua(false)
            }, 'Đã lưu quy trình. Dự án đã tạo trước đó không đổi.')
          }
        />
      ) : (
        <BangBuoc buoc={q.buoc} />
      )}
    </div>
  )
}

function BangBuoc({ buoc }: { buoc: BuocMau[] }) {
  return (
    <KhungBang nhan="Các bước của quy trình">
      <thead>
        <tr>
          <th className={LOP_TH}>STT</th>
          <th className={LOP_TH}>Nội dung công việc</th>
          <th className={`${LOP_TH} text-right`}>Số ngày</th>
          <th className={LOP_TH}>Bên thực hiện</th>
          <th className={LOP_TH}>Văn bản / căn cứ</th>
        </tr>
      </thead>
      <tbody>
        {(Object.keys(GIAI_DOAN) as (keyof typeof GIAI_DOAN)[]).map((gd) => {
          const trong = buoc.filter((b) => b.gd === gd)
          if (trong.length === 0) return null
          return (
            <Fragment key={gd}>
              <tr className="bg-tint-brand">
                <td colSpan={5} className={`${LOP_TD} font-semibold text-brand`}>
                  Giai đoạn {gd} — {GIAI_DOAN[gd]}
                </td>
              </tr>
              {trong.map((b, i) => (
                <tr key={`${gd}-${i}`} className={b.nhom ? 'bg-nen-2 font-semibold' : undefined}>
                  <td className={`${LOP_TD} tabular-nums whitespace-nowrap`}>{b.stt}</td>
                  <td className={LOP_TD} style={b.cha !== null ? { paddingLeft: 28 } : undefined}>
                    {b.ten}
                  </td>
                  <td className={`${LOP_TD} text-right tabular-nums`}>{b.nhom ? '' : b.soNgay}</td>
                  <td className={`${LOP_TD} whitespace-nowrap`}>{b.nhom ? '' : BEN_THUC_HIEN[b.ben]}</td>
                  <td className={`${LOP_TD} text-[12px] text-faint`}>{b.vanBan}</td>
                </tr>
              ))}
            </Fragment>
          )
        })}
      </tbody>
    </KhungBang>
  )
}

/** Một dòng đang sửa — `cha` trỏ bằng khóa (không bằng vị trí) để đổi chỗ không lệch. */
type DongSua = Omit<BuocMau, 'cha'> & { khoa: string; chaKhoa: string | null }

let dem = 0
const khoaMoi = () => `m${++dem}`

function SuaBuoc({
  q,
  ban,
  huy,
  luu,
}: {
  q: QuyTrinhMauChiTiet
  ban: boolean
  huy: () => void
  luu: (dl: { ten: string; canCu: string; hinhThuc: HinhThuc; buoc: BuocMau[] }) => void
}) {
  const [dau, datDau] = useState({ ten: q.ten, canCu: q.canCu ?? '', hinhThuc: q.hinhThuc })
  const [dong, datDong] = useState<DongSua[]>(() =>
    q.buoc.map(({ cha, ...b }, i) => ({ ...b, khoa: `g${i}`, chaKhoa: cha === null ? null : `g${cha}` })),
  )
  const doi = (i: number, gt: Partial<DongSua>) =>
    datDong((c) => c.map((d, k) => (k === i ? { ...d, ...gt } : d)))
  const doiCho = (i: number, huong: -1 | 1) =>
    datDong((c) => {
      const m = [...c]
      const [x] = m.splice(i, 1)
      m.splice(i + huong, 0, x!)
      return m
    })
  const them = (nhom: boolean) =>
    datDong((c) => [
      ...c,
      {
        khoa: khoaMoi(),
        chaKhoa: null,
        gd: c.at(-1)?.gd ?? 'I',
        stt: '',
        nhom,
        ten: '',
        soNgay: nhom ? 0 : 1,
        donVi: '',
        ben: 'chu-dau-tu',
        vanBan: '',
      },
    ])
  const ghi = () => {
    const viTri = new Map(dong.map((d, i) => [d.khoa, i]))
    luu({
      ...dau,
      buoc: dong.map(({ khoa: _k, chaKhoa, ...b }) => ({
        ...b,
        cha: chaKhoa !== null && viTri.has(chaKhoa) ? viTri.get(chaKhoa)! : null,
      })),
    })
  }
  const o = 'w-full rounded border border-line bg-nen-2 px-1.5 py-1 text-[12.5px]'

  return (
    <>
      <div className="grid gap-x-3 md:grid-cols-[2fr_2fr_1fr]">
        <ONhap
          id="qt-ten"
          nhan="Tên quy trình"
          value={dau.ten}
          onChange={(e) => datDau({ ...dau, ten: e.target.value })}
        />
        <ONhap
          id="qt-can-cu"
          nhan="Căn cứ"
          value={dau.canCu}
          onChange={(e) => datDau({ ...dau, canCu: e.target.value })}
        />
        <div className="mb-3.5">
          <label htmlFor="qt-hinh-thuc" className="mb-1.5 block text-[12.5px] font-semibold text-body">
            Hình thức
          </label>
          <select
            id="qt-hinh-thuc"
            value={dau.hinhThuc}
            onChange={(e) => datDau({ ...dau, hinhThuc: e.target.value as HinhThuc })}
            className="w-full rounded-lg border border-line bg-nen-2 px-3 py-2 text-[13.5px]"
          >
            {Object.entries(HINH_THUC).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <KhungBang nhan="Sửa các bước">
        <thead>
          <tr>
            <th className={LOP_TH}>GĐ</th>
            <th className={LOP_TH}>STT</th>
            <th className={LOP_TH}>Nhóm</th>
            <th className={LOP_TH}>Nội dung công việc</th>
            <th className={LOP_TH}>Thuộc nhóm</th>
            <th className={LOP_TH}>Số ngày</th>
            <th className={LOP_TH}>Bên</th>
            <th className={LOP_TH}>Văn bản</th>
            <th className={LOP_TH}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dong.map((d, i) => (
            <tr key={d.khoa} className={d.nhom ? 'bg-nen-2' : undefined}>
              <td className={LOP_TD}>
                <select
                  aria-label="Giai đoạn"
                  value={d.gd}
                  className={o}
                  onChange={(e) => doi(i, { gd: e.target.value as BuocMau['gd'] })}
                >
                  {Object.keys(GIAI_DOAN).map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </td>
              <td className={LOP_TD}>
                <input
                  aria-label="STT"
                  value={d.stt}
                  maxLength={20}
                  className={`${o} w-16`}
                  onChange={(e) => doi(i, { stt: e.target.value })}
                />
              </td>
              <td className={`${LOP_TD} text-center`}>
                <input
                  type="checkbox"
                  aria-label="Là nhóm"
                  checked={d.nhom}
                  className="accent-brand"
                  onChange={(e) =>
                    doi(i, { nhom: e.target.checked, soNgay: e.target.checked ? 0 : d.soNgay })
                  }
                />
              </td>
              <td className={`${LOP_TD} min-w-[260px]`}>
                <input
                  aria-label="Nội dung"
                  value={d.ten}
                  maxLength={500}
                  className={o}
                  onChange={(e) => doi(i, { ten: e.target.value })}
                />
              </td>
              <td className={LOP_TD}>
                <select
                  aria-label="Thuộc nhóm"
                  value={d.chaKhoa ?? ''}
                  className={`${o} max-w-[160px]`}
                  onChange={(e) => doi(i, { chaKhoa: e.target.value || null })}
                >
                  <option value="">—</option>
                  {dong
                    .slice(0, i)
                    .filter((x) => x.nhom)
                    .map((x) => (
                      <option key={x.khoa} value={x.khoa}>
                        {x.stt} {x.ten.slice(0, 30)}
                      </option>
                    ))}
                </select>
              </td>
              <td className={LOP_TD}>
                <input
                  aria-label="Số ngày"
                  type="number"
                  min={0}
                  max={3650}
                  disabled={d.nhom}
                  value={d.soNgay}
                  className={`${o} w-16`}
                  onChange={(e) => doi(i, { soNgay: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
              </td>
              <td className={LOP_TD}>
                <select
                  aria-label="Bên thực hiện"
                  value={d.ben}
                  disabled={d.nhom}
                  className={o}
                  onChange={(e) => doi(i, { ben: e.target.value as BuocMau['ben'] })}
                >
                  {Object.entries(BEN_THUC_HIEN).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td className={LOP_TD}>
                <input
                  aria-label="Văn bản"
                  value={d.vanBan}
                  maxLength={500}
                  className={o}
                  onChange={(e) => doi(i, { vanBan: e.target.value })}
                />
              </td>
              <td className={`${LOP_TD} whitespace-nowrap`}>
                <span className="inline-flex gap-1">
                  <Nut aria-label="Lên" disabled={i === 0} onClick={() => doiCho(i, -1)}>
                    ↑
                  </Nut>
                  <Nut aria-label="Xuống" disabled={i === dong.length - 1} onClick={() => doiCho(i, 1)}>
                    ↓
                  </Nut>
                  <Nut
                    aria-label="Bỏ bước"
                    kieu="nguy-hiem"
                    onClick={() =>
                      datDong((c) =>
                        c
                          .filter((_, k) => k !== i)
                          .map((x) => (x.chaKhoa === d.khoa ? { ...x, chaKhoa: null } : x)),
                      )
                    }
                  >
                    ✕
                  </Nut>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </KhungBang>
      <div className="mt-3 flex flex-wrap gap-2">
        <Nut onClick={() => them(false)}>+ Thêm bước</Nut>
        <Nut onClick={() => them(true)}>+ Thêm nhóm</Nut>
        <span className="flex-1" />
        <Nut
          kieu="chinh"
          disabled={ban || !dau.ten.trim() || dong.some((d) => !d.ten.trim() || !d.stt.trim())}
          onClick={ghi}
        >
          {ban ? 'Đang lưu…' : 'Lưu quy trình'}
        </Nut>
        <Nut onClick={huy}>Hủy</Nut>
      </div>
    </>
  )
}
