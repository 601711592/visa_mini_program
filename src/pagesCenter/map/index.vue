<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="card-h">董大象签证商城</view>
        <view class="kv">
          <text>公司地址</text>
          <text>待配置</text>
        </view>
        <view class="hint">详细地址与坐标确认后，将在这里显示地图位置。</view>
      </view>
      <view class="sheet-card">
        <view class="empty-state">
          <image src="/static/images/center/map-pinned.png" mode="aspectFit" />
          <view class="empty-h">地图位置待配置</view>
          <view class="empty-p">当前没有已确认的位置，暂不展示地图。</view>
        </view>
      </view>
      <view class="btn solid full disabled">打开地图导航</view>
      <view class="hint">正式小程序使用原生地图及位置导航；游客可访问本页。</view>
    </view>
  </view>
</template>

<script setup lang="ts">
// 游客可访问本页，不加登录守卫；公司坐标待业务配置，不虚构地点。
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
