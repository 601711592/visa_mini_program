<template>
  <view class="center-page account-page">
    <profile-header
      :logged="global.isLogin"
      :nickname="global.userInfo?.nickname || '微信用户'"
      :phone="global.userInfo?.phone_masked || ''"
      :avatar="global.userInfo?.avatar || ''"
      @tap="onProfile"
    />
    <view class="main">
      <order-shortcuts @open="openOrders" />
      <view class="card benefits">
        <benefit-row
          icon="/static/images/center/coins.png"
          title="积分中心"
          :description="pointsDescription"
          link-text="明细"
          pill-text="去使用"
          @detail="go('/pagesCenter/points/index')"
          @action="usePoints"
        />
        <benefit-row
          icon="/static/images/center/ticket-percent.png"
          title="优惠券"
          :description="couponDescription"
          link-text="查看全部"
          pill-text="去使用"
          @detail="go('/pagesCenter/coupons/index')"
          @action="go('/pagesCenter/coupons/index?purpose=use')"
        />
        <benefit-row
          icon="/static/images/center/user-round-plus.png"
          title="邀请好友"
          description="查看邀请记录与奖励规则"
          pill-text="去邀请"
          @detail="go('/pagesCenter/invite/index')"
          @action="go('/pagesCenter/invite/index')"
        />
      </view>
      <service-list @open="openService" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGlobalStore, ACCOUNT_PAGE, HOME_PAGE } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const checking = computed(() => global.status === 'checking');
const pointsDescription = computed(() => {
  if (checking.value) return '正在校验登录状态…';
  return global.isLogin ? `当前积分 ${center.balance}` : '登录后查看';
});
const couponDescription = computed(() => {
  if (checking.value) return '正在校验登录状态…';
  return global.isLogin ? `${center.availableCouponCount} 张可用` : '登录后查看';
});

/** 私有页面入口：未登录先登录，成功后恢复原目标页面。 */
async function go(url: string) {
  if (global.isLogin) {
    uni.navigateTo({ url });
    return;
  }
  await global.ensureLogin({ target: url });
}

function onProfile() {
  if (global.isLogin) {
    uni.navigateTo({ url: '/pagesCenter/profile/index' });
    return;
  }
  void global.ensureLogin({ target: ACCOUNT_PAGE });
}

function openOrders(filter: string) {
  void go(filter ? `/pagesOrder/orders/index?filter=${encodeURIComponent(filter)}` : '/pagesOrder/orders/index');
}

/** 去使用积分：进入商品浏览；产品分类页接入前回到首页商品列表。 */
async function usePoints() {
  if (!global.isLogin) {
    await global.ensureLogin({ target: HOME_PAGE });
    return;
  }
  uni.navigateBack({ fail: () => uni.reLaunch({ url: HOME_PAGE }) });
}

function openService(key: string) {
  if (key === 'map') {
    // 地图定位游客可访问
    uni.navigateTo({ url: '/pagesCenter/map/index' });
    return;
  }
  void go('/pagesCenter/address/index');
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.account-page {
  padding-bottom: 60rpx;
}

.main {
  position: relative;
  margin-top: -93rpx;
  padding: 0 24rpx;
}

.benefits {
  padding: 0 28rpx;
}
</style>
