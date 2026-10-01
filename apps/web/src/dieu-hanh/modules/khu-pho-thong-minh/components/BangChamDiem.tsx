import { Table } from '@heroui/react'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { D } from '@/dieu-hanh/mocks/data'
import { COT_BANG, oDiem } from '../du-lieu'

/** Ô điểm tiêu chí — port từ scv(). */
function ODiem({ v }: { v: number }) {
  const { nen, chu } = oDiem(v)
  return (
    <span
      className="tnum inline-grid h-[26px] min-w-[38px] place-items-center rounded-lg text-[0.74rem] font-bold"
      style={{ background: nen, color: chu }}
    >
      {v}
    </span>
  )
}

interface Props {
  moChiTiet: (i: number) => void
}

export function BangChamDiem({ moChiTiet }: Props) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Bảng chấm điểm 5 tiêu chí khu phố thông minh">
          <Table.Header>
            {COT_BANG.map((c) => (
              <Table.Column
                key={c}
                isRowHeader={c === 'Ấp / Thôn'}
                className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
              >
                {c}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {D.apscore.map((r, i) => (
              <Table.Row
                key={r[0]}
                onAction={() => moChiTiet(i)}
                className="cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover"
              >
                <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{r[0]}</b>
                  <small className="block text-[0.7rem] text-faint">{r[1]}</small>
                </Table.Cell>
                {([2, 3, 4, 5, 6] as const).map((k) => (
                  <Table.Cell key={k} className="px-3.5 py-3">
                    <ODiem v={r[k]} />
                  </Table.Cell>
                ))}
                <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{r[7]}</b>
                </Table.Cell>
                <Table.Cell className="px-3.5 py-3">
                  <StatusChip trangThai={r[8]} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
