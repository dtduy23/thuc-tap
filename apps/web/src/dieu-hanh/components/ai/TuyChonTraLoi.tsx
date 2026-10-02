import type { ReactNode } from 'react'

export const CAP_VAN = ['gon', 'phan_tich', 'khuyen_nghi'] as const
export const DO_DAI = ['ngan', 'vua', 'chi_tiet', 'day_du'] as const
export const CHON_BIEU_DO = ['tu_dong', 'co', 'khong'] as const

const NHAN_CAP: Record<(typeof CAP_VAN)[number], [string, string]> = {
  gon: ['Gọn', 'Chỉ kết luận và con số cốt lõi'],
  phan_tich: ['Phân tích', 'Thêm khoảng, tỉ trọng, điểm bất thường'],
  khuyen_nghi: ['Khuyến nghị', 'Thêm phạm vi và bước tiếp theo'],
}

const NHAN_DO_DAI: Record<(typeof DO_DAI)[number], [string, string]> = {
  ngan: ['Ngắn', 'Một đoạn — kết luận và con số, không hơn.'],
  vua: ['Vừa', 'Ba đoạn ngắn. Đủ cho khoảng, tỉ trọng và một điểm đáng chú ý.'],
  chi_tiet: ['Chi tiết', 'Bốn đoạn, câu dài hơn. Có chỗ cho phân bố và so sánh.'],
  day_du: ['Đầy đủ', 'Sáu đoạn. Chậm hơn 1–2 giây vì phải viết nhiều hơn.'],
}

const NHAN_BIEU_DO: Record<(typeof CHON_BIEU_DO)[number], [string, string]> = {
  tu_dong: ['Tự động', 'Vẽ khi câu hỏi có xin — "vẽ biểu đồ", "đồ thị"…'],
  co: ['Luôn vẽ', 'Vẽ mọi lượt, nếu dữ liệu hợp một dạng nào đó'],
  khong: ['Không vẽ', 'Chỉ bảng và lời văn, kể cả khi câu hỏi xin vẽ'],
}

function Nhom({ ten, ghi, children }: { ten: string; ghi?: string; children: ReactNode }) {
  return (
    <div className="px-1 py-2">
      <p className="px-2.5 text-[0.68rem] font-semibold uppercase tracking-wide text-body">{ten}</p>
      {ghi && <p className="px-2.5 pt-0.5 text-[0.72rem] leading-snug text-faint">{ghi}</p>}
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Muc({ nhan, mo, chon, bam }: { nhan: string; mo: string; chon: boolean; bam: () => void }) {
  return (
    <button
      type="button"
      onClick={bam}
      aria-pressed={chon}
      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${chon ? 'bg-tint-brand' : 'hover:bg-nav-hover'}`}
    >
      <span className={`mt-[5px] size-1.5 flex-none rounded-full ${chon ? 'bg-brand' : 'bg-faint'}`} />
      <span className="min-w-0">
        <span className={`block text-[0.74rem] ${chon ? 'font-medium text-brand' : 'text-ink'}`}>{nhan}</span>
        <span className="block text-[0.72rem] leading-snug text-chu-phu">{mo}</span>
      </span>
    </button>
  )
}

/**
 * Ba công tắc TRÌNH BÀY trong nút `+` — đổi cách viết một câu trả lời đã có.
 * Dạng danh sách có dòng mô tả: "Khuyến nghị" hay "Luôn vẽ" không tự giải thích.
 * Độ dài là trục riêng với tầng: "phân tích nhưng ngắn" phải diễn đạt được.
 */
export function TuyChonTraLoi({
  mucVan,
  doDai,
  bieuDo,
  doiMucVan,
  doiDoDai,
  doiBieuDo,
}: {
  mucVan: string
  doDai: string
  bieuDo: string
  doiMucVan: (v: string) => void
  doiDoDai: (v: string) => void
  doiBieuDo: (v: string) => void
}) {
  const nacDoDai = (DO_DAI as readonly string[]).includes(doDai) ? (doDai as (typeof DO_DAI)[number]) : 'vua'
  return (
    <div className="grid w-full divide-y divide-line-2">
      <Nhom ten="Tầng trả lời" ghi="Bảng luôn có. Đây là phần lời văn quanh nó.">
        {CAP_VAN.map((ma) => (
          <Muc
            key={ma}
            nhan={NHAN_CAP[ma][0]}
            mo={NHAN_CAP[ma][1]}
            chon={mucVan === ma}
            bam={() => doiMucVan(ma)}
          />
        ))}
      </Nhom>
      <Nhom
        ten="Độ dài câu trả lời"
        ghi="Bao nhiêu chữ. Khác với tầng ở trên — tầng quyết định viết về cái gì."
      >
        {/* Nấc chứ không kéo trơn: đoạn và câu không có giá trị lẻ. */}
        <div className="px-2.5 pb-1 pt-2">
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Độ dài câu trả lời">
            {DO_DAI.map((ma) => (
              <button
                key={ma}
                type="button"
                role="radio"
                aria-checked={nacDoDai === ma}
                onClick={() => doiDoDai(ma)}
                className={`rounded-md border px-1 py-1 text-[0.7rem] transition-colors ${
                  nacDoDai === ma
                    ? 'border-brand bg-tint-brand font-medium text-brand'
                    : 'border-line text-body hover:bg-nav-hover'
                }`}
              >
                {NHAN_DO_DAI[ma][0]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[0.72rem] leading-snug text-chu-phu">{NHAN_DO_DAI[nacDoDai][1]}</p>
        </div>
      </Nhom>
      <Nhom ten="Biểu đồ">
        {CHON_BIEU_DO.map((ma) => (
          <Muc
            key={ma}
            nhan={NHAN_BIEU_DO[ma][0]}
            mo={NHAN_BIEU_DO[ma][1]}
            chon={bieuDo === ma}
            bam={() => doiBieuDo(ma)}
          />
        ))}
      </Nhom>
    </div>
  )
}
