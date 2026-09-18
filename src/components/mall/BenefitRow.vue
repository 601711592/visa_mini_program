<template>
  <view class="benefit-row">
    <button class="benefit-main" @tap="$emit('detail')"><MallIcon :name="icon" :size="44" /><view class="benefit-copy"><view class="benefit-title">{{ title }}</view><view class="benefit-description"><text>{{ value }}</text><text v-if="detailLabel" class="benefit-link"> · {{ detailLabel }}</text><MallIcon v-if="detailLabel" name="chevron" :size="25" /></view></view></button>
    <button class="benefit-action" @tap.stop="$emit('use')"><text class="benefit-pill">{{ action || '去使用' }}</text></button>
  </view>
</template>
<script setup lang="ts">
import MallIcon from './MallIcon.vue';
defineProps<{ icon: string; title: string; value: string; action?: string; detailLabel?: string }>();
defineEmits<{ (event: 'detail'): void; (event: 'use'): void }>();
</script>
<style scoped>
.benefit-row { box-sizing: border-box; display: flex; align-items: center; min-height: 150rpx; border-bottom: 1.5rpx solid #E3E8F0; }
.benefit-row:last-child { border-bottom: 0; }
.benefit-main { display: flex; align-items: center; flex: 1; min-width: 0; align-self: stretch; min-height: 0; padding: 0; margin: 0; background: transparent; border-radius: 0; text-align: left; line-height: normal; }
.benefit-main::after, .benefit-action::after { border: 0; }
.benefit-copy { min-width: 0; margin-left: 26rpx; }
.benefit-title { margin-bottom: 8rpx; color: #202631; font-size: 32rpx; font-weight: 500; }
.benefit-description { display: flex; align-items: center; flex-wrap: wrap; color: #737D8C; font-size: 25rpx; line-height: 1.5; }
.benefit-link { color: #164E70; white-space: nowrap; }
/* 保持 66rpx 的视觉胶囊，外层独立按钮承接 88rpx 触控区域。 */
.benefit-action { box-sizing: border-box; flex-shrink: 0; display: flex; align-items: center; width: 172rpx; min-height: 88rpx; margin: 0 0 0 12rpx; padding: 11rpx 0; background: transparent; line-height: 1.5; }
.benefit-pill { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 66rpx; border-radius: 40rpx; background: #EAF6FD; color: #164E70; font-size: 28rpx; font-weight: 500; }
</style>
