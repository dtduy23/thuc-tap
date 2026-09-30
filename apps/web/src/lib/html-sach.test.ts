/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { lamSachHtml } from './html-sach'

describe('lọc HTML (DOMPurify, ADR-0005)', () => {
  it('bỏ script, sự kiện on*, liên kết javascript:, CSS gọi ra ngoài', () => {
    const ra = lamSachHtml(
      '<p onclick="x()">A<script>alert(1)</script><img src=x onerror=alert(1)></p>' +
        '<a href="javascript:alert(1)">b</a><span style="background:url(https://ngoai)">c</span>',
    )
    expect(ra).not.toMatch(/script|onclick|onerror|<img|javascript:|url\(/i)
    expect(ra).toContain('A')
  })

  it('giữ định dạng văn bản và chip trường của trình soạn mẫu', () => {
    const chip = '<span class="chip-truong" data-truong="ho_ten" contenteditable="false">Họ tên</span>'
    const ra = lamSachHtml(
      `<p style="text-align:center"><b>X</b> ${chip}</p><table><tr><td>1</td></tr></table>`,
    )
    expect(ra).toContain('data-truong="ho_ten"')
    // contenteditable luôn bị bỏ — trình soạn tự đặt lại cho chip sau khi nạp.
    expect(ra).not.toContain('contenteditable')
    expect(ra).toContain('text-align:center')
    expect(ra).toContain('<td>1</td>')
  })
})
