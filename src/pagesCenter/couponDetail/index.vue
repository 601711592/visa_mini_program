<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view v-if="loading" class="page-body hint">加载中…</view>
      <view v-else-if="error" class="page-body"><view>{{ error }}</view><view class="btn outline" @tap="loadCoupon">重试</view></view>
      <view v-else-if="coupon" class="page-body">
        <view class="coupon-card" :class="{ dim: coupon.status !== '未使用' }">
          <view class="coupon-face">
            <view class="coupon-amount"><text class="coupon-unit">¥</text><text class="coupon-value">{{ coupon.amount }}</text></view>
            <text class="coupon-min">{{ coupon.min > 0 ? `满 ${coupon.min} 元可用` : '无门槛' }}</text>
          </view>
          <view class="coupon-copy">
            <view class="coupon-name">{{ coupon.name }}</view>
            <view class="coupon-desc">{{ coupon.scope }}</view>
              <view class="coupon-expiry">{{ coupon.status === '未生效' ? `${coupon.start.slice(0, 16)} 起可用` : `${coupon.end.slice(0, 16)} 到期` }}</view>
            <view class="coupon-actions">

              <text class="status-tag">{{ coupon.status === '已使用' && coupon.orderStatus === 'pending' ? '订单待付款' : coupon.status }}</text>
            </view>
          </view>
        </view>
        <view class="sheet-card">
          <view class="card-h">使用规则</view>
          <view class="kv">
            <text>使用门槛</text>
            <text>{{ coupon.min > 0 ? `订单满足 ¥${coupon.min}` : '无门槛' }}</text>
          </view>
          <view class="kv">
            <text>适用范围</text>
            <text>{{ coupon.scope }}</text>
          </view>
          <view class="kv"><text>生效时间</text><text>{{ coupon.start }}</text></view>
          <view v-if="coupon.revokeReason" class="kv"><text>收回原因</text><text>{{ coupon.revokeReason }}</text></view>
          <view class="kv">
            <text>有效期至</text>
            <text>{{ coupon.end }}</text>
          </view>
          <view class="kv">
            <text>当前状态</text>
            <text>{{ coupon.status === '已使用' && coupon.orderStatus === 'pending' ? '订单待付款' : coupon.status }}</text>
          </view>
          <view class="para">每个订单限用一张优惠券，可叠加积分使用。</view>
          <view class="hint">适用性以订单结算时的服务端报价为准。</view>
        </view>
      </view>
      <view v-else class="page-body">
        <view class="empty-state">
          <image src="/static/images/center/package-open.png" mode="aspectFit" />
          <view class="empty-h">未找到优惠券</view>
          <view class="empty-p">该优惠券不存在或已下线</view>
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

const id = ref(0);
const loading = ref(true);
const error = ref('');
const coupon = computed(() => center.findCoupon(id.value));

onLoad((query) => {
  id.value = Number(query?.id) || 0;
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesCenter/couponDetail/index?id=${id.value}` }))) return;
  await loadCoupon();
});

/** 详情每次进入刷新券状态。 */
async function loadCoupon() {
  loading.value = true;
  error.value = '';
  try { await center.loadCoupons(); } catch { error.value = '优惠券加载失败，请重试'; }
  finally { loading.value = false; }
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
