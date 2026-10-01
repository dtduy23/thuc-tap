/**
 * Port từ drawQr() — mã QR giả lập 13×13 ô, sinh từ hạt nên cùng vùng trồng
 * luôn ra cùng hình. Không phải QR đọc được, bản gốc cũng vậy.
 */
export function MaQr({ hat, nhanDong }: { hat: number; nhanDong: string }) {
  let s = hat
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  const o: boolean[] = []
  for (let i = 0; i < 169; i++) {
    const r = Math.floor(i / 13)
    const c = i % 13
    // Ba ô vuông định vị ở 3 góc — vẽ theo quy luật cố định, không ngẫu nhiên
    const coDinh = (r < 4 && c < 4) || (r < 4 && c > 8) || (r > 8 && c < 4)
    if (coDinh) {
      const rr = r > 8 ? r - 9 : r
      const cc = c > 8 ? c - 9 : c
      o.push(rr === 0 || rr === 3 || cc === 0 || cc === 3 || (rr >= 1 && rr <= 2 && cc >= 1 && cc <= 2))
    } else {
      o.push(rnd() < 0.45)
    }
  }

  return (
    <div
      className="mx-auto grid aspect-square w-[150px] gap-px rounded-[10px] border border-line bg-white p-2"
      style={{ gridTemplateColumns: 'repeat(13,1fr)' }}
      role="img"
      aria-label={nhanDong}
    >
      {o.map((on, i) => (
        <i key={i} className={on ? 'bg-qr-o' : 'bg-transparent'} />
      ))}
    </div>
  )
}
