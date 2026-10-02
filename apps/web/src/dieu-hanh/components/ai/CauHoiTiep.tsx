/** Nút câu hỏi gợi ý — bấm là hỏi nguyên văn; gõ lại thì người ta đổi đúng từ làm câu trả lời được. */
export const NUT_CAU =
  'rounded-full border border-line px-3 py-1 text-left text-[0.74rem] text-body transition-colors hover:border-brand hover:bg-tint-brand hover:text-brand'

export function CauHoiTiep({ ds, nhan, chon }: { ds: string[]; nhan: string; chon: (q: string) => void }) {
  return (
    <div className="pt-1">
      <p className="mb-1.5 text-[0.72rem] text-faint">{nhan}</p>
      <div className="flex flex-wrap gap-1.5">
        {ds.map((q, i) => (
          <button key={i} type="button" onClick={() => chon(q)} className={NUT_CAU}>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
