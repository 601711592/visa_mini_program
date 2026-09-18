<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useGlobalStore } from './store/global';
import { MALL_PREVIEW } from './mall/config';
const global = useGlobalStore();
onLaunch(() => {
  // 独立演示不读取、清理或校验真实账号缓存。
  if (!MALL_PREVIEW) void global.initialize();
});
onShow(() => {
  if (!MALL_PREVIEW && global.status !== 'authenticating' && !global.loginOpen) void global.restoreSession();
});
onHide(() => {});
</script>
<style lang="scss">
/* 保留既有全局布局工具，商城组件使用独立 mx- 前缀。 */
.flex {
  display: flex;
  &-1 { flex: 1; }
  &-r-c { display: flex; align-items: center; }
  &-r-fs { display: flex; align-items: flex-start; }
  &-r-fe { display: flex; align-items: flex-end; }
  &-r-fe-sb { display: flex; align-items: flex-end; justify-content: space-between; }
  &-r-fs-sb { display: flex; align-items: flex-start; justify-content: space-between; }
  &-r-c-fs { display: flex; align-items: center; justify-content: flex-start; }
  &-r-fs-fe { display: flex; align-items: flex-start; justify-content: flex-end; }
  &-r-c-c { display: flex; align-items: center; justify-content: center; }
  &-r-fs-c { display: flex; align-items: flex-start; justify-content: center; }
  &-r-fe-c { display: flex; align-items: flex-end; justify-content: center; }
  &-c { display: flex; flex-direction: column; }
  &-c-fe { display: flex; flex-direction: column; align-items: flex-end; }
  &-c-c { display: flex; flex-direction: column; justify-content: center; }
  &-c-c-c { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  &-c-c-fe { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
  &-c-fs-c { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
  &-c-c-fs { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
  &-c-sb-c { display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
  &-c-fs-fs { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; }
  &-r-c-sb { display: flex; align-items: center; justify-content: space-between; }
  &-r-c-sa { display: flex; align-items: center; justify-content: space-around; }
  &-r-c-fe { display: flex; align-items: center; justify-content: flex-end; }
  &-s-0 { flex-shrink: 0; }
  &-w { display: flex; flex-wrap: wrap; }
}
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.b { font-weight: bold; }.t-c { text-align: center; }.t-r { text-align: right; }.t-l { text-align: left; }
@for $i from 0 through 60 {
  .mt#{$i} { margin-top: #{$i}px !important; }.mr#{$i} { margin-right: #{$i}px !important; }
  .mb#{$i} { margin-bottom: #{$i}px !important; }.ml#{$i} { margin-left: #{$i}px !important; }.m#{$i} { margin: #{$i}px; }
  .pt#{$i} { padding-top: #{$i}px !important; }.pr#{$i} { padding-right: #{$i}px !important; }
  .pb#{$i} { padding-bottom: #{$i}px !important; }.pl#{$i} { padding-left: #{$i}px !important; }.p#{$i} { padding: #{$i}px; }
}
.safe-area-inset-bottom { padding-bottom: 0 !important; padding-bottom: constant(safe-area-inset-bottom) !important; padding-bottom: env(safe-area-inset-bottom) !important; }
</style>
