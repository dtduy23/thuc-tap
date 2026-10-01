import { Table } from '@heroui/react'
import type { PhanAnh } from '@/dieu-hanh/mocks/types'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { EmptyState } from '@/dieu-hanh/components/ui/StateViews'

/** Thứ tự cột copy nguyên từ thead của bản gốc. */
const COT = ['Mã', 'Nội dung phản ánh', 'Lĩnh vực', 'Ngày', 'Trạng thái'] as const

interface Props {
  danhSach: ReadonlyArray<PhanAnh>
  moChiTiet: (id: string) => void
}

export function BangPhanAnh({ danhSach, moChiTiet }: Props) {
  if (!danhSach.length) return <EmptyState noiDung="Chưa có phản ánh nào" />

  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Danh sách phản ánh kiến nghị">
          <Table.Header>
            {COT.map((c) => (
              <Table.Column
                key={c}
                isRowHeader={c === 'Mã'}
                className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
              >
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {danhSach.map((p) => (
              <Table.Row
                key={p.id}
                onAction={() => moChiTiet(p.id)}
                className="cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover"
              >
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{p.id}</Table.Cell>
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{p.ten}</b>
                  <small className="mt-px block text-[0.68rem] text-faint">{p.nguoi}</small>
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={[p.linhvuc, 'gray']} />
                </Table.Cell>
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{p.ngay}</Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={p.st} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
