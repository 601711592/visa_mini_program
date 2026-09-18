<template>
  <MallPage public-page :footer="mall.data.cart.length > 0">
    <view class="mx-body">
      <view v-if="!mall.enabled" class="mx-card mx-muted">购物车业务待接入。前端完整流程请使用独立预览构建。</view>
      <view v-for="line in mall.data.cart" :key="line.id" class="mx-card">
        <view class="cart-line"><checkbox-group @change="line.selected = $event.detail.value.includes(line.id)"><label class="cart-check"><checkbox :value="line.id" :checked="line.selected" color="#164E70" /></label></checkbox-group><view class="cart-product"><ProductLine :line="line" /></view></view>
        <view class="mx-between"><button class="mx-button mx-plain" @tap="remove(line.id)">删除</button><view class="mx-stepper"><button :disabled="line.quantity <= 1" @tap="change(line.id, line.quantity - 1)">−</button><text>{{ line.quantity }}</text><button :disabled="line.quantity >= Math.min(99, line.stock)" @tap="change(line.id, line.quantity + 1)">＋</button></view></view>
      </view>
      <view v-if="!mall.data.cart.length" class="mx-empty"><MallIcon name="cart" :size="100" /><view class="mx-title">购物车还是空的</view><view class="mx-muted">先选择商品、套餐和出发日期</view><button class="mx-button" @tap="go('category')">去逛逛</button></view>
    </view>
    <template #footer><checkbox-group @change="selectAll($event.detail.value.includes('all'))"><label class="mx-check"><checkbox value="all" :checked="all" color="#164E70" /><text>全选</text></label></checkbox-group><view><view class="mx-muted">合计</view><text class="mx-price">¥{{ money(total) }}</text></view><button class="mx-button" :disabled="!selected.length" @tap="checkout">结算（{{ selected.length }}）</button></template>
  </MallPage>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useMallPreviewStore } from '@/store/mall-preview';
import { setQuantity, money } from '@/mall/model';
import { attempt, confirm, go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import MallIcon from '@/components/mall/MallIcon.vue';
import ProductLine from '@/components/mall/ProductLine.vue';
const mall = useMallPreviewStore();
const selected = computed(() => mall.data.cart.filter(item => item.selected));
const all = computed(() => !!mall.data.cart.length && selected.value.length === mall.data.cart.length);
const total = computed(() => selected.value.reduce((sum, item) => sum + item.unitCents * item.quantity, 0));
function selectAll(value: boolean) { mall.data.cart.forEach(item => { item.selected = value; }); }
function change(id: string, quantity: number) { attempt(() => setQuantity(mall.data, id, quantity)); }
function remove(id: string) { confirm('删除商品', '确定从购物车移除此商品？', () => { mall.data.cart = mall.data.cart.filter(item => item.id !== id); }); }
function checkout() { attempt(() => { mall.checkout(selected.value, 'cart'); go('checkout'); }); }
</script>
<style scoped>.cart-line { display: flex; align-items: flex-start; }.cart-check { display: flex; align-items: center; min-height: 100rpx; width: 64rpx; }.cart-check checkbox { transform: scale(.8); transform-origin: left center; }.cart-product { flex: 1; min-width: 0; }</style>
