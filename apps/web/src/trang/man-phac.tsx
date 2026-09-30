import { laPhac, quyenCua } from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { ViTri } from '@/lib/phan-he'
import { Chip, The, ThongBao } from '@/ui/co-ban'

const NGUON = { db: 'Postgres của GDOS', native: 'FOXAI Native (gọi API)' } as const

/**
 * Màn PHÁC — chức năng đã có chỗ trên cây nhưng chưa xây màn. Không để trang
 * trống: cho người xem (và người sẽ xây) thấy chức năng này nằm đâu trong khung,
 * vì sao nằm đó, lấy dữ liệu từ đâu, cần quyền gì.
 */
export function ManPhac({ vt }: { vt: ViTri }) {
  const { tang, nhom, module: m, chucNang: c } = vt
  const loai = c.hanhDong && c.hanhDong !== 'READ' ? 'Thao tác' : 'Đường vào xem / bộ lọc'
  const dong: [string, ReactNode][] = [
    ['Cấp 1 · Tầng', `Tầng ${tang.so} — ${tang.nhan}`],
    [
      'Cấp 2 · Nhóm',
      <>
        {nhom.nhan}
        <span className="block text-[11.5px] text-faint italic">Câu hỏi của nhóm: {nhom.hoi}</span>
      </>,
    ],
    [
      'Cấp 3 · Module',
      <>
        {m.nhan}
        <span className="block text-[11.5px] text-faint">{m.mo}</span>
      </>,
    ],
    [
      'Cấp 4 · Chức năng',
      <>
        {c.nhan} <span className="text-faint">· {loai}</span>
        {c.mo && <span className="block text-[11.5px] text-faint">{c.mo}</span>}
      </>,
    ],
    ['Nguồn dữ liệu', NGUON[m.nguon]],
    [
      'Mã quyền',
      <code key="q" className="text-[12.5px]">
        {quyenCua(m, c)}
      </code>,
    ],
  ]

  return (
    <div className="max-w-[760px]">
      <ThongBao>
        <b>Màn phác.</b> Chức năng đã có chỗ trong khung, màn hình sẽ xây ở các mốc sau. Menu, đường dẫn và
        quyền đã chạy thật.
      </ThongBao>
      <The tieuDe="Vị trí trong khung">
        <dl className="m-0 grid gap-x-5 gap-y-2.5 text-[13px] sm:grid-cols-[150px_1fr]">
          {dong.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold text-faint">{k}</dt>
              <dd className="m-0 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </The>
      <The tieuDe={`Các đường vào của "${m.nhan}"`}>
        <ul className="m-0 list-none space-y-1.5 p-0 text-[13px]">
          {m.con.map((x) => (
            <li key={x.id} className="flex items-center gap-2">
              {x.id === c.id ? (
                <b className="text-brand">{x.nhan}</b>
              ) : (
                <Link to="/$chucNang" params={{ chucNang: x.id }} className="text-body hover:text-brand">
                  {x.nhan}
                </Link>
              )}
              {laPhac(m, x) ? <Chip>sắp có</Chip> : <Chip mau="ok">đã có</Chip>}
            </li>
          ))}
        </ul>
      </The>
    </div>
  )
}
