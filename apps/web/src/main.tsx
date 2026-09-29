import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrangNenMong } from '@/trang-nen-mong'
import '@/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrangNenMong />
  </StrictMode>,
)
