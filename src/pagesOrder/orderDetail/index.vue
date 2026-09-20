<template>
  <view class="center-page">
    <template v-if="order">
      <view class="status-hero">
        <image :src="heroIcon" mode="aspectFit" />
        <view class="hero-title">{{ heroTitle }}</view>
        <view class="hero-desc">{{ heroDesc }}</view>
      </view>
      <view class="page-body">
        <view v-for="(item, index) in order.items" :key="index" class="sheet-card">
          <view class="order-product">
            <view class="product-symbol">
              <image src="/static/images/center/book-open.png" mode="aspectFit" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ item.goodsName }}</text>
              <text class="product-meta">{{ item.pack }} · {{ item.group }}</text>
              <text class="product-meta">{{ item.date }} · {{ item.qty }} 人</text>
            </view>
          </view>
          <view class="traveller-list">
            <view class="traveller-title">本商品出行人 · {{ item.travellers.length }} 位</view>
            <template v-for="(traveller, ti) in item.travellers" :key="ti">
              <view class="kv">
                <text>{{ traveller.name }}</text>
                <text>护照尾号 {{ traveller.passport }}</text>
              </view>
              <view class="kv">
                <text>生日</text>
                <text>{{ traveller.birthday }}</text>
              </view>
            </template>
          </view>
        </view>
        <view class="sheet-card">
          <view class="card-title">价格明细</view>
          <view class="kv">
            <text>商品总额</text>
            <text>¥{{ money(order.base) }}</text>
          </view>
          <view class="kv">
            <text>多人优惠</text>
            <text>−¥{{ money(order.discount) }}</text>
          </view>
          <view class="kv">
            <text>优惠券</text>
            <text>−¥{{ money(order.coupon) }}</text>
          </view>
          <view class="kv">
            <text>积分抵扣（{{ order.points }} 积分）</text>
            <text>−¥{{ money(order.points * 0.02) }}</text>
          </view>
          <view class="kv">
            <text>{{ order.state === '待付款' ? '待支付金额' : '订单金额' }}</text>
            <text class="due-amount">¥{{ money(order.due) }}</text>
          </view>
        </view>
        <view class="sheet-card">
          <view class="kv">
            <text>订单编号</text>
            <text>{{ order.id }}</text>
          </view>
          <view class="kv">
            <text>创建时间</text>
            <text>{{ order.created }}</text>
          </view>
          <view v-if="order.state === '办理中'" class="hint">办理进度及快递信息接入既有体系后展示。</view>
        </view>
        <view v-if="order.state === '售后退款'" class="sheet-card">
          <view class="kv">
            <text>退款范围</text>
            <text>整单申请</text>
          </view>
          <view class="kv">
            <text>退款原因</text>
            <text>{{ order.reason || '—' }}</text>
          </view>
          <view class="kv">
            <text>审核状态</text>
            <text>审核中</text>
          </view>
        </view>
        <view class="actions detail-actions">
          <template v-if="order.state === '待付款'">
            <view class="btn outline" @tap="cancelOrder">取消订单</view>
            <view class="btn solid" @tap="goPay">继续付款</view>
          </template>
          <view
            v-else-if="order.state === '办理中' || order.state === '已完成'"
            class="btn outline"
            @tap="goRefund"
          >
            申请退款
          </view>
        </view>
      </view>
    </template>
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
import { useCenterStore, type OrderState } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const orderId = ref('');

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesOrder/orderDetail/index?id=${orderId.value}` }))) return;
});

const order = computed(() => center.findOrder(orderId.value));

const heroIcon = computed(() => {
  const state = order.value?.state;
  if (state === '已完成') return '/static/images/center/circle-check.png';
  if (state === '待付款') return '/static/images/center/clock-3.png';
  return '/static/images/center/file-clock.png';
});

const heroTitle = computed(() => {
  const state = order.value?.state;
  return state === '售后退款' ? '退款审核中' : state || '';
});

const heroDescs: Record<OrderState, string> = {
  待付款: '请确认订单信息后继续付款',
  办理中: '您的订单正在办理，请关注办理情况',
  已完成: '本次服务已完成，感谢您的信任',
  售后退款: '退款申请已提交，结果以审核为准',
  已取消: '订单已取消，您可以重新选购',
};
const heroDesc = computed(() => (order.value ? heroDescs[order.value.state] : ''));

const money = (n: number) => Number(n).toFixed(2);

function goPay() {
  uni.navigateTo({ url: `/pagesOrder/orderPay/index?id=${orderId.value}` });
}

function goRefund() {
  uni.navigateTo({ url: `/pagesOrder/orderRefund/index?id=${orderId.value}` });
}

function cancelOrder() {
  uni.showModal({
    title: '取消订单',
    content: '取消后将无法继续支付这笔订单，您可以重新选购。',
    success: (res) => {
      if (!res.confirm) return;
      center.mockCancelOrder(orderId.value);
      uni.showToast({ title: '订单已取消（模拟）', icon: 'none' });
    },
  });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pagesOrder/orders/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.status-hero {
  .hero-title {
    font-size: 40rpx;
    font-weight: 600;
    color: $brand-ink;
    margin: 22rpx 0 12rpx;
  }

  .hero-desc {
    font-size: 25rpx;
    color: #285d7a;
    margin: 12rpx 0 26rpx;
  }
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

.traveller-title {
  font-size: 25rpx;
  font-weight: 500;
  color: $text;
  margin: 12rpx 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text;
  margin-bottom: 20rpx;
}

.kv > text.due-amount {
  font-weight: 600;
  color: $text;
}

.detail-actions {
  margin-top: 4rpx;
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
