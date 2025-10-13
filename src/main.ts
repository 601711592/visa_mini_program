import { createSSRApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { getAssetUrl } from './utils';
import 'uno.css';

export function createApp() {
  const pinia = createPinia();
  const app = createSSRApp(App);
  app.use(pinia);
  app.config.globalProperties.getAssetUrl = getAssetUrl;
  return {
    app,
  };
}
