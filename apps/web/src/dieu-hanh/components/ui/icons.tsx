import type { ReactNode } from 'react'

/** Thuộc tính chung của mọi icon trong bản gốc (IC + MINI). */
const S = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** IC — icon module, dùng ở sidebar và ô màu đầu trang. */
export const IC: Record<string, ReactNode> = {
  /* ClipboardList của lucide — cùng icon FOXAINATIVE dùng cho Quản lý nhiệm vụ. */
  quanlynhiemvu: (
    <svg {...S} strokeWidth={2}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  ),
  /* Nhóm ĐIỀU HÀNH — port từ PAGES[].i của Dashboard_GDOS_XaPhuong_3.html (lưới 20). */
  'xp-overview': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  ),
  'xp-kpi': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="4.5" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
    </svg>
  ),
  'xp-tthc': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M5 2.5h7l3.5 3.5v11.5H5z" />
      <path d="M8 10h5M8 13h5" />
    </svg>
  ),
  'xp-ktxh': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M3 17h14M5 14V9M9 14V5M13 14v-3M17 14V7" />
    </svg>
  ),
  'xp-antt': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M10 2.5 16 5v5c0 3.5-2.5 6-6 7.5C6.5 16 4 13.5 4 10V5z" />
    </svg>
  ),
  'xp-ht': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M3 17V8l4-3v12M7 17V9l5-4v12M12 17V7l5 3v7M2 17h16" />
    </svg>
  ),
  'xp-ytgd': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M10 6.5v7M6.5 10h7" />
    </svg>
  ),
  'xp-pakn': (
    <svg {...S} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M3 4.5h14v9H8l-4 3v-3H3z" />
    </svg>
  ),
  tongquan: (
    <svg {...S} strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  nhiemvu: (
    <svg {...S} strokeWidth={2}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  tthc: (
    <svg {...S} strokeWidth={2}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  vanban: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  phananh: (
    <svg {...S} strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  ktxh: (
    <svg {...S} strokeWidth={2}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  chiso: (
    <svg {...S} strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  /* Users — Dân số & Hộ khẩu (prototype dùng 👥). */
  danso: (
    <svg {...S} strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  /* BarChart3 — Báo cáo lên Tỉnh (prototype dùng 📊). */
  baocaotinh: (
    <svg {...S} strokeWidth={2}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12" y="8" width="3" height="10" />
      <rect x="17" y="4" width="3" height="14" />
    </svg>
  ),
  /* Monitor — Các HTTT phân hệ (prototype dùng 🖥). */
  httt: (
    <svg {...S} strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  datdai: (
    <svg {...S} strokeWidth={2}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  nongnghiep: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 22c5 0 8-3 8-8 0-6-8-12-8-12S4 8 4 14c0 5 3 8 8 8z" />
      <path d="M12 22V10" />
      <path d="M12 14l4-3" />
      <path d="M12 17l-4-3" />
    </svg>
  ),
  gdyt: (
    <svg {...S} strokeWidth={2}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  ),
  ditich: (
    <svg {...S} strokeWidth={2}>
      <path d="M3 9l9-7 9 7" />
      <line x1="4" y1="9" x2="4" y2="19" />
      <line x1="9" y1="10" x2="9" y2="19" />
      <line x1="15" y1="10" x2="15" y2="19" />
      <line x1="20" y1="9" x2="20" y2="19" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  ),
  sonha: (
    <svg {...S} strokeWidth={2}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <rect x="9" y="12" width="6" height="5" rx="1" />
    </svg>
  ),
  apthongminh: (
    <svg {...S} strokeWidth={2}>
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8.5 14.5a5 5 0 0 1 7 0" />
      <path d="M10.5 17a2.2 2.2 0 0 1 3 0" />
    </svg>
  ),
  baocao: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path
        d="M12 18l-1.2-3L8 13.8l2.8-1.2L12 10l1.2 2.6 2.8 1.2-2.8 1.2z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  ),
  dashboard: (
    <svg {...S} strokeWidth={2}>
      <path d="M21.2 15.9A10 10 0 1 1 8 2.8" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  taoSlide: (
    <svg {...S} strokeWidth={2}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="12" y1="16" x2="12" y2="20" />
      <polygon points="10 8 16 10 10 12 10 8" />
    </svg>
  ),
  ai: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  ),
  vaitro: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  nguoidung: (
    <svg {...S} strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  tochuc: (
    <svg {...S} strokeWidth={2}>
      <rect x="9" y="2" width="6" height="5" rx="1" />
      <rect x="2" y="17" width="6" height="5" rx="1" />
      <rect x="16" y="17" width="6" height="5" rx="1" />
      <path d="M12 7v4M5 17v-2h14v2M12 11v4" />
    </svg>
  ),
  tichhop: (
    <svg {...S} strokeWidth={2}>
      <path d="M20 7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
      <path d="M4 8V4a2 2 0 0 1 2-2h9l5 5" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M2 12h9" />
      <path d="M8 15l3-3-3-3" />
    </svg>
  ),
  mauvanban: (
    <svg {...S} strokeWidth={2}>
      <rect x="3" y="3" width="18" height="6" rx="1.5" />
      <rect x="3" y="13" width="7" height="8" rx="1.5" />
      <rect x="14" y="13" width="7" height="8" rx="1.5" />
    </svg>
  ),
  tomtat: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  soanthao: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M21.5 12.5a1.8 1.8 0 0 0-2.6 0L14 17.4V20h2.6l4.9-4.9a1.8 1.8 0 0 0 0-2.6z" />
    </svg>
  ),
  phancong: (
    <svg {...S} strokeWidth={2}>
      <path d="M3 6l2 2 3-3" />
      <path d="M3 13l2 2 3-3" />
      <path d="M3 20l2 2 3-3" />
      <line x1="12" y1="6" x2="21" y2="6" />
      <line x1="12" y1="13" x2="21" y2="13" />
      <line x1="12" y1="20" x2="21" y2="20" />
    </svg>
  ),
  // Bot, tin nhắn, cơ sở dữ liệu — cùng bộ icon lucide mà FOXAINATIVE dùng cho nhóm Trợ lí AI.
  chatbot: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  trochuyen: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  ),
  hoidap: (
    <svg {...S} strokeWidth={2}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
  nguondulieu: (
    <svg {...S} strokeWidth={2}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  ),
  // Bản FOXAINATIVE dùng icon Brain của lucide cho mục này.
  trithuc: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 5v13" />
    </svg>
  ),
  capxuly: (
    <svg {...S} strokeWidth={2}>
      <circle cx="12" cy="5" r="2.6" />
      <circle cx="5" cy="19" r="2.6" />
      <circle cx="19" cy="19" r="2.6" />
      <path d="M12 7.6v2.9M10.3 11.9 6.6 16.6M13.7 11.9l3.7 4.7" />
    </svg>
  ),
}

/** MINI — icon nhỏ trong thẻ KPI và dòng chỉ số. */
export const MINI: Record<string, ReactNode> = {
  doc: (
    <svg {...S} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  check: (
    <svg {...S} strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  clock: (
    <svg {...S} strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  warn: (
    <svg {...S} strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <circle cx="12" cy="16.6" r=".6" fill="currentColor" />
    </svg>
  ),
  people: (
    <svg {...S} strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  shield: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  cam: (
    <svg {...S} strokeWidth={2}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4z" />
    </svg>
  ),
  road: (
    <svg {...S} strokeWidth={2}>
      <path d="M4 21L9 3" />
      <path d="M20 21L15 3" />
      <path d="M12 7v2M12 13v2M12 19v2" />
    </svg>
  ),
  tree: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 22v-5" />
      <path d="M7 17h10L12 3z" />
    </svg>
  ),
  bulb: (
    <svg {...S} strokeWidth={2}>
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  ),
  drop: (
    <svg {...S} strokeWidth={2}>
      <path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" />
    </svg>
  ),
  med: (
    <svg {...S} strokeWidth={2}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M12 11v5M9.5 13.5h5" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  grad: (
    <svg {...S} strokeWidth={2}>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </svg>
  ),
}
