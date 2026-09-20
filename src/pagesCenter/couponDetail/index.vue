<template>
  <view class="center-page">
    <view v-if="coupon" class="page-body">
      <view class="coupon-card" :class="{ dim: coupon.status !== '未使用' }">
        <view class="coupon-face">
          <text class="coupon-amount"><text class="coupon-unit">¥</text>{{ coupon.amount }}</text>
          <text class="coupon-min">{{ coupon.min > 0 ? `满 ${coupon.min} 元可用` : '无门槛（演示）' }}</text>
        </view>
        <view class="coupon-copy">
          <view class="coupon-name">{{ coupon.name }}</view>
          <view class="coupon-desc">{{ coupon.scope }} · {{ coupon.end }} 到期</view>
          <view class="coupon-actions">
            <view class="text-link" @tap="goDetail">
              使用规则
              <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
            </view>
            <text class="status-tag">{{ coupon.status }}</text>
          </view>
        </view>
      </view>
      <view class="sheet-card">
        <view class="card-h">使用规则</view>
        <view class="kv">
          <text>使用门槛</text>
          <text>{{ coupon.min > 0 ? `订单满足 ¥${coupon.min}` : '无门槛（演示）' }}</text>
        </view>
        <view class="kv">
          <text>适用范围</text>
          <text>{{ coupon.scope }}</text>
        </view>
        <view class="kv">
          <text>有效期至</text>
          <text>{{ coupon.end }}</text>
        </view>
        <view class="kv">
          <text>当前状态</text>
          <text>{{ coupon.status }}</text>
        </view>
        <view class="para">每个订单限用一张优惠券，可叠加积分使用。</view>
        <view class="para">退款后退回已使用优惠券；过期券返还后的有效性待确认。</view>
        <view class="hint">本页金额、门槛与有效期均为演示配置，以正式券规则为准。</view>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const id = ref(0);
const coupon = computed(() => center.findCoupon(id.value));

onLoad((query) => {
  id.value = Number(query?.id) || 0;
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesCenter/couponDetail/index?id=${id.value}` }))) return;
});

function goDetail() {
  uni.navigateTo({ url: `/pagesCenter/couponDetail/index?id=${id.value}` });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
