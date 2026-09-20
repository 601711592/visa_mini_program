<template>
  <view class="center-page">
    <view class="balance-hero">
      <view class="card-heading">
        <text>可用积分</text>
        <view class="text-link" @tap="goRules">
          <text>积分规则</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="large-number">{{ balanceText }}</view>
      <text class="hero-note">积分永久有效 · 500 积分可抵 10 元</text>
      <view class="btn light-button" @tap="usePoints">去使用积分</view>
    </view>
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
      <view class="sheet-card">
        <text class="card-title">积分明细</text>
        <template v-if="entries.length">
          <view v-for="(entry, index) in entries" :key="index" class="ledger-row">
            <view class="ledger-info">
              <text class="name">{{ entry.name }}</text>
              <text class="note">{{ entry.note }}</text>
              <text class="date">{{ entry.date }}</text>
            </view>
            <text class="amount" :class="entry.amount > 0 ? 'positive' : 'negative'">
              {{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}
            </text>
          </view>
        </template>
        <view v-else class="empty-state">
          <image src="/static/images/center/receipt-text.png" mode="aspectFit" />
          <text class="empty-title">暂无记录</text>
          <text class="empty-sub">积分变动后会展示在这里</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

type PointsFilter = '全部' | '收入' | '支出';

const tabs: PointsFilter[] = ['全部', '收入', '支出'];
const filter = ref<PointsFilter>('全部');

const balanceText = computed(() => center.balance.toLocaleString());
const entries = computed(() =>
  center.ledger.filter((x) => filter.value === '全部' || (filter.value === '收入' ? x.amount > 0 : x.amount < 0)),
);

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/points/index' }))) return;
});

function goRules() {
  uni.navigateTo({ url: '/pagesCenter/pointsRules/index' });
}

/** 产品分类页未建，先回首页商品列表。 */
function usePoints() {
  uni.reLaunch({ url: '/pages/mall/index' });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

// center.scss 中 h3/p/strong/b/small 为元素选择器，小程序 view/text 不命中，这里用类补齐同款排版。
.hero-note {
  display: block;
  color: #285d7a;
  font-size: 25rpx;
  margin: 12rpx 0 26rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $text;
  margin: 0 0 20rpx;
}

.ledger-info {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .name {
    font-size: 28rpx;
    font-weight: 500;
    color: $text;
  }

  .note {
    font-size: 24rpx;
    margin: 8rpx 0;
  }

  .date {
    font-size: 22rpx;
    color: $muted;
  }
}

.amount {
  font-size: 36rpx;
  font-weight: 700;
  flex: none;

  &.positive {
    color: $brand-ink;
  }

  &.negative {
    color: $text;
  }
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: $text;
  margin: 0 0 12rpx;
}

.empty-sub {
  display: block;
  font-size: 26rpx;
  color: $muted;
  margin: 0 0 28rpx;
}
</style>
