import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { CAU_HINH, type CauHinh } from './cau-hinh.js'

async function khoiDong() {
  const app = await NestFactory.create(AppModule)
  // Mọi route nằm dưới /api: web gọi đường dẫn tương đối, nginx chuyển tiếp
  // đúng một tiền tố — cùng cách GDOS cũ đã chạy ổn trên gdos.fox.ai.vn.
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  const { cong, moiTruong } = app.get<CauHinh>(CAU_HINH)
  await app.listen(cong)
  console.log(`GDOS API · ${moiTruong} · http://localhost:${cong}/api/health`)
}

void khoiDong()
