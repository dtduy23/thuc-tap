import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { CAU_HINH, type CauHinh } from './cau-hinh.js'

async function khoiDong() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // Mọi route nằm dưới /api: web gọi đường dẫn tương đối, nginx chuyển tiếp
  // đúng một tiền tố — cùng cách GDOS cũ đã chạy ổn trên gdos.fox.ai.vn.
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
  // Chỉ tin header X-Forwarded-For từ nginx chạy cùng máy — IP ghi vào phiên
  // đăng nhập phải là IP thật của người dùng, không phải IP người dùng tự khai.
  app.set('trust proxy', 'loopback')
  // Xuất lưới ra Excel gửi lên cả phần đang lọc — nới giới hạn JSON mặc định (100 KB).
  app.useBodyParser('json', { limit: '2mb' })

  const { cong, moiTruong } = app.get<CauHinh>(CAU_HINH)
  await app.listen(cong)
  console.log(`GDOS API · ${moiTruong} · http://localhost:${cong}/api/health`)
}

void khoiDong()
