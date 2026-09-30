/** Hiện một đoạn HTML đã lọc qua DOMPurify (ADR-0005) — xem lib/html-sach.ts. */
import type { HTMLAttributes } from 'react'
import { lamSachHtml } from '@/lib/html-sach'

export function HtmlSach({
  html,
  ...p
}: { html: string } & Omit<HTMLAttributes<HTMLDivElement>, 'children'>) {
  // eslint-disable-next-line no-restricted-syntax -- chuỗi qua DOMPurify trước khi vào DOM
  return <div {...p} dangerouslySetInnerHTML={{ __html: lamSachHtml(html) }} />
}
