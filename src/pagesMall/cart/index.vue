<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="sheet-card empty-state">
          <view class="empty-h">购物车结算暂未开放</view>
          <view class="empty-p">请从商品详情页选择“立即购买”。</view>
          <view class="btn solid full" @tap="goCatalog">浏览商品</view>
        </view>
      </view>
    </view>
  </layout>
</template>
<script setup lang="ts">
/** 返回商品分类页。 */
function goCatalog() {
  uni.switchTab({ url: '/pages/catalog/index' });
}
</script>
<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
