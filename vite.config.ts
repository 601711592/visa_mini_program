import { defineConfig, loadEnv } from 'vite';
import Unocss from 'unocss/vite';
import uni from '@dcloudio/vite-plugin-uni';
import postcssPxtorpxPro from 'postcss-pxtorpx-pro';
import VueTypeImports from 'vite-plugin-vue-type-imports';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());

  // uni() 初始化时就可能读取并缓存 manifest，必须在创建插件前写入当前环境的 AppID。
  if (env.VITE_APP_ID) {
    const manifestPath = path.resolve(__dirname, 'src/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest['mp-weixin']) {
      manifest['mp-weixin'].appid = env.VITE_APP_ID;
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ 已更新 manifest.json 中的 appid 为: ${env.VITE_APP_ID}`);
  }

  return {
    plugins: [
      uni(),
      VueTypeImports(),
      Unocss(),
    ],
    css: {
      postcss: {
        plugins: [postcssPxtorpxPro({ transform: (x) => x, exclude: 'node_modules' })],
      },
    },
  };
});
