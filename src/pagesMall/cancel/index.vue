<template><MallPage><view class="mx-body"><view v-if="order && order.status === '待付款'" class="mx-card"><view class="mx-title">确认取消这笔订单？</view><view class="mx-hint">取消后无法继续支付这笔订单，可重新选购。演示中已抵扣的积分及占用的优惠券会释放。</view><view class="mx-muted">{{ order.id }}</view><view class="mx-stack"><button class="mx-button mx-wide" @tap="cancel">确认取消</button><button class="mx-button mx-outline mx-wide" @tap="back">保留订单</button></view></view><view v-else class="mx-empty"><view class="mx-title">当前订单不可取消</view><button class="mx-button" @tap="go('order', { id })">查看订单</button></view></view></MallPage></template>
<script setup lang="ts">
import { useOrderPage } from '@/mall/use-order';
import { attempt, go, back, routes } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
const { mall, order, id } = useOrderPage();
function cancel() { attempt(() => { mall.cancel(id.value); uni.redirectTo({ url: routes.order + '?id=' + encodeURIComponent(id.value) }); }); }
</script>
