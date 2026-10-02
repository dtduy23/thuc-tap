import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'

export interface MucTab {
  /** Nhãn hiển thị — copy nguyên văn từ bản gốc. */
  nhan: ReactNode
  /** Nội dung pane tương ứng. */
  noiDung: ReactNode
}

interface Props {
  muc: MucTab[]
  /** Chỉ số tab đang mở — do module giữ để code ngoài đổi tab được (bản gốc làm vậy ở đất đai, khu phố). */
  dangMo: number
  doiTab: (i: number) => void
  /** Nhãn cho screen reader, tiếng Việt. */
  nhanDong: string
}

/**
 * Port từ .tabs/.tab/.tabpane của bản gốc. Chỉ báo trượt bằng layoutId —
 * đây là phản hồi trực tiếp cho hành động bấm, đúng §6.
 */
export function Tabs({ muc, dangMo, doiTab, nhanDong }: Props) {
  const id = useId()

  return (
    <>
      {/* Lớp cuộn ngang riêng cho thanh tab: nhiều tab trên màn 390px thì cuộn
          thanh tab, không cắt mất tab cuối và không kéo cả trang cuộn ngang. */}
      <div className="max-w-full overflow-x-auto">
        <div
          role="tablist"
          aria-label={nhanDong}
          className="mb-4 flex w-max gap-1.5 rounded-[10px] bg-nen-tab p-1"
        >
          {muc.map((m, i) => {
            const mo = i === dangMo
            return (
              <button
                key={i}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={mo}
                aria-controls={`${id}-pane-${i}`}
                onClick={() => doiTab(i)}
                className={`relative rounded-lg px-4 py-[7px] text-[0.78rem] font-semibold transition-colors ${
                  mo ? 'text-brand' : 'text-chu-phu hover:text-ink'
                }`}
              >
                {mo && (
                  <motion.span
                    layoutId={`${id}-chi-bao`}
                    className="absolute inset-0 rounded-lg bg-nen shadow-tab"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{m.nhan}</span>
              </button>
            )
          })}
        </div>
      </div>

      {muc.map((m, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-pane-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== dangMo}
        >
          {i === dangMo && m.noiDung}
        </div>
      ))}
    </>
  )
}
