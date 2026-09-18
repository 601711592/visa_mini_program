<template><view class="mx-actions"><button v-if="order.status === '待付款'" class="mx-button mx-outline" @tap="go('cancel', { id: order.id })">取消订单</button><button v-if="order.status === '待付款'" class="mx-button" @tap="go('payment', { id: order.id })">继续付款</button><button v-if="order.status === '办理中' || order.status === '已完成'" class="mx-button mx-outline" @tap="go('refund', { id: order.id })">申请退款</button><button v-if="details" class="mx-button mx-outline" @tap="go('order', { id: order.id })">查看详情</button></view></template>
<script setup lang="ts">
import type { Order } from '@/mall/model';
import { go } from '@/mall/navigation';
defineOptions({ options: { styleIsolation: 'shared' } });
withDefaults(defineProps<{ order: Order; details?: boolean }>(), { details: false });
</script>
