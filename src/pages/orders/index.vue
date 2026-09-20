<template>
  <view class="center-page">
    <view class="filter-tabs">
      <view
        v-for="tab in filterTabs"
        :key="tab"
        class="tab"
        :class="{ selected: currentFilter === tab }"
        @tap="currentFilter = tab"
      >
        {{ tab }}
      </view>
    </view>
    <view class="page-body">
      <view class="hint">订单与金额均为演示数据</view>
      <view v-for="order in filteredOrders" :key="order.id" class="sheet-card">
        <view class="card-heading">
          <text class="order-no">{{ order.id }}</text>
          <text class="status-tag">{{ order.state }}</text>
        </view>
        <view v-for="(item, index) in order.items" :key="index" class="order-product">
          <view class="product-symbol">
            <image src="/static/images/center/book-open.png" mode="aspectFit" />
          </view>
          <view class="product-info">
            <text class="product-name">{{ item.goodsName }}</text>
            <text class="product-meta">{{ item.pack }} · {{ item.group }}</text>
            <text class="product-meta">{{ item.date }} · {{ item.qty }} 人</text>
          </view>
        </view>
        <view class="order-total">
          <text>共 {{ totalQty(order) }} 人</text>
          <text>
            {{ order.state === '待付款' ? '待支付' : '实付' }}
            <text class="total-amount">¥{{ money(order.due) }}</text>
          </text>
        </view>
        <view class="actions">
          <template v-if="order.state === '待付款'">
            <view class="btn outline" @tap="cancelOrder(order)">取消订单</view>
            <view class="btn solid" @tap="goPay(order)">继续付款</view>
          </template>
          <view
            v-else-if="order.state === '办理中' || order.state === '已完成'"
            class="btn outline"
            @tap="goRefund(order)"
          >
            申请退款
          </view>
          <view class="btn outline" @tap="goDetail(order)">查看详情</view>
        </view>
      </view>
      <view v-if="!filteredOrders.length" class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-title">暂无相关订单</view>
        <view class="empty-desc">您可以先浏览喜欢的签证服务</view>
        <view class="btn solid" @tap="goMall">去逛逛</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type CenterOrder } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const filterTabs = ['全部', '待付款', '办理中', '已完成', '售后退款'];
const currentFilter = ref('全部');

onLoad((query) => {
  const filter = query?.filter;
  if (filter && filterTabs.includes(filter)) currentFilter.value = filter;
});

onShow(async () => {
  const target =
    currentFilter.value === '全部'
      ? '/pages/orders/index'
      : `/pages/orders/index?filter=${encodeURIComponent(currentFilter.value)}`;
  if (!(await global.ensureLogin({ target }))) return;
});

const filteredOrders = computed(() =>
  center.orders.filter((o) => currentFilter.value === '全部' || o.state === currentFilter.value),
);

const money = (n: number) => Number(n).toFixed(2);
const totalQty = (order: CenterOrder) => order.items.reduce((n, item) => n + item.qty, 0);

function goDetail(order: CenterOrder) {
  uni.navigateTo({ url: `/pages/orderDetail/index?id=${order.id}` });
}

function goPay(order: CenterOrder) {
  uni.navigateTo({ url: `/pages/orderPay/index?id=${order.id}` });
}

function goRefund(order: CenterOrder) {
  uni.navigateTo({ url: `/pages/orderRefund/index?id=${order.id}` });
}

function cancelOrder(order: CenterOrder) {
  uni.showModal({
    title: '取消订单',
    content: '取消后将无法继续支付这笔订单，您可以重新选购。',
    success: (res) => {
      if (!res.confirm) return;
      center.mockCancelOrder(order.id);
      uni.showToast({ title: '订单已取消（模拟）', icon: 'none' });
    },
  });
}

function goMall() {
  uni.reLaunch({ url: '/pages/mall/index' });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.order-no {
  font-size: 21rpx;
  color: $muted;
  overflow-wrap: anywhere;
}

.order-product {
  .product-info {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: $text;
    margin-bottom: 8rpx;
  }

  .product-meta {
    display: block;
    font-size: 23rpx;
    color: $muted;
    line-height: 1.6;
    margin: 2rpx 0;
  }
}

.order-total .total-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: $text;
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
