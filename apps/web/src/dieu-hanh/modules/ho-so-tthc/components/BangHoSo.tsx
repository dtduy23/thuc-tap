import { Table } from '@heroui/react'
import type { HoSoTthc } from '@/dieu-hanh/mocks/types'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { EmptyState } from '@/dieu-hanh/components/ui/StateViews'

/** Thứ tự cột copy nguyên từ thead của bản gốc. */
const COT = ['Mã HS', 'Công dân', 'Loại thủ tục', 'Tiếp nhận', 'Hạn', 'Trạng thái', 'Chuyên viên'] as const

interface Props {
  hoSo: ReadonlyArray<HoSoTthc>
  moChiTiet: (id: string) => void
}

export function BangHoSo({ hoSo, moChiTiet }: Props) {
  if (!hoSo.length) return <EmptyState noiDung="Không có hồ sơ nào khớp bộ lọc" />

  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Danh sách hồ sơ thủ tục hành chính">
          <Table.Header>
            {COT.map((c) => (
              <Table.Column
                key={c}
                isRowHeader={c === 'Mã HS'}
                className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
              >
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {hoSo.map((h) => (
              <Table.Row
                key={h.id}
                onAction={() => moChiTiet(h.id)}
                className="cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover"
              >
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{h.id}</Table.Cell>
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{h.cd}</b>
                  <small className="tnum mt-px block text-[0.68rem] text-faint">{h.cccd}</small>
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  {h.loai}
                  <small className="mt-px block text-[0.68rem] text-faint">{h.nhom}</small>
                </Table.Cell>
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{h.nhan}</Table.Cell>
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">{h.han}</Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={h.st} />
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap px-3.5 py-3 text-[0.8rem]">CV {h.cv}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
