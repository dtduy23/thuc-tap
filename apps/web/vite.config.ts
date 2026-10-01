import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    strictPort: true,
    // Web luôn gọi đường dẫn TƯƠNG ĐỐI /api — ở máy dev thì Vite chuyển tiếp,
    // trên server thì nginx chuyển tiếp. Bundle không cứng địa chỉ nào.
    proxy: { '/api': 'http://localhost:4100' },
  },
})
