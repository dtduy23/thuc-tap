import type { PhanAnh } from '@/dieu-hanh/mocks/types'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import { anhMinhHoa } from '@/dieu-hanh/lib/anh'
import { goiYPhanCong, hatAnh } from '../du-lieu'

interface Props {
  p: PhanAnh
  xemAnh: (k: number) => void
}

/** Cột trái modal: lời phản ánh, 3 ảnh hiện trường, nhận định AI. */
export function CotNoiDung({ p, xemAnh }: Props) {
  const anhNho = [0, 1, 2].map((k) => anhMinhHoa(p.kw || 'street', hatAnh(p.id, k)))

  return (
    <div>
      <div className="rounded-[10px] bg-row-hover px-[15px] py-[13px] text-[0.8rem] leading-[1.6]">
        "{p.nd}"
      </div>

      <div className="mb-1.5 mt-2.5 text-[0.68rem] text-faint">ẢNH HIỆN TRƯỜNG CÔNG DÂN GỬI (3)</div>
      <div className="grid grid-cols-3 gap-2">
        {anhNho.map((src, k) => (
          <button
            key={src}
            type="button"
            onClick={() => xemAnh(k)}
            aria-label={`Xem ảnh hiện trường ${k + 1}`}
            className="aspect-[4/3] overflow-hidden rounded-[7px] bg-cover bg-center transition-transform hover:scale-[1.03]"
            style={{ backgroundImage: `url('${src}'), linear-gradient(160deg,#C9BFAE,#AFA492)` }}
          />
        ))}
      </div>

      <div className="mt-3">
        <AiBox>
          <b>✦ AI phân loại:</b> {p.linhvuc} · mức ưu tiên {p.st[1] === 'red' ? 'CAO' : 'trung bình'} — gợi ý
          giao {goiYPhanCong(p.linhvuc)}.
        </AiBox>
      </div>
    </div>
  )
}
