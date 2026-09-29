import { useEffect, useState } from 'react'
import { NHOM, TANG } from '@gdos/shared'
import { hoiPhuThuoc, type TinhTrang } from '@/suc-khoe'

const NHAN_DB: Record<string, string> = {
  'chua-cau-hinh': 'chưa cấu hình DATABASE_URL',
  'khong-ket-noi': 'không kết nối được',
}

/**
 * Trang của Mốc 0: chứng minh web ↔ API ↔ gói dùng chung đã nối với nhau.
 * Mốc 1 thay bằng khung portal + đăng nhập + cây phân hệ lọc theo quyền.
 */
export function TrangNenMong() {
  const [tt, setTt] = useState<TinhTrang>({ loai: 'dang-hoi' })

  useEffect(() => {
    void hoiPhuThuoc().then(setTt)
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm text-faint">Mốc 0 · Nền móng</p>
      <h1 className="mb-6 text-2xl font-bold">GDOS</h1>

      <section className="mb-4 rounded-xl border border-line bg-nen p-5" aria-live="polite">
        <h2 className="mb-2 text-sm font-semibold text-body">Tình trạng hệ thống</h2>
        {tt.loai === 'dang-hoi' && <p className="text-faint">Đang kiểm tra…</p>}
        {tt.loai === 'ok' && (
          <p className="font-semibold text-ok">API và cơ sở dữ liệu hoạt động bình thường.</p>
        )}
        {tt.loai === 'khong-toi-api' && (
          <p className="font-semibold text-danger">
            Không tới được API. Kiểm tra `pnpm dev` đã chạy phần API chưa.
          </p>
        )}
        {tt.loai === 'thieu' && (
          <ul className="space-y-1">
            <li className="text-ok">API đang chạy.</li>
            {Object.entries(tt.phuThuoc).map(([ten, trangThai]) => (
              <li key={ten} className={trangThai === 'ok' ? 'text-ok' : 'text-warn'}>
                {ten}: {NHAN_DB[trangThai] ?? trangThai}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-line bg-nen p-5">
        <h2 className="mb-2 text-sm font-semibold text-body">Khung phân hệ (đọc từ @gdos/shared)</h2>
        {TANG.map((t) => (
          <div key={t.so} className="mb-3 last:mb-0">
            <p className="text-sm font-bold text-brand">
              Tầng {t.so} — {t.nhan}
            </p>
            <p className="text-sm text-body">
              {NHOM.filter((n) => n.tang === t.so)
                .map((n) => n.nhan)
                .join(' · ')}
            </p>
          </div>
        ))}
      </section>
    </main>
  )
}
