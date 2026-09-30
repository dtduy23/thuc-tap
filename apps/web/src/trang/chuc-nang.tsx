import { quyenCua } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { MAN_HINH } from '@/app/man-hinh'
import { timViTri } from '@/lib/phan-he'
import { truyVanToi } from '@/lib/phien'
import { ThongBao } from '@/ui/co-ban'

/**
 * Một chức năng cấp 4. Kiểm quyền lần nữa ở đây — người dùng gõ thẳng URL thì
 * không đi qua cây. (API vẫn là chốt chặn thật; đây chỉ để không hiện màn trống.)
 */
export function TrangChucNang({ id }: { id: string }) {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const vt = timViTri(id)
  if (!vt) return <KhongTimThay />

  const quyen = new Set(toi.quyen)
  const { tang, nhom, module: m, chucNang: c } = vt
  if (!quyen.has(quyenCua(m, c))) {
    return <ThongBao kieu="loi">Tài khoản không có quyền mở chức năng “{c.nhan}”.</ThongBao>
  }

  const anhEm = m.con.filter((x) => quyen.has(quyenCua(m, x)))
  const ManHinh = MAN_HINH[id]

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">
        {[
          ['C1', `Tầng ${tang.so} — ${tang.nhan}`],
          ['C2', nhom.nhan],
          ['C3', m.nhan],
        ].map(([cap, nhan]) => (
          <span key={cap} className="flex items-center gap-1.5">
            <span className="rounded border border-line bg-nen-2 px-1 text-[9.5px] font-bold">{cap}</span>
            {nhan} ›
          </span>
        ))}
        <span className="rounded border border-line bg-nen-2 px-1 text-[9.5px] font-bold">C4</span>
        <b className="text-body">{c.nhan}</b>
      </nav>
      <h1 className="mt-0 mb-1 text-[21px] font-bold">{c.nhan}</h1>
      <p className="mt-0 mb-4 max-w-[72ch] text-[12.5px] text-faint">{c.mo ?? m.mo}</p>

      {anhEm.length > 1 && (
        <div role="tablist" className="mb-4 flex gap-0.5 overflow-x-auto border-b border-line">
          {anhEm.map((x) => (
            <Link
              key={x.id}
              to="/$chucNang"
              params={{ chucNang: x.id }}
              role="tab"
              aria-selected={x.id === id}
              className={`border-b-2 px-3 py-2 text-[13px] whitespace-nowrap ${x.id === id ? 'border-brand font-semibold text-brand' : 'border-transparent text-body'}`}
            >
              {x.nhan}
            </Link>
          ))}
        </div>
      )}

      <Suspense fallback={<p className="text-faint">Đang tải…</p>}>
        {ManHinh ? <ManHinh /> : <ThongBao>Màn hình của chức năng này đang được xây dựng.</ThongBao>}
      </Suspense>
    </>
  )
}

export function KhongTimThay() {
  return (
    <div className="p-6">
      <h1 className="text-[21px] font-bold">Không tìm thấy trang</h1>
      <p className="text-faint">
        Đường dẫn không tồn tại.{' '}
        <Link to="/" className="text-brand">
          Về trang chủ
        </Link>
      </p>
    </div>
  )
}
