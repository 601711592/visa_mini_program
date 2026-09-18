<template><view class="agreement-page"><template v-if="MALL_PREVIEW"><text class="title">协议阅读演示</text><text class="content">当前为前端预览，不读取正式服务协议、不发起注册。正式协议仍由原有接口在非预览模式读取，不使用演示文字代替。</text></template><text v-else-if="loading">正在加载协议…</text><view v-else-if="error"><text>{{ error }}</text><button @tap="load">重新加载</button></view><view v-else-if="agreement"><text class="title">{{ agreement.title }}</text><text class="version">版本：{{ agreement.version }}</text><text class="content" selectable>{{ agreement.content }}</text></view></view></template>
<script setup lang="ts">
import { ref } from 'vue';import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getServiceAgreement, type ServiceAgreement } from '@/services/login';import { MALL_PREVIEW } from '@/mall/config';
const loading = ref(false), error = ref(''), agreement = ref<ServiceAgreement | null>(null);let alive = true;
async function load() {
  if (loading.value || MALL_PREVIEW) return;
  loading.value = true; error.value = '';
  try { const result = await getServiceAgreement(); if (alive) agreement.value = result.data; }
  catch (e) { if (alive) error.value = e instanceof Error ? e.message : '协议加载失败'; }
  finally { if (alive) loading.value = false; }
}
onLoad(load);onUnload(() => { alive = false; });
</script>
<style scoped>.agreement-page { padding: 40rpx; background: #fff; min-height: 100vh; box-sizing: border-box; color: #495566; }.title { display: block; font-size: 36rpx; font-weight: 600; color: #202631; margin-bottom: 24rpx; }.version { display: block; color: #737D8C; font-size: 24rpx; margin: 24rpx 0; }.content { white-space: pre-wrap; line-height: 1.8; font-size: 28rpx; }</style>
