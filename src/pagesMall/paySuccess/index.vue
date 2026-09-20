<template>
  <view class="center-page">
    <view class="page-body">
      <view v-if="order" class="sheet-card success-card">
        <image class="success-icon" src="/static/images/center/circle-check.png" />
        <view class="success-title">支付成功</view>
        <view class="success-amount">¥{{ order.due.toFixed(2) }}</view>
        <view class="success-note">订单已提交，顾问将尽快与您联系</view>
        <view class="button-stack">
          <view class="btn solid full" @tap="viewOrder">查看订单</view>
          <view class="btn outline full" @tap="goAccount">返回个人中心</view>
        </view>
        <view class="hint success-hint">交易完成后发放消费积分</view>
      </view>
      <view v-else class="sheet-card empty-state">
        <view class="empty-h">未找到该订单</view>
        <view class="empty-p">订单可能已失效，请返回后重试</view>
        <view class="btn solid full" @tap="goBack">返回</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const orderId = ref('');

const order = computed(() => center.findOrder(orderId.value));

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesMall/paySuccess/index?id=${orderId.value}` }))) return;
});

function viewOrder() {
  uni.redirectTo({ url: `/pagesOrder/orderDetail/index?id=${orderId.value}` });
}

function goAccount() {
  uni.switchTab({ url: '/pages/account/index' });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/account/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.success-card {
  text-align: center;
}

.success-icon {
  width: 88rpx;
  height: 88rpx;
  margin: 12rpx 0 24rpx;
}

.success-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text;
}

.success-amount {
  font-size: 32rpx;
  color: $brand-ink;
  margin: 16rpx 0 8rpx;
}

.success-note {
  font-size: 25rpx;
  color: $muted;
}

.success-hint {
  margin-top: 24rpx;
  margin-bottom: 0;
  text-align: center;
}
</style>
