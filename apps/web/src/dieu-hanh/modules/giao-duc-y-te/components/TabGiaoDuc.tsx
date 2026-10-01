import { Table } from '@heroui/react'
import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { ProgressMetric } from '@/dieu-hanh/components/metrics/ProgressMetric'
import { AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import { CHI_TIEU_GD, CHUYEN_CAN, HS_THEO_CAP, NGUY_CO_BO_HOC, THE_GIAO_DUC, TONG_HS, TUAN } from '../du-lieu'

const COT = ['Trường', 'Cấp', 'HS', 'Sĩ số TB', 'CSVC', 'Chuẩn QG'] as const

interface Props {
  moDrill: (ct: ChiTieuDrill) => void
  moTruong: (i: number) => void
}

/** Tab 0 — "Giáo dục". */
export function TabGiaoDuc({ moDrill, moTruong }: Props) {
  // Bản gốc: cột đỏ cam khi sĩ số > 34 (chuẩn ≤ 35)
  const cotSiSo: MucChart[] = D.truong.map((t) => [
    t.ten.replace(' Bình Minh', ''),
    t.ss,
    t.ss > 34 ? '#D97E06' : '#12A150',
  ])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THE_GIAO_DUC.map((t) => (
          <KpiCard
            key={t.nhan}
            nhan={t.nhan}
            giaTri={t.giaTri}
            phu={t.phu}
            mauSo={t.mau}
            onClick={() => moDrill(t.drill)}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard tieuDe="Học sinh theo cấp học">
          <div className="flex items-center gap-3.5">
            <Donut items={HS_THEO_CAP} size={142} thick={24} center={TONG_HS} />
            <div className="flex-1">
              <DonutLegend items={HS_THEO_CAP} />
            </div>
          </div>
        </SectionCard>

        <SectionCard tieuDe="Sĩ số TB/lớp theo trường — chuẩn ≤ 35">
          <Bar items={cotSiSo} h={176} />
        </SectionCard>

        <SectionCard tieuDe="Chuyên cần toàn địa bàn (%)">
          <Line vals={CHUYEN_CAN} labels={TUAN} h={176} color="#1B66E0" />
        </SectionCard>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <SectionCard tieuDe="Mạng lưới trường lớp · bấm để xem chi tiết" khongDem>
            <Table variant="secondary">
              <Table.ScrollContainer className="overflow-x-auto">
                <Table.Content aria-label="Mạng lưới trường lớp trên địa bàn">
                  <Table.Header>
                    {COT.map((c) => (
                      <Table.Column
                        key={c}
                        isRowHeader={c === 'Trường'}
                        className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-left text-[0.62rem] font-bold tracking-[0.1em] text-faint"
                      >
                        {c}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {D.truong.map((r, i) => (
                      <Table.Row
                        key={r.ten}
                        onAction={() => moTruong(i)}
                        className="cursor-pointer border-b border-line-2 transition-colors last:border-b-0 hover:bg-row-hover"
                      >
                        <Table.Cell className="px-3.5 py-3 text-[0.8rem]">
                          <b className="text-ink">{r.ten}</b>
                          <small className="block text-[0.7rem] text-faint">{r.to}</small>
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                          {r.cap}
                        </Table.Cell>
                        <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                          {r.hs}
                        </Table.Cell>
                        <Table.Cell className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                          {r.ss}
                        </Table.Cell>
                        <Table.Cell className="px-3.5 py-3">
                          <StatusChip trangThai={r.csvc} />
                        </Table.Cell>
                        <Table.Cell className="px-3.5 py-3">
                          <StatusChip trangThai={r.chuan} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </SectionCard>

          <SectionCard tieuDe="Chỉ tiêu giáo dục · bấm để xem chi tiết">
            {CHI_TIEU_GD.map(([ten, val, mt]) => (
              <button
                key={ten}
                type="button"
                onClick={() =>
                  moDrill({
                    ten,
                    val,
                    sub: `% · MT ${mt}`,
                    pct: Math.min(val, 176),
                    mod: 'gdyt',
                    dv: 'Văn hóa - Xã hội + Phòng GD',
                  })
                }
                className="block w-full text-left"
              >
                <div className="mb-1.5 flex justify-between text-[0.78rem]">
                  <span className="text-body">{ten}</span>
                  <b className="tnum text-ink">
                    {val}% · MT {mt}
                  </b>
                </div>
                <ProgressMetric
                  pct={Math.min(val, 176)}
                  mau={val >= 98 ? 'var(--ok)' : 'var(--warn)'}
                  className="mb-3.5"
                />
              </button>
            ))}
          </SectionCard>
        </div>

        <SectionCard tieuDe="Cảnh báo nguy cơ bỏ học" phu={<AiChip>✦ AI theo dõi</AiChip>}>
          <div className="pt-0.5">
            {NGUY_CO_BO_HOC.map(([ten, lyDo]) => (
              <button
                key={ten}
                type="button"
                onClick={() =>
                  toast(
                    `Hồ sơ theo dõi ${ten.split(' — ')[0]}: lịch sử chuyên cần, hoàn cảnh, cán bộ phụ trách (demo)`,
                  )
                }
                className="flex w-full items-start gap-2.5 border-b border-line-2 py-2.5 text-left last:border-0 hover:bg-row-hover"
              >
                <span className="mt-1.5 size-2 flex-none rounded-full bg-canh-bao" aria-hidden="true" />
                <div className="min-w-0">
                  <b className="text-[0.78rem] text-ink">{ten}</b>
                  <small className="block text-[0.7rem] text-faint">{lyDo}</small>
                </div>
              </button>
            ))}
          </div>
          <NutChinh
            onPress={() => toast('Đã phân công cán bộ + hội phụ nữ vận động 3 trường hợp, hẹn báo cáo 12/04')}
            className="mt-2.5 w-full justify-center"
          >
            Phân công cán bộ vận động
          </NutChinh>
        </SectionCard>
      </div>
    </>
  )
}
