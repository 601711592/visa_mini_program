<template>
  <view class="card orders">
    <view class="section-title">
      <text class="title">我的订单</text>
      <view class="all" @tap="$emit('open', '')">
        <text>查看全部</text>
        <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
      </view>
    </view>
    <view class="order-grid">
      <view class="entry" v-for="item in entries" :key="item.filter" @tap="$emit('open', item.filter)">
        <image :src="item.icon" mode="aspectFit" />
        <text>{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface OrderEntry {
  filter: string;
  label: string;
  icon: string;
}

withDefaults(defineProps<{ entries?: OrderEntry[] }>(), {
  entries: () => [
    { filter: '待付款', label: '待付款', icon: '/static/images/center/wallet.png' },
    { filter: '办理中', label: '办理中', icon: '/static/images/center/file-clock.png' },
    { filter: '已完成', label: '已完成', icon: '/static/images/center/circle-check.png' },
  ],
});
defineEmits(['open']);
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.orders {
  padding: 30rpx 26rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 34rpx;
    font-weight: 600;
    color: $text;
  }
}

.all {
  display: flex;
  align-items: center;
  font-size: 27rpx;
  color: $muted;
  min-height: 48rpx;

  image {
    width: 30rpx;
    height: 30rpx;
  }
}

.order-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 30rpx;

  .entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: $text;
    min-height: 126rpx;

    image {
      width: 54rpx;
      height: 54rpx;
    }
  }
}
</style>
