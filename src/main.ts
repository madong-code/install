import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './style/index.scss';
import App from './App.vue';
import { createPinia } from 'pinia';
import { initConfig, getConfig } from './utils/config';

function setDocumentTitle(title?: string) {
  const config = getConfig();
  const finalTitle = title || config.installInfo.title || 'MDAdmin 安装向导';
  document.title = finalTitle;
}

async function bootstrap() {
  await initConfig();
  setDocumentTitle();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(ElementPlus);
  app.use(pinia);
  app.mount('#app');
}

bootstrap().catch(console.error);
