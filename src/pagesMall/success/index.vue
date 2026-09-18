<template><MallPage><view class="mx-empty"><MallIcon :name="paid ? 'check' : 'clock'" :size="120" /><view class="mx-title">{{ paid ? '支付成功（模拟）' : '尚未确认支付成功' }}</view><view v-if="paid && order" class="mx-number">¥{{ money(order.price.due) }}</view><view class="mx-muted">{{ paid ? '订单已进入办理中，可在我的订单查看。' : '支付状态以当前订单记录为准。' }}</view><button class="mx-button" @tap="go('order', { id })">查看订单</button><button class="mx-button mx-outline" @tap="go('account')">返回个人中心</button></view></MallPage></template>
<script setup lang="ts">
import { computed } from 'vue';
import { useOrderPage } from '@/mall/use-order';
import { money } from '@/mall/model';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import MallIcon from '@/components/mall/MallIcon.vue';
const { order, id } = useOrderPage();
const paid = computed(() => !!order.value && order.value.payment === 'succeeded' && order.value.status !== '待付款' && order.value.status !== '已取消');
</script>
