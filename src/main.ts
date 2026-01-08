import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { initConfig, getConfig } from './utils/config'

// 动态设置页面标题
function setDocumentTitle(title?: string) {
  const defaultTitle = 'MDAdmin 安装向导'
  const config = getConfig()
  const finalTitle = title || config.installInfo.title || defaultTitle
  document.title = finalTitle
  
  // 同时更新meta标签（如果需要）
  const titleElement = document.getElementById('dynamic-title')
  if (titleElement) {
    titleElement.textContent = finalTitle
  }
}

// 初始化配置
async function bootstrap() {
  // 等待配置初始化完成
  await initConfig()
  
  // 设置动态标题
  setDocumentTitle()
  
  const app = createApp(App)
  const pinia = createPinia()
  
  app.use(ElementPlus)
  app.use(pinia)
  app.mount('#app')
}

bootstrap().catch(console.error)