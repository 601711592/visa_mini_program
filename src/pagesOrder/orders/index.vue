<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="filter-tabs">
        <view
          v-for="tab in filterTabs"
          :key="tab"
          class="tab"
          :class="{ selected: currentFilter === tab }"
          @tap="chooseFilter(tab)"
        >
          {{ tab }}
        </view>
      </view>
      <view class="page-body">
        <view v-if="center.ordersError" class="hint" @tap="reload">{{ center.ordersError }} · 点击重试</view>
        <view v-for="order in filteredOrders" :key="order.id" class="sheet-card">
          <view class="card-heading">
            <text class="order-no">{{ order.id }}</text>
            <text class="status-tag">{{ order.state }}</text>
          </view>
          <view v-if="order.refund && order.refund.status !== 'cancelled' && order.state !== '已退款'" class="refund-line">{{ order.refund.label }}</view>
          <view v-for="(item, index) in order.items" :key="index" class="order-product">
            <image v-if="item.cover && !failedCovers[item.cover]" class="product-cover" :src="item.cover" mode="aspectFill" @error="failedCovers[item.cover] = true" />
              <view v-else class="product-symbol">
              <image src="/static/images/center/book-open.png" mode="aspectFit" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ item.goodsName }}</text>
              <text class="product-meta">{{ item.pack }}<text v-if="item.group"> · {{ item.group }}</text></text>
              <text class="product-meta"><text v-if="item.date">{{ item.date }} · </text>{{ item.qty }} 人</text>
            </view>
          </view>
          <view class="order-total">
            <text>共 {{ totalQty(order) }} 人</text>
            <text>
              {{ order.state === '待付款' ? '待支付' : order.state === '已退款' ? '已退' : '实付' }}
              <text class="total-amount">¥{{ money(order.due) }}</text>
            </text>
          </view>
          <view class="actions">
            <template v-if="order.state === '待付款'">
              <view class="btn outline" @tap="cancelOrder(order)">取消订单</view>
              <view class="btn solid" @tap="goPay(order)">继续付款</view>
            </template>
            <view class="btn outline" @tap="goDetail(order)">查看详情</view>
            <view v-if="showRefundButton(order)" class="btn solid" @tap="openRefund(order)">申请退款</view>
          </view>
        </view>
        <view v-if="!filteredOrders.length && !center.ordersLoading" class="empty-state">
          <image src="/static/images/center/package-open.png" mode="aspectFit" />
          <view class="empty-title">暂无相关订单</view>
          <view class="empty-desc">您可以先浏览喜欢的签证服务</view>
          <view class="btn solid" @tap="goMall">去逛逛</view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow, onReachBottom } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type CenterOrder } from '@/store/center';
import type { OrderFilter } from '@/services/orders';
import { openRefund, showRefundButton } from '../refund';

const global = useGlobalStore();
const center = useCenterStore();
const failedCovers = ref<Record<string, boolean>>({});

const filterTabs = ['全部', '待付款', '办理中', '已完成', '售后退款', '已取消'];
const currentFilter = ref('全部');

onLoad((query) => {
  const filter = query?.filter;
  if (filter && filterTabs.includes(filter)) currentFilter.value = filter;
});

onShow(async () => {
  const target =
    currentFilter.value === '全部'
      ? '/pagesOrder/orders/index'
      : `/pagesOrder/orders/index?filter=${encodeURIComponent(currentFilter.value)}`;
  if (!(await global.ensureLogin({ target }))) return;
  await reload();
});

onReachBottom(async () => {
  if (!global.isLogin) return;
  try { await center.loadOrders(false, apiFilter()); } catch { /* 继续显示已加载订单 */ }
});

const stateCodes: Record<string, OrderFilter> = {
  待付款: 'pending',
  办理中: 'processing', 已完成: 'completed', 已取消: 'cancelled',
  售后退款: 'refund',
};
/** 将页面筛选转换为接口订单状态。 */
function apiFilter(): OrderFilter | '' { return stateCodes[currentFilter.value] || ''; }
/** 切换订单筛选并刷新列表。 */
function chooseFilter(tab: string) { currentFilter.value = tab; void reload(); }

/** 重新加载当前筛选下的订单。 */
async function reload() {
  try { await center.loadOrders(true, apiFilter()); } catch { /* 页面显示错误和重试入口 */ }
}

// 售后退款按退款记录筛选，订单状态可能是已完成、退款中或已退款，以服务端结果为准。
const filteredOrders = computed(() =>
  center.orders.filter((o) => {
    if (currentFilter.value === '全部') return true;
    if (currentFilter.value === '售后退款') return !!o.refund && o.refund.status !== 'cancelled';
    return o.state === currentFilter.value;
  }),
);

/** 将金额格式化为两位小数。 */
const money = (n: number) => Number(n).toFixed(2);
/** 统计订单总人数。 */
const totalQty = (order: CenterOrder) => order.items.reduce((n, item) => n + item.qty, 0);

/** 打开订单详情。 */
function goDetail(order: CenterOrder) {
  uni.navigateTo({ url: `/pagesOrder/orderDetail/index?id=${order.id}` });
}

/** 打开订单付款页。 */
function goPay(order: CenterOrder) {
  uni.navigateTo({ url: `/pagesOrder/orderPay/index?id=${order.id}` });
}

/** 确认后取消订单。 */
function cancelOrder(order: CenterOrder) {
  uni.showModal({
    title: '取消订单',
    content: '取消后将无法继续支付这笔订单，您可以重新选购。',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await center.cancelOrder(order.id);
        uni.showToast({ title: '订单已取消', icon: 'none' });
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '取消失败，请重试', icon: 'none' });
        await reload();
      }
    },
  });
}

/** 返回商城。 */
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

.refund-line {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $brand-ink;
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
