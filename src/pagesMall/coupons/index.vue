<template><MallPage><view class="mx-tabs"><button v-for="item in filters" :key="item" class="mx-tab" :class="{ active: filter === item }" @tap="filter = item">{{ item }}</button></view><view class="mx-body"><CouponCard v-for="coupon in items" :key="coupon.id" :coupon="coupon" :disabled-reason="coupon.reservedBy ? '待付款订单占用中' : ''"><view class="mx-actions"><button class="mx-button mx-plain" @tap="go('coupon', { id: coupon.id })">使用规则</button><button v-if="status(coupon) === '未使用'" class="mx-button mx-light" :disabled="!!coupon.reservedBy" @tap="go('eligible', { id: coupon.id })">去使用</button></view></CouponCard><view v-if="!items.length" class="mx-empty"><view class="mx-title">暂无{{ filter }}优惠券</view><button class="mx-button" @tap="go('category')">去逛逛</button></view></view></MallPage></template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';
import { day, type Coupon } from '@/mall/model';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import CouponCard from '@/components/mall/CouponCard.vue';
const mall = useMallPreviewStore(), filters = ['未使用', '已使用', '已过期'], filter = ref('未使用');
function status(coupon: Coupon) { return coupon.status === '未使用' && coupon.end < day() ? '已过期' : coupon.status; }
const items = computed(() => mall.data.member ? mall.data.coupons.filter(item => status(item) === filter.value) : []);
onLoad(options => { const value = String(options?.filter || '未使用'); if (filters.includes(value)) filter.value = value; });
</script>
