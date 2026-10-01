/**
 * Nguồn dữ liệu vào › Nguồn API — khai hệ thống của khách trả số liệu chỉ tiêu (JSON): địa
 * chỉ, xác thực, và ÁNH XẠ trường trả về → mã chỉ tiêu. "Lấy thử" gọi thật nhưng chưa ghi gì;
 * "Lấy ngay" ghi vào kho. Khóa / token chỉ gửi lên máy chủ, không bao giờ trả lại trình duyệt.
 */
import {
  ANH_XA_TRONG,
  BO_CHI_TIEU,
  XAC_THUC_NGUON,
  kiemNguonApi,
  type KetQuaThuNguon,
  type NguonApi,
  type NguonApiGhi,
  type XacThucNguon,
} from '@gdos/shared'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LoiApi } from '@/lib/http'
import { ngayGio } from '@/lib/ngay'
import {
  KHOA_NGUON_VAO,
  layTuNguonApi,
  suaNguonApi,
  taoNguonApi,
  thuNguonApi,
  truyVanNguonApi,
  xoaNguonApi,
} from '@/lib/nguon-vao'
import { Chip, Nut, ODanhDau, ThongBao } from '@/ui/co-ban'
import { Luoi, type CotLuoi } from '@/ui/luoi/luoi'
import { ChonCheDo, HopThoai, LOP_NHAN, LOP_O_NHO, TieuDeKhoi } from '../van-ban/chung'
import { BangKiemNap } from './chung'

const cauLoi = (e: unknown, macDinh: string) => (e instanceof LoiApi ? e.message : macDinh)
const CHI_TIEU_NAP = BO_CHI_TIEU.filter((c) => c.linhVuc !== 'kpi')

type Soan = NguonApiGhi & { id?: string; coBiMat: boolean }

const MOI: Soan = {
  ten: '',
  diaChi: '',
  xacThuc: 'khong',
  tenHeader: null,
  anhXa: ANH_XA_TRONG,
  bat: true,
  coBiMat: false,
}

/** Bỏ các trường chỉ dùng ở màn hình trước khi gửi. */
function deGui({ id: _id, coBiMat: _co, ...n }: Soan): NguonApiGhi {
  return { ...n, biMat: n.biMat || undefined, tenHeader: n.xacThuc === 'header' ? n.tenHeader : null }
}

function O({
  nhan,
  id,
  goiY,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & { nhan: string; id: string; goiY?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LOP_NHAN}>
        {nhan}
      </label>
      <input id={id} {...p} className={LOP_O_NHO} />
      {goiY && <p className="mt-1 mb-0 text-[11.5px] text-faint">{goiY}</p>}
    </div>
  )
}

function BieuMau({ dau, dong }: { dau: Soan; dong: () => void }) {
  const qc = useQueryClient()
  const [n, datN] = useState<Soan>(dau)
  const [thu, datThu] = useState<KetQuaThuNguon>()
  const [loi, datLoi] = useState<string>()
  const a = n.anhXa
  const datA = (moi: Partial<Soan['anhXa']>) => datN((c) => ({ ...c, anhXa: { ...c.anhXa, ...moi } }))
  const loiHinhThuc = kiemNguonApi(deGui(n))

  const luu = useMutation({
    mutationFn: () => (n.id ? suaNguonApi(n.id, deGui(n)) : taoNguonApi(deGui(n))),
    onSuccess: (ds) => {
      qc.setQueryData(truyVanNguonApi.queryKey, ds)
      dong()
    },
    onError: (e) => datLoi(cauLoi(e, 'Không lưu được.')),
  })
  const goiThu = useMutation({
    mutationFn: () => thuNguonApi(deGui(n), n.id),
    onSuccess: (r) => {
      datLoi(undefined)
      datThu(r)
    },
    onError: (e) => datLoi(cauLoi(e, 'Không gọi thử được.')),
  })
  const ban = luu.isPending || goiThu.isPending

  return (
    <HopThoai
      tieuDe={n.id ? 'Sửa nguồn API' : 'Thêm nguồn API'}
      phu="Hệ thống của khách trả số liệu chỉ tiêu dạng JSON"
      dong={dong}
      khoa={ban}
      rong="max-w-[900px]"
      chan={
        <>
          <Nut onClick={dong} disabled={ban}>
            Hủy
          </Nut>
          <Nut disabled={ban || loiHinhThuc.length > 0} onClick={() => goiThu.mutate()}>
            {goiThu.isPending ? 'Đang gọi…' : 'Lấy thử'}
          </Nut>
          <Nut kieu="chinh" disabled={ban || loiHinhThuc.length > 0} onClick={() => luu.mutate()}>
            {luu.isPending ? 'Đang lưu…' : 'Lưu'}
          </Nut>
        </>
      }
    >
      {loi && <ThongBao kieu="loi">{loi}</ThongBao>}
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <O
          nhan="Tên nguồn"
          id="ng-ten"
          value={n.ten}
          maxLength={200}
          onChange={(e) => datN({ ...n, ten: e.target.value })}
          placeholder="vd Một cửa điện tử"
        />
        <O
          nhan="Địa chỉ (GET)"
          id="ng-dia-chi"
          value={n.diaChi}
          maxLength={1000}
          onChange={(e) => datN({ ...n, diaChi: e.target.value })}
          placeholder="https://…/api/so-lieu"
        />
        <div className="min-w-0">
          <label htmlFor="ng-xac-thuc" className={LOP_NHAN}>
            Xác thực
          </label>
          <select
            id="ng-xac-thuc"
            value={n.xacThuc}
            onChange={(e) => datN({ ...n, xacThuc: e.target.value as XacThucNguon })}
            className={LOP_O_NHO}
          >
            {Object.entries(XAC_THUC_NGUON).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {n.xacThuc === 'header' && (
          <O
            nhan="Tên header"
            id="ng-header"
            value={n.tenHeader ?? ''}
            maxLength={64}
            onChange={(e) => datN({ ...n, tenHeader: e.target.value })}
            placeholder="vd X-API-Key"
          />
        )}
        {n.xacThuc !== 'khong' && (
          <O
            nhan="Khóa / token"
            id="ng-bi-mat"
            type="password"
            autoComplete="off"
            value={n.biMat ?? ''}
            onChange={(e) => datN({ ...n, biMat: e.target.value })}
            placeholder={n.coBiMat ? 'Đã lưu — để trống để giữ nguyên' : ''}
            goiY="Lưu mã hóa trên máy chủ; không hiện lại, không trả về trình duyệt."
          />
        )}
      </div>

      <div className="mt-5">
        <TieuDeKhoi phu="JSON trả về được đọc thành các dòng (chỉ tiêu, kỳ, giá trị)">Ánh xạ</TieuDeKhoi>
        <ChonCheDo
          giaTri={a.kieu}
          doi={(kieu) => datA({ kieu })}
          muc={[
            { id: 'dong', nhan: 'Một mảng — mỗi phần tử là một số' },
            { id: 'truong', nhan: 'Một đối tượng — mỗi trường là một chỉ tiêu' },
          ]}
        />
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
          <O
            nhan={a.kieu === 'dong' ? 'Đường tới mảng' : 'Đường tới đối tượng'}
            id="ng-duong"
            value={a.duongDan}
            onChange={(e) => datA({ duongDan: e.target.value.trim() })}
            placeholder="vd data.items — để trống nếu ở ngay gốc"
          />
          <O
            nhan="Trường kỳ"
            id="ng-ky"
            value={a.truongKy}
            onChange={(e) => datA({ truongKy: e.target.value.trim() })}
            placeholder="để trống = kỳ tháng hiện tại"
            goiY="Nhận 2026-09, 09/2026, T9/2026 hoặc ngày ISO."
          />
          {a.kieu === 'dong' && (
            <>
              <O
                nhan="Trường mã chỉ tiêu"
                id="ng-ma"
                value={a.truongMa}
                onChange={(e) => datA({ truongMa: e.target.value.trim() })}
                goiY="Giá trị phải là mã trong bộ chỉ tiêu, vd TTHC-01."
              />
              <O
                nhan="Trường giá trị"
                id="ng-gia-tri"
                value={a.truongGiaTri}
                onChange={(e) => datA({ truongGiaTri: e.target.value.trim() })}
              />
            </>
          )}
        </div>
        {a.kieu === 'truong' && (
          <div className="mt-3">
            <span className={LOP_NHAN}>Trường trong JSON → chỉ tiêu</span>
            {a.cap.map((c, i) => (
              <div key={i} className="mb-2 grid min-w-0 gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input
                  aria-label={`Trường ${i + 1}`}
                  value={c.truong}
                  placeholder="vd tongHoSo"
                  onChange={(e) =>
                    datA({
                      cap: a.cap.map((x, j) => (j === i ? { ...x, truong: e.target.value.trim() } : x)),
                    })
                  }
                  className={LOP_O_NHO}
                />
                <select
                  aria-label={`Chỉ tiêu ${i + 1}`}
                  value={c.maChiTieu}
                  onChange={(e) =>
                    datA({ cap: a.cap.map((x, j) => (j === i ? { ...x, maChiTieu: e.target.value } : x)) })
                  }
                  className={LOP_O_NHO}
                >
                  <option value="">— chọn chỉ tiêu —</option>
                  {CHI_TIEU_NAP.map((d) => (
                    <option key={d.ma} value={d.ma}>
                      {d.ma} · {d.ten} ({d.donVi})
                    </option>
                  ))}
                </select>
                <Nut onClick={() => datA({ cap: a.cap.filter((_, j) => j !== i) })}>Bỏ</Nut>
              </div>
            ))}
            <Nut onClick={() => datA({ cap: [...a.cap, { truong: '', maChiTieu: '' }] })}>+ Thêm cặp</Nut>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ODanhDau
          id="ng-bat"
          nhan="Đang dùng nguồn này"
          checked={n.bat}
          onChange={(e) => datN({ ...n, bat: e.target.checked })}
        />
      </div>
      {loiHinhThuc.length > 0 && n.ten + n.diaChi !== '' && (
        <p className="m-0 text-[12px] text-danger">{loiHinhThuc.join(' · ')}</p>
      )}

      {thu && (
        <div className="mt-5">
          <TieuDeKhoi phu="chưa ghi gì vào kho">Kết quả lấy thử</TieuDeKhoi>
          {thu.loi ? (
            <ThongBao kieu="loi">{thu.loi}</ThongBao>
          ) : (
            <>
              <p className="mt-0 mb-2 text-[13px]">
                <b className="text-ok">{thu.soHopLe}</b> dòng hợp lệ ·{' '}
                <b className={thu.soLoi ? 'text-danger' : 'text-faint'}>{thu.soLoi}</b> dòng lỗi
              </p>
              {thu.dong.length > 0 && <BangKiemNap kq={thu} nhanHang="Thứ tự" />}
            </>
          )}
          {thu.mauJson && (
            <details className="mt-3" open={!!thu.loi}>
              <summary className="cursor-pointer text-[12.5px] font-semibold text-body">
                JSON nguồn trả về (đoạn đầu)
              </summary>
              <pre className="mt-2 mb-0 max-h-[260px] overflow-auto rounded-lg border border-line bg-nen-2 p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-body">
                {thu.mauJson}
              </pre>
            </details>
          )}
        </div>
      )}
    </HopThoai>
  )
}

export default function NguonApiMan() {
  const qc = useQueryClient()
  const { data: ds } = useSuspenseQuery(truyVanNguonApi)
  const [soan, datSoan] = useState<Soan>()
  const [kq, datKq] = useState<{ ok: boolean; cau: string }>()

  const lay = useMutation({
    mutationFn: (n: NguonApi) => layTuNguonApi(n.id),
    onSuccess: async (l) => {
      await qc.invalidateQueries({ queryKey: KHOA_NGUON_VAO })
      await qc.invalidateQueries({ queryKey: ['chi-tieu'] })
      datKq({
        ok: l.trangThai === 'xong' && l.soLoi === 0,
        cau:
          l.trangThai === 'xong'
            ? `“${l.tenNguon}”: đã ghi ${l.soDong} số liệu${l.soLoi ? `, bỏ ${l.soLoi} dòng lỗi — xem ở Kết quả lấy về` : ''}.`
            : `“${l.tenNguon}”: không lấy được số nào. ${l.loi[0] ?? ''}`,
      })
    },
    onError: (e) => datKq({ ok: false, cau: cauLoi(e, 'Không lấy được.') }),
  })
  const xoa = useMutation({
    mutationFn: (n: NguonApi) => xoaNguonApi(n.id),
    onSuccess: (moi) => qc.setQueryData(truyVanNguonApi.queryKey, moi),
    onError: (e) => datKq({ ok: false, cau: cauLoi(e, 'Không xóa được.') }),
  })

  const cot: CotLuoi<NguonApi>[] = [
    {
      id: 'ten',
      nhan: 'Nguồn',
      kieu: 'chu',
      rong: 230,
      batBuoc: true,
      giaTri: (n) => n.ten,
      hien: (n) => <b className="text-ink">{n.ten}</b>,
    },
    { id: 'diaChi', nhan: 'Địa chỉ', kieu: 'chu', rong: 300, giaTri: (n) => n.diaChi },
    {
      id: 'xacThuc',
      nhan: 'Xác thực',
      kieu: 'danh-muc',
      rong: 150,
      giaTri: (n) => XAC_THUC_NGUON[n.xacThuc],
    },
    {
      id: 'anhXa',
      nhan: 'Ánh xạ',
      kieu: 'chu',
      rong: 190,
      giaTri: (n) => (n.anhXa.kieu === 'dong' ? 'Mảng các dòng' : `${n.anhXa.cap.length} trường → chỉ tiêu`),
    },
    {
      id: 'bat',
      nhan: 'Tình trạng',
      kieu: 'danh-muc',
      rong: 120,
      giaTri: (n) => (n.bat ? 'Đang dùng' : 'Đang tắt'),
      hien: (n) => <Chip mau={n.bat ? 'ok' : 'xam'}>{n.bat ? 'Đang dùng' : 'Đang tắt'}</Chip>,
    },
    {
      id: 'lanCuoi',
      nhan: 'Lần lấy gần nhất',
      kieu: 'chu',
      rong: 250,
      giaTri: (n) => n.lanCuoi?.luc ?? null,
      hien: (n) =>
        n.lanCuoi ? (
          <span className={n.lanCuoi.trangThai === 'xong' ? 'text-ok' : 'text-danger'}>
            {n.lanCuoi.trangThai === 'xong' ? `✓ ${n.lanCuoi.soDong} số` : '✗ lỗi'}
            {n.lanCuoi.soLoi > 0 && n.lanCuoi.trangThai === 'xong'
              ? `, ${n.lanCuoi.soLoi} dòng lỗi`
              : ''}{' '}
            <span className="text-faint">· {ngayGio(n.lanCuoi.luc)}</span>
          </span>
        ) : (
          <span className="text-faint">Chưa lấy lần nào</span>
        ),
    },
    {
      id: 'thaoTac',
      nhan: 'Thao tác',
      kieu: 'chu',
      rong: 250,
      khongLoc: true,
      giaTri: () => null,
      hien: (n) => (
        <span className="flex flex-wrap gap-1.5">
          <Nut kieu="chinh" disabled={lay.isPending || !n.bat} onClick={() => lay.mutate(n)}>
            {lay.isPending && lay.variables?.id === n.id ? 'Đang lấy…' : 'Lấy ngay'}
          </Nut>
          <Nut onClick={() => datSoan({ ...n })}>Sửa</Nut>
          <Nut
            kieu="nguy-hiem"
            disabled={xoa.isPending}
            onClick={() => window.confirm(`Xóa nguồn “${n.ten}”? Số liệu đã lấy vẫn giữ.`) && xoa.mutate(n)}
          >
            Xóa
          </Nut>
        </span>
      ),
    },
  ]

  return (
    <>
      <ThongBao>
        Khai hệ thống của khách trả <b>số liệu chỉ tiêu</b> dạng JSON. Số lấy về đi vào cùng một kho với kênh
        Excel và lên thẳng các trang Điều hành. Hiện lấy khi bấm <b>Lấy ngay</b> (chưa có lịch tự chạy).
      </ThongBao>
      {kq && <ThongBao kieu={kq.ok ? 'ok' : 'loi'}>{kq.cau}</ThongBao>}
      <Luoi
        ma="nguon-api"
        tieuDe="Nguồn API"
        cot={cot}
        dong={ds}
        khoa={(n) => n.id}
        congCu={
          <Nut kieu="chinh" onClick={() => datSoan(MOI)}>
            + Thêm nguồn
          </Nut>
        }
        rong="Chưa khai nguồn API nào. Đơn vị chưa có API thì dùng “Nạp từ Excel”."
      />
      {soan && <BieuMau key={soan.id ?? 'moi'} dau={soan} dong={() => datSoan(undefined)} />}
    </>
  )
}
