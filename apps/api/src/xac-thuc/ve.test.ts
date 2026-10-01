import { describe, expect, it } from 'vitest'
import { docVe, kyVe, type NoiDungVe } from './ve.js'

const KHOA = 'k'.repeat(40)
const BAY_GIO = 1_800_000_000_000
const mau = (het = BAY_GIO / 1000 + 60): NoiDungVe => ({
  tk: 'tai-khoan-1',
  dv: ['don-vi-1'],
  qt: false,
  pc: [{ v: 'CHUYEN_VIEN', p: ['du-an'] }],
  het,
})

describe('kyVe / docVe', () => {
  it('ký rồi đọc lại đúng nội dung', () => {
    expect(docVe(kyVe(mau(), KHOA), KHOA, BAY_GIO)).toEqual(mau())
  })

  it('sai khóa thì từ chối', () => {
    expect(docVe(kyVe(mau(), KHOA), 'x'.repeat(40), BAY_GIO)).toBeNull()
  })

  it('sửa nội dung (vd tự nâng thành quản trị) thì từ chối', () => {
    const [, chuKy] = kyVe(mau(), KHOA).split('.')
    const gia = Buffer.from(JSON.stringify({ ...mau(), qt: true })).toString('base64url')
    expect(docVe(`${gia}.${chuKy}`, KHOA, BAY_GIO)).toBeNull()
  })

  it('hết hạn thì từ chối', () => {
    expect(docVe(kyVe(mau(BAY_GIO / 1000 - 1), KHOA), KHOA, BAY_GIO)).toBeNull()
  })

  it('vé hỏng dạng thì từ chối, không ném lỗi', () => {
    for (const hong of ['', 'abc', 'a.b.c', '.', 'khong-co-dau-cham'])
      expect(docVe(hong, KHOA, BAY_GIO)).toBeNull()
  })

  it('vé có chữ ký đúng nhưng vai lạ thì từ chối', () => {
    const la = { ...mau(), pc: [{ v: 'SIEU_QUAN_TRI', p: null }] } as unknown as NoiDungVe
    expect(docVe(kyVe(la, KHOA), KHOA, BAY_GIO)).toBeNull()
  })
})
