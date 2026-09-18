<template>
  <view class="service-list">
    <button class="service-list__row" @tap="$emit('address')"><MallIcon name="address" :size="44" /><text class="service-list__label">收货地址管理</text><MallIcon name="chevron" :size="32" /></button>
    <button class="service-list__row" @tap="$emit('map')"><MallIcon name="map" :size="44" /><text class="service-list__label">我司地图定位</text><MallIcon name="chevron" :size="32" /></button>
  </view>
</template>
<script setup lang="ts">
import MallIcon from './MallIcon.vue';
defineEmits<{ (event: 'address'): void; (event: 'map'): void }>();
</script>
<style scoped>
.service-list { padding: 0 28rpx; margin-bottom: 20rpx; background: #fff; border-radius: 24rpx; }
.service-list__row { box-sizing: border-box; display: flex; align-items: center; width: 100%; min-height: 124rpx; margin: 0; padding: 0; border: 0; border-bottom: 1.5rpx solid #E3E8F0; border-radius: 0; background: transparent; text-align: left; line-height: normal; }
.service-list__row:last-child { border-bottom: 0; }
.service-list__row::after { border: 0; }
.service-list__label { flex: 1; min-width: 0; margin: 0 26rpx; font-size: 30rpx; font-weight: 500; color: #202631; }
</style>
