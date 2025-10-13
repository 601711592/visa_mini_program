import { defineConfig } from 'vite';
import Unocss from 'unocss/vite';
import uni from '@dcloudio/vite-plugin-uni';
import postcssPxtorpxPro from 'postcss-pxtorpx-pro';
import VueTypeImports from 'vite-plugin-vue-type-imports';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni(), VueTypeImports(), Unocss()],
  css: {
    postcss: {
      plugins: [postcssPxtorpxPro({ transform: (x) => x, exclude: 'node_modules' })],
    },
  },
});
