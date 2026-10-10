<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="filter-tabs coupon-tabs">
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
          {{ purpose === 'use' ? '选择优惠券后可查看适用商品。' : '每单可用一张，可叠加积分抵扣' }}
        </view>
        <view v-if="loading" class="hint">加载中…</view>
        <view v-else-if="error" class="sheet-card"><view>{{ error }}</view><view class="btn outline" @tap="loadCoupons">重试</view></view>
        <template v-else-if="list.length">
          <view
            v-for="coupon in list"
            :key="coupon.id"
            class="coupon-card"
            :class="{ dim: coupon.status !== '未使用' }"
          >
            <view class="coupon-face">
              <view class="coupon-amount"><text class="coupon-unit">¥</text><text class="coupon-value">{{ coupon.amount }}</text></view>
              <text class="coupon-min">{{ coupon.min > 0 ? `满 ${coupon.min} 元可用` : '无门槛' }}</text>
            </view>
            <view class="coupon-copy">
              <view class="coupon-name">{{ coupon.name }}</view>
              <view class="coupon-desc">{{ coupon.scope }}</view>
              <view class="coupon-expiry">{{ coupon.status === '未生效' ? `${coupon.start.slice(0, 16)} 起可用` : `${coupon.end.slice(0, 16)} 到期` }}</view>
              <view class="coupon-actions">
                <view class="text-link" @tap="goDetail(coupon.id)">
                  使用规则
                  <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
                </view>
                <view v-if="coupon.status === '未使用'" class="btn compact" @tap.stop="goUse(coupon.id)">去使用</view>
                <text v-else class="status-tag">{{ coupon.status === '已使用' && coupon.orderStatus === 'pending' ? '订单待付款' : coupon.status }}</text>
              </view>
            </view>
          </view>
        </template>
        <view v-else class="empty-state">
          <image src="/static/images/center/package-open.png" mode="aspectFit" />
          <view class="empty-h">暂无{{ filter }}优惠券</view>
          <view class="empty-p">新的优惠券会展示在这里</view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const tabs = ['未使用', '已使用', '已失效'] as const;
const filter = ref<typeof tabs[number]>('未使用');
const purpose = ref('');
const loading = ref(false);
const error = ref('');

const list = computed(() => center.coupons.filter((c) => {
  if (filter.value === '未使用') return c.status === '未使用' || c.status === '未生效';
  if (filter.value === '已失效') return c.status === '已过期' || c.status === '已收回';
  return c.status === '已使用';
}));

onLoad((query) => {
  purpose.value = query?.purpose || '';
});

onShow(async () => {
  const target = `/pagesCenter/coupons/index${purpose.value ? `?purpose=${purpose.value}` : ''}`;
  if (!(await global.ensureLogin({ target }))) return;
  await loadCoupons();
});

async function loadCoupons() {
  loading.value = true;
  error.value = '';
  try { await center.loadCoupons(); } catch { error.value = '优惠券加载失败，请重试'; }
  finally { loading.value = false; }
}

/** 打开优惠券详情。 */
function goDetail(id: number) {
  uni.navigateTo({ url: `/pagesCenter/couponDetail/index?id=${id}` });
}

/** 查看优惠券适用商品。 */
function goUse(id: number) {
  uni.navigateTo({ url: `/pagesCenter/couponGoods/index?id=${id}` });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
