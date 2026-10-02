import { useState } from 'react'
import { Button, InputGroup, Label, ListBox, Select, TextField } from '@heroui/react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import {
  docBuoc,
  docTruong,
  type BuocHoiThoai,
  type KieuTruong,
  type Scenario,
} from '@/dieu-hanh/lib/api-tro-ly'
import { ModalKhung } from '@/dieu-hanh/components/overlay/ModalKhung'
import { useModalMo } from '@/dieu-hanh/hooks/use-modal-mo'

export const KICH_BAN_RONG: Scenario = {
  name: '',
  trigger: '',
  reply: '',
  requiredFields: [],
  steps: [],
  rules: [],
}

const KIEU: { ma: KieuTruong; nhan: string }[] = [
  { ma: 'van_ban', nhan: 'Văn bản' },
  { ma: 'so', nhan: 'Số' },
  { ma: 'dien_thoai', nhan: 'Số điện thoại' },
  { ma: 'email', nhan: 'Email' },
  { ma: 'ngay', nhan: 'Ngày' },
]

const NUT_NHO = 'grid place-items-center rounded-md p-1 text-faint hover:text-ink disabled:opacity-25'
const NUT_XOA =
  'flex-none rounded-lg p-1 text-faint transition-colors hover:bg-canh-bao-bg hover:text-canh-bao'

/** Đổi thứ tự bằng nút, không kéo thả: màn này soạn bằng bàn phím từ đầu tới cuối. */
function DoiCho({
  i,
  n,
  khoa,
  doi,
}: {
  i: number
  n: number
  khoa?: boolean
  doi: (a: number, b: number) => void
}) {
  if (n < 2) return null
  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={khoa || i === 0}
        aria-label={`Đưa bước ${i + 1} ↑`}
        className={NUT_NHO}
        onClick={() => doi(i - 1, i)}
      >
        <ChevronUp className="size-3" />
      </button>
      <button
        type="button"
        disabled={khoa || i === n - 1}
        aria-label={`Đưa bước ${i + 1} ↓`}
        className={NUT_NHO}
        onClick={() => doi(i, i + 1)}
      >
        <ChevronDown className="size-3" />
      </button>
    </div>
  )
}

const hoanVi = <T,>(ds: T[], i: number, j: number) => {
  const d = [...ds]
  const a = d[i]
  const b = d[j]
  if (a === undefined || b === undefined) return ds
  d[i] = b
  d[j] = a
  return d
}

/** Bỏ dấu, bỏ dấu câu, gộp khoảng trắng — để so hai chuỗi người gõ. */
const chuanHoa = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Gộp bản khai CŨ (hai danh sách) thành một danh sách bước. Trường bắt buộc
 * gán vào bước NÓI VỀ NÓ, khớp theo từ trọn vẹn; không khớp thì thành bước mới
 * ở cuối — thấy được và sửa được, thay vì biến mất.
 */
export function gopBanKhaiCu(k: Scenario): BuocHoiThoai[] {
  const buoc = (k.steps ?? []).map(docBuoc)
  if (buoc.some((b) => b.thuThap)) return buoc
  const con: BuocHoiThoai[] = []
  for (const truong of (k.requiredFields ?? []).map(docTruong)) {
    const khoa = chuanHoa(truong.ten)
    const i = buoc.findIndex(
      (b) => !b.thuThap && khoa.length >= 3 && ` ${chuanHoa(b.ten)} `.includes(` ${khoa} `),
    )
    const cu = buoc[i]
    if (cu) buoc[i] = { ...cu, thuThap: true, kieu: truong.kieu }
    else con.push({ ten: truong.ten, thuThap: true, kieu: truong.kieu })
  }
  return [...buoc, ...con]
}

export const soThuThap = (k: Scenario) => gopBanKhaiCu(k).filter((b) => b.thuThap).length

/** Port KichBanDialog — soạn một kịch bản: các bước có thứ tự và quy tắc không đánh số. */
export function KichBanDialog({
  banDau,
  dong,
  luu,
  khoa,
}: {
  /** `null` = thêm mới. */
  banDau: Scenario | null
  dong: () => void
  luu: (k: Scenario) => void
  khoa?: boolean
}) {
  const state = useModalMo(dong)
  // Gộp NGAY LÚC MỞ: người soạn thấy một danh sách, kể cả với bản khai cũ.
  const [f, setF] = useState<Scenario>(() =>
    banDau ? { ...banDau, steps: gopBanKhaiCu(banDau) } : KICH_BAN_RONG,
  )
  const soCu = banDau?.requiredFields?.length ?? 0
  const buoc = f.steps.map(docBuoc)
  const suaBuoc = (i: number, phan: Partial<BuocHoiThoai>) =>
    setF((p) => ({ ...p, steps: buoc.map((x, j) => (j === i ? { ...x, ...phan } : x)) }))

  const nop = () =>
    luu({
      ...f,
      name: f.name.trim(),
      trigger: f.trigger.trim(),
      // Mọi lời khai đã nằm trong `steps`; giữ cả hai thì một ô bị hỏi hai lần.
      requiredFields: [],
      steps: buoc
        .map((x) => ({ ...x, ten: x.ten.trim() }))
        .filter((x) => x.ten)
        .map((x) => (x.thuThap ? x : { ...x, kieu: 'van_ban' })),
      rules: f.rules.map((x) => x.trim()).filter(Boolean),
    })

  return (
    <ModalKhung
      state={state}
      tieuDe={banDau ? 'Sửa kịch bản' : 'Thêm kịch bản mới'}
      nhanDong="Đóng hộp kịch bản"
      chanTrang={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onPress={dong}>
            Huỷ
          </Button>
          <Button variant="primary" isDisabled={khoa || !f.name.trim()} onPress={nop}>
            Lưu kịch bản
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <TextField value={f.name} onChange={(v) => setF((p) => ({ ...p, name: v }))} isDisabled={khoa}>
          <Label>Tên kịch bản</Label>
          <InputGroup>
            <InputGroup.Input placeholder="VD: Mở thẻ tín dụng" />
          </InputGroup>
        </TextField>

        <TextField value={f.trigger} onChange={(v) => setF((p) => ({ ...p, trigger: v }))} isDisabled={khoa}>
          <Label>Mô tả ngắn</Label>
          <span className="text-[0.72rem] text-faint">
            Khi nào kịch bản này được dùng — mô tả bằng lời, không phải biểu thức.
          </span>
          <InputGroup>
            <InputGroup.Input placeholder="VD: Khách hàng muốn mở thẻ tín dụng" />
          </InputGroup>
        </TextField>

        {soCu > 0 && (
          <p className="rounded-[9px] bg-bg px-3 py-2 text-[0.72rem] leading-relaxed text-body">
            {soCu} thông tin bắt buộc khai theo lối cũ đã được gộp vào danh sách bước bên dưới. Lưu lại một
            lần là bản khai theo lối mới.
          </p>
        )}

        <div>
          <p className="text-[0.74rem] font-medium text-ink">Các bước hội thoại</p>
          <p className="mb-1.5 text-[0.72rem] leading-normal text-faint">
            Theo THỨ TỰ — “hỏi thu nhập” trước “đề xuất hạn mức” là một quy trình khác hẳn chiều ngược lại.
            Bước nào cần lấy thông tin của khách thì tích “Thu thập”: bot sẽ hỏi đúng thứ tự này và không kết
            thúc khi còn thiếu.
          </p>
          <div className="grid gap-1.5">
            {buoc.map((x, i) => (
              <div key={i} className="rounded-[9px] border border-line p-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="grid size-5 flex-none place-items-center rounded-full bg-bg text-[0.68rem] text-body">
                    {i + 1}
                  </span>
                  <TextField
                    aria-label={`Các bước hội thoại ${i + 1}`}
                    value={x.ten}
                    onChange={(v) => suaBuoc(i, { ten: v })}
                    isDisabled={khoa}
                    className="flex-1"
                  >
                    <InputGroup>
                      <InputGroup.Input placeholder="VD: Hỏi số điện thoại" />
                    </InputGroup>
                  </TextField>
                  <DoiCho
                    i={i}
                    n={buoc.length}
                    khoa={khoa}
                    doi={(a, b) => setF((p) => ({ ...p, steps: hoanVi(buoc, a, b) }))}
                  />
                  <button
                    type="button"
                    disabled={khoa}
                    aria-label={`Xoá các bước hội thoại ${i + 1}`}
                    className={NUT_XOA}
                    onClick={() => setF((p) => ({ ...p, steps: buoc.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 pl-6">
                  <label className="flex items-center gap-1.5 text-[0.72rem] text-body">
                    <input
                      type="checkbox"
                      disabled={khoa}
                      checked={x.thuThap}
                      aria-label={`Thu thập ở bước ${i + 1}`}
                      onChange={(e) => suaBuoc(i, { thuThap: e.target.checked })}
                      className="accent-brand"
                    />
                    <span className="font-medium text-ink">Thu thập</span>
                    <span className="text-faint">— Bước này phải lấy được giá trị từ khách</span>
                  </label>
                  {/* Kiểu chỉ có nghĩa cho bước thu thập — hiện ở mọi dòng là mời chọn thứ không dùng. */}
                  {x.thuThap && (
                    <Select
                      aria-label={`Kiểu của ${x.ten || i + 1}`}
                      selectedKey={x.kieu}
                      onSelectionChange={(k) => suaBuoc(i, { kieu: k as KieuTruong })}
                      isDisabled={khoa}
                      className="ml-auto w-[160px]"
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {KIEU.map((k) => (
                            <ListBox.Item key={k.ma} id={k.ma}>
                              {k.nhan}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            isDisabled={khoa}
            className="mt-1"
            onPress={() =>
              setF((p) => ({ ...p, steps: [...buoc, { ten: '', thuThap: false, kieu: 'van_ban' }] }))
            }
          >
            <Plus className="size-3.5" /> Thêm các bước hội thoại
          </Button>
        </div>

        <div>
          <p className="text-[0.74rem] font-medium text-ink">Quy tắc cần lưu ý</p>
          <p className="mb-1.5 text-[0.72rem] leading-normal text-faint">
            Điều cấm và ràng buộc — đúng ở MỌI bước, nên không đánh số.
          </p>
          <div className="grid gap-1.5">
            {f.rules.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TextField
                  aria-label={`Quy tắc cần lưu ý ${i + 1}`}
                  value={r}
                  onChange={(v) => setF((p) => ({ ...p, rules: p.rules.map((y, j) => (j === i ? v : y)) }))}
                  isDisabled={khoa}
                  className="flex-1"
                >
                  <InputGroup>
                    <InputGroup.Input placeholder="VD: Không được bỏ qua bước" />
                  </InputGroup>
                </TextField>
                <button
                  type="button"
                  disabled={khoa}
                  aria-label={`Xoá quy tắc cần lưu ý ${i + 1}`}
                  className={NUT_XOA}
                  onClick={() => setF((p) => ({ ...p, rules: p.rules.filter((_, j) => j !== i) }))}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            isDisabled={khoa}
            className="mt-1"
            onPress={() => setF((p) => ({ ...p, rules: [...p.rules, ''] }))}
          >
            <Plus className="size-3.5" /> Thêm quy tắc cần lưu ý
          </Button>
        </div>
      </div>
    </ModalKhung>
  )
}
