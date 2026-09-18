<template>
  <view class="mx-card price-breakdown"><view class="mx-title">价格明细</view><view class="price-breakdown__row"><text>商品原价总额</text><text>¥{{ money(price.base) }}</text></view><view class="price-breakdown__row"><text>多人优惠</text><text>−¥{{ money(price.groupDiscount) }}</text></view><view class="price-breakdown__row"><text>优惠券</text><text>−¥{{ money(price.coupon) }}</text></view><view class="price-breakdown__row"><text>积分抵扣（{{ price.points }} 积分）</text><text>−¥{{ money(price.pointsCents) }}</text></view><view class="price-breakdown__row"><text>订单金额</text><text class="price-breakdown__total">¥{{ money(price.due) }}</text></view></view>
</template>
<script setup lang="ts">
import { money, type Price } from '@/mall/model';
defineOptions({ options: { styleIsolation: 'shared' } });
defineProps<{ price: Price }>();
</script>
<style scoped>
.price-breakdown .mx-title { margin-bottom: 20rpx; }
.price-breakdown__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24rpx; padding: 18rpx 0; font-size: 25rpx; line-height: 1.6; border-bottom: 1rpx solid #E3E8F0; }
.price-breakdown__row:last-child { border-bottom: 0; }
.price-breakdown__row > text:first-child { color: #737D8C; }
.price-breakdown__row > text:last-child { flex-shrink: 0; color: #495566; text-align: right; }
.price-breakdown__total { font-weight: 600; }
</style>
