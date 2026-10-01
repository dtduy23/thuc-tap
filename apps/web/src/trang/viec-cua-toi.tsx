import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ngayVn } from '@/lib/ngay'
import { truyVanViecCuaToi } from '@/lib/xuyen-suot'
import { Chip, The } from '@/ui/co-ban'

const MUC_DO = {
  'qua-han': ['danger', 'Quá hạn / gấp'],
  'sap-han': ['warn', 'Sắp đến hạn'],
  thuong: ['brand', 'Cần xử lý'],
} as const

/**
 * "Việc của tôi" — gom việc từ MỌI module nghiệp vụ (ADR-0002, ADR-0007), xếp gấp
 * trước. Là vỏ, không nằm trong cây. Thêm nghiệp vụ không phải sửa màn này.
 */
export function ViecCuaToi() {
  const { data: ds, isPending, isError } = useQuery(truyVanViecCuaToi)
  const di = useNavigate()
  return (
    <The tieuDe="Việc của tôi" phu={ds ? `${ds.length} việc` : undefined}>
      {isPending && <p className="m-0 text-[13px] text-faint">Đang tải…</p>}
      {isError && <p className="m-0 text-[13px] text-danger">Không tải được danh sách việc.</p>}
      {ds && ds.length === 0 && <p className="m-0 text-[13px] text-faint">Không có việc nào cần làm ngay.</p>}
      {ds && ds.length > 0 && (
        <ul className="m-0 list-none divide-y divide-line-2 p-0">
          {ds.slice(0, 30).map((v, i) => {
            const [mau, nhan] = MUC_DO[v.mucDo]
            return (
              <li key={`${v.nguon}-${i}`}>
                <a
                  href={v.lienKet}
                  onClick={(e) => {
                    // Liên kết thật (mở tab mới được), nhưng bấm thường thì chuyển trang trong ứng dụng.
                    e.preventDefault()
                    void di({ href: v.lienKet })
                  }}
                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 py-2 hover:bg-nav-hover"
                >
                  <Chip mau={mau}>{nhan}</Chip>
                  <span className="min-w-0 flex-1 text-[13px]">
                    <b className="text-ink">{v.tieuDe}</b>
                    <span className="block text-[11.5px] text-faint">
                      {v.nghiepVu} · {v.hoSoTen} · {v.moTa}
                    </span>
                  </span>
                  {v.han && <span className="text-[12px] text-faint tabular-nums">hạn {ngayVn(v.han)}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      )}
      {ds && ds.length > 30 && (
        <p className="mt-2 mb-0 text-[12px] text-faint">… và {ds.length - 30} việc khác.</p>
      )}
    </The>
  )
}
