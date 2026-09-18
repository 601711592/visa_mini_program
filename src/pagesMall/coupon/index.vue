<template><MallPage><view v-if="coupon" class="mx-body"><CouponCard :coupon="coupon" /><view class="mx-card"><view class="mx-title">使用规则</view><view class="mx-row"><text>适用范围</text><text>{{ coupon.scope }}</text></view><view class="mx-row"><text>使用门槛</text><text>{{ coupon.minimumCents ? '满 ' + money(coupon.minimumCents) + ' 元可用' : '无门槛（演示）' }}</text></view><view class="mx-row"><text>有效期至</text><text>{{ coupon.end }}</text></view><view class="mx-hint">一单一张，允许叠加积分；最终适用性及优惠金额在结算页校验。</view><view class="mx-hint">新人券 10 元已确认，演示中的门槛及有效期不是正式运营承诺。退款成功后的返券规则及过期处理仍待正式配置。</view></view><button class="mx-button mx-wide" :disabled="!usable" @tap="go('eligible', { id })">{{ coupon.reservedBy ? '待付款订单占用中' : usable ? '查看适用商品' : '该券不可使用' }}</button></view><view v-else class="mx-empty">优惠券不存在</view></MallPage></template>
<script setup lang="ts">
import { computed, ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';import { day, money } from '@/mall/model';import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';import CouponCard from '@/components/mall/CouponCard.vue';
const mall = useMallPreviewStore(), id = ref('');
const coupon = computed(() => mall.data.member ? mall.data.coupons.find(item => item.id === id.value) : undefined);
const usable = computed(() => coupon.value?.status === '未使用' && coupon.value.end >= day() && !coupon.value.reservedBy);
onLoad(options => { id.value = String(options?.id || ''); });
</script>
