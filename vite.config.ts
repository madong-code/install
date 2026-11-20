import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_PORT, VITE_BASE, VITE_GLOB_API_URL } = env
  const proxyTarget =
    process.env.VITE_PROXY_TARGET ||
    env.VITE_PROXY_TARGET ||
    'http://127.0.0.1:8500/adminapi'

  return defineConfig({
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src'),
      },
    },
    server: {
      port: Number(VITE_PORT) || 5888,
      proxy: {
        '/adminapi': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/adminapi/, ''),
          ws: true,
        },
      },
      host: '0.0.0.0',
      allowedHosts: true,
    },
    base: VITE_BASE || '/',
    build: {
      // 构建产物直接输出到后端 backend/public/install，安装向导随构建即用，
      // 无需手动复制；outDir 在项目根之外，必须显式 emptyOutDir 才会清空重建
      outDir: resolve(import.meta.dirname, '../../backend/public/install'),
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
    },
    publicDir: 'public',
  })
}
