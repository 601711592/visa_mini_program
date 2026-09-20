<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="card-h">奖励规则待公布</view>
        <view class="para">奖励金额、获得条件、发放时间及邀请关系建立方式尚未确定。</view>
        <view class="para">正式规则发布后将在此展示，当前不生成推荐码或计算邀请奖励。</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';

const global = useGlobalStore();

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pages/inviteRules/index' }))) return;
});
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
