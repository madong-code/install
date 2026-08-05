import { createApp } from 'vue';

import { createPinia } from 'pinia';

import App from './App.vue';
import { getConfig, initConfig } from './utils/config';

function setDocumentTitle(title?: string) {
  const defaultTitle = 'Madong 安装向导';
  const config = getConfig();
  const finalTitle = title || config.installInfo?.title || defaultTitle;
  document.title = finalTitle;

  const titleElement = document.querySelector('#dynamic-title');
  if (titleElement) {
    titleElement.textContent = finalTitle;
  }
}

async function bootstrap() {
  await initConfig();
  setDocumentTitle();

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.mount('#app');
}

bootstrap().catch(console.error);
