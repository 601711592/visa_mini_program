<template>
  <view class="center-page">
    <view class="balance-hero">
      <text>与好友分享出行服务</text>
      <view class="hero-h2">邀请好友</view>
      <view class="hero-p">一起发现适合自己的签证服务</view>
    </view>
    <view class="page-body">
      <view class="sheet-card">
        <view class="invite-metrics">
          <view>
            <text class="metric-value">—</text>
            <text>成功邀请</text>
          </view>
          <view>
            <text class="metric-value">—</text>
            <text>推荐奖励积分</text>
          </view>
        </view>
        <view class="hint">邀请功能尚未上线，记录与奖励暂未开放。</view>
        <view class="btn solid full" @tap="go('/pages/inviteShare/index')">查看邀请方式</view>
      </view>
      <view class="sheet-card">
        <view class="menu-row" @tap="go('/pages/inviteRecords/index')">
          <image src="/static/images/center/users.png" mode="aspectFit" />
          <text>邀请记录</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="menu-row" @tap="go('/pages/inviteRules/index')">
          <image src="/static/images/center/file-text.png" mode="aspectFit" />
          <text>奖励规则</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
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
  if (!(await global.ensureLogin({ target: '/pages/invite/index' }))) return;
});

function go(url: string) {
  uni.navigateTo({ url });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.sheet-card .btn {
  margin-top: 20rpx;
}
</style>
