interface Props {
  hienQh: boolean
  datHienQh: (v: boolean) => void
  anhVeTinh: boolean
  datAnhVeTinh: (v: boolean) => void
  moQh: number
  datMoQh: (v: number) => void
  moThongTinQh: () => void
}

/** Port từ .layerbox — bảng bật/tắt lớp nổi trên bản đồ. */
export function HopLop({ hienQh, datHienQh, anhVeTinh, datAnhVeTinh, moQh, datMoQh, moThongTinQh }: Props) {
  return (
    <div className="absolute right-3 top-3 z-10 w-max rounded-[9px] border border-line bg-nen/95 px-[13px] py-2.5 text-[0.72rem] shadow-card backdrop-blur">
      <b className="mb-1.5 block text-[0.6rem] tracking-[0.12em] text-faint">LỚP BẢN ĐỒ</b>

      <label className="flex cursor-not-allowed items-center gap-[7px] py-[3px] text-chu-phu">
        <input type="checkbox" checked disabled />
        Địa chính (thửa đất)
      </label>

      <label className="flex cursor-pointer items-center gap-[7px] py-[3px] text-chu-phu">
        <input type="checkbox" checked={hienQh} onChange={(e) => datHienQh(e.target.checked)} />
        Quy hoạch SDĐ
      </label>

      <label className="flex cursor-pointer items-center gap-[7px] py-[3px] text-chu-phu">
        <input type="checkbox" checked={anhVeTinh} onChange={(e) => datAnhVeTinh(e.target.checked)} />
        Ảnh vệ tinh
      </label>

      <div className="mt-1.5">
        <label className="block text-[0.66rem] font-bold text-chu-phu" htmlFor="do-mo-qh">
          ĐỘ MỜ QUY HOẠCH: <span className="tnum">{moQh}%</span>
        </label>
        <input
          id="do-mo-qh"
          type="range"
          min={0}
          max={80}
          value={moQh}
          onChange={(e) => datMoQh(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        type="button"
        onClick={moThongTinQh}
        className="h-[26px] px-1 text-[0.68rem] font-semibold text-brand hover:underline"
      >
        ⓘ Thông tin quy hoạch
      </button>
    </div>
  )
}
