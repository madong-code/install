/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 当前场景（版本）：standard 标准版 | saas 多租户版，默认 standard */
  readonly VITE_APP_EDITION?: string
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
