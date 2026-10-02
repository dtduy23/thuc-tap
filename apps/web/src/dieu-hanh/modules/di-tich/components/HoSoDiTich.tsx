import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { MaQr } from '@/dieu-hanh/components/ui/MaQr'
import { anhMinhHoa, NEN_THUMB } from '@/dieu-hanh/lib/anh'
import { toast } from '@/dieu-hanh/store/toast'
import type { DiTich } from '@/dieu-hanh/mocks/types'

interface Props {
  diTich: DiTich
  /** Chỉ số trong D.dt — bản gốc suy hạt ảnh từ p.seed. */
  moAnh: (anh: string[], viTri: number) => void
  moTour: () => void
  moVideo: () => void
}

function Kv({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line-2 py-[9px] text-[0.78rem] last:border-0">
      <span className="flex-none text-chu-phu">{nhan}</span>
      <b className="text-right text-ink">{giaTri}</b>
    </div>
  )
}

/** Port từ selDt() — panel hồ sơ di tích bên phải. */
export function HoSoDiTich({ diTich: p, moAnh, moTour, moVideo }: Props) {
  const anhBia = p.imgs?.[0] ?? anhMinhHoa(p.kw || 'temple', p.seed, 700, 300)
  // Bản gốc: 4 ảnh tư liệu, hạt = seed * 10 + k
  const anhTuLieu = [0, 1, 2, 3].map((k) => anhMinhHoa(p.kw || 'pagoda', p.seed * 10 + k))
  const anhPhongTo = p.imgs?.length
    ? [...p.imgs]
    : [0, 1, 2, 3].map((k) => anhMinhHoa(p.kw || 'pagoda', p.seed * 10 + k, 1100, 800))

  return (
    <SectionCard tieuDe={`Hồ sơ · ${p.ten}`} phu={<StatusChip trangThai={p.xh} />}>
      <button
        type="button"
        onClick={() => moAnh(anhPhongTo, 0)}
        className="mb-3 block w-full overflow-hidden rounded-[10px]"
        aria-label={`Phóng to ảnh ${p.ten}`}
      >
        <div
          className="relative bg-cover bg-center"
          style={{ aspectRatio: '16/7', backgroundImage: `url('${anhBia}'), ${NEN_THUMB}` }}
        >
          {!p.imgs?.length && (
            <span className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[0.66rem] text-white">
              Ảnh minh họa · chưa có ảnh tư liệu
            </span>
          )}
        </div>
      </button>

      <Kv nhan="Phân loại" giaTri={p.pl} />
      <Kv nhan="Xếp hạng" giaTri={p.qd} />
      <Kv nhan="Bảo tồn" giaTri={p.bts} />
      <Kv nhan="Tư liệu số" giaTri={p.tl} />
      <Kv nhan="Sự kiện gắn liền" giaTri={p.sk} />
      <Kv nhan="Lượt quét QR" giaTri={p.quet} />

      <div className="mt-3.5 grid items-start gap-3.5 sm:grid-cols-[150px_1fr]">
        <div>
          <div className="w-[140px]">
            <MaQr hat={p.seed} nhanDong={`Mã QR thuyết minh ${p.ten}`} />
          </div>
          <div className="mt-1.5 text-center text-[0.66rem] text-faint">QR thuyết minh Việt/Anh</div>
        </div>

        <div className="grid gap-2">
          {p.tour ? (
            <NutChinh onPress={moTour} className="justify-center">
              ▶ Mở tour ảo 360°
            </NutChinh>
          ) : (
            <NutPhu
              onPress={() => toast('Di tích chưa scan 360° — đề xuất đưa vào kế hoạch số hóa đợt 2/2026')}
              className="justify-center"
            >
              Đăng ký scan 360°
            </NutPhu>
          )}

          {p.yt && (
            <NutPhu onPress={moVideo} className="justify-center">
              ▶ Video giới thiệu di tích
            </NutPhu>
          )}

          <a
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.ten)}`}
            target="_blank"
            rel="noopener"
            className="rounded-3xl border border-line px-4 py-2 text-center text-[0.78rem] font-semibold text-ink no-underline hover:bg-row-hover"
          >
            🔍 Ảnh Google về di tích
          </a>

          <NutPhu onPress={() => toast('Đã tải bộ mã QR để in bảng gắn tại điểm')} className="justify-center">
            Tải QR in bảng
          </NutPhu>
          <NutPhu
            onPress={() => toast('Học liệu số + bộ câu hỏi về nguồn đã gửi 14 trường')}
            className="justify-center"
          >
            Gửi học liệu cho trường
          </NutPhu>
        </div>
      </div>

      <div className="mb-1.5 mt-3.5 text-[0.68rem] text-faint">
        ẢNH TƯ LIỆU · bấm để phóng to · ảnh minh họa — thay ảnh chính thức của địa phương khi triển khai
      </div>
      <div className="grid grid-cols-4 gap-2">
        {anhTuLieu.map((a, k) => (
          <button
            key={k}
            type="button"
            onClick={() => moAnh(anhPhongTo, k % anhPhongTo.length)}
            className="overflow-hidden rounded-lg"
            aria-label={`Phóng to ảnh tư liệu ${k + 1} của ${p.ten}`}
          >
            <div
              className="aspect-[4/3] bg-cover bg-center"
              style={{ backgroundImage: `url('${a}'), ${NEN_THUMB}` }}
            />
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
