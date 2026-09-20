<template>
  <view class="center-page">
    <view class="page-body">
      <view v-if="order" class="sheet-card pay-card">
        <view class="card-h pay-title">董大象签证商城</view>
        <view class="pay-amount">¥{{ order.due.toFixed(2) }}</view>
        <view class="pay-no">订单号 {{ order.id }}</view>
        <view class="kv">
          <text>支付方式</text>
          <text>微信支付</text>
        </view>
        <view class="hint pay-hint">支付交互演示，不会发起真实扣款</view>
        <view class="button-stack">
          <view class="btn solid full" @tap="paySuccess">模拟支付成功</view>
          <view class="btn outline full" @tap="payCancel">模拟取消支付</view>
          <view class="btn outline full" @tap="payFail">模拟支付失败</view>
        </view>
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
import { useMallStore } from '@/store/mall';

const global = useGlobalStore();
const center = useCenterStore();
const mall = useMallStore();

const orderId = ref('');

const order = computed(() => center.findOrder(orderId.value));

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesMall/payment/index?id=${orderId.value}` }))) return;
});

function paySuccess() {
  if (!order.value) return;
  if (order.value.state !== '待付款') {
    uni.showToast({ title: '订单状态已更新', icon: 'none' });
    return;
  }
  mall.completePayment(orderId.value);
  uni.redirectTo({ url: `/pagesMall/paySuccess/index?id=${orderId.value}` });
}

function payCancel() {
  uni.showToast({ title: '支付已取消，可以稍后继续付款', icon: 'none' });
  setTimeout(() => uni.navigateBack(), 800);
}

function payFail() {
  uni.showToast({ title: '模拟支付失败，请重试或返回订单。', icon: 'none' });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/account/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.pay-card {
  text-align: center;
}

.pay-title {
  margin-bottom: 8rpx;
}

.pay-amount {
  font-size: 70rpx;
  font-weight: 600;
  color: $brand-ink;
  line-height: 1.3;
  margin: 24rpx 0 8rpx;
}

.pay-no {
  font-size: 23rpx;
  color: $muted;
  margin-bottom: 12rpx;
}

.pay-card .kv {
  text-align: left;
}

.pay-hint {
  margin: 20rpx 0 0;
  text-align: center;
}
</style>
