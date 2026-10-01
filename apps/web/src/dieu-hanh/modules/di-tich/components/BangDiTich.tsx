import { Table } from '@heroui/react'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { D } from '@/dieu-hanh/mocks/data'

const COT = ['Di tích', 'Xếp hạng', 'Bảo tồn', 'Số hóa'] as const

interface Props {
  dangChon: number
  chon: (i: number) => void
}

/** Danh mục di tích — bấm một dòng thì panel hồ sơ bên phải đổi theo. */
export function BangDiTich({ dangChon, chon }: Props) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Danh mục di tích và địa chỉ đỏ">
          <Table.Header>
            {COT.map((c) => (
              <Table.Column
                key={c}
                isRowHeader={c === 'Di tích'}
                className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
              >
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {D.dt.map((p, i) => (
              <Table.Row
                key={p.ten}
                onAction={() => chon(i)}
                className={`cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover ${
                  i === dangChon ? 'bg-brand-soft' : ''
                }`}
              >
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{p.ten}</b>
                  <small className="block text-[0.7rem] text-faint">{p.sub}</small>
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={p.xh} />
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={p.bt} />
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={p.so} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
