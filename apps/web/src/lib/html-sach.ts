/**
 * Cửa DUY NHẤT để HTML thô vào DOM (ADR-0005): mọi chuỗi đều qua DOMPurify. Luật ESLint
 * chặn `dangerouslySetInnerHTML` và gán `innerHTML` ở mọi chỗ khác.
 *
 * Danh sách cho phép đủ cho văn bản hành chính (thân mẫu, văn bản FOXAI Native soạn ra):
 * đoạn, bảng, danh sách, định dạng chữ, và "chip" trường thông tin của trình soạn mẫu.
 */
import DOMPurify from 'dompurify'

const CAU_HINH = {
  ALLOWED_TAGS:
    'p br div span b strong i em u s sub sup hr h1 h2 h3 h4 ul ol li blockquote font table thead tbody tr th td a'.split(
      ' ',
    ),
  ALLOWED_ATTR: 'class style align size color colspan rowspan href'.split(' '),
  // Chip trường: data-truong (mã trường), data-ph (đoạn gợi ý). data-* không chạy được mã.
  ALLOW_DATA_ATTR: true,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#)/i,
}

// Hook chỉ gắn được khi có DOM (trình duyệt; test chạy Node thuần thì bỏ qua).
if (DOMPurify.isSupported) {
  // CSS có `url(...)` gọi được ra ngoài (lộ người đang xem) — bỏ nguyên thuộc tính style đó.
  DOMPurify.addHook('uponSanitizeAttribute', (_nut, dl) => {
    if (dl.attrName === 'style' && /url\s*\(|expression\s*\(|@import/i.test(dl.attrValue)) dl.keepAttr = false
  })
  // Liên kết không được giữ quyền truy cập ngược lại trang GDOS.
  DOMPurify.addHook('afterSanitizeAttributes', (nut) => {
    if (nut.tagName === 'A') nut.setAttribute('rel', 'noopener noreferrer')
  })
}

export const lamSachHtml = (html: string): string => DOMPurify.sanitize(html, CAU_HINH)

/** Gán HTML đã lọc vào một phần tử (vùng `contentEditable` phải uncontrolled). */
export function ganHtmlSach(el: HTMLElement, html: string): void {
  // eslint-disable-next-line no-restricted-syntax -- chuỗi vừa qua DOMPurify ngay trên dòng này
  el.innerHTML = lamSachHtml(html)
}
