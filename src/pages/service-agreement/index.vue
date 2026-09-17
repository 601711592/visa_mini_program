<template>
  <view class="agreement-page">
    <text v-if="loading">正在加载协议…</text>
    <view v-else-if="error"><text>{{ error }}</text><button @tap="load">重新加载</button></view>
    <view v-else-if="agreement"><text class="title">{{ agreement.title }}</text><text class="version">版本：{{ agreement.version }}</text><text class="content" selectable>{{ agreement.content }}</text></view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getServiceAgreement, type ServiceAgreement } from '@/services/login';
const loading = ref(false);
const error = ref('');
const agreement = ref<ServiceAgreement | null>(null);
async function load() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  try { agreement.value = (await getServiceAgreement()).data; }
  catch (e) { error.value = e instanceof Error ? e.message : '协议加载失败'; }
  finally { loading.value = false; }
}
onLoad(load);
</script>
<style scoped>
.agreement-page { padding: 40rpx; background: #fff; min-height: 100vh; box-sizing: border-box; color: #495566; }
.title { display: block; font-size: 36rpx; font-weight: 600; color: #202631; }
.version { display: block; color: #737D8C; font-size: 24rpx; margin: 24rpx 0; }
.content { white-space: pre-wrap; line-height: 1.8; font-size: 28rpx; }
</style>
