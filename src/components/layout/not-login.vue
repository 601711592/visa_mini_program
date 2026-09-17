<template>
  <view class="login-required">
    <text class="title">{{ global.status === 'checking' ? '正在校验登录状态…' : '登录后查看个人信息' }}</text>
    <button v-if="global.status !== 'checking'" @tap="login">手机号快捷登录</button>
  </view>
</template>
<script setup lang="ts">
import { useGlobalStore } from '@/store/global';
const global = useGlobalStore();
function login() { void global.ensureLogin(); }
</script>
<style scoped>
.login-required { padding: 100rpx 48rpx; text-align: center; }
.title { display: block; font-size: 32rpx; color: #202631; margin-bottom: 40rpx; }
button { background: #8AD0F9; color: #164E70; border-radius: 48rpx; min-height: 88rpx; font-size: 28rpx; }
button::after { border: 0; }
</style>
