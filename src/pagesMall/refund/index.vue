<template><MallPage><view v-if="order && (order.status === '办理中' || order.status === '已完成')" class="mx-body"><view class="mx-card"><view class="mx-title">整单退款申请</view><view class="mx-row"><text>申请金额</text><text class="mx-price">¥{{ money(order.price.due) }}</text></view><view class="mx-muted">提交后由商家审核。本页面仅演示整单申请，不执行真实退款。</view></view><view class="mx-card"><view class="mx-field"><text class="mx-field-title">退款原因</text><picker :range="reasons" :value="reasonIndex < 0 ? 0 : reasonIndex" @change="reasonIndex = Number($event.detail.value)"><view class="mx-row">{{ reasonIndex < 0 ? '请选择退款原因' : reasons[reasonIndex] }}<text>›</text></view></picker></view><view class="mx-field"><text class="mx-field-title">补充说明（选填）</text><textarea v-model="note" class="mx-textarea" placeholder="请补充说明退款原因" :maxlength="300" /></view></view><view class="mx-hint">超过半年在线申请的正式起算口径待确认；当前演示按订单创建时间检查。</view><view v-if="error" class="mx-error" role="alert">{{ error }}</view><button class="mx-button mx-wide" @tap="submit">提交申请（模拟）</button></view><view v-else class="mx-empty"><view class="mx-title">当前订单不可重复申请退款</view><button class="mx-button" @tap="go('order', { id })">查看订单</button></view></MallPage></template>
<script setup lang="ts">
import { ref } from 'vue';
import { useOrderPage } from '@/mall/use-order';
import { money } from '@/mall/model';
import { go, routes } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
const { mall, order, id } = useOrderPage();
const reasons = ['出行计划变更', '重复下单', '其他原因'];
const reasonIndex = ref(-1), note = ref(''), error = ref('');
function submit() { try { mall.refund(id.value, reasons[reasonIndex.value] || '', note.value); uni.redirectTo({ url: routes.order + '?id=' + encodeURIComponent(id.value) }); } catch (e) { error.value = e instanceof Error ? e.message : '申请未完成'; } }
</script>
