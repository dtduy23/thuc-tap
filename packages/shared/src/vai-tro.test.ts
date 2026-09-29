import { describe, expect, it } from 'vitest'
import { locTheoQuyen, type ModuleDef } from './phan-he.js'
import { kiemTraPhanCong, tinhQuyen, type PhanCong } from './vai-tro.js'

/** Cây mẫu đủ bốn nhóm Tầng 1 và một nhóm Tầng 2 — đủ để thử mọi luật của ADR-0006. */
const CAY: ModuleDef[] = [
  {
    id: 'tong-quan',
    nhan: 'Tổng quan',
    nhom: 'dieu-hanh',
    maQuyen: 'DASHBOARD',
    nguon: 'db',
    mo: '',
    con: [{ id: 'tq-toan', nhan: 'Toàn đơn vị' }],
  },
  {
    id: 'du-an',
    nhan: 'Dự án',
    nhom: 'tac-nghiep',
    maQuyen: 'PROJECT',
    nguon: 'db',
    mo: '',
    con: [
      { id: 'da-tat-ca', nhan: 'Tất cả' },
      { id: 'da-tao', nhan: 'Tạo mới', hanhDong: 'CREATE' },
      { id: 'da-don-doc', nhan: 'Đôn đốc', hanhDong: 'ASSIGN' },
    ],
  },
  {
    id: 'khieu-nai',
    nhan: 'Khiếu nại đất đai',
    nhom: 'tac-nghiep',
    maQuyen: 'COMPLAINT',
    nguon: 'db',
    mo: '',
    con: [{ id: 'kn-tiep-nhan', nhan: 'Tiếp nhận' }],
  },
  {
    id: 'dm-linh-vuc',
    nhan: 'Lĩnh vực',
    nhom: 'danh-muc',
    maQuyen: 'CATALOG',
    nguon: 'db',
    mo: '',
    con: [
      { id: 'lv-ds', nhan: 'Danh sách' },
      { id: 'lv-sua', nhan: 'Sửa', hanhDong: 'UPDATE' },
    ],
  },
  {
    id: 'nhat-ky',
    nhan: 'Nhật ký thao tác',
    nhom: 'giam-sat',
    maQuyen: 'AUDIT',
    nguon: 'db',
    mo: '',
    con: [{ id: 'nk-tat-ca', nhan: 'Tất cả' }],
  },
  {
    id: 'qt-tai-khoan',
    nhan: 'Tài khoản',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_NGUOI_DUNG',
    nguon: 'db',
    mo: '',
    con: [{ id: 'tk-ds', nhan: 'Danh sách' }],
  },
]

const quyen = (pc: PhanCong[], co = false) => tinhQuyen(CAY, pc, co)
const idThay = (pc: PhanCong[], co = false) =>
  locTheoQuyen(CAY, quyen(pc, co)).flatMap((t) =>
    t.nhom.flatMap((n) => n.modules.flatMap((m) => m.con.map((c) => c.id))),
  )

describe('Chủ tịch xã — Lãnh đạo · tất cả', () => {
  const q = quyen([{ vai: 'LANH_DAO', phamVi: 'tat-ca' }])

  it('thấy toàn bộ Tầng 1, kể cả Giám sát & Lưu vết', () => {
    expect(q.has('DASHBOARD.READ') && q.has('PROJECT.READ') && q.has('COMPLAINT.READ')).toBe(true)
    expect(q.has('AUDIT.READ')).toBe(true)
  })

  it('duyệt và giao việc được', () => {
    expect(q.has('PROJECT.APPROVE') && q.has('PROJECT.ASSIGN')).toBe(true)
  })

  it('KHÔNG nhập liệu: không tạo, không sửa, không xóa', () => {
    for (const h of ['CREATE', 'UPDATE', 'DELETE']) expect(q.has(`PROJECT.${h}`)).toBe(false)
  })

  it('không thấy Tầng 2 khi không có cờ quản trị', () => {
    expect(idThay([{ vai: 'LANH_DAO', phamVi: 'tat-ca' }])).not.toContain('tk-ds')
  })
})

describe('Chuyên viên — phân công Dự án', () => {
  const pc: PhanCong[] = [{ vai: 'CHUYEN_VIEN', phamVi: ['du-an'] }]
  const q = quyen(pc)

  it('nhập liệu được trong phân hệ được phân', () => {
    expect(q.has('PROJECT.CREATE') && q.has('PROJECT.UPDATE') && q.has('PROJECT.DELETE')).toBe(true)
  })

  it('không thấy phân hệ không được phân', () => {
    expect(q.has('COMPLAINT.READ')).toBe(false)
    expect(q.has('DASHBOARD.READ')).toBe(false)
  })

  it('đọc được danh mục dù không được phân — cần để chọn giá trị', () => {
    expect(q.has('CATALOG.READ')).toBe(true)
    expect(q.has('CATALOG.UPDATE')).toBe(false)
  })

  it('không duyệt, không giao việc — nên chức năng Đôn đốc biến mất, anh em vẫn còn', () => {
    expect(idThay(pc)).toEqual(expect.arrayContaining(['da-tat-ca', 'da-tao']))
    expect(idThay(pc)).not.toContain('da-don-doc')
  })

  it('không bao giờ thấy Giám sát & Lưu vết, kể cả phạm vi "tất cả"', () => {
    expect(quyen([{ vai: 'CHUYEN_VIEN', phamVi: 'tat-ca' }]).has('AUDIT.READ')).toBe(false)
  })
})

describe('Phó chủ tịch — Lãnh đạo · một số phân hệ', () => {
  const q = quyen([{ vai: 'LANH_DAO', phamVi: ['du-an'] }])

  it('duyệt trong lĩnh vực phụ trách, không thấy lĩnh vực khác', () => {
    expect(q.has('PROJECT.APPROVE')).toBe(true)
    expect(q.has('COMPLAINT.READ')).toBe(false)
  })
})

describe('Thanh tra — chỉ đọc', () => {
  const q = quyen([{ vai: 'THANH_TRA', phamVi: 'tat-ca' }])

  it('đọc toàn bộ, kể cả nhật ký', () => {
    expect(q.has('PROJECT.READ') && q.has('AUDIT.READ')).toBe(true)
  })

  it('không duyệt, không nhập liệu', () => {
    expect(q.has('PROJECT.APPROVE') || q.has('PROJECT.CREATE')).toBe(false)
  })
})

describe('Cờ quản trị', () => {
  it('chỉ có cờ: thấy Tầng 2, KHÔNG đọc được hồ sơ nghiệp vụ (NĐ 13/2023)', () => {
    const q = quyen([], true)
    expect(q.has('QT_NGUOI_DUNG.READ')).toBe(true)
    expect(q.has('PROJECT.READ') || q.has('AUDIT.READ')).toBe(false)
  })

  it('admin lúc xây dựng = cờ + Lãnh đạo + Chuyên viên, thấy và làm hết', () => {
    const pc: PhanCong[] = [
      { vai: 'LANH_DAO', phamVi: 'tat-ca' },
      { vai: 'CHUYEN_VIEN', phamVi: 'tat-ca' },
    ]
    const tatCa = CAY.flatMap((m) => m.con.map((c) => c.id))
    expect(idThay(pc, true).sort()).toEqual(tatCa.sort())
  })
})

describe('kiemTraPhanCong', () => {
  it('phân công hợp lệ không có lỗi', () => {
    expect(kiemTraPhanCong({ vai: 'CHUYEN_VIEN', phamVi: ['du-an', 'khieu-nai'] }, CAY)).toEqual([])
  })

  it('chặn phạm vi rỗng', () => {
    expect(kiemTraPhanCong({ vai: 'CHUYEN_VIEN', phamVi: [] }, CAY)).toHaveLength(1)
  })

  it('chặn phân hệ không tồn tại', () => {
    expect(kiemTraPhanCong({ vai: 'CHUYEN_VIEN', phamVi: ['khong-co'] }, CAY)[0]).toMatch(/Không có phân hệ/)
  })

  it('chặn phân công Chuyên viên vào Giám sát & Lưu vết', () => {
    expect(kiemTraPhanCong({ vai: 'CHUYEN_VIEN', phamVi: ['nhat-ky'] }, CAY)[0]).toMatch(/Giám sát/)
  })

  it('chặn phân công Tầng 2 — Tầng 2 chỉ đi qua cờ', () => {
    expect(kiemTraPhanCong({ vai: 'LANH_DAO', phamVi: ['qt-tai-khoan'] }, CAY)[0]).toMatch(/cờ quản trị/)
  })
})
