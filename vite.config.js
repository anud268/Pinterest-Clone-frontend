import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Restrictive Content Security Policy for production builds. Browser-side E2EE is only as
// strong as the code running on this origin, so scripts are limited to our own files.
// (Not applied in dev: Vite's HMR needs inline scripts.)
const contentSecurityPolicy = (apiUrl) => {
  const api = new URL(apiUrl)
  const ws = `${api.protocol === 'https:' ? 'wss:' : 'ws:'}//${api.host}`
  return [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    `connect-src 'self' ${api.origin} ${ws} https://ik.imagekit.io`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3500'
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'content-security-policy',
        apply: 'build',
        transformIndexHtml: (html) =>
          html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(apiUrl)}" />`),
      },
    ],
    // The crypto package loads its .wasm via new URL(..., import.meta.url); pre-bundling breaks that
    optimizeDeps: { exclude: ['@matrix-org/matrix-sdk-crypto-wasm'] },
  }
})
