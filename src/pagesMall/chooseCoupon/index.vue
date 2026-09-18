<template>
  <MallPage><view class="mx-body" v-if="mall.data.draft && !submitted"><button class="mx-button mx-outline mx-wide" @tap="choose('')">不使用优惠券</button><view class="mx-hint">一笔订单使用一张优惠券，可叠加积分抵扣。</view><CouponCard v-for="coupon in mall.data.coupons" :key="coupon.id" :coupon="coupon" :disabled-reason="issue(coupon)"><button class="mx-button mx-plain" :disabled="!!issue(coupon)" @tap="choose(coupon.id)">{{ mall.data.draft.couponId === coupon.id ? '已选用' : '使用此券' }}</button></CouponCard><view v-if="error" class="mx-error">{{ error }}</view></view><view v-else class="mx-empty"><view class="mx-title">没有可修改的结算单</view><button class="mx-button" @tap="back">返回</button></view></MallPage>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMallPreviewStore } from '@/store/mall-preview';
import { couponIssue, type Coupon } from '@/mall/model';
import { back } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import CouponCard from '@/components/mall/CouponCard.vue';
const mall = useMallPreviewStore(), error = ref('');
const submitted = computed(() => !!(mall.data.draft && mall.data.submitted[mall.data.draft.id]));
function issue(coupon: Coupon) { return couponIssue(coupon, mall.data.draft?.lines || []); }
function choose(id: string) {
  if (!mall.data.member || !mall.data.draft || submitted.value) return;
  const coupon = mall.data.coupons.find(item => item.id === id);
  if (id && (!coupon || issue(coupon))) { error.value = coupon ? issue(coupon) : '优惠券已不存在'; return; }
  mall.data.draft.couponId = id; back();
}
</script>
