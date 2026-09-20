<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card rules-card">
        <text class="card-title">积分如何使用</text>
        <text class="para">500 积分可抵扣 10 元，积分永久有效。</text>
        <text class="para">选择商品并进入结算后，可在积分抵扣项选择使用。具体可抵扣金额以结算页为准。</text>
        <text class="card-title">积分如何获得</text>
        <text class="para">交易完成后，消费 1 元获得 1 积分，零头四舍五入；具体赠分基数待业务确认。</text>
        <text class="card-title">退款与调整</text>
        <text class="para">退款时返还已使用积分，后台可增减积分。实际到账以积分明细为准。</text>
        <text class="hint">积分抵扣上限、赠分基数等规则尚待确认，本预览不作额外承诺。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';

const global = useGlobalStore();

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pages/pointsRules/index' }))) return;
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
