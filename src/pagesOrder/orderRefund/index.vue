<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="sheet-card empty-state">
          <view class="empty-h">退款申请暂未开放</view>
          <view class="empty-p">如需售后服务，请联系商家客服。</view>
          <view class="btn solid full" @tap="back">返回订单</view>
        </view>
      </view>
    </view>
  </layout>
</template>
<script setup lang="ts">
/** 返回订单页面。 */
function back() {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pagesOrder/orders/index' }) });
}
</script>
<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
