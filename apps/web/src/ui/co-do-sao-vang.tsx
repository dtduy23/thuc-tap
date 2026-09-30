/** Năm cánh sao: đỉnh ngoài bán kính R, đỉnh trong r = R·0,382 — sao năm cánh đều. */
function diemSao(cx: number, cy: number, R: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const bk = i % 2 === 0 ? R : R * 0.382
    const goc = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(cx + bk * Math.cos(goc)).toFixed(2)},${(cy + bk * Math.sin(goc)).toFixed(2)}`
  }).join(' ')
}

const SAO = diemSao(15, 10, 6)

/** Quốc kỳ: nền đỏ, sao vàng năm cánh ở giữa, tỉ lệ 3:2 (Hiến pháp 2013, Điều 13). */
export function CoDoSaoVang({ rong = 30, className = '' }: { rong?: number; className?: string }) {
  return (
    <svg
      width={rong}
      height={(rong * 2) / 3}
      viewBox="0 0 30 20"
      role="img"
      aria-label="Cờ đỏ sao vàng"
      className={`flex-none rounded-[2px] shadow-[0_2px_8px_rgba(0,0,0,.28)] ${className}`}
    >
      <rect width="30" height="20" fill="#da251d" />
      <polygon points={SAO} fill="#ffff00" />
    </svg>
  )
}
