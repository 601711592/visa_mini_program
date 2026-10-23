<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="sheet-card rules-card">
          <text class="card-title">积分如何使用</text>
          <text class="para">500 积分可抵扣 10 元，积分永久有效。</text>
          <text v-if="rules" class="para">{{ rules.points_max_bps ? `最高可抵扣商品原价的 ${rules.points_max_bps / 100}%，具体金额以结算页为准。` : '当前小程序未启用积分抵扣。' }}</text>
          <text v-if="rules" class="para">优惠叠加顺序：{{ stackOrders[rules.stack_order] }}。优惠券门槛按轮到优惠券时的剩余金额判断。</text>
          <text class="para">待付款订单占用的积分暂不可用，取消或超时关闭订单后释放。</text>
          <text class="card-title">积分如何获得</text>
          <text v-if="rules" class="para">{{ rules.reward_bps ? `交易完成后，每 1 元${rules.reward_basis === 'paid' ? '实付金额' : '商品原价'}获得 ${rules.reward_bps / 10000} 积分，结果四舍五入至整数。` : '当前小程序未启用消费赠分。' }}</text>
          <text v-if="rules && rules.reward_bps" class="para">订单按下单时的赠分规则计算，支付成功不立即赠分。</text>
          <text v-if="center.pointsLoading" class="hint">正在读取积分规则…</text>
          <view v-else-if="center.pointsError"><text class="hint">{{ center.pointsError }}</text><view class="btn" @tap="reload">重新加载</view></view>
          <text v-else-if="!rules" class="hint">当前小程序尚未配置交易积分规则。</text>
          <text class="card-title">积分调整</text>
          <text class="para">管理员可根据实际情况增加或扣减积分，变动记录可在积分明细查看。</text>
          <text class="card-title">邀请好友</text>
          <text class="para">好友通过你的分享注册后，其首笔订单办理完成时，你获得与好友该笔订单相同的积分，详见“邀请好友”页面。</text>
          <text class="card-title">订单退款</text>
          <text class="para">订单退款成功后，本单使用的积分全部退回，本单赠送的积分扣回；可用积分不足时扣至 0 为止。</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();
const stackOrders = { group_coupon_points: '多人优惠 → 优惠券 → 积分', coupon_group_points: '优惠券 → 多人优惠 → 积分', points_group_coupon: '积分 → 多人折扣 → 优惠券' };
const rules = computed(() => center.pointsPage ? center.pointRules : null);
async function reload() {
  try { await center.loadPoints(true, ''); } catch { /* 页面显示错误并允许重试 */ }
}
onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/pointsRules/index' }))) return;
  await reload();
});
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

// center.scss 中 sheet-card 的 h3/p 为元素选择器，小程序 view/text 不命中，这里用类补齐同款排版。
.rules-card {
  .card-title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: $text;
    margin: 0 0 20rpx;

    &:not(:first-child) {
      margin-top: 34rpx;
    }
  }

  .para {
    display: block;
    margin: 16rpx 0;
    color: $body;
    font-size: 26rpx;
  }

  .hint {
    display: block;
  }
}
</style>
