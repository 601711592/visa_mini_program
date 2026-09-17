<template>
  <view class="account-page">
    <view v-if="global.status === 'checking'" class="card">正在校验登录状态…</view>
    <view v-else-if="global.isLogin && global.userInfo" class="card">
      <text class="title">{{ global.userInfo.nickname || '已登录' }}</text>
      <text class="phone">{{ global.userInfo.phone_masked }}</text>
      <button class="primary" @tap="openPrivacyContract">隐私保护指引</button>
      <button class="secondary" @tap="logout">退出登录</button>
    </view>
    <view v-else class="card">
      <text class="title">登录后使用会员服务</text>
      <text v-if="global.sessionError" class="hint">{{ global.sessionError }}</text>
      <button class="primary" @tap="login">手机号快捷登录</button>
      <button v-if="global.sessionError" class="secondary" @tap="global.restoreSession()">重新校验登录状态</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { useGlobalStore } from '@/store/global';
import { openPrivacyContract } from '@/utils/wechat-privacy';
import { ACCOUNT_PAGE } from '@/utils/auth-routing';
const global = useGlobalStore();
function login() { void global.ensureLogin({ target: ACCOUNT_PAGE }); }
function logout() {
  uni.showModal({ title: '退出登录', content: '退出后将清理本机出行人、地址和联系电话草稿，商品选择会保留。',
    success: (result) => { if (result.confirm) void global.logout(); },
  });
}
</script>
<style scoped>
.account-page { min-height: 100vh; padding: 24rpx; box-sizing: border-box; background: #F4F6FA; color: #495566; }
.card { background: white; border-radius: 24rpx; padding: 40rpx; }
.title { display: block; color: #202631; font-size: 34rpx; font-weight: 600; margin-bottom: 24rpx; }
.phone,.hint { display: block; margin: 24rpx 0; font-size: 28rpx; }
.primary,.secondary { margin-top: 24rpx; min-height: 88rpx; font-size: 28rpx; color: #164E70; border-radius: 44rpx; }
.primary { background: #8AD0F9; }
.secondary { background: #EAF6FD; }
button::after { border: 0; }
</style>
