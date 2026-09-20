<template>
  <view class="benefit">
    <view class="detail" @tap="$emit('detail')">
      <image class="icon" :src="icon" mode="aspectFit" />
      <view class="copy">
        <text class="name">{{ title }}</text>
        <view class="description">
          <text>{{ description }}</text>
          <view v-if="linkText" class="detail-link">
            <text> · {{ linkText }}</text>
            <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>
    <view class="pill-hit" @tap.stop="$emit('action')">
      <view class="pill">{{ pillText }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ icon: string; title: string; description: string; linkText?: string; pillText: string }>();
defineEmits(['detail', 'action']);
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.benefit {
  min-height: 150rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1.5rpx solid $line;

  &:last-child {
    border-bottom: 0;
  }
}

.detail {
  display: flex;
  align-items: center;
  gap: 26rpx;
  flex: 1;
  min-width: 0;
  align-self: stretch;
}

.icon {
  width: 44rpx;
  height: 44rpx;
  flex: none;
}

.copy {
  min-width: 0;
}

.name {
  display: block;
  font-weight: 500;
  font-size: 32rpx;
  color: $text;
  margin-bottom: 8rpx;
}

.description {
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-size: 25rpx;
  color: $muted;
  line-height: 1.5;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  color: $brand-ink;

  image {
    width: 25rpx;
    height: 25rpx;
  }
}

.pill-hit {
  flex: none;
  min-height: 88rpx;
  display: flex;
  align-items: center;
}

.pill {
  background: $brand-soft;
  color: $brand-ink;
  border-radius: 40rpx;
  width: 172rpx;
  min-height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 500;
}
</style>
