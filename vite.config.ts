import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/ai-tg-bot-miniapp/'

  return {
    plugins: [react(), tailwindcss()],
    base,
    server: {
      port: 5173,
      host: true,
    },
  }
})
