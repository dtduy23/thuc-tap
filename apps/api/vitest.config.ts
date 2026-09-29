import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

// esbuild (mặc định của Vitest) không phát decorator metadata, mà NestJS dựa
// vào nó để tiêm phụ thuộc theo kiểu. Không có SWC thì test khởi tạo module
// sẽ nhận `undefined` thay vì service — lỗi khó hiểu, mất cả buổi mới ra.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
