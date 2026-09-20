<template>
  <view class="center-page">
    <view v-if="order" class="page-body">
      <view class="sheet-card pay-card">
        <text class="eyebrow">待支付</text>
        <view class="pay-amount">¥{{ money(order.due) }}</view>
        <view class="kv">
          <text>订单</text>
          <text>{{ order.id }}</text>
        </view>
        <view class="hint">支付交互演示，不发起微信支付。</view>
      </view>
      <view class="button-stack">
        <view class="btn solid full" @tap="paySuccess">模拟支付成功</view>
        <view class="btn outline full" @tap="payCancel">模拟支付取消</view>
        <view class="btn outline full" @tap="payFail">模拟支付失败</view>
      </view>
    </view>
    <view v-else class="page-body">
      <view class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-title">未找到该订单</view>
        <view class="empty-desc">订单可能已被移除，请返回订单列表查看</view>
        <view class="btn solid" @tap="goBack">返回上一页</view>
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

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesOrder/orderPay/index?id=${orderId.value}` }))) return;
});

const order = computed(() => center.findOrder(orderId.value));

const money = (n: number) => Number(n).toFixed(2);

function paySuccess() {
  center.mockPaySuccess(orderId.value);
  uni.showToast({ title: '模拟支付成功，未发生真实扣款', icon: 'none' });
  setTimeout(() => uni.navigateBack(), 800);
}

function payCancel() {
  uni.showToast({ title: '支付已取消，可以稍后继续付款', icon: 'none' });
  setTimeout(() => uni.navigateBack(), 800);
}

function payFail() {
  uni.showToast({ title: '模拟支付失败，请重试或返回订单。', icon: 'none' });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pagesOrder/orders/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.pay-card {
  .pay-amount {
    font-size: 70rpx;
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: 1rpx;
    color: $text;
    margin: 16rpx 0;
  }
}

.empty-state {
  .empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text;
    margin-bottom: 12rpx;
  }

  .empty-desc {
    font-size: 26rpx;
    color: $muted;
    margin-bottom: 28rpx;
  }
}
</style>
