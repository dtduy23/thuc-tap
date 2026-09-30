import { laPhac } from '@gdos/shared'
import { Link } from '@tanstack/react-router'
import type { ViTri } from '@/lib/phan-he'

/**
 * Màn PHÁC — chức năng đã có chỗ trên cây nhưng chưa xây. Nói với người dùng bằng
 * ngôn ngữ của họ ("đang xây dựng"), và chỉ lối sang những chức năng đã dùng được.
 * Vị trí kỹ thuật (tầng, nhóm, mã quyền) thuộc về tài liệu, không hiện ở đây.
 */
export function ManPhac({ vt }: { vt: ViTri }) {
  const { module: m, chucNang: c } = vt
  const daCo = m.con.filter((x) => x.id !== c.id && !laPhac(m, x))
  return (
    <div className="max-w-[620px] rounded-[10px] border border-line bg-nen px-6 py-8 text-center shadow-[0_1px_2px_rgba(16,34,54,.06),0_4px_14px_rgba(16,34,54,.05)]">
      <div
        aria-hidden="true"
        className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-tint-brand text-brand"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4Z" />
        </svg>
      </div>
      <h2 className="m-0 text-[16px] font-bold text-ink">“{c.nhan}” đang được xây dựng</h2>
      <p className="mx-auto mt-1.5 mb-0 max-w-[46ch] text-[13px] text-faint">
        Chức năng này sẽ có trong các bản cập nhật tới.
      </p>
      {daCo.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {daCo.map((x) => (
            <Link
              key={x.id}
              to="/$chucNang"
              params={{ chucNang: x.id }}
              className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:border-brand hover:text-brand"
            >
              {x.nhan}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
