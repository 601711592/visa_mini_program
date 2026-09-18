<template>
  <MallPage public-page>
    <ProfileHeader :logged="logged" :checking="checking" :nickname="nickname" :phone="phone" :avatar="avatar" @open="openProfile" />
    <view class="mx-body account-body">
      <OrderShortcuts @open="status => openPrivate('orders', { filter: status })" />
      <view class="mx-card">
        <BenefitRow icon="points" title="我的积分" :value="pointsValue" @detail="openPrivate('points')" @use="go('category')" />
        <BenefitRow icon="coupon" title="我的优惠券" :value="couponValue" @detail="openPrivate('coupons')" @use="openPrivate('coupons', { filter: '未使用' })" />
        <BenefitRow icon="invite" title="邀请好友" value="邀请奖励待上线" action="去邀请" @detail="openPrivate('invite')" @use="openPrivate('invite')" />
      </view>
      <ServiceList @address="openPrivate('addresses')" @map="go('map')" />
      <view v-if="!MALL_PREVIEW && global.sessionError" class="mx-card"><view class="mx-muted">{{ global.sessionError }}</view><button class="mx-button mx-plain" @tap="global.restoreSession()">重新校验登录状态</button></view>
    </view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useGlobalStore } from '@/store/global';
import { useMallPreviewStore } from '@/store/mall-preview';
import { MALL_PREVIEW } from '@/mall/config';
import { day } from '@/mall/model';
import { go, routes, type PageName } from '@/mall/navigation';
import { currentUrl } from '@/utils/auth-routing';
import MallPage from '@/components/mall/MallPage.vue';
import ProfileHeader from '@/components/mall/ProfileHeader.vue';
import OrderShortcuts from '@/components/mall/OrderShortcuts.vue';
import BenefitRow from '@/components/mall/BenefitRow.vue';
import ServiceList from '@/components/mall/ServiceList.vue';
const global = useGlobalStore(), mall = useMallPreviewStore();
const logged = computed(() => MALL_PREVIEW ? mall.data.member : global.isLogin);
const checking = computed(() => !MALL_PREVIEW && global.status === 'checking');
const nickname = computed(() => MALL_PREVIEW ? mall.data.nickname : global.userInfo?.nickname || '已登录');
const avatar = computed(() => MALL_PREVIEW ? mall.data.avatar : global.userInfo?.avatar || '');
const phone = computed(() => MALL_PREVIEW ? '前端演示账号' : global.userInfo?.phone_masked || '');
const pointsValue = computed(() => !logged.value ? '登录后查看' : MALL_PREVIEW ? `${mall.data.balance} 积分` : '业务数据待接入');
const couponValue = computed(() => !logged.value ? '登录后查看' : MALL_PREVIEW ? `${mall.data.coupons.filter(item => item.status === '未使用' && item.end >= day() && !item.reservedBy).length} 张可用` : '业务数据待接入');
async function openPrivate(page: PageName, params: Record<string, string> = {}) {
  const query = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  const target = routes[page] + (query ? '?' + query : '');
  if (MALL_PREVIEW && !mall.data.member) { mall.pendingTarget = target; mall.pendingOrigin = currentUrl(); go('login'); return; }
  if (!MALL_PREVIEW && !(await global.ensureLogin({ target }))) return;
  go(page, params);
}
function openProfile() { void openPrivate('profile'); }
</script>
<style scoped>.account-body { padding-top: 0; margin-top: -20rpx; position: relative; }</style>
