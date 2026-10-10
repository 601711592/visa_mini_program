<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="sheet-card">
          <view class="card-h">{{ COMPANY.name }}</view>
          <view class="kv">
            <text>公司地址</text>
            <text>{{ COMPANY.address }}</text>
          </view>
        </view>
        <view v-if="coords" class="sheet-card">
          <map
            class="map-view"
            :latitude="coords.latitude"
            :longitude="coords.longitude"
            :scale="16"
            :markers="markers"
            @tap="openNavigation"
          />
        </view>
        <view v-else class="sheet-card">
          <view class="empty-state">
            <image src="/static/images/center/map-pinned.png" mode="aspectFit" />
            <view class="empty-h">地图位置待配置</view>
            <view class="empty-p">当前没有已确认的位置，暂不展示地图。</view>
          </view>
        </view>
        <view class="btn solid full" :class="{ disabled: !coords }" @tap="openNavigation">打开地图导航</view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
// 游客可访问本页，不加登录守卫。
// 坐标使用 GCJ-02（腾讯地图坐标拾取器取值）；置为 null 时页面展示待配置状态。
const COMPANY = {
  name: '广州市大象旅游科技有限公司',
  address: '广州市白云区沙凤三路3号B101（办公：109区域）',
  latitude: 23.150634 as number | null,
  longitude: 113.195205 as number | null,
};

const coords = COMPANY.latitude !== null && COMPANY.longitude !== null ? { latitude: COMPANY.latitude, longitude: COMPANY.longitude } : null;
const markers = coords ? [{ id: 1, ...coords, title: COMPANY.name }] : [];

/** 打开微信内置地图，由用户选择导航应用；坐标未配置时不响应。 */
function openNavigation() {
  if (!coords) return;
  uni.openLocation({ ...coords, name: COMPANY.name, address: COMPANY.address, scale: 16 });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.map-view {
  width: 100%;
  height: 480rpx;
}
</style>
