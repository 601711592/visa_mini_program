<template>
  <MallPage>
    <view class="mx-tabs"><button v-for="item in filters" :key="item" class="mx-tab" :class="{ active: filter === item }" @tap="filter = item">{{ item }}</button></view>
    <view class="mx-body">
      <view v-for="order in items" :key="order.id" class="mx-card">
        <view class="order-heading"><text class="order-id">{{ order.id }}</text><text class="mx-badge">{{ order.status }}</text></view>
        <ProductLine v-for="line in order.lines" :key="line.id" :line="line" variant="order" />
        <view class="order-total"><text>共 {{ order.lines.reduce((sum, item) => sum + item.quantity, 0) }} 人</text><view>{{ order.status === '待付款' ? '待支付' : '订单金额' }} <text class="order-total__price">¥{{ money(order.price.due) }}</text></view></view>
        <OrderActions :order="order" details />
      </view>
      <view v-if="!items.length" class="mx-empty"><view class="mx-title">暂无相关订单</view><button class="mx-button" @tap="go('category')">去逛逛</button></view>
    </view>
  </MallPage>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';
import { money } from '@/mall/model';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import ProductLine from '@/components/mall/ProductLine.vue';
import OrderActions from '@/components/mall/OrderActions.vue';
const mall = useMallPreviewStore();
const filters = ['全部', '待付款', '办理中', '已完成', '售后退款'], filter = ref('全部');
const items = computed(() => mall.data.member ? mall.data.orders.filter(item => filter.value === '全部' || item.status === filter.value) : []);
onLoad(options => { const value = String(options?.filter || '全部'); if (filters.includes(value)) filter.value = value; });
</script>
<style scoped>
.order-heading { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 20rpx; }
.order-id { min-width: 0; font-size: 21rpx; color: #737D8C; overflow-wrap: anywhere; }
.order-total { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; border-top: 1rpx solid #E3E8F0; margin-top: 18rpx; padding-top: 24rpx; color: #737D8C; font-size: 24rpx; }
.order-total__price { color: #202631; font-size: 32rpx; font-weight: 600; }
</style>
