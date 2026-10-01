import { DON_VI } from '@/dieu-hanh/mocks/data'

/** Port từ .hero — dải ngang xanh navy có ảnh nền mờ và câu trích bên phải. */
export function Hero() {
  return (
    <div className="relative mb-4 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[14px] bg-[linear-gradient(100deg,#0A2540_25%,#134FA8_90%)] px-6 py-6 sm:px-[30px] md:flex-row md:items-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[url('https://loremflickr.com/1400/300/city,vietnam?lock=88')] bg-cover bg-[center_60%] opacity-25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(10,37,64,.55),rgba(19,79,168,.15))]"
        aria-hidden="true"
      />
      <div className="relative z-10 text-white">
        <h2 className="text-[1.1rem] font-extrabold tracking-[0.02em] sm:text-[1.32rem]">
          {DON_VI.heroTieuDe}
        </h2>
        <div className="mt-1.5 text-[0.7rem] font-bold tracking-[0.07em] opacity-95 sm:text-[0.76rem]">
          DÂN BIẾT · DÂN BÀN · DÂN LÀM · DÂN KIỂM TRA · DÂN GIÁM SÁT · DÂN THỤ HƯỞNG
        </div>
      </div>
      <div className="relative z-10 border-r-[3px] border-hero-rule pr-3 text-left text-[0.82rem] italic leading-[1.5] text-white md:text-right">
        "Lấy người dân làm
        <br />
        trung tâm phục vụ"
      </div>
    </div>
  )
}
