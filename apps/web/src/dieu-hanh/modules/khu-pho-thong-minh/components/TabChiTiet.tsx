import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { DiemKhuPho } from '@/dieu-hanh/mocks/types'
import { mauTieuChi, MINH_CHUNG, TCN, VIEC_CAN_LAM } from '../du-lieu'

interface Props {
  khuPho: DiemKhuPho
  moDrill: (ct: ChiTieuDrill) => void
  xuatHoSo: (ten: string) => void
}

/** Một dòng việc cần làm — port .list-item + .dot của bản gốc. */
function DongViec({ mau, tieuDe, phu }: { mau: string; tieuDe: string; phu: string }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line-2 py-2.5 last:border-0">
      <span className="mt-1.5 size-2 flex-none rounded-full" style={{ background: mau }} aria-hidden="true" />
      <div className="min-w-0">
        <b className="text-[0.78rem] text-ink">{tieuDe}</b>
        <small className="block text-[0.7rem] text-faint">{phu}</small>
      </div>
    </div>
  )
}

/** Tab 1 — "Chi tiết · <khu phố>", port từ openApDetail(). */
export function TabChiTiet({ khuPho: r, moDrill, xuatHoSo }: Props) {
  const diem = [r[2], r[3], r[4], r[5], r[6]]
  // Bản gốc: tiêu chí thấp nhất là việc ưu tiên
  const thapNhat = diem.indexOf(Math.min(...diem))

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
      <SectionCard
        tieuDe={`Mức độ đạt 5 tiêu chí · Tổng ${r[7]} / 100`}
        phu={<StatusChip trangThai={r[8]} />}
      >
        <div className="grid grid-cols-2 gap-0.5 text-center sm:grid-cols-3 lg:grid-cols-5">
          {diem.map((v, k) => (
            <button
              key={k}
              type="button"
              onClick={() =>
                moDrill({
                  ten: `${r[0]} — ${TCN[k]}`,
                  val: v,
                  sub: 'điểm / 100 theo bộ tiêu chí tỉnh',
                  pct: v,
                  mod: 'apthongminh',
                  dv: 'Tổ CNSCĐ + Văn phòng',
                })
              }
              className="rounded-lg p-1 hover:bg-row-hover"
            >
              <Gauge val={v} color={mauTieuChi(v)} />
              <div className="-mt-1.5 text-[0.62rem] leading-[1.3] text-chu-phu">{TCN[k]}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-center text-[0.68rem] text-faint">
          Ngưỡng đạt chuẩn ≥ 90 điểm/tiêu chí — vòng đỏ là tiêu chí kéo tụt kết quả
        </div>
      </SectionCard>

      <div className="grid gap-4">
        <SectionCard tieuDe="Việc cần hoàn thiện" phu={<AiChip>✦ AI đề xuất</AiChip>}>
          <div className="pt-0.5">
            <DongViec
              mau="var(--gdos-danger)"
              tieuDe={`Ưu tiên: nâng ${TCN[thapNhat]} (${diem[thapNhat]} điểm)`}
              phu={`tiêu chí thấp nhất — kéo tổng điểm của ${r[0]}`}
            />
            {VIEC_CAN_LAM.map(([ten, phu]) => (
              <DongViec key={ten} mau="var(--warn)" tieuDe={ten} phu={phu} />
            ))}
          </div>
        </SectionCard>

        <SectionCard tieuDe="Minh chứng tự tổng hợp">
          <div className="text-[0.78rem] leading-[2.1]">
            {MINH_CHUNG.map(([nd, daCo]) => (
              <div key={nd} style={{ color: daCo ? 'var(--ok-tx)' : 'var(--warn-tx)' }}>
                {daCo ? '✓' : '…'} {nd}
              </div>
            ))}
          </div>
          <NutChinh onPress={() => xuatHoSo(r[0])} className="mt-3 w-full justify-center">
            Xuất bộ hồ sơ đề nghị công nhận (PDF)
          </NutChinh>
        </SectionCard>
      </div>
    </div>
  )
}
