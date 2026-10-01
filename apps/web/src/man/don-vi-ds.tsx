import { CAP_DON_VI, CAP_DUOI_TINH, type CapDonVi, type DonViDong } from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { lamMoiPhienNgay, LoiApi } from '@/lib/http'
import { KHOA_TOI, truyVanToi } from '@/lib/phien'
import { KHOA_DON_VI, suaDonVi, taoDonVi, truyVanDonVi } from '@/lib/quan-tri'
import { Chip, Nut, OChon, ONhap, The, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'

const loiCua = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)

/** Xếp cây: mỗi tỉnh rồi tới các xã của nó; đơn vị có cha ngoài phạm vi đứng đầu nhánh của mình. */
function xepCay(ds: readonly DonViDong[]): { dv: DonViDong; cap: number }[] {
  const ids = new Set(ds.map((d) => d.id))
  const goc = ds.filter((d) => !d.chaId || !ids.has(d.chaId))
  const kq: { dv: DonViDong; cap: number }[] = []
  const di = (dv: DonViDong, cap: number) => {
    kq.push({ dv, cap })
    ds.filter((c) => c.chaId === dv.id).forEach((c) => di(c, cap + 1))
  }
  goc.forEach((g) => di(g, 0))
  return kq
}

export default function DonViDs() {
  const qc = useQueryClient()
  const { data: toi } = useSuspenseQuery(truyVanToi)
  const { data: ds } = useSuspenseQuery(truyVanDonVi)
  const [dangSua, datDangSua] = useState<string>()
  const [thongBao, datThongBao] = useState<{ ok: boolean; cau: string }>()

  const coTao = toi.quyen.includes('QT_DON_VI.CREATE')
  const coSua = toi.quyen.includes('QT_DON_VI.UPDATE')
  const dsTinh = ds.filter((d) => d.cap === 'tinh')
  const cay = xepCay(ds)
  const capCua = new Map(cay.map((x) => [x.dv.id, x.cap]))
  const tenCua = new Map(ds.map((d) => [d.id, d.ten]))
  const dangSuaDv = ds.find((d) => d.id === dangSua)

  const cot: CotLuoi<DonViDong>[] = [
    {
      id: 'ten',
      nhan: 'Đơn vị',
      kieu: 'chu',
      rong: 280,
      batBuoc: true,
      giaTri: (dv) => dv.ten,
      hien: (dv) => (
        <span style={{ paddingLeft: (capCua.get(dv.id) ?? 0) * 18 }}>
          {(capCua.get(dv.id) ?? 0) > 0 && <span className="mr-1.5 text-faint">└</span>}
          <b className="text-ink">{dv.ten}</b>
          {dv.id === toi.donVi.id && (
            <span className="ml-2">
              <Chip mau="brand">Đơn vị của bạn</Chip>
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'ma',
      nhan: 'Mã',
      kieu: 'chu',
      rong: 130,
      giaTri: (dv) => dv.ma,
      hien: (dv) => <code className="text-[12.5px]">{dv.ma}</code>,
    },
    {
      id: 'cap',
      nhan: 'Loại',
      kieu: 'danh-muc',
      rong: 150,
      giaTri: (dv) => dv.cap,
      luaChon: Object.entries(CAP_DON_VI).map(([giaTri, nhan]) => ({ giaTri, nhan })),
    },
    {
      id: 'cha',
      nhan: 'Trực thuộc',
      kieu: 'danh-muc',
      rong: 180,
      giaTri: (dv) => (dv.chaId ? (tenCua.get(dv.chaId) ?? null) : null),
    },
    { id: 'soTaiKhoan', nhan: 'Tài khoản', kieu: 'so', rong: 110, cong: true, giaTri: (dv) => dv.soTaiKhoan },
    ...(coSua
      ? [
          {
            id: 'thaoTac',
            nhan: 'Thao tác',
            kieu: 'chu',
            rong: 100,
            khongLoc: true,
            giaTri: () => null,
            hien: (dv) => <Nut onClick={() => datDangSua(dv.id)}>Sửa</Nut>,
          } satisfies CotLuoi<DonViDong>,
        ]
      : []),
  ]

  return (
    <>
      {thongBao && <ThongBao kieu={thongBao.ok ? 'ok' : 'loi'}>{thongBao.cau}</ThongBao>}
      {coTao && dsTinh.length > 0 && (
        <ThemDonVi
          dsTinh={dsTinh}
          xong={async (ten) => {
            // Xã mới chưa nằm trong vé đang cầm — làm mới để thấy và tạo được tài khoản cho nó.
            await lamMoiPhienNgay()
            await qc.invalidateQueries({ queryKey: KHOA_DON_VI })
            await qc.invalidateQueries({ queryKey: KHOA_TOI })
            datThongBao({ ok: true, cau: `Đã thêm ${ten}.` })
          }}
        />
      )}

      {dangSuaDv && (
        <SuaDonVi
          key={dangSuaDv.id}
          dv={dangSuaDv}
          dong={() => datDangSua(undefined)}
          xong={(moi) => {
            qc.setQueryData<DonViDong[]>(KHOA_DON_VI, (cu) => cu?.map((x) => (x.id === moi.id ? moi : x)))
            datDangSua(undefined)
            datThongBao({ ok: true, cau: `Đã lưu ${moi.ten}.` })
          }}
        />
      )}

      <Luoi
        ma="don-vi"
        tieuDe="Danh sách đơn vị"
        cot={cot}
        dong={cay.map((x) => x.dv)}
        khoa={(dv) => dv.id}
        rong="Chưa có đơn vị nào trong phạm vi."
      />
      <p className="mt-2 text-[12px] text-faint">
        Tài khoản cấp tỉnh thấy dữ liệu của tỉnh và mọi đơn vị trực thuộc; tài khoản ở một đơn vị chỉ thấy đơn
        vị mình. Chủ đầu tư là một đơn vị; nhà thầu, tư vấn là "doanh nghiệp" — chỉ thấy dự án mình tham gia.
        Đơn vị gốc (tỉnh) tạo bằng lệnh khởi tạo trên máy chủ.
      </p>
    </>
  )
}

function ThemDonVi({ dsTinh, xong }: { dsTinh: DonViDong[]; xong: (ten: string) => Promise<void> }) {
  const [chaId, datChaId] = useState(dsTinh[0]!.id)
  const [cap, datCap] = useState<CapDonVi>('xa')
  const [ma, datMa] = useState('')
  const [ten, datTen] = useState('')
  const [loi, datLoi] = useState<string>()

  const tao = useMutation({
    mutationFn: () => taoDonVi({ chaId, cap, ma: ma.trim(), ten: ten.trim() }),
    onSuccess: async () => {
      const daTao = ten.trim()
      datMa('')
      datTen('')
      datLoi(undefined)
      await xong(daTao)
    },
    onError: (e) => datLoi(loiCua(e, 'Không thêm được đơn vị.')),
  })

  const gui = (e: FormEvent) => {
    e.preventDefault()
    tao.mutate()
  }

  return (
    <The tieuDe="Thêm đơn vị">
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <form onSubmit={gui} className="grid items-end gap-x-3 sm:grid-cols-[1fr_1fr_130px_1fr_auto]">
        <OChon id="dv-cha" nhan="Trực thuộc" value={chaId} onChange={(e) => datChaId(e.target.value)}>
          {dsTinh.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ten}
            </option>
          ))}
        </OChon>
        <OChon id="dv-cap" nhan="Loại" value={cap} onChange={(e) => datCap(e.target.value as CapDonVi)}>
          {CAP_DUOI_TINH.map((c) => (
            <option key={c} value={c}>
              {CAP_DON_VI[c]}
            </option>
          ))}
        </OChon>
        <ONhap
          id="dv-ma"
          nhan="Mã"
          required
          maxLength={30}
          spellCheck={false}
          placeholder="VD: XA-01"
          value={ma}
          onChange={(e) => datMa(e.target.value.toUpperCase())}
        />
        <ONhap
          id="dv-ten"
          nhan="Tên đơn vị"
          required
          maxLength={150}
          placeholder={cap === 'doanh-nghiep' ? 'VD: Công ty …' : 'VD: Sở …, Xã …'}
          value={ten}
          onChange={(e) => datTen(e.target.value)}
        />
        <div className="mb-3.5">
          <Nut type="submit" kieu="chinh" disabled={tao.isPending}>
            {tao.isPending ? 'Đang thêm…' : 'Thêm'}
          </Nut>
        </div>
      </form>
    </The>
  )
}

function SuaDonVi({ dv, dong, xong }: { dv: DonViDong; dong: () => void; xong: (moi: DonViDong) => void }) {
  const [ma, datMa] = useState(dv.ma)
  const [ten, datTen] = useState(dv.ten)
  const sua = useMutation({
    mutationFn: () => suaDonVi(dv.id, { ma: ma.trim(), ten: ten.trim() }),
    onSuccess: xong,
  })
  return (
    <The tieuDe={`Sửa đơn vị · ${dv.ten}`} phu={CAP_DON_VI[dv.cap]}>
      {sua.error && <ThongBao kieu="loi">{loiCua(sua.error, 'Không lưu được.')}</ThongBao>}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sua.mutate()
        }}
        className="grid items-end gap-x-3 sm:grid-cols-[2fr_1fr_auto]"
      >
        <ONhap
          id="sdv-ten"
          nhan="Tên đơn vị"
          required
          maxLength={150}
          value={ten}
          onChange={(e) => datTen(e.target.value)}
        />
        <ONhap
          id="sdv-ma"
          nhan="Mã"
          required
          maxLength={30}
          spellCheck={false}
          value={ma}
          onChange={(e) => datMa(e.target.value.toUpperCase())}
        />
        <div className="mb-3.5 flex gap-2">
          <Nut type="submit" kieu="chinh" disabled={sua.isPending || !ten.trim() || !ma.trim()}>
            {sua.isPending ? 'Đang lưu…' : 'Lưu'}
          </Nut>
          <Nut onClick={dong}>Hủy</Nut>
        </div>
      </form>
    </The>
  )
}
