import { Table } from '@heroui/react'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import type { VungTrong } from '@/dieu-hanh/mocks/types'

const COT = ['Mã vùng', 'Vùng trồng / Sản phẩm', 'DT', 'Nhật ký', 'Trạng thái'] as const

interface Props {
  vung: ReadonlyArray<[string, VungTrong]>
  dangChon: string
  chon: (id: string) => void
}

/** Bảng vùng trồng — bấm một dòng thì panel QR và nhật ký bên phải đổi theo. */
export function BangVungTrong({ vung, dangChon, chon }: Props) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Danh sách vùng trồng được cấp mã truy xuất">
          <Table.Header>
            {COT.map((c) => (
              <Table.Column
                key={c}
                isRowHeader={c === 'Mã vùng'}
                className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
              >
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {vung.map(([id, v]) => (
              <Table.Row
                key={id}
                onAction={() => chon(id)}
                className={`cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover ${
                  id === dangChon ? 'bg-brand-soft' : ''
                }`}
              >
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{id}</b>
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{v.sp}</b>
                  <small className="block text-[0.7rem] text-faint">{v.ho}</small>
                </Table.Cell>
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{v.dt}</Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={v.nk} />
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={v.st} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
