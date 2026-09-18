<template>
  <view class="profile-header">
    <button class="profile-header__trigger" @tap="$emit('open')">
      <image v-if="avatar" class="profile-header__avatar" :src="avatar" mode="aspectFill" />
      <view v-else class="profile-header__avatar profile-header__empty"><MallIcon name="user" :size="72" /></view>
      <view class="profile-header__identity">
        <view class="profile-header__name">{{ checking ? '正在校验登录状态…' : logged ? nickname || '已登录' : '点击登录' }}</view>
        <view class="profile-header__phone" :class="{ 'is-guest': !logged }">{{ logged ? phone : '登录后查看订单与权益' }}</view>
      </view>
      <MallIcon name="chevron" :size="38" />
    </button>
  </view>
</template>
<script setup lang="ts">
import MallIcon from './MallIcon.vue';
defineProps<{ logged: boolean; checking?: boolean; nickname?: string; phone?: string; avatar?: string }>();
defineEmits<{ (event: 'open'): void }>();
</script>
<style scoped>
/* HTML hero 398 - 原生导航示意 110 = 页面内 288rpx，不能重复画导航。 */
.profile-header { position: relative; height: 288rpx; background: #8AD0F9; border-radius: 0 0 24rpx 24rpx; color: #164E70; }
.profile-header__trigger { position: absolute; top: 20rpx; left: 42rpx; right: 40rpx; display: flex; align-items: center; width: auto; padding: 0; margin: 0; border: 0; border-radius: 0; background: transparent; color: inherit; text-align: left; line-height: normal; }
.profile-header__trigger::after { border: 0; }
.profile-header__avatar { box-sizing: border-box; width: 150rpx; height: 150rpx; flex-shrink: 0; border: 2rpx solid #fff; border-radius: 50%; background: #fff; }
.profile-header__empty { display: flex; align-items: center; justify-content: center; background: #EAF6FD; }
.profile-header__identity { flex: 1; min-width: 0; margin-left: 24rpx; margin-right: 16rpx; }
.profile-header__name { font-size: 42rpx; font-weight: 600; line-height: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-header__phone { margin-top: 10rpx; font-size: 30rpx; line-height: normal; overflow-wrap: anywhere; }
.profile-header__phone.is-guest { font-size: 26rpx; }
</style>
