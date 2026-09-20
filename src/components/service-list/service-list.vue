<template>
  <view class="card services">
    <view class="row" v-for="item in entries" :key="item.key" @tap="$emit('open', item.key)">
      <image class="icon" :src="item.icon" mode="aspectFit" />
      <text class="label">{{ item.label }}</text>
      <image class="chevron" src="/static/images/center/chevron-right-muted.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup lang="ts">
interface ServiceEntry {
  key: string;
  label: string;
  icon: string;
}

withDefaults(defineProps<{ entries?: ServiceEntry[] }>(), {
  entries: () => [
    { key: 'address', label: '收货地址管理', icon: '/static/images/center/map-pin.png' },
    { key: 'map', label: '我司地图定位', icon: '/static/images/center/map.png' },
  ],
});
defineEmits(['open']);
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.services {
  padding: 0 28rpx;
}

.row {
  min-height: 124rpx;
  display: flex;
  align-items: center;
  gap: 26rpx;
  border-bottom: 1.5rpx solid $line;
  font-size: 30rpx;
  color: $text;

  &:last-child {
    border-bottom: 0;
  }
}

.icon {
  width: 44rpx;
  height: 44rpx;
  flex: none;
}

.label {
  flex: 1;
}

.chevron {
  width: 32rpx;
  height: 32rpx;
  flex: none;
}
</style>
