<template>
  <view class="flex flex-col items-center">
    <!-- 顶部图片区域 -->
    <view class="w-[166px] h-[134px] mt-[328px] empty_image"></view>

    <!-- 提示文字 -->
    <view class="text-[48px] font-semibold text-black leading-[67px] mt-[16px] text-center"> 啊哦，你还没登录哦 </view>

    <!-- 登录提示 -->
    <view class="text-[24px] font-normal text-black leading-[34px] mt-[16px]"> 立即登录, 开始定制个性化T恤 </view>

    <!-- 微信授权按钮 -->
    <view class="w-[440px] mt-[120px] h-[88px] bg-black rounded-[90px] flex items-center justify-center" @click="clickHandle">
      <view class="text-[28px] font-semibold text-white">登录</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/store/global';

const global = useGlobalStore();

const clickHandle = () => {
  global.showLoginDialog = true;
};
</script>

<style lang="scss">
.empty_image {
  background: url(#{$assets}common/empty.png) no-repeat center / 100% 100%;
}
</style>
