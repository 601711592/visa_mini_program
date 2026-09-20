<template>
  <view class="hero">
    <view class="profile" @tap="$emit('tap')">
      <image v-if="logged && avatar" class="avatar" :src="avatar" mode="aspectFill" />
      <view v-else class="avatar guest-avatar">
        <image src="/static/images/center/user-round.png" mode="aspectFit" />
      </view>
      <view class="identity">
        <text class="name">{{ logged ? nickname : '点击登录' }}</text>
        <text class="sub">{{ logged ? phone : '登录后查看订单与权益' }}</text>
      </view>
      <image class="chevron" src="/static/images/center/chevron-right.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ logged: boolean; nickname: string; phone: string; avatar: string }>();
defineEmits(['tap']);
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.hero {
  height: 288rpx;
  background: $brand;
  border-radius: 0 0 24rpx 24rpx;
}

.profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 40rpx 0 42rpx;
}

.avatar {
  flex: none;
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  border: 2rpx solid #ffffff;
}

.guest-avatar {
  background: $brand-soft;
  display: flex;
  align-items: center;
  justify-content: center;

  image {
    width: 72rpx;
    height: 72rpx;
  }
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 42rpx;
  font-weight: 600;
  color: $brand-ink;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sub {
  font-size: 30rpx;
  color: $brand-ink;
}

.chevron {
  flex: none;
  width: 38rpx;
  height: 38rpx;
}
</style>
