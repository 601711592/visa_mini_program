<template>
  <layout :navbar="{ backgroundColor: '#8AD0F9', fixed: true }">
    <template #navbarRight><button class="home-cart" aria-label="购物车" @tap="go('cart')"><MallIcon name="cart" :size="40" /></button></template>
    <MallPage public-page>
      <view class="page mx-body">
        <button class="home-search" @tap="search"><MallIcon name="search" :size="32" /><text>点击搜索商品</text></button>
        <image v-if="MALL_PREVIEW" class="home-promo" src="/static/images/login-travel.png" mode="aspectFit" aria-hidden="true" />
        <view v-else class="company home-promo" />
        <scroll-view scroll-x class="home-categories"><view class="home-category-row"><button v-for="item in catalog.categories" :key="item.id" :class="{ active: catalog.homeCategory === item.id }" @tap="catalog.homeCategory = item.id">{{ item.name }}</button></view></scroll-view>
        <view v-if="catalog.loading" class="mx-empty">正在加载商品…</view>
        <view v-else-if="catalog.error" class="mx-empty"><view>{{ catalog.error }}</view><button class="mx-button" @tap="catalog.load(true)">重新加载</button></view>
        <CatalogCards v-else :items="items" />
        <view v-if="catalog.loaded && !catalog.loading && !catalog.error && !items.length" class="mx-empty mx-muted">暂无商品</view>
      </view>
    </MallPage>
  </layout>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { onShow, onShareAppMessage } from '@dcloudio/uni-app';
import { useCatalogStore } from '@/store/catalog';
import { MALL_PREVIEW } from '@/mall/config';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import MallIcon from '@/components/mall/MallIcon.vue';
import CatalogCards from '@/components/mall/CatalogCards.vue';
const catalog = useCatalogStore();
const items = computed(() => catalog.homeCategory ? catalog.goods.filter(item => item.category_id === catalog.homeCategory) : catalog.goods);
function search() { uni.navigateTo({ url: '/pages/search/index' }); }
onShow(() => { void catalog.load(); });
onShareAppMessage(() => ({ title: import.meta.env.VITE_APP_TITLE }));
</script>
<style lang="scss" scoped>
@import './index.scss';
.home-search { display: flex; align-items: center; width: 100%; min-height: 88rpx; padding: 20rpx 24rpx; margin: 0; border-radius: 44rpx; background: white; color: #737D8C; font-size: 27rpx; line-height: 1.5; }
.home-search text { margin-left: 16rpx; }.home-search::after,.home-cart::after { border: 0; }
.home-cart { display: flex; align-items: center; justify-content: center; min-width: 64rpx; height: 88rpx; padding: 0; background: transparent; }
.home-promo { display: block; width: 100%; height: 340rpx; margin: 24rpx 0; border-radius: 24rpx; background-color: #EAF6FD; }
.home-categories { margin-bottom: 24rpx; white-space: nowrap; }.home-category-row { display: flex; }
.home-category-row button { flex: 1; min-width: 190rpx; min-height: 88rpx; margin: 0 16rpx 0 0; padding: 18rpx; border-radius: 16rpx; font-size: 28rpx; color: #737D8C; background: #fff; }
.home-category-row button::after { border: 0; }.home-category-row button.active { color: #164E70; background: #DCEFFC; font-weight: 600; }
</style>
