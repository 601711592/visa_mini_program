<template>
  <view class="agreement-page">
    <text class="title">{{ agreement.title }}</text>
    <text class="version">版本：{{ agreement.version }}</text>
    <text class="content" selectable>{{ agreement.content }}</text>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { LOGIN_AGREEMENTS, type LoginAgreementKind } from '@/content/login-agreements';
const kind = ref<LoginAgreementKind>('service');
const agreement = computed(() => LOGIN_AGREEMENTS[kind.value]);
// 只读取本地协议；未知类型回退到服务协议，不请求后端。
onLoad((query) => {
  kind.value = query?.kind === 'privacy' ? 'privacy' : 'service';
  uni.setNavigationBarTitle({ title: agreement.value.title });
});
</script>
<style scoped>.agreement-page { padding: 40rpx; background: #fff; min-height: 100vh; box-sizing: border-box; color: #495566; }.title { display: block; font-size: 36rpx; font-weight: 600; color: #202631; margin-bottom: 24rpx; }.version { display: block; color: #737D8C; font-size: 24rpx; margin: 24rpx 0; }.content { white-space: pre-wrap; line-height: 1.8; font-size: 28rpx; }</style>
