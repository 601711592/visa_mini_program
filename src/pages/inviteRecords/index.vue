<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="empty-state">
          <image src="/static/images/center/users.png" mode="aspectFit" />
          <view class="empty-h">暂无邀请记录</view>
          <view class="empty-p">功能上线后，可在这里查看邀请状态与奖励记录。</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';

const global = useGlobalStore();

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pages/inviteRecords/index' }))) return;
});
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
