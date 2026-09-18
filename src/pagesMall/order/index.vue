<template>
  <MallPage>
    <template v-if="order">
      <view class="mx-hero"><view class="mx-title">{{ order.status === '售后退款' ? '退款审核中' : order.status }}</view><view class="mx-muted">{{ statusCopy }}</view></view>
      <view class="mx-body">
        <view v-for="line in order.lines" :key="line.id" class="mx-card"><ProductLine :line="line" /><template v-if="line.travellersRequired"><view class="mx-line" /><view class="mx-subtitle">本商品出行人 · {{ line.travellers.length }} 位</view><view v-for="(person, index) in line.travellers" :key="index" class="mx-row"><view><view>{{ person.name }}</view><view class="mx-muted">生日 {{ person.birthday }}</view></view><text class="mx-muted">护照尾号 {{ person.passport.slice(-4) }}</text></view></template></view>
        <PriceBreakdown :price="order.price" />
        <view v-if="order.address" class="mx-card"><view class="mx-title">邮寄地址</view><view class="mx-hint">{{ order.address.name }} · {{ order.address.phone.slice(0, 3) }}****{{ order.address.phone.slice(-4) }}</view><view>{{ order.address.region.join(' ') }} {{ order.address.detail }}</view></view>
        <view class="mx-card"><view class="mx-row"><text>订单编号</text><text class="mx-muted mx-wrap">{{ order.id }}</text></view><view class="mx-row"><text>创建时间</text><text class="mx-muted">{{ createdAt }}</text></view><view v-if="order.status === '办理中'" class="mx-hint">办理进度和快递信息沿用既有体系，当前前端演示未接入。</view></view>
        <view v-if="order.status === '售后退款'" class="mx-card"><view class="mx-title">整单退款申请</view><view class="mx-row"><text>退款原因</text><text>{{ order.reason }}</text></view><view v-if="order.note" class="mx-hint">{{ order.note }}</view><view class="mx-row"><text>审核状态</text><text class="mx-badge">审核中</text></view><view class="mx-muted">提交申请不代表退款成功，不在此阶段退回资金、积分或优惠券。</view></view>
        <OrderActions :order="order" />
      </view>
    </template>
    <view v-else class="mx-empty"><view class="mx-title">订单不存在或演示会话已重置</view><button class="mx-button" @tap="go('orders')">返回订单列表</button></view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useOrderPage } from '@/mall/use-order';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import ProductLine from '@/components/mall/ProductLine.vue';
import PriceBreakdown from '@/components/mall/PriceBreakdown.vue';
import OrderActions from '@/components/mall/OrderActions.vue';
const { order } = useOrderPage();
const createdAt = computed(() => order.value ? new Date(order.value.createdAt).toLocaleString('zh-CN', { hour12: false }) : '');
const statusCopy = computed(() => order.value ? ({ '待付款': '请核对信息后继续付款', '办理中': '订单正在办理，请关注办理情况', '已完成': '本次服务已完成', '售后退款': '退款申请已提交，结果以审核为准', '已取消': '订单已取消，可重新选购' })[order.value.status] : '');
</script>
