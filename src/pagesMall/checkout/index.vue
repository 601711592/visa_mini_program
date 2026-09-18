<template>
  <MallPage :footer="!!draft && !submittedId">
    <view v-if="submittedId" class="mx-empty"><view class="mx-title">订单已提交</view><button class="mx-button" @tap="go('order', { id: submittedId })">查看订单</button></view>
    <view v-else-if="draft" class="mx-body">
      <view v-for="line in draft.lines" :key="line.id" class="mx-card">
        <ProductLine :line="line" />
        <button v-if="line.travellersRequired" class="traveller-entry" @tap="go('travellers', { id: line.id })"><view><view class="mx-subtitle">填写本商品出行人</view><view class="mx-muted">需 {{ line.quantity }} 位，已填 {{ line.travellers.length }} 位</view><view v-for="(person, index) in line.travellers" :key="index" class="mx-muted">{{ person.name }} · 护照尾号 {{ person.passport.slice(-4) }}</view></view><text>›</text></button>
      </view>
      <view class="mx-card"><button class="checkout-row" @tap="go('addresses', { select: '1' })"><view><view class="mx-subtitle">{{ shipping ? '收货地址（必选）' : '邮寄地址（按需填写）' }}</view><view class="mx-muted">{{ address ? address.name + ' · ' + address.phone.slice(0, 3) + '****' + address.phone.slice(-4) : '用于护照或材料邮寄' }}</view><view v-if="address" class="mx-muted">{{ address.region.join(' ') }} {{ address.detail }}</view></view><text>›</text></button></view>
      <view class="mx-card"><button class="checkout-row" @tap="go('chooseCoupon')"><text>优惠券</text><text class="mx-muted">{{ coupon ? coupon.name : '选择优惠券' }} ›</text></button><view class="mx-row"><view><view>积分抵扣</view><view class="mx-muted">可用 {{ mall.data.balance }} 积分</view></view><switch :checked="draft.usePoints" color="#164E70" @change="draft.usePoints = $event.detail.value" /></view></view>
      <PriceBreakdown :price="mall.price" />
      <view class="mx-card"><checkbox-group @change="draft.consent = $event.detail.value.includes('yes')"><label class="mx-check"><checkbox value="yes" :checked="draft.consent" color="#164E70" /><text>我已核对商品、套餐、日期及出行人，并阅读商品详情中的预订须知和退改规则。</text></label></checkbox-group><view class="mx-hint">当前为前端演示：满 2 人优惠、券门槛及积分上限均为暂定值，不代表正式成交规则。</view><view v-if="error" class="mx-error" role="alert">{{ error }}</view></view>
    </view>
    <view v-else class="mx-empty"><view class="mx-title">暂无待结算商品</view><button class="mx-button" @tap="go('category')">选择商品</button></view>
    <template #footer><view><view class="mx-muted">实付（演示）</view><text class="mx-price">¥{{ money(mall.price.due) }}</text></view><button class="mx-button" :disabled="submitting" @tap="submit">提交订单</button></template>
  </MallPage>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMallPreviewStore } from '@/store/mall-preview';
import { money } from '@/mall/model';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import ProductLine from '@/components/mall/ProductLine.vue';
import PriceBreakdown from '@/components/mall/PriceBreakdown.vue';
const mall = useMallPreviewStore(), error = ref(''), submitting = ref(false);
const draft = computed(() => mall.data.draft);
const submittedId = computed(() => draft.value ? mall.data.submitted[draft.value.id] || '' : '');
const address = computed(() => mall.data.addresses.find(item => item.id === draft.value?.addressId));
const coupon = computed(() => mall.data.coupons.find(item => item.id === draft.value?.couponId));
const shipping = computed(() => draft.value?.lines.some(item => item.shippingRequired));
function submit() {
  if (submitting.value) return;
  submitting.value = true; error.value = '';
  try { const order = mall.submit(); go('payment', { id: order.id }); }
  catch (e) { error.value = e instanceof Error ? e.message : '提交未完成，请重试'; }
  finally { submitting.value = false; }
}
</script>
<style scoped>.traveller-entry,.checkout-row { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 20rpx 0; margin: 0; min-height: 88rpx; background: transparent; font-size: 28rpx; color: #495566; line-height: 1.6; text-align: left; border-radius: 0; }.traveller-entry { margin-top: 20rpx; border-top: 1rpx solid #E3E8F0; }.traveller-entry::after,.checkout-row::after { border: 0; }.traveller-entry>view,.checkout-row>view { min-width: 0; flex: 1; }.traveller-entry>text,.checkout-row>text { margin-left: 16rpx; }</style>
