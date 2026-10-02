/**
 * Lời văn của trợ lí — port `LoiVan` của FOXAINATIVE.
 *
 * Không dùng thư viện markdown: lời nhắc chỉ cho phép đoạn và in đậm, kéo cả bộ
 * dựng markdown vào là nhận một bề mặt chèn HTML không bao giờ cần. Ở đây chỉ
 * tách chuỗi rồi trả nút React — không có đường nào cho thẻ.
 */

/** Phải TRÙNG KHỚP `render_nhan` phía máy chủ, nếu không chữ nhảy hình lúc `done` về. */
const NHAN: Record<string, string> = {
  dudoan: '🔮 Dự đoán',
  nhandinh: '💭 Nhận định',
}

/** Phải trùng `prose.NGUON_HIEN` và `render_nguon` phía máy chủ. */
const NGUON: Record<string, string> = {
  so_lieu: 'Theo số liệu',
  tai_lieu: 'Theo tài liệu',
  web: 'Theo trang web của tổ chức',
}

const KE_NGANG = /^\s*([-*_])\1{2,}\s*$/
const HANG_BANG = /^\s*\|.*\|\s*$/
const NGAN_BANG = /^\s*\|?[\s:|-]+\|[\s:|-]*$/
/** Đòi khoảng trắng sau đúng một dấu — `**Hải Phòng:**` không khớp. */
const GACH_DAU_DONG = /^[ \t]*[-*+][ \t]+/
const TIEU_DE = /^\s{0,3}#{1,6}\s+/
/** CHỈ http/https — bắt `javascript:` là dựng đường chèn mã giữa thứ duy nhất đến từ mô hình. */
const LIEN_KET = /(https?:\/\/[^\s<>()[\]{}"'`]+)/g
const DUOI_CAU = /[.,;:!?…"'»]+$/

/**
 * `{{nhandinh: X}}` → `💭 Nhận định — X`. Máy chủ chỉ dựng nhãn lúc chốt `done`,
 * còn chữ chảy trước đó là văn thô. Bất biến với số lần áp.
 */
function dungNhan(s: string): string {
  return s
    .replace(
      /\{\{\s*(dudoan|nhandinh)\s*:\s*([\s\S]*?)\}\}/gi,
      (_m, loai: string, noi: string) => `\n\n${NHAN[loai.toLowerCase()]} — ${noi.trim()}`,
    )
    .replace(
      /\{\{\s*(dudoan|nhandinh)\s*:\s*([\s\S]*)$/i,
      (_m, loai: string, noi: string) => `\n\n${NHAN[loai.toLowerCase()]} — ${noi.trimStart()}`,
    )
    .replace(/\{\{[^{}]*$/, '')
}

/** `{{nguon: tai_lieu}}` → dòng in đậm khi có từ hai nhãn; dưới hai nhãn thì bỏ. */
function dungNguon(s: string): string {
  const mau = /\{\{\s*nguon\s*:\s*(so_lieu|tai_lieu|web)\s*\}\}/gi
  const dem = (s.match(mau) || []).length
  if (dem < 2) return s.replace(mau, '')
  return s.replace(mau, (_m, loai: string) => `\n\n**${NGUON[loai.toLowerCase()]}**\n\n`)
}

export function LoiVan({ text, className = '' }: { text: string; className?: string }) {
  const doan = dungNguon(dungNhan(text || ''))
    .split(/\n\s*\n/)
    .filter((d) => d.trim())
  if (!doan.length) return null
  return (
    <div className={className}>
      {doan.map((d, i) => (
        <Doan key={i} chu={d} dau={i === 0} />
      ))}
    </div>
  )
}

/** Một đoạn — hoặc một bảng, nếu mô hình lỡ sinh bảng markdown dù lời nhắc đã cấm. */
function Doan({ chu, dau }: { chu: string; dau: boolean }) {
  const dong = chu
    .split('\n')
    .map((d) => d.replace(TIEU_DE, ''))
    .filter((d) => d.trim() && !KE_NGANG.test(d))
  if (!dong.length) return null

  const hang = dong.filter((d) => HANG_BANG.test(d) && !NGAN_BANG.test(d))
  if (hang.length >= 2 && hang.length >= dong.length - 1) {
    const o = hang.map((d) =>
      d
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((x) => x.trim()),
    )
    const [dauBang, ...than] = o
    return (
      <div className={`overflow-x-auto ${dau ? '' : 'mt-2.5'}`}>
        <table className="tnum w-full text-[0.74rem]">
          <thead>
            <tr>
              {(dauBang ?? []).map((c, i) => (
                <th key={i} className="border-b border-line px-2 py-1 text-left font-semibold">
                  {dam(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {than.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="border-b border-line px-2 py-1 align-top">
                    {dam(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Liệt kê: gom theo cụm liền nhau — câu dẫn trước danh sách không thành một mục.
  if (dong.some((d) => GACH_DAU_DONG.test(d))) {
    const khoi: { gach: boolean; dong: string[] }[] = []
    for (const d of dong) {
      const gach = GACH_DAU_DONG.test(d)
      const cuoi = khoi[khoi.length - 1]
      if (cuoi && cuoi.gach === gach) cuoi.dong.push(d)
      else khoi.push({ gach, dong: [d] })
    }
    return (
      <div className={dau ? '' : 'mt-2.5'}>
        {khoi.map((k, i) =>
          k.gach ? (
            <ul key={i} className="my-1 grid list-disc gap-0.5 pl-5">
              {k.dong.map((d, j) => (
                <li key={j}>{dam(d.replace(GACH_DAU_DONG, ''))}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className={i ? 'mt-2.5' : ''}>
              {k.dong.map((d, j) => (
                <span key={j}>
                  {j ? <br /> : null}
                  {dam(d)}
                </span>
              ))}
            </p>
          ),
        )}
      </div>
    )
  }

  return (
    <p className={dau ? '' : 'mt-2.5'}>
      {dong.map((d, i) => (
        <span key={i}>
          {i ? <br /> : null}
          {dam(d)}
        </span>
      ))}
    </p>
  )
}

/** `**` phải xử TRƯỚC `*`, nếu không chữ đậm thành chữ nghiêng kèm một dấu sao lạc. */
function dam(s: string) {
  return s.split(/\*\*(.+?)\*\*/g).map((phan, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold">
        {phan}
      </strong>
    ) : (
      nghieng(phan, i)
    ),
  )
}

function nghieng(s: string, khoa: number) {
  const manh = s.split(/\*(.+?)\*/g)
  if (manh.length === 1) return lienKet(s, khoa)
  return (
    <span key={khoa}>
      {manh.map((phan, i) => (i % 2 ? <em key={i}>{lienKet(phan, i)}</em> : lienKet(phan, i)))}
    </span>
  )
}

function lienKet(s: string, khoa: number) {
  const manh = s.split(LIEN_KET)
  if (manh.length === 1) return s
  return (
    <span key={khoa}>
      {manh.map((phan, i) => {
        if (i % 2 === 0) return phan
        const duoi = phan.match(DUOI_CAU)?.[0] ?? ''
        const dia = duoi ? phan.slice(0, -duoi.length) : phan
        return (
          <span key={i}>
            {/* `noopener`: trang mở ra giữ được `window.opener` là đổi được địa chỉ tab này. */}
            <a
              href={dia}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2"
            >
              {dia}
            </a>
            {duoi}
          </span>
        )
      })}
    </span>
  )
}
