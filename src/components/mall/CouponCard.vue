<template>
  <view class="coupon-card" :class="{ dim: coupon.status !== '未使用' || coupon.end < day() || !!disabledReason }">
    <view class="coupon-face"><view class="coupon-amount"><text>¥</text>{{ coupon.cents / 100 }}</view><view class="coupon-threshold">{{ coupon.minimumCents ? '满 ' + coupon.minimumCents / 100 + ' 元可用' : '无门槛（演示）' }}</view></view>
    <view class="coupon-copy"><view class="coupon-title">{{ coupon.name }}</view><view class="coupon-meta">{{ coupon.scope }} · {{ coupon.end }} 到期</view><view v-if="disabledReason" class="coupon-reason">{{ disabledReason }}</view><view class="coupon-actions"><slot /></view></view>
  </view>
</template>
<script setup lang="ts">
import { day, type Coupon } from '@/mall/model';
defineOptions({ options: { styleIsolation: 'shared' } });
defineProps<{ coupon: Coupon; disabledReason?: string }>();
</script>
<style scoped>
.coupon-card { display: flex; box-sizing: border-box; margin-bottom: 22rpx; overflow: hidden; border-left: 6rpx solid #C58B52; border-radius: 24rpx; background: #fff; }
.coupon-face { box-sizing: border-box; width: 176rpx; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20rpx 10rpx; border-right: 1rpx dashed #D1DAE7; color: #164E70; }
.coupon-amount { font-size: 62rpx; font-weight: 600; line-height: 1.3; }
.coupon-amount text { margin-right: 4rpx; font-size: 28rpx; }
.coupon-threshold { margin-top: 8rpx; font-size: 21rpx; line-height: 1.5; text-align: center; }
.coupon-copy { box-sizing: border-box; flex: 1; min-width: 0; padding: 28rpx 24rpx; }
.coupon-title { margin-bottom: 12rpx; color: #202631; font-size: 30rpx; font-weight: 600; line-height: 1.5; }
.coupon-meta, .coupon-reason { color: #737D8C; font-size: 22rpx; line-height: 1.6; overflow-wrap: anywhere; }
.coupon-reason { margin-top: 8rpx; }
.coupon-actions { margin-top: 18rpx; }
.coupon-actions :deep(.mx-actions) { justify-content: space-between; margin-top: 0; }
.coupon-actions :deep(.mx-actions > button) { margin: 0; }
.coupon-card.dim { border-left-color: #C5CDD9; }
.dim .coupon-face { color: #818C9C; }
</style>
