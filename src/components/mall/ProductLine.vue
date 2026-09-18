<template>
  <view class="product-line" :class="{ 'product-line--order': variant === 'order' }">
    <view v-if="placeholder" class="product-line__cover product-line__placeholder"><MallIcon name="passport" :size="58" /></view>
    <image v-else :src="line.cover" mode="aspectFill" class="product-line__cover" />
    <view class="product-line__copy"><view class="product-line__name">{{ line.name }}</view><view class="product-line__meta">{{ line.specName }} · {{ line.group }}</view><view class="product-line__meta">{{ line.date }} · {{ line.quantity }} 人</view><view v-if="variant !== 'order'" class="product-line__price">¥{{ money(line.unitCents) }}<text class="product-line__unit"> / 人</text></view></view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { money, type Line } from '@/mall/model';
import MallIcon from './MallIcon.vue';
const props = withDefaults(defineProps<{ line: Line; variant?: 'checkout' | 'order' }>(), { variant: 'checkout' });
const placeholder = computed(() => !props.line.cover || /^\/static\/mall\/(passport|plane)\.png$/.test(props.line.cover));
</script>
<style scoped>
.product-line { display: flex; align-items: flex-start; padding: 20rpx 0; }
.product-line__cover { display: block; box-sizing: border-box; width: 152rpx; height: 152rpx; margin-right: 24rpx; flex-shrink: 0; border-radius: 16rpx; background: #EAF6FD; }
.product-line__placeholder { display: flex; align-items: center; justify-content: center; }
.product-line__copy { flex: 1; min-width: 0; }
.product-line__name { margin-bottom: 8rpx; font-size: 30rpx; font-weight: 600; color: #202631; line-height: 1.5; overflow-wrap: anywhere; }
.product-line__meta { margin: 2rpx 0; color: #737D8C; font-size: 24rpx; line-height: 1.6; }
.product-line__price { margin-top: 8rpx; color: #164E70; font-size: 32rpx; font-weight: 500; }
.product-line__unit { color: #737D8C; font-size: 23rpx; font-weight: 400; }
.product-line--order { align-items: center; padding: 18rpx 0; }
.product-line--order .product-line__cover { width: 112rpx; height: 128rpx; border-radius: 14rpx; }
.product-line--order .product-line__name { font-size: 28rpx; }
.product-line--order .product-line__meta { font-size: 23rpx; }
</style>
