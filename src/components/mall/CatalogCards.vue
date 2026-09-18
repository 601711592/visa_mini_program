<template>
  <view class="catalog-cards" :class="{ 'catalog-cards--category': variant === 'category' }">
    <view v-for="goods in items" :key="goods.id" class="catalog-card" @tap="open(goods.id)">
      <view class="catalog-card__image"><image :src="goods.cover" mode="aspectFill" /></view>
      <view class="catalog-card__name">{{ goods.name }}</view>
      <view class="catalog-card__bottom"><view class="catalog-card__price"><text class="catalog-card__currency">¥</text><text>{{ money(goods.price) }}</text></view><button v-if="cartEntry" class="catalog-card__cart" aria-label="选择规格后加入购物车" @tap.stop="open(goods.id)"><MallIcon name="cart" :size="variant === 'category' ? 46 : 36" /></button></view>
    </view>
  </view>
</template>
<script setup lang="ts">
import type { Goods } from '@/services/shop';
import MallIcon from './MallIcon.vue';
import { money } from '@/mall/model';
withDefaults(defineProps<{ items: Goods[]; cartEntry?: boolean; variant?: 'default' | 'category' }>(), { variant: 'default' });
function open(id: number) { uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${id}` }); }
</script>
<style scoped>
.catalog-cards { display: flex; flex-wrap: wrap; justify-content: space-between; align-content: flex-start; }
.catalog-card { box-sizing: border-box; width: calc(50% - 12rpx); min-width: 0; margin-bottom: 20rpx; overflow: hidden; background: #fff; border-radius: 24rpx; }
.catalog-card__image { position: relative; width: 100%; height: 0; padding-top: 100%; background: #EDF2F8; overflow: hidden; }
.catalog-card__image image { position: absolute; top: 0; left: 0; display: block; width: 100%; height: 100%; }
.catalog-card__name { margin: 24rpx 24rpx 0; min-height: 84rpx; color: #202631; font-size: 28rpx; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.catalog-card__bottom { display: flex; align-items: center; justify-content: space-between; gap: 4rpx; min-height: 88rpx; padding: 0 16rpx 8rpx 24rpx; }
.catalog-card__price { min-width: 0; color: #164E70; font-size: 34rpx; font-weight: 500; white-space: nowrap; }
.catalog-card__currency { margin-right: 2rpx; font-size: 22rpx; font-weight: 400; }
.catalog-card__cart { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 88rpx; min-height: 88rpx; padding: 0; margin: 0; background: transparent; border-radius: 0; line-height: 1; }
.catalog-card__cart::after { border: 0; }
.catalog-cards--category .catalog-card { width: calc(50% - 10rpx); border: 2rpx solid #EDF1F5; border-radius: 20rpx; box-shadow: 0 6rpx 20rpx #20263106; padding: 12rpx 12rpx 0; }
.catalog-cards--category .catalog-card__image { padding-top: 76.923077%; border-radius: 14rpx; }
.catalog-cards--category .catalog-card__name { margin: 20rpx 4rpx 0; min-height: 82rpx; font-size: 26rpx; line-height: 1.55; }
.catalog-cards--category .catalog-card__bottom { padding: 0 0 8rpx 4rpx; margin-right: -8rpx; }
.catalog-cards--category .catalog-card__price { font-weight: 600; }
</style>
