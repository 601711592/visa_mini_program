<template>
  <MallPage>
    <view class="mx-tabs"><button v-for="item in filters" :key="item" class="mx-tab" :class="{ active: filter === item }" @tap="filter = item">{{ item }}</button></view>
    <view class="mx-body"><view v-for="order in items" :key="order.id" class="mx-card"><view class="mx-between"><text class="mx-muted">{{ order.id }}</text><text class="mx-badge">{{ order.status }}</text></view><view class="mx-line" /><ProductLine v-for="line in order.lines" :key="line.id" :line="line" /><view class="mx-order-total"><text class="mx-muted">共 {{ order.lines.reduce((sum, item) => sum + item.quantity, 0) }} 人　{{ order.status === '待付款' ? '待支付' : '订单金额' }}</text><text class="mx-price"> ¥{{ money(order.price.due) }}</text></view><OrderActions :order="order" details /></view><view v-if="!items.length" class="mx-empty"><view class="mx-title">暂无相关订单</view><button class="mx-button" @tap="go('category')">去逛逛</button></view></view>
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
