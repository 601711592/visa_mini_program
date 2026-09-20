<template>
  <view class="center-page">
    <view class="filter-tabs">
      <view
        v-for="tab in tabs"
        :key="tab"
        class="tab"
        :class="{ selected: filter === tab }"
        @tap="filter = tab"
      >
        {{ tab }}
      </view>
    </view>
    <view class="page-body">
      <view class="hint">
        {{ purpose === 'use' ? '先选择一张券，再查看适用商品。' : '一单一张，可与积分叠加使用；券条件为演示配置。' }}
      </view>
      <template v-if="list.length">
        <view
          v-for="coupon in list"
          :key="coupon.id"
          class="coupon-card"
          :class="{ dim: coupon.status !== '未使用' }"
        >
          <view class="coupon-face">
            <text class="coupon-amount"><text class="coupon-unit">¥</text>{{ coupon.amount }}</text>
            <text class="coupon-min">{{ coupon.min > 0 ? `满 ${coupon.min} 元可用` : '无门槛（演示）' }}</text>
          </view>
          <view class="coupon-copy">
            <view class="coupon-name">{{ coupon.name }}</view>
            <view class="coupon-desc">{{ coupon.scope }} · {{ coupon.end }} 到期</view>
            <view class="coupon-actions">
              <view class="text-link" @tap="goDetail(coupon.id)">
                使用规则
                <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
              </view>
              <view v-if="coupon.status === '未使用'" class="btn compact" @tap.stop="goUse(coupon.id)">去使用</view>
              <text v-else class="status-tag">{{ coupon.status }}</text>
            </view>
          </view>
        </view>
      </template>
      <view v-else class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-h">暂无优惠券</view>
        <view class="empty-p">新的优惠券会展示在这里</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type CouponStatus } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const tabs: CouponStatus[] = ['未使用', '已使用', '已过期'];
const filter = ref<CouponStatus>('未使用');
const purpose = ref('');

const list = computed(() => center.coupons.filter((c) => c.status === filter.value));

onLoad((query) => {
  purpose.value = query?.purpose || '';
});

onShow(async () => {
  const target = `/pagesCenter/coupons/index${purpose.value ? `?purpose=${purpose.value}` : ''}`;
  if (!(await global.ensureLogin({ target }))) return;
});

function goDetail(id: number) {
  uni.navigateTo({ url: `/pagesCenter/couponDetail/index?id=${id}` });
}

function goUse(id: number) {
  uni.navigateTo({ url: `/pagesCenter/couponGoods/index?id=${id}` });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
