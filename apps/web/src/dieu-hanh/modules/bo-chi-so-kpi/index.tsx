import { P9 } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { KhungDashboardXp, type DuLieuXp } from '@/dieu-hanh/components/layout/KhungDashboardXp'
import { TheChiSoXu } from '@/dieu-hanh/components/metrics/TheChiSoXu'
import { DonutPhanRa } from '@/dieu-hanh/components/charts/DonutPhanRa'
import { DuongXuHuong } from '@/dieu-hanh/components/charts/DuongXuHuong'
import { GhiChuCanhBao } from '@/dieu-hanh/components/ui/GhiChuCanhBao'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'
import { LOP_BANG, LienKetTrang, LuoiDashboard, TheDashboard } from '@/dieu-hanh/components/ui/LuoiDashboard'
import { useKpi } from './use-kpi'
import { BulletKpi } from './components/BulletKpi'
import { BanDoNhiet } from './components/BanDoNhiet'

/** Bộ chỉ số KPI — port từ #p-kpi + RENDER.kpi của Dashboard_GDOS_XaPhuong_3.html. */
export default function BoChiSoKpi() {
  return <KhungDashboardXp trang="kpi">{(d) => <NoiDung d={d} />}</KhungDashboardXp>
}

const O_CHU = [
  { nhan: 'Đạt, vượt ít', nen: 'color-mix(in srgb, var(--bd-1) 30%, var(--gdos-surface))' },
  { nhan: 'Đạt, vượt nhiều', nen: 'var(--bd-1)' },
  { nhan: 'Chưa đạt', nen: 'color-mix(in srgb, var(--bd-chua-dat) 70%, var(--gdos-surface))' },
]

function NoiDung({ d }: { d: DuLieuXp }) {
  const kpis = useKpi(d.KPIS)
  const met = kpis.filter((k) => k.met === true).length
  const miss = kpis.filter((k) => k.met === false).length
  const na = kpis.filter((k) => k.met === null).length
  const coSo = kpis.filter((k) => k.v != null && k.hist)

  return (
    <LuoiDashboard>
      {kpis.map((k) => (
        <TheChiSoXu
          key={k.code}
          t={{
            code: k.code,
            label: k.short,
            value: k.v,
            dec: k.v != null && k.v % 1 ? 2 : 0,
            unit: '%',
            icon: k.icon,
            color: k.color,
            period: 'T9',
            span: 4,
            pp: true,
            data: k.hist,
          }}
          chan={
            k.v == null ? (
              `mục tiêu ≥ ${k.t}%`
            ) : (
              <>
                mục tiêu ≥ {k.t}%{' '}
                <span className={`font-semibold ${k.met ? 'text-bd-dat-chu' : 'text-bd-chua-dat'}`}>
                  {k.met ? '✓ Đạt' : '✗ Chưa đạt'}
                </span>
              </>
            )
          }
        />
      ))}

      <TheDashboard nhip={4} tieuDe="Kết quả thực hiện KPI" phu="6 chỉ số cấp trên giao · kỳ gần nhất">
        <DonutPhanRa
          parts={[
            { label: 'Đạt mục tiêu', value: met, color: 'var(--bd-dat)' },
            { label: 'Chưa đạt', value: miss, color: 'var(--bd-chua-dat)' },
            { label: 'Chưa có dữ liệu', value: na, color: 'var(--bd-khac)' },
          ]}
          center={`${met}/${kpis.length}`}
          centerSub="KPI đạt"
          size={160}
          dec={0}
        />
      </TheDashboard>

      <TheDashboard
        nhip={8}
        tieuDe="Hiện trạng so với mục tiêu"
        phu="Biểu đồ bullet · thang 70–100% · vùng đỏ nhạt = dưới mục tiêu · vạch đen = mục tiêu"
      >
        <BulletKpi kpis={kpis} />
      </TheDashboard>

      <TheDashboard
        nhip={12}
        tieuDe="Diễn biến KPI qua 10 kỳ"
        moPhong
        phu="Kỳ T9/2026 là số liệu thực tế tổng hợp từ các dashboard lĩnh vực"
      >
        <DuongXuHuong
          labels={P9}
          series={coSo.map((k) => ({
            name: `${k.code} ${k.short}`,
            color: d.MAU_CHUOI_KPI[k.code]!,
            data: k.hist!,
          }))}
          unit="%"
          dec={1}
          zero={false}
          height={270}
        />
      </TheDashboard>

      <TheDashboard
        nhip={12}
        tieuDe="Bản đồ nhiệt đạt / chưa đạt theo kỳ"
        moPhong
        phu="Màu xanh đậm dần theo mức vượt mục tiêu · đỏ = chưa đạt · xám = chưa có dữ liệu"
      >
        <div className="overflow-x-auto">
          <BanDoNhiet kpis={kpis} labels={P9} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-body">
          {O_CHU.map((o) => (
            <span key={o.nhan}>
              <i
                className="mr-1.5 inline-block size-2.5 rounded-[3px] align-[-1px]"
                style={{ background: o.nen }}
              />
              {o.nhan}
            </span>
          ))}
          <span>
            <i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-bd-nen-phu align-[-1px] outline outline-1 outline-bd-truc" />
            Chưa có dữ liệu
          </span>
        </div>
      </TheDashboard>

      <TheDashboard
        nhip={12}
        tieuDe="Bảng tổng hợp & truy xuất nguồn số liệu"
        phu="Hiện trạng KPI được tính tự động từ chỉ tiêu tại dashboard lĩnh vực – bấm tên dashboard để xem chi tiết"
      >
        <div className="overflow-x-auto">
          <table className={LOP_BANG}>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Chỉ số KPI</th>
                <th style={{ textAlign: 'right' }}>Mục tiêu</th>
                <th style={{ textAlign: 'right' }}>Hiện trạng</th>
                <th style={{ textAlign: 'right' }}>Chênh lệch</th>
                <th>Trạng thái</th>
                <th>Cách tính từ chỉ tiêu nguồn</th>
                <th>Dashboard nguồn</th>
                <th>Đầu mối</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.code}>
                  <td className="whitespace-nowrap text-faint">{k.code}</td>
                  <td className="text-ink">{k.name}</td>
                  <td className="tnum whitespace-nowrap text-ink" style={{ textAlign: 'right' }}>
                    ≥ {k.t}%
                  </td>
                  <td className="tnum text-ink" style={{ textAlign: 'right' }}>
                    <b>{k.v == null ? '—' : `${soCoDinh(k.v, k.v % 1 ? 2 : 0)}%`}</b>
                  </td>
                  <td
                    className={`tnum ${k.met ? 'text-bd-dat-chu' : k.met === false ? 'text-bd-chua-dat' : 'text-ink'}`}
                    style={{ textAlign: 'right' }}
                  >
                    {k.v == null ? '—' : `${k.v - k.t >= 0 ? '+' : ''}${soCoDinh(k.v - k.t, 2)}`}
                  </td>
                  <td>
                    {k.met === null ? (
                      <NhanDanhGia loai="na" coIcon>
                        Chưa có dữ liệu
                      </NhanDanhGia>
                    ) : k.met ? (
                      <NhanDanhGia loai="ok" coIcon>
                        Đạt
                      </NhanDanhGia>
                    ) : (
                      <NhanDanhGia loai="no" coIcon>
                        Chưa đạt
                      </NhanDanhGia>
                    )}
                  </td>
                  <td className="text-body">{k.how}</td>
                  <td>
                    {k.src ? (
                      <LienKetTrang module={d.TRANG[k.src].module}>{k.srcName} →</LienKetTrang>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="text-body">{k.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TheDashboard>

      <TheDashboard nhip={12} tieuDe="Lưu ý" phu={' '}>
        <GhiChuCanhBao ds={d.GHI_CHU_KPI} />
      </TheDashboard>
    </LuoiDashboard>
  )
}
