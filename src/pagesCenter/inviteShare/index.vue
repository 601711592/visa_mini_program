<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="card-h">邀请方式</view>
        <view class="para">后续将在微信小程序内提供邀请入口。</view>
        <view class="btn solid full disabled" disabled>
          <image src="/static/images/center/send.png" mode="aspectFit" />
          <text>分享邀请 · 待上线</text>
        </view>
        <view class="hint">邀请链接、推荐码及海报的采用方式待确认。</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';

const global = useGlobalStore();

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/inviteShare/index' }))) return;
});
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.btn image {
  width: 30rpx;
  height: 30rpx;
}
</style>
