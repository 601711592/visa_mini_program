<template>
  <MallPage public-page>
    <template #navigation><CatalogNav /></template>
    <view v-if="catalog.loading" class="mx-empty">正在加载商品…</view>
    <view v-else-if="catalog.error" class="mx-empty"><view>{{ catalog.error }}</view><button class="mx-button" @tap="catalog.load(true)">重新加载</button></view>
    <view v-else class="category-layout"><scroll-view scroll-y class="category-side"><button v-for="item in catalog.categories" :key="item.id" class="category-link" :class="{ active: catalog.selectedCategory === item.id }" @tap="catalog.selectedCategory = item.id">{{ item.name }}</button></scroll-view><view class="category-products"><CatalogCards :items="items" cart-entry /><view v-if="!items.length" class="mx-empty mx-muted">该分类暂无商品</view></view></view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed } from 'vue';import { onShow } from '@dcloudio/uni-app';import { useCatalogStore } from '@/store/catalog';
import MallPage from '@/components/mall/MallPage.vue';import CatalogNav from '@/components/mall/CatalogNav.vue';import CatalogCards from '@/components/mall/CatalogCards.vue';
const catalog = useCatalogStore();const items = computed(() => catalog.goods.filter(item => item.category_id === catalog.selectedCategory));
onShow(() => { void catalog.load(); });
</script>
<style scoped>
.category-layout { display: flex; align-items: flex-start; min-height: 80vh; }.category-side { width: 170rpx; flex-shrink: 0; height: 76vh; background: #EDF1F6; }.category-link { position: relative; width: 100%; min-height: 104rpx; margin: 0; padding: 28rpx 14rpx; border-radius: 0; background: transparent; color: #737D8C; font-size: 27rpx; line-height: 1.6; }.category-link::after { border: 0; }.category-link.active { background: #F4F6FA; color: #164E70; font-weight: 600; }.category-link.active::before { content: ''; position: absolute; left: 0; top: 32rpx; bottom: 32rpx; width: 6rpx; background: #8AD0F9; border-radius: 3rpx; }.category-products { flex: 1; min-width: 0; padding: 24rpx 18rpx; }
</style>
