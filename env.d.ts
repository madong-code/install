/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 版本模式（三态）：'standard' 强制标准版 / 'saas' 强制多租户版（均按前端 env 锁定，
   * 运行时接口不可翻转）/ 'auto' 自动识别（框架验证接口判断，异常自动回退标准版）。
   * 未配置时等同 'auto'
   */
  readonly VITE_APP_EDITION?: 'auto' | 'saas' | 'standard' | (string & {})
  /** SaaS 场景下「多租户」部署模式的默认选中值（Vite 环境变量恒为字符串） */
  readonly VITE_ENABLE_TENANT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
