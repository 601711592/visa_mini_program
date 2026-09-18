<template>
  <MallPage><view class="mx-body" v-if="order && order.status === '待付款'"><view class="mx-card"><view class="mx-title">{{ order.payment === 'failed' ? '支付失败' : order.payment === 'cancelled' ? '支付已取消' : '确认付款' }}</view><view class="mx-number">¥{{ money(order.price.due) }}</view><view class="mx-muted">订单 {{ order.id }}</view><view class="mx-hint">仅演示付款状态，不调用微信支付、不产生扣款。</view><view v-if="order.payment !== 'idle'" class="mx-hint">订单仍为待付款，可主动重试或返回订单。</view></view><view class="mx-stack"><button class="mx-button mx-wide" @tap="pay('succeeded')">{{ order.payment === 'idle' ? '模拟支付成功' : '重试付款（模拟成功）' }}</button><button class="mx-button mx-outline mx-wide" @tap="pay('failed')">模拟支付失败</button><button class="mx-button mx-outline mx-wide" @tap="pay('cancelled')">模拟取消支付</button><button class="mx-button mx-plain mx-wide" @tap="go('order', { id })">返回订单详情</button></view></view><view v-else class="mx-empty"><view class="mx-title">当前订单无需付款</view><button class="mx-button" @tap="go('order', { id })">查看订单</button></view></MallPage>
</template>
<script setup lang="ts">
import { useOrderPage } from '@/mall/use-order';
import { money } from '@/mall/model';
import { attempt, go, routes } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
const { mall, order, id } = useOrderPage();
function pay(result: 'succeeded' | 'failed' | 'cancelled') { attempt(() => { mall.pay(id.value, result); if (result === 'succeeded') uni.redirectTo({ url: routes.success + '?id=' + encodeURIComponent(id.value) }); }); }
</script>
