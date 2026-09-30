import { DANH_SACH_MODULE, NHOM, TANG, type ChucNang, type ModuleDef } from '@gdos/shared'

export interface ViTri {
  tang: (typeof TANG)[number]
  nhom: (typeof NHOM)[number]
  module: ModuleDef
  chucNang: ChucNang
}

/** Chức năng cấp 4 nằm ở đâu trong cây — cho đường dẫn C1 › C2 › C3 › C4. */
export function timViTri(id: string): ViTri | undefined {
  for (const m of DANH_SACH_MODULE) {
    const c = m.con.find((x) => x.id === id)
    if (!c) continue
    const nhom = NHOM.find((n) => n.ma === m.nhom)!
    return { tang: TANG.find((t) => t.so === nhom.tang)!, nhom, module: m, chucNang: c }
  }
  return undefined
}
