import { quyenCua } from '@gdos/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { MAN_HINH } from '@/app/man-hinh'
import { timViTri } from '@/lib/phan-he'
import { truyVanToi } from '@/lib/phien'
import { ThongBao } from '@/ui/co-ban'
import { ManPhac } from './man-phac'

/**
 * Một chức năng cấp 4. Kiểm quyền lần nữa ở đây — người dùng gõ thẳng URL thì
 * không đi qua cây. (API vẫn là chốt chặn thật; đây chỉ để không hiện màn trống.)
 */
export function TrangChucNang({ id }: { id: string }) {
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const vt = timViTri(id)
  if (!vt) return <KhongTimThay />

  const quyen = new Set(toi.quyen)
  const { nhom, module: m, chucNang: c } = vt
  if (!quyen.has(quyenCua(m, c))) {
    return <ThongBao kieu="loi">Tài khoản không có quyền mở chức năng “{c.nhan}”.</ThongBao>
  }

  const anhEm = m.con.filter((x) => quyen.has(quyenCua(m, x)))
  const ManHinh = MAN_HINH[id]

  return (
    <>
      <nav aria-label="Vị trí" className="mb-1 text-[12px] text-faint">
        {nhom.nhan} <span className="mx-1 opacity-60">›</span> {m.nhan}
      </nav>
      <h1 className="mt-0 mb-3 text-[20px] font-extrabold tracking-[-.01em] text-ink">{c.nhan}</h1>

      {anhEm.length > 1 && (
        <div role="tablist" className="mb-4 flex gap-0.5 overflow-x-auto border-b border-line">
          {anhEm.map((x) => (
            <Link
              key={x.id}
              to="/$chucNang"
              params={{ chucNang: x.id }}
              role="tab"
              aria-selected={x.id === id}
              className={`-mb-px border-b-[2.5px] px-3.5 py-2 text-[13px] whitespace-nowrap ${x.id === id ? 'border-vang font-bold text-brand' : 'border-transparent font-medium text-faint hover:text-ink'}`}
            >
              {x.nhan}
            </Link>
          ))}
        </div>
      )}

      <Suspense fallback={<p className="text-faint">Đang tải…</p>}>
        {ManHinh ? <ManHinh /> : <ManPhac vt={vt} />}
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
