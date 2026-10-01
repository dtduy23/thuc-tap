import {
  GIAI_DOAN,
  homNay,
  khoangBuoc,
  soNgayGiua,
  trangThaiBuoc,
  type BuocDuAn,
  type GiaiDoan,
  type HoSoDuAn,
  type TrangThaiBuoc,
} from '@gdos/shared'
import { Fragment, useMemo, useState } from 'react'
import { ngayVn } from '@/lib/ngay'

const MAU_THANH: Record<TrangThaiBuoc, string> = {
  xong: 'bg-ok',
  'qua-han': 'bg-danger',
  'sap-han': 'bg-warn',
  'trong-han': 'bg-brand',
  'cho-xac-nhan': 'bg-tim',
  'bo-qua': 'bg-line',
}

const MUC_ZOOM = [
  { ten: 'Quý', px: 1.5 },
  { ten: 'Tháng', px: 4 },
  { ten: 'Tuần', px: 12 },
] as const

const COT_TEN = 300

/**
 * Gantt — vẽ từ đúng chuỗi hạn của checklist (khoangBuoc ở @gdos/shared), nên
 * không thể lệch với Checklist. Cột tên ghim khi cuộn ngang. Bước nháp không vẽ.
 */
export default function Gantt({ hs }: { hs: HoSoDuAn }) {
  const [zoom, datZoom] = useState(1)
  const hn = homNay()
  const px = MUC_ZOOM[zoom]!.px

  const { khoang, tu, den } = useMemo(() => {
    const k = khoangBuoc(hs.buoc, hs.ngayBatDau)
    const map = new Map<string, { tu: string; den: string }>()
    hs.buoc.forEach((b, i) => {
      const x = k[i]
      if (x && !b.laNhom) map.set(b.id, x)
    })
    // Nhóm: trải từ con sớm nhất tới con muộn nhất.
    for (const b of [...hs.buoc].reverse()) {
      if (!b.laNhom) continue
      const con = hs.buoc
        .filter((c) => c.chaId === b.id)
        .map((c) => map.get(c.id))
        .filter((x) => !!x)
      if (con.length)
        map.set(b.id, {
          tu: con.reduce((m, c) => (c.tu < m ? c.tu : m), con[0]!.tu),
          den: con.reduce((m, c) => (c.den > m ? c.den : m), con[0]!.den),
        })
    }
    const tatCa = [...map.values()]
    const cuoi = tatCa.reduce((m, x) => (x.den > m ? x.den : m), hs.ngayBatDau)
    return { khoang: map, tu: hs.ngayBatDau, den: cuoi > hn ? cuoi : hn }
  }, [hs.buoc, hs.ngayBatDau, hn])

  const soNgay = soNgayGiua(tu, den) + 20
  const rong = soNgay * px
  const x = (ngay: string) => soNgayGiua(tu, ngay) * px

  const thang = useMemo(() => {
    const ds: { nhan: string; x: number }[] = []
    const d = new Date(`${tu.slice(0, 7)}-01T00:00:00Z`)
    while (d.toISOString().slice(0, 10) <= den) {
      const s = d.toISOString().slice(0, 10)
      if (s >= tu) ds.push({ nhan: `${s.slice(5, 7)}/${s.slice(0, 4)}`, x: soNgayGiua(tu, s) * px })
      d.setUTCMonth(d.getUTCMonth() + 1)
    }
    return ds
  }, [tu, den, px])

  const giaiDoan = Object.keys(GIAI_DOAN) as GiaiDoan[]
  const hang = (b: BuocDuAn) => {
    const k = khoang.get(b.id)
    const tt = trangThaiBuoc(b, hn)
    return (
      <div key={b.id} className="flex min-h-[28px] items-center border-b border-line-2 hover:bg-nav-hover">
        <div
          className="sticky left-0 z-[2] flex-none self-stretch truncate border-r border-line bg-nen px-2 py-1 text-[12px]"
          style={{ width: COT_TEN }}
          title={`${b.stt}. ${b.ten}`}
        >
          <span className="text-faint">{b.stt}</span>{' '}
          <span className={b.laNhom ? 'font-semibold text-ink' : b.boQua ? 'text-faint line-through' : ''}>
            {b.ten}
          </span>
        </div>
        <div className="relative h-[28px]" style={{ width: rong }}>
          {k && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 rounded ${b.laNhom ? 'h-1.5 bg-body/50' : `h-3.5 ${MAU_THANH[tt]}`}`}
              style={{ left: x(k.tu), width: Math.max(4, x(k.den) - x(k.tu)) }}
              title={`${b.ten}\n${ngayVn(k.tu)} → ${ngayVn(k.den)}${b.ngayHoanThanh ? `\nXong: ${ngayVn(b.ngayHoanThanh)}` : ''}`}
            />
          )}
          {b.ngayHoanThanh && (
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ok bg-nen"
              style={{ left: x(b.ngayHoanThanh) }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px]">
        <div role="group" aria-label="Thu phóng" className="flex gap-1">
          {MUC_ZOOM.map((m, i) => (
            <button
              key={m.ten}
              type="button"
              aria-pressed={zoom === i}
              onClick={() => datZoom(i)}
              className={`rounded-full border px-2.5 py-0.5 ${zoom === i ? 'border-brand bg-tint-brand font-semibold text-brand' : 'border-line text-body'}`}
            >
              {m.ten}
            </button>
          ))}
        </div>
        {(
          [
            ['bg-ok', 'Hoàn thành'],
            ['bg-danger', 'Quá hạn'],
            ['bg-warn', 'Sắp đến hạn'],
            ['bg-brand', 'Trong hạn'],
            ['bg-tim', 'Chờ xác nhận'],
          ] as const
        ).map(([mau, nhan]) => (
          <span key={nhan} className="flex items-center gap-1 text-faint">
            <i className={`inline-block h-2.5 w-3.5 rounded-sm ${mau}`} />
            {nhan}
          </span>
        ))}
        <span className="flex items-center gap-1 text-faint">
          <i className="inline-block size-2.5 rounded-full border-2 border-ok" /> ngày xong thực tế
        </span>
      </div>

      <div
        className="max-h-[70vh] overflow-auto rounded-[10px] border border-line bg-nen"
        role="figure"
        aria-label="Biểu đồ Gantt"
      >
        <div style={{ width: COT_TEN + rong }} className="relative">
          <div className="sticky top-0 z-[3] flex border-b-2 border-line bg-nen-2">
            <div
              className="sticky left-0 z-[4] flex-none border-r border-line bg-nen-2 px-2 py-1.5 text-[11.5px] font-semibold text-faint"
              style={{ width: COT_TEN }}
            >
              Công việc
            </div>
            <div className="relative h-[30px]" style={{ width: rong }}>
              {thang.map((t) => (
                <span
                  key={t.nhan}
                  className="absolute top-0 bottom-0 border-l border-line pt-1.5 pl-1 text-[10.5px] whitespace-nowrap text-faint"
                  style={{ left: t.x }}
                >
                  {t.nhan}
                </span>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 z-[1] w-0.5 bg-danger"
            style={{ left: COT_TEN + x(hn) }}
          >
            <span className="absolute top-[34px] left-1 rounded bg-nen/80 px-1 text-[9.5px] font-bold whitespace-nowrap text-danger">
              Hôm nay
            </span>
          </div>

          {giaiDoan.map((gd) => {
            const ds = hs.buoc.filter((b) => b.giaiDoan === gd && !b.laNhap)
            if (!ds.length) return null
            return (
              <Fragment key={gd}>
                <div className="flex border-b border-line">
                  <div
                    className="be-mat-dam sticky left-0 z-[2] flex-none px-2 py-1 text-[12px] font-bold text-white"
                    style={{ width: COT_TEN }}
                  >
                    <span className="mr-1.5 text-vang">{gd}</span>
                    {GIAI_DOAN[gd]}
                  </div>
                  <div className="be-mat-dam opacity-90" style={{ width: rong }} />
                </div>
                {ds.map(hang)}
              </Fragment>
            )
          })}
        </div>
      </div>
    </>
  )
}
