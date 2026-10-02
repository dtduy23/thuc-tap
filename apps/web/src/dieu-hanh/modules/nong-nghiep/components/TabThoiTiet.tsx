import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { ProgressMetric } from '@/dieu-hanh/components/metrics/ProgressMetric'
import { AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import { toast } from '@/dieu-hanh/store/toast'
import { SAU_BENH, THOI_TIET_7_NGAY, THOI_TIET_HOM_NAY, mauThanh } from '../du-lieu'

/** Tab 1 — "Thời tiết & Sâu bệnh". */
export function TabThoiTiet() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <SectionCard
        tieuDe="Thời tiết nông vụ · 7 ngày"
        phu={<StatusChip trangThai={[THOI_TIET_HOM_NAY.nhanCanhBao, 'yel']} />}
      >
        <div className="flex items-baseline gap-3.5">
          <span className="text-[2.6rem] font-extrabold text-ink">{THOI_TIET_HOM_NAY.nhietDo}</span>
          <div>
            <b className="text-[0.84rem] text-ink">{THOI_TIET_HOM_NAY.moTa}</b>
            <div className="text-[0.72rem] text-chu-phu">{THOI_TIET_HOM_NAY.phu}</div>
          </div>
        </div>

        <div className="mt-4 flex h-[120px] items-end gap-2.5">
          {THOI_TIET_7_NGAY.map(([thu, do_, mua]) => (
            <button
              key={thu}
              type="button"
              onClick={() =>
                toast(
                  `${thu}: ${do_}°C${
                    mua
                      ? ' · mưa lớn 40-70mm — hoãn phun thuốc, kiểm tra tiêu úng'
                      : ' · trời nắng, thuận lợi sản xuất'
                  }`,
                )
              }
              className="flex-1 text-center"
              aria-label={`Thời tiết ${thu}: ${do_} độ`}
            >
              {/* Chiều cao cột: bản gốc (nhiệt độ - 24) * 11 px */}
              <div
                className="mb-[5px] rounded-md"
                style={{
                  height: (do_ - 24) * 11,
                  background: mua ? 'var(--brand)' : 'var(--cot-nang)',
                }}
              />
              <small className="text-[0.66rem] font-bold text-faint">{thu}</small>
              <div className="tnum text-[0.7rem] font-bold text-ink">{do_}°</div>
            </button>
          ))}
        </div>

        <div className="mt-3 text-[0.76rem] font-semibold text-warn">{THOI_TIET_HOM_NAY.canhBao}</div>
      </SectionCard>

      <SectionCard tieuDe="Cảnh báo sâu bệnh" phu={<AiChip>✦ AI nhận diện qua ảnh</AiChip>}>
        {SAU_BENH.map((p) => (
          <button
            key={p.ten}
            type="button"
            onClick={() => toast(`AI khuyến cáo ${p.ten.split(' — ')[0]}: ${p.khuyenCao}`)}
            className="block w-full text-left"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <b className="text-[0.8rem] text-ink">{p.ten}</b>
              <StatusChip trangThai={[`Mức ${p.muc}`, p.mau]} />
            </div>
            <div className="mb-1.5 text-[0.72rem] text-chu-phu">{p.viTri}</div>
            <ProgressMetric pct={p.pct} mau={mauThanh(p.mau)} className="mb-4" />
          </button>
        ))}

        <div className="text-[0.72rem] text-chu-phu">
          182 ảnh nông dân gửi qua App — AI nhận diện đúng 96% · bấm từng dòng để xem khuyến cáo
        </div>
      </SectionCard>
    </div>
  )
}
