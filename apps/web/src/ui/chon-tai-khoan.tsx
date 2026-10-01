import type { TaiKhoanDanhBa } from '@gdos/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { timDanhBa } from '@/lib/du-an'
import { Nut } from './co-ban'

/** Chọn một tài khoản từ danh bạ (gõ ≥ 2 ký tự để tìm). */
export function ChonTaiKhoan({
  nhan,
  gt,
  doi,
  khoa,
}: {
  nhan: string
  gt: { id: string; hoTen: string } | null
  doi: (x: { id: string; hoTen: string } | null) => void
  khoa: boolean
}) {
  const [tim, datTim] = useState('')
  const { data: ds = [] } = useQuery({
    queryKey: ['danh-ba', tim],
    queryFn: () => timDanhBa(tim),
    enabled: tim.trim().length >= 2,
  })
  return (
    <div className="mb-3.5">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-body">{nhan}</span>
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-[13.5px]">{gt?.hoTen ?? '— chưa có —'}</b>
        {!khoa && gt && (
          <Nut onClick={() => doi(null)} className="!py-0.5">
            Bỏ
          </Nut>
        )}
      </div>
      {!khoa && (
        <>
          <input
            type="search"
            aria-label={`Tìm ${nhan.toLowerCase()}`}
            placeholder="Gõ tên để tìm…"
            value={tim}
            onChange={(e) => datTim(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-nen-2 px-3 py-1.5 text-[13px]"
          />
          {tim.trim().length >= 2 && (
            <ul className="m-0 mt-1 max-h-48 list-none overflow-y-auto rounded-lg border border-line p-1">
              {ds.map((t: TaiKhoanDanhBa) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      doi({ id: t.id, hoTen: t.hoTen })
                      datTim('')
                    }}
                    className="w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-nav-hover"
                  >
                    {t.hoTen} <span className="text-faint">· {t.donViTen}</span>
                  </button>
                </li>
              ))}
              {ds.length === 0 && <li className="px-2 py-1.5 text-[12.5px] text-faint">Không tìm thấy.</li>}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
