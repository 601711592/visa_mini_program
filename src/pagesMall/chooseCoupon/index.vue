<template>
  <view class="center-page">
    <view class="page-body">
      <view class="hint">每单限用一张，可与积分叠加使用。</view>
      <template v-if="list.length">
        <view v-for="coupon in list" :key="coupon.id" class="coupon-card" :class="{ dim: stateOf(coupon) !== 'ok' }">
          <view class="coupon-face">
            <text class="coupon-amount"><text class="coupon-unit">¥</text>{{ coupon.amount }}</text>
            <text class="coupon-min">{{ coupon.min > 0 ? `满 ${coupon.min} 元可用` : '无门槛（演示）' }}</text>
          </view>
          <view class="coupon-copy">
            <view class="coupon-name">{{ coupon.name }}</view>
            <view class="coupon-desc">{{ coupon.min ? `满 ${coupon.min} 元可用` : '无门槛（演示）' }} · {{ coupon.scope }}</view>
            <view class="coupon-end">有效期至 {{ coupon.end }}</view>
          </view>
          <view class="coupon-side">
            <text v-if="stateOf(coupon) === 'category'" class="coupon-unfit">不适用于本单商品</text>
            <text v-else-if="stateOf(coupon) === 'threshold'" class="coupon-unfit">未达门槛</text>
            <view v-else class="btn" :class="mall.couponId === coupon.id ? 'compact' : 'solid coupon-btn'" @tap="pick(coupon)">
              {{ mall.couponId === coupon.id ? '已选择' : '选择' }}
            </view>
          </view>
        </view>
        <view class="btn outline full skip-btn" @tap="clear">不使用优惠券</view>
      </template>
      <view v-else class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-h">暂无可用优惠券</view>
        <view class="empty-p">新的优惠券会展示在这里</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type Coupon } from '@/store/center';
import { useMallStore } from '@/store/mall';

const global = useGlobalStore();
const center = useCenterStore();
const mall = useMallStore();

const list = computed(() => center.coupons.filter((c) => c.status === '未使用'));
const rows = computed(() => mall.checkoutRows);
const totals = computed(() => mall.totals());

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesMall/chooseCoupon/index' }))) return;
});

/** 与 mall.totals 的券资格口径一致：分类关键词需命中全部结算行，门槛按商品总额−多人优惠计算。 */
function stateOf(coupon: Coupon): 'category' | 'threshold' | 'ok' {
  if (coupon.categoryKeyword && rows.value.some((x) => !x.category.includes(coupon.categoryKeyword))) return 'category';
  if (totals.value.base - totals.value.discount < coupon.min) return 'threshold';
  return 'ok';
}

function pick(coupon: Coupon) {
  mall.setCoupon(mall.couponId === coupon.id ? 0 : coupon.id);
  uni.navigateBack();
}

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
  padding-right: 24rpx;
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
