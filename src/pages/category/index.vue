<template>
  <MallPage public-page>
    <template #navigation><CatalogNav /></template>
    <view v-if="catalog.loading" class="mx-empty">正在加载商品…</view>
    <view v-else-if="catalog.error" class="mx-empty"><view>{{ catalog.error }}</view><button class="mx-button" @tap="catalog.load(true)">重新加载</button></view>
    <view v-else class="category-layout"><scroll-view scroll-y class="category-side"><button v-for="item in catalog.categories" :key="item.id" class="category-link" :class="{ active: catalog.selectedCategory === item.id }" @tap="catalog.selectedCategory = item.id">{{ item.name }}</button></scroll-view><view class="category-products"><CatalogCards :items="items" cart-entry variant="category" /><view v-if="!items.length" class="mx-empty mx-muted">该分类暂无商品</view></view></view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed } from 'vue';import { onShow } from '@dcloudio/uni-app';import { useCatalogStore } from '@/store/catalog';
import MallPage from '@/components/mall/MallPage.vue';import CatalogNav from '@/components/mall/CatalogNav.vue';import CatalogCards from '@/components/mall/CatalogCards.vue';
const catalog = useCatalogStore();const items = computed(() => catalog.goods.filter(item => item.category_id === catalog.selectedCategory));
onShow(() => { void catalog.load(); });
</script>
<style scoped>
.category-layout { display: flex; align-items: stretch; min-height: 960rpx; background: #EDF2F7; }
.category-side { box-sizing: border-box; width: 152rpx; flex-shrink: 0; padding-top: 16rpx; height: calc(100vh - 200rpx); min-height: 960rpx; background: #EDF2F7; }
.category-link { position: relative; box-sizing: border-box; width: 100%; min-height: 128rpx; margin: 0; padding: 32rpx 16rpx; border-radius: 0; background: transparent; color: #495566; font-size: 26rpx; line-height: 1.5; }
.category-link::after { border: 0; }
.category-link.active { background: #fff; color: #164E70; font-weight: 600; }
.category-link.active::before { content: ''; position: absolute; left: 0; top: 40rpx; bottom: 40rpx; width: 6rpx; background: #8AD0F9; border-radius: 4rpx; }
.category-products { flex: 1; min-width: 0; box-sizing: border-box; padding: 32rpx 20rpx; background: #fff; border-radius: 36rpx 0 0 0; }
</style>
