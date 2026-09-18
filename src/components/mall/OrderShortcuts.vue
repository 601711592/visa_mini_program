<template>
  <view class="order-shortcuts">
    <view class="order-shortcuts__heading"><view class="order-shortcuts__title">我的订单</view><button class="order-shortcuts__all" @tap="$emit('open', '全部')"><text>查看全部</text><MallIcon name="chevron" :size="30" /></button></view>
    <view class="order-shortcuts__grid"><button v-for="entry in entries" :key="entry.status" class="order-shortcuts__item" @tap="$emit('open', entry.status)"><MallIcon :name="entry.icon" :size="54" /><text>{{ entry.status }}</text></button></view>
  </view>
</template>
<script setup lang="ts">
import MallIcon from './MallIcon.vue';
defineEmits<{ (event: 'open', status: string): void }>();
const entries = [{ status: '待付款', icon: 'wallet' }, { status: '办理中', icon: 'order' }, { status: '已完成', icon: 'check' }, { status: '售后退款', icon: 'refund' }];
</script>
<style scoped>
.order-shortcuts { box-sizing: border-box; height: 258rpx; padding: 30rpx 26rpx; margin-bottom: 20rpx; background: #fff; border-radius: 24rpx; }
.order-shortcuts__heading { display: flex; align-items: center; justify-content: space-between; min-height: 48rpx; }
.order-shortcuts__title { font-size: 34rpx; font-weight: 600; line-height: normal; color: #202631; }
.order-shortcuts__all { position: relative; display: flex; align-items: center; min-height: 88rpx; padding: 0; margin: -20rpx 0; background: transparent; border: 0; border-radius: 0; font-size: 27rpx; line-height: normal; color: #737D8C; }
.order-shortcuts__all::after { border: 0; }
.order-shortcuts__grid { display: flex; margin-top: 30rpx; }
.order-shortcuts__item { flex: 1; min-width: 0; min-height: 126rpx; padding: 0; margin: 0; display: flex; flex-direction: column; align-items: center; background: transparent; border-radius: 0; color: #202631; font-size: 28rpx; font-weight: 500; line-height: normal; }
.order-shortcuts__item::after { border: 0; }
.order-shortcuts__item text { margin-top: 20rpx; white-space: nowrap; }
</style>
