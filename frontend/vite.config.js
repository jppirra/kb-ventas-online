import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { port: 5173, https: true },
  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify('v' + (pkg.appVersion || pkg.version))
  }
})
