import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allow Render host when running `vite preview` in production
  preview: {
    allowedHosts: ['taskmanageruiapplication.onrender.com'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
