import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default ({ mode }: { mode: string }) => {

  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_VERSION, VITE_PORT, VITE_BASE_URL, VITE_API_URL, VITE_API_PROXY_URL } = env
  return defineConfig({

    plugins: [
      vue(),
      // 自动导入 Element Plus 组件
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue'],
        dts: 'src/auto-imports.d.ts'
      }),
      // 自动导入 Vue 组件
      Components({
        resolvers: [
          // 自动导入 Element Plus 组件
          ElementPlusResolver(),
        ],
        dts: 'src/components.d.ts'
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: Number(VITE_PORT),
      proxy: {
        '/adminapi': {
          target: VITE_API_PROXY_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/adminapi/, '/adminapi')
        }
      },
      host: true
    },
    base: VITE_BASE_URL,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      // 确保配置文件被正确复制
      rollupOptions: {
        external: [],
        output: {
          manualChunks: undefined
        }
      }
    },
    // 确保 public 目录下的文件被复制到输出目录
    publicDir: 'public'
  })

}
