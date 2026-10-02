/** Port từ legChips() — chú giải nhỏ nằm bên phải tiêu đề card. */
export function LegendChips({ items }: { items: ReadonlyArray<{ name: string; c: string }> }) {
  return (
    <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      {items.map((x) => (
        <span key={x.name} className="inline-flex items-center gap-1.5 text-[0.72rem]">
          <i className="size-[9px] rounded-full" style={{ background: x.c }} />
          {x.name}
        </span>
      ))}
    </span>
  )
}
