/**
 * KHÔNG GIAN DỰ ÁN — cột trái khi đang ở trong MỘT dự án (tổ chức như PMS): "Quay lại danh
 * mục" rồi các phần của hồ sơ. Thay cho cây phân hệ trong lúc làm việc với một dự án, để
 * người dùng không lạc giữa cả hệ thống; bấm "Quay lại danh mục" là về cây.
 */
import { Link } from '@tanstack/react-router'
import { theMoDuoc, type MaThe } from '@/trang/ho-so-du-an'

const BIEU_TUONG: Record<MaThe, string> = {
  'tong-quan': '📊',
  checklist: '📑',
  gantt: '📅',
  'ke-hoach': '🕘',
  'van-ban': '📜',
  'kinh-phi': '💰',
  'vuong-mac': '⚠️',
  'thanh-vien': '👥',
  'nhat-ky': '🕵',
}

export function KhongGianDuAn({
  id,
  the,
  quyen,
}: {
  id: string
  the: string | undefined
  quyen: readonly string[]
}) {
  const cacThe = theMoDuoc(quyen)
  const dangXem = cacThe.find((t) => t.id === the)?.id ?? cacThe[0]?.id
  return (
    <nav aria-label="Không gian dự án">
      <Link
        to="/$chucNang"
        params={{ chucNang: 'da-tat-ca' }}
        className="mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-body hover:bg-nav-hover hover:text-ink"
      >
        <span aria-hidden="true" className="w-4 flex-none text-center">
          ←
        </span>
        Quay lại danh mục
      </Link>
      <p className="mt-3 mb-1.5 px-2.5 text-[10.5px] font-bold tracking-[.12em] text-vang uppercase">
        Không gian dự án
      </p>
      {cacThe.map((t) => {
        const dang = t.id === dangXem
        return (
          <Link
            key={t.id}
            to="/du-an/$id"
            params={{ id }}
            search={{ the: t.id }}
            aria-current={dang ? 'page' : undefined}
            className={`mb-0.5 flex items-center gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-[13px] ${dang ? 'border-vang bg-tint-brand font-semibold text-ink' : 'border-transparent font-medium text-body hover:bg-nav-hover hover:text-ink'}`}
          >
            <span aria-hidden="true" className="w-4 flex-none text-center text-[13px]">
              {BIEU_TUONG[t.id]}
            </span>
            {t.nhan}
          </Link>
        )
      })}
    </nav>
  )
}
