import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { KichBanTienDo } from '@/dieu-hanh/lib/api-tro-ly'

/**
 * Tiến độ một quy trình nhiều bước. Kịch bản đang chạy trông y hệt trò chuyện
 * thường, nên phải vẽ ra: còn mấy bước, còn thiếu GÌ (tên, không chỉ đếm), xong chưa.
 */
export function TienDoKichBan({ kichBan }: { kichBan: KichBanTienDo }) {
  const { ten, buoc, tongBuoc, conThieu, xong, loi } = kichBan
  const phanTram = tongBuoc > 0 ? Math.min(100, Math.round((buoc / tongBuoc) * 100)) : 0
  return (
    <section
      className={`rounded-card border p-3.5 ${xong ? 'border-ok bg-tint-ok' : 'border-brand/30 bg-tint-brand'}`}
      aria-label={`Tiến độ kịch bản ${ten}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {xong && <CircleCheck className="size-3.5 text-ok-tx" />}
        <p className={`text-[0.74rem] font-medium ${xong ? 'text-ok-tx' : 'text-brand'}`}>{ten}</p>
        <span className="tnum ml-auto text-[0.72rem] text-body">
          {xong ? 'Đã xong' : `Bước ${buoc}/${tongBuoc}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={buoc}
        aria-valuemin={0}
        aria-valuemax={tongBuoc}
        aria-label={`Bước ${buoc}/${tongBuoc}`}
        className="h-1.5 overflow-hidden rounded-full bg-track"
      >
        <div
          className={`h-full rounded-full ${xong ? 'bg-ok' : 'bg-brand'}`}
          style={{ width: `${phanTram}%` }}
        />
      </div>
      {/* Lý do bị từ chối đặt ngay đây: người vừa gõ sai đang nhìn vào ô nhập. */}
      {loi && (
        <p className="mt-2 flex items-start gap-1.5 rounded-md bg-canh-bao-bg px-2 py-1.5 text-[0.72rem] leading-relaxed text-canh-bao">
          <TriangleAlert className="mt-px size-3.5 flex-none" />
          <span>{loi}</span>
        </p>
      )}
      {conThieu.length > 0 && (
        <p className="mt-2 text-[0.72rem] leading-relaxed text-body">
          Còn thiếu: <b className="font-medium">{conThieu.join(' · ')}</b>
        </p>
      )}
    </section>
  )
}
