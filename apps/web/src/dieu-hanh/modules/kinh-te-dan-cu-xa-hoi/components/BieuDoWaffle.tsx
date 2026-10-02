import type { PhanDonut } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { DanhSachGiaTri } from '@/dieu-hanh/components/charts/DonutPhanRa'

/**
 * Port từ waffle(): 100 ô, mỗi ô 1% dân số. Làm tròn theo phần dư lớn nhất để
 * tổng số ô luôn đúng 100 dù từng nhóm có phần lẻ.
 */
export function BieuDoWaffle({ parts, total }: { parts: ReadonlyArray<PhanDonut>; total: number }) {
  const raw = parts.map((p) => (p.value / total) * 100)
  const fl = raw.map(Math.floor)
  const rem = 100 - fl.reduce((a, b) => a + b, 0)
  raw
    .map((v, i) => [v - fl[i]!, i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, rem)
    .forEach(([, i]) => fl[i]!++)

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="grid max-w-[520px] flex-[1_1_300px] grid-cols-10 gap-[3px] min-[761px]:grid-cols-20">
        {parts.flatMap((p, i) =>
          Array.from({ length: fl[i]! }, (_, k) => (
            <i
              key={`${p.label}-${k}`}
              className="block aspect-square rounded-[3px] hover:outline-2 hover:-outline-offset-1 hover:outline-ink"
              style={{ background: p.color }}
              {...goiY({ tieuDe: p.label, than: `${soCoDinh(p.value)} người · ${soCoDinh(raw[i]!, 1)}%` })}
            />
          )),
        )}
      </div>
      <DanhSachGiaTri
        className="flex-[0_1_240px]"
        ds={parts.map((p, i) => ({
          label: p.label,
          color: p.color,
          so: soCoDinh(p.value),
          phu: `${soCoDinh(raw[i]!, 1)}%`,
        }))}
      />
    </div>
  )
}
