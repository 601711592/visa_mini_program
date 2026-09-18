<template>
  <MallPage public-page>
    <view class="mx-body">
      <view class="search-field"><MallIcon name="search" :size="34" /><input v-model="value" class="mx-input" placeholder="请输入商品关键词" :focus="true" confirm-type="search" @input="schedule" @confirm="search" /><button v-if="value" class="mx-button mx-plain" @tap="clear">清除</button></view>
      <view v-if="loading" class="mx-empty">搜索中…</view>
      <view v-else-if="error" class="mx-empty"><view>{{ error }}</view><button class="mx-button" @tap="search">重新搜索</button></view>
      <CatalogCards v-else-if="items.length" :items="items" />
      <view v-else class="mx-empty mx-muted">{{ value.trim() ? '没有找到相关商品，请试试其他关键词' : '输入关键词查找商品' }}</view>
    </view>
  </MallPage>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onUnload } from '@dcloudio/uni-app';
import { getGoodsList, type Goods } from '@/services/shop';
import { demoGoods } from '@/mall/fixtures';
import { MALL_PREVIEW } from '@/mall/config';
import MallPage from '@/components/mall/MallPage.vue';
import MallIcon from '@/components/mall/MallIcon.vue';
import CatalogCards from '@/components/mall/CatalogCards.vue';
const value = ref(''), loading = ref(false), error = ref('');
const items = ref<Goods[]>([]);
let timer: ReturnType<typeof setTimeout> | undefined;
let sequence = 0;
async function search() {
  if (timer) clearTimeout(timer);
  const run = ++sequence, keyword = value.value.trim();
  error.value = ''; items.value = [];
  if (!keyword) { loading.value = false; return; }
  loading.value = true;
  try {
    const results = MALL_PREVIEW ? demoGoods().filter(item => item.name.toLowerCase().includes(keyword.toLowerCase())) : (await getGoodsList({ pageSize: 100, name: keyword })).data.data;
    if (run === sequence) items.value = results;
  } catch (e) { if (run === sequence) error.value = e instanceof Error ? e.message : '搜索失败，请重试'; }
  finally { if (run === sequence) loading.value = false; }
}
function schedule() { ++sequence; if (timer) clearTimeout(timer); loading.value = !!value.value.trim(); timer = setTimeout(search, 300); }
function clear() { value.value = ''; void search(); }
onUnload(() => { ++sequence; if (timer) clearTimeout(timer); });
</script>
<style scoped>.search-field { display: flex; align-items: center; background: #fff; border-radius: 24rpx; padding: 0 20rpx; margin-bottom: 24rpx; }.search-field input { flex: 1; min-width: 0; margin-left: 16rpx; }.search-field button { flex-shrink: 0; }</style>
