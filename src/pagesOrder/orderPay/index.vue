<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view v-if="order" class="sheet-card pay-card">
          <view class="card-h">继续付款</view>
          <view class="pay-amount">¥{{ order.due.toFixed(2) }}</view>
          <view class="kv"
            ><text>订单号</text><text>{{ order.id }}</text></view
          >
          <view class="button-stack">
            <view class="btn solid full" @tap="pay">{{ busy ? '正在确认…' : '微信支付' }}</view>
            <view class="btn outline full" @tap="goBack">返回订单</view>
          </view>
        </view>
        <view v-else class="sheet-card empty-state">
          <view class="empty-h">{{ error || '正在加载订单…' }}</view>
          <view class="btn solid full" @tap="load">重试</view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { payTradeOrder } from '@/services/pay';

const global = useGlobalStore();
const center = useCenterStore();
const orderId = ref('');
const busy = ref(false);
const error = ref('');
const order = computed(() => center.findOrder(orderId.value));
onLoad(query => {
  orderId.value = query?.id || '';
});
onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesOrder/orderPay/index?id=${orderId.value}` }))) return;
  await load();
});
/** 加载待支付订单。 */
async function load() {
  try {
    await center.loadOrder(orderId.value);
    error.value = '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : '订单加载失败';
  }
}
/** 发起微信支付并确认收款结果。 */
async function pay() {
  if (busy.value || !order.value) return;
  busy.value = true;
  try {
    const result = await payTradeOrder(orderId.value, order.value.priceVersion);
    await load();
    if (result === 'paid') uni.redirectTo({ url: `/pagesMall/paySuccess/index?id=${orderId.value}` });
    else uni.showToast({ title: '尚未确认收款，可稍后重试', icon: 'none' });
  } catch (e) {
    await load();
    uni.showToast({ title: e instanceof Error ? e.message : '支付状态确认失败', icon: 'none' });
  } finally {
    busy.value = false;
  }
}
/** 返回订单页面。 */
function goBack() {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pagesOrder/orders/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
.pay-card {
  text-align: center;
}
.pay-amount {
  font-size: 70rpx;
  font-weight: 600;
  color: $brand-ink;
  margin: 24rpx 0;
}
.pay-card .kv {
  text-align: left;
}
</style>
