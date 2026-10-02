import type { ChatMessage } from '@/dieu-hanh/lib/api-tro-ly'
import type { Turn } from '@/dieu-hanh/hooks/use-ask-turns'
import { BangKetQua } from '@/dieu-hanh/components/ai/BangKetQua'
import { CauHoiTiep } from '@/dieu-hanh/components/ai/CauHoiTiep'
import { LoiVan } from '@/dieu-hanh/components/ai/LoiVan'
import { TienDoKichBan } from '@/dieu-hanh/components/ai/TienDoKichBan'
import { TienTrinh } from '@/dieu-hanh/components/ai/TienTrinh'

export const BONG_HOI =
  'max-w-[80%] rounded-[16px] rounded-br-[4px] bg-tint-brand px-4 py-2.5 text-[0.84rem] font-medium text-brand shadow-card'

const VAN = 'text-[0.86rem] leading-relaxed text-ink'

/** Một lượt đã lưu — đọc lại từ đoạn chat cũ. */
export function DongCu({ m }: { m: ChatMessage }) {
  if (m.author === 'user') {
    return (
      <div className="flex justify-end">
        <p className={BONG_HOI}>{m.text}</p>
      </div>
    )
  }
  const soDong = m.payload?.rowCount
  return (
    <div className="grid gap-1">
      <LoiVan text={m.text} className={VAN} />
      {soDong !== undefined && (
        <div className="flex items-center gap-2 pt-1 text-[0.72rem] text-faint">
          <span>{typeof soDong === 'number' ? soDong : JSON.stringify(soDong)} dòng</span>
          <span>· lượt đã lưu</span>
        </div>
      )}
    </div>
  )
}

/** Port `LuotChatLive` — một lượt đang chạy hoặc vừa xong trong phiên này. */
export function LuotChat({
  turn: t,
  hoiTiep,
  chiGiongNoi,
}: {
  turn: Turn
  hoiTiep: (q: string) => void
  chiGiongNoi: boolean
}) {
  const r = t.result
  // Ẩn chữ CÓ ĐIỀU KIỆN: máy chủ không ném khi tổng hợp một câu hỏng, nên chỉ ẩn
  // khi chắc cả bài đã ra loa — chặng đọc báo `warn` thì hiện chữ lại.
  const changDoc = t.steps.find((s) => s.step === 'đọc thành tiếng')
  const docHong = changDoc?.status === 'warn'
  const dangDoc = chiGiongNoi && t.running
  const anChu = chiGiongNoi && !docHong && (t.running || changDoc?.status === 'ok')

  return (
    <div className="grid gap-2">
      <div className="flex justify-end">
        <p className={BONG_HOI}>{t.question}</p>
      </div>

      <TienTrinh
        steps={t.steps}
        running={t.running}
        attempts={r?.attempts ?? 1}
        khongNguon={r?.unsourcedNumbers ?? []}
        nodes={r?.nodes}
        soLanGoiLlm={r?.soLanGoiLlm}
        model={r?.tenCongKhai}
      />

      {t.error && (
        <div className="rounded-card border border-canh-bao bg-canh-bao-bg p-3.5">
          <p className="text-[0.74rem] leading-relaxed text-canh-bao">{t.error.message}</p>
        </div>
      )}

      {/* Kịch bản đứng trước lời văn — nó là khung cảnh để đọc câu tiếp theo. */}
      {r?.kichBan && <TienDoKichBan kichBan={r.kichBan} />}

      {r?.quaTran && (
        <p className="flex items-start gap-1.5 rounded-md bg-warn-bg px-2.5 py-1.5 text-[0.72rem] text-warn-tx">
          <span aria-hidden="true">⏱</span>
          <span>
            Quá hạn thời gian nên <b>bỏ phần diễn giải</b> — kết quả vẫn đầy đủ và đã qua mọi phép kiểm.
          </span>
        </p>
      )}

      {anChu && (
        <p className="flex items-start gap-1.5 rounded-md bg-bg px-2.5 py-1.5 text-[0.72rem] text-body">
          <span aria-hidden="true">{dangDoc ? '🔊' : '🎧'}</span>
          <span>
            {dangDoc
              ? 'Đang tổng hợp giọng đọc…'
              : 'Bot này đặt kênh Giọng nói — câu trả lời phát bằng tiếng, không hiện chữ.'}
          </span>
        </p>
      )}

      {docHong && (
        <p className="flex items-start gap-1.5 rounded-md bg-warn-bg px-2.5 py-1.5 text-[0.72rem] text-warn-tx">
          <span aria-hidden="true">⚠</span>
          <span>Không tổng hợp được đủ giọng đọc, hiện chữ để bạn không mất câu trả lời.</span>
        </p>
      )}

      {anChu ? null : r?.answer ? (
        r.kind === 'clarify' ? (
          <div className="rounded-card border border-brand/30 bg-tint-brand p-3.5">
            <p className="mb-1 text-[0.74rem] font-medium text-brand">Cần làm rõ thêm</p>
            <LoiVan text={r.answer} className={VAN} />
          </div>
        ) : r.kind === 'unsupported' ? (
          <div className="rounded-card border border-line bg-bg p-3.5">
            <LoiVan text={r.answer} className="text-[0.86rem] leading-relaxed text-body" />
          </div>
        ) : (
          <LoiVan text={r.answer} className={VAN} />
        )
      ) : t.vanDang ? (
        <LoiVan text={t.vanDang} className={VAN} />
      ) : null}

      {/* Bảng chỉ khi câu hỏi ĐÒI liệt kê; chế độ chỉ-giọng-nói thì không hiện. */}
      {!anChu && r?.hoiDanhSach && r.rows?.length ? (
        <BangKetQua columns={r.columns ?? []} rows={r.rows} className="mt-3" />
      ) : null}

      {r?.warnings?.map((w, i) => (
        <p key={i} className="text-[0.72rem] text-warn-tx">
          ⚠ {w}
        </p>
      ))}

      {r?.followUps?.length ? <CauHoiTiep ds={r.followUps} nhan="Hỏi tiếp" chon={hoiTiep} /> : null}
    </div>
  )
}
