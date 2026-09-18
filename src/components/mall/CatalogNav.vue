<template>
  <view class="catalog-nav-space" :style="{ height: height + 'px' }" />
  <view class="catalog-nav" :style="{ height: height + 'px', paddingTop: status + 'px' }"><view class="catalog-nav-row" :style="{ height: rowHeight + 'px', paddingRight: right + 'px' }"><button class="catalog-cart" aria-label="购物车" @tap="go('cart')"><MallIcon name="cart" :size="38" /></button><button class="catalog-search" @tap="search"><MallIcon name="search" :size="30" /><text>搜索国家或商品</text></button></view></view>
</template>
<script setup lang="ts">
import { ref } from 'vue';import { go } from '@/mall/navigation';import MallIcon from './MallIcon.vue';
const status = ref(20), rowHeight = ref(44), right = ref(16), height = ref(64);
try { const info = uni.getSystemInfoSync(); status.value = info.statusBarHeight || 0;
// #ifdef MP-WEIXIN
const rect = uni.getMenuButtonBoundingClientRect(); if (rect && rect.width && rect.top) { right.value = Math.max(16, info.windowWidth - rect.left + 8); rowHeight.value = Math.max(44, rect.height + 2 * (rect.top - status.value)); }
// #endif
height.value = status.value + rowHeight.value; } catch { /* 非微信预览沿用安全默认值。 */ }
function search() { uni.navigateTo({ url: '/pages/search/index' }); }
</script>
<style scoped>
.catalog-nav { position: fixed; left: 0; top: 0; right: 0; z-index: 50; box-sizing: border-box; background: #8AD0F9; }
.catalog-nav-row { box-sizing: border-box; padding-left: 20rpx; display: flex; align-items: center; }
.catalog-cart { width: 80rpx; flex-shrink: 0; min-height: 88rpx; display: flex; align-items: center; justify-content: center; margin: 0 12rpx 0 0; padding: 0; border-radius: 0; background: transparent; }
.catalog-search { display: flex; align-items: center; flex: 1; min-width: 0; height: 70rpx; padding: 0 20rpx; margin: 0; border-radius: 36rpx; background: #EAF6FD; color: #495566; font-size: 25rpx; line-height: 1.5; text-align: left; }
.catalog-search text { margin-left: 12rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.catalog-search::after, .catalog-cart::after { border: 0; }
</style>
