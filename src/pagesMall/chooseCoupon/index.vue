<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="hint">每单限用一张，可与积分叠加使用。</view>
        <view v-if="loading" class="hint">加载中…</view>
        <view v-else-if="error" class="sheet-card"><view>{{ error }}</view><view class="btn outline" @tap="loadCoupons">重试</view></view>
        <view v-else-if="!couponEnabled" class="hint">当前未开放优惠券</view>
        <template v-else-if="list.length">
          <view v-for="coupon in list" :key="coupon.id" class="coupon-card" :class="{ dim: coupon.unavailable_reason }">
            <view class="coupon-face">
              <view class="coupon-amount"><text class="coupon-unit">¥</text><text class="coupon-value">{{ coupon.amount_cents / 100 }}</text></view>
              <text class="coupon-min">{{ coupon.minimum_cents > 0 ? `满 ${coupon.minimum_cents / 100} 元可用` : '无门槛' }}</text>
            </view>
            <view class="coupon-copy">
              <view class="coupon-name">{{ coupon.name }}</view>
              <view class="coupon-desc">{{ coupon.scope_label }}</view>
              <view class="coupon-end">{{ coupon.ends_at.slice(0, 16) }} 到期</view>
              <view class="coupon-side">
                <text v-if="coupon.unavailable_reason" class="coupon-unfit">{{ coupon.unavailable_reason }}</text>
                <view v-else class="btn" :class="mall.couponId === coupon.id ? 'compact' : 'solid coupon-btn'" @tap="pick(coupon)">
                  {{ mall.couponId === coupon.id ? '已选择' : '选择' }}
                </view>
              </view>
            </view>
          </view>
        </template>
        <view v-else class="empty-state">
          <image src="/static/images/center/package-open.png" mode="aspectFit" />
          <view class="empty-h">暂无可用优惠券</view>
          <view class="empty-p">新的优惠券会展示在这里</view>
        </view>
        <view class="btn outline full skip-btn" @tap="clear">不使用优惠券</view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { quoteOrder, type CheckoutCoupon } from '@/services/orders';
import { useMallStore } from '@/store/mall';

const global = useGlobalStore();
const mall = useMallStore();
const loading = ref(false);
const error = ref('');

const list = ref<CheckoutCoupon[]>([]);
const couponEnabled = ref(false);
let requestId = 0;
onUnload(() => { requestId++; });

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesMall/chooseCoupon/index' }))) return;
  await loadCoupons();
});

/** 重新报价读取本单候选券，不沿用旧金额或前端推算的资格。 */
async function loadCoupons() {
  const seq = ++requestId;
  loading.value = true;
  error.value = '';
  list.value = [];
  couponEnabled.value = false;
  try {
    const input = mall.selection();
    if (!input) throw new Error('请先选择商品套餐');
    const result = await quoteOrder({ ...input, coupon_id: null });
    if (seq !== requestId || !global.isLogin) return;
    couponEnabled.value = result.data.coupon_enabled;
    list.value = result.data.coupon_options;
    if (!couponEnabled.value) mall.setCoupon(0);
  } catch (e) {
    if (seq === requestId) error.value = e instanceof Error ? e.message : '优惠券加载失败，请重试';
  } finally { if (seq === requestId) loading.value = false; }
}

/** 选择或取消当前优惠券并返回结算页。 */
function pick(coupon: CheckoutCoupon) {
  if (loading.value || error.value || !global.isLogin || !couponEnabled.value || coupon.unavailable_reason) return;
  mall.setCoupon(mall.couponId === coupon.id ? 0 : coupon.id);
  uni.navigateBack();
}

/** 取消使用优惠券并返回结算页。 */
function clear() {
  mall.setCoupon(0);
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.coupon-end {
  font-size: 22rpx;
  color: $muted;
  margin-top: 6rpx;
}

.coupon-side {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 16rpx;
}

.coupon-unfit {
  font-size: 22rpx;
  color: $muted;
  max-width: 160rpx;
  text-align: center;
  line-height: 1.5;
}

.coupon-btn {
  min-height: 72rpx;
  padding: 10rpx 28rpx;
  font-size: 25rpx;
}

.skip-btn {
  margin-top: 12rpx;
}
</style>
