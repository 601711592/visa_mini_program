<template>
  <view class="center-page checkout-page">
    <template v-if="rows.length">
      <view class="page-body checkout-body">
        <view v-for="item in rows" :key="item.key" class="sheet-card">
          <view class="order-product">
            <image v-if="item.cover" class="product-cover" :src="item.cover" mode="aspectFill" />
            <view v-else class="product-symbol">
              <image class="placeholder-icon" src="/static/images/center/book-open.png" mode="aspectFit" />
            </view>
            <view class="product-info">
              <text v-if="item.category" class="status-tag">{{ item.category }}</text>
              <text class="product-name">{{ item.goodsName }}</text>
              <text class="product-meta">{{ item.packTitle }} · {{ item.personName }} · {{ item.date }} · {{ item.qty }} 人</text>
            </view>
          </view>
          <view class="kv">
            <text>¥{{ formatMoney(item.unitPrice) }} / 人</text>
            <text>共 {{ item.qty }} 人</text>
          </view>
          <template v-if="item.needsTravellers">
            <view class="menu-row traveller-entry">
              <view class="row-main">
                <text class="row-title">本商品出行人</text>
                <text class="row-sub">需 {{ item.qty }} 位 · 已填写 {{ mall.travellersOf(item.key).length }} 位</text>
              </view>
              <button class="traveller-action" :class="{ 'traveller-action--done': travellersComplete(item) }" @tap="goTravellers(item)">{{ travellersComplete(item) ? '已完善 · 修改' : '填写出行人' }}</button>
            </view>
            <view v-if="mall.travellersOf(item.key).length" class="traveller-list">
              <view v-for="(traveller, index) in mall.travellersOf(item.key)" :key="index" class="traveller-summary">
                <text>出行人 {{ index + 1 }} · {{ traveller.name }}</text>
                <text class="traveller-passport">护照尾号 {{ traveller.passport.slice(-4) }}</text>
              </view>
            </view>

          </template>
        </view>

        <view class="sheet-card address-card">
          <view class="menu-row address-entry" @tap="goAddress">
            <view class="row-main">
              <text class="row-title">邮寄地址（选填）</text>
              <text class="row-sub">{{ addressHint }}</text>
            </view>
            <text v-if="!selectedAddress && mall.checkoutAddressId !== 0" class="address-add">添加地址</text>
            <image class="entry-arrow" src="/static/images/center/chevron-right.png" mode="aspectFit" />
          </view>
          <view v-if="center.addressesError" class="row-sub" @tap="refreshAddresses">{{ center.addressesError }} · 点击重试</view>
        </view>

        <view class="sheet-card">
          <view class="menu-row entry-line" @tap="goCoupons">
            <view class="row-main">
              <text class="row-title">优惠券</text>
              <text class="row-sub">{{ totals.couponAmount > 0 ? `已优惠 ¥${totals.couponAmount.toFixed(2)}` : '选择优惠券，与积分同享' }}</text>
            </view>
            <image class="entry-arrow" src="/static/images/center/chevron-right.png" mode="aspectFit" />
          </view>
          <view class="points-row">
            <view class="row-main">
              <text class="row-title">使用积分</text>
              <text class="row-sub">可用 {{ center.balance }}，本单抵 ¥{{ totals.pointsDeduct.toFixed(2) }}</text>
            </view>
            <checkbox-group class="points-control" @change="onPointsChange">
              <label class="points-check-label"><checkbox class="checkout-checkbox" value="points" :checked="mall.usePoints" color="#164E70" aria-label="使用积分" /></label>
            </checkbox-group>
          </view>
          <text class="points-note">500 积分 = 10 元，演示上限：商品原价的 20%（待确认）</text>
        </view>

        <view class="sheet-card">
          <view class="card-h">金额明细</view>
          <view class="kv">
            <text>商品总额</text>
            <text>¥{{ totals.base.toFixed(2) }}</text>
          </view>
          <view v-if="totals.discount > 0" class="kv">
            <text>多人优惠</text>
            <text class="mini-price">−¥{{ totals.discount.toFixed(2) }}</text>
          </view>
          <view v-if="totals.couponAmount > 0" class="kv">
            <text>优惠券</text>
            <text class="mini-price">−¥{{ totals.couponAmount.toFixed(2) }}</text>
          </view>
          <view v-if="totals.pointsDeduct > 0" class="kv">
            <text>积分抵扣（{{ totals.points }} 积分）</text>
            <text class="mini-price">−¥{{ totals.pointsDeduct.toFixed(2) }}</text>
          </view>
          <view class="kv due-row">
            <text>实付金额</text>
            <text class="due-price">¥{{ totals.due.toFixed(2) }}</text>
          </view>
        </view>

        <view class="consent-row consent-inner">
          <checkbox-group @change="onConsentChange">
            <label class="consent-check"><checkbox class="checkout-checkbox" value="agree" :checked="agreed" color="#164E70" aria-label="同意预订须知与退改规则" /></label>
          </checkbox-group>
          <view class="consent-copy">我已阅读并同意<text class="rule-link" @tap="openRules('booking')">《预订须知》</text>与<text class="rule-link" @tap="openRules('refund')">《退改规则》</text></view>
        </view>
      </view>

      <view class="bottom-bar">
        <view class="bar-total">
          <text class="bar-label">实付</text>
          <text class="bar-price">¥{{ totals.due.toFixed(2) }}</text>
        </view>
        <view class="btn solid submit-btn" @tap="submit">提交订单</view>
      </view>
    </template>

    <view v-else class="page-body">
      <view class="empty-state">
        <image class="empty-icon" src="/static/images/center/shopping-cart.png" mode="aspectFit" />
        <view class="empty-h">暂无结算商品</view>
        <view class="empty-p">去挑选心仪的签证服务吧</view>
        <view class="btn solid" @tap="goCatalog">去逛逛</view>
      </view>
    </view>
    <view v-if="rulesVisible" class="rules-mask" @tap="closeRules" @touchmove.stop.prevent>
      <view class="rules-sheet" @tap.stop>
        <view class="rules-header"><text class="rules-title">{{ rulesKind === 'booking' ? '预订须知' : '退改规则' }}</text><button class="rules-close" @tap="closeRules">关闭</button></view>
        <scroll-view scroll-y class="rules-body">
          <text v-if="rulesLoading" class="rules-state">正在加载商品规则…</text>
          <view v-else-if="rulesError" class="rules-state"><text>规则加载失败</text><button class="traveller-action" @tap="openRules(rulesKind)">重新加载</button></view>
          <view v-else v-for="rule in rules" :key="rule.id" class="rule-product">
            <text class="rule-product-name">{{ rule.name }}</text>
            <rich-text v-if="rule.content" :nodes="rule.content" />
            <text v-else class="rules-state">该商品暂未配置此项规则，请联系商家确认。</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { useMallStore, type CartItem } from '@/store/mall';
import { formatMoney } from '@/utils';
import { getGoodsDetail } from '@/services/shop';

const global = useGlobalStore();
const center = useCenterStore();
const mall = useMallStore();

const agreed = ref(false);
const rulesVisible = ref(false);
const rulesKind = ref<'booking' | 'refund'>('booking');
const rulesLoading = ref(false);
const rulesError = ref(false);
const rules = ref<{ id: number; name: string; content: string }[]>([]);
let rulesRequest = 0;
function closeRules() { rulesVisible.value = false; rulesRequest++; }
async function openRules(kind: 'booking' | 'refund') {
  const request = ++rulesRequest;
  rulesKind.value = kind;
  rulesVisible.value = true;
  rulesLoading.value = true;
  rulesError.value = false;
  try {
    const ids = [...new Set(mall.checkoutRows.map(item => item.goodsId))];
    const result = await Promise.all(ids.map(async id => {
      const { data } = await getGoodsDetail(String(id));
      return { id, name: data.name, content: (kind === 'booking' ? data.booking_description : data.refund_description) || '' };
    }));
    if (request === rulesRequest) rules.value = result;
  } catch {
    if (request === rulesRequest) rulesError.value = true;
  } finally {
    if (request === rulesRequest) rulesLoading.value = false;
  }
}
function travellersComplete(item: CartItem) { return mall.travellersOf(item.key).length === item.qty; }

const rows = computed(() => mall.checkoutRows);
const totals = computed(() => mall.totals());

const selectedAddress = computed(() => mall.checkoutAddressId === 0 ? undefined
  : mall.checkoutAddressId === null
    ? center.addresses.find((a) => a.is_default) || center.addresses[0]
    : center.addresses.find((a) => a.id === mall.checkoutAddressId));
const addressHint = computed(() => {
  const address = selectedAddress.value;
  if (mall.checkoutAddressId === 0) return '本单不使用邮寄地址';
  return address ? `${address.name} · ${address.province} ${address.city} ${address.district} ${address.street}` : '如需邮寄护照，请添加地址';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesMall/checkout/index' }))) return;
  await refreshAddresses();
});

async function refreshAddresses() {
  try {
    await center.loadAddresses();
    if (global.isLogin && center.addressesLoaded && mall.checkoutAddressId && !selectedAddress.value) {
      mall.checkoutAddressId = 0;
      uni.showToast({ title: '所选地址已删除，本单不使用邮寄地址', icon: 'none' });
    }
  } catch { /* 地址卡片显示错误与重试入口 */ }
}

function goTravellers(item: CartItem) {
  uni.navigateTo({ url: `/pagesMall/travellers/index?key=${encodeURIComponent(item.key)}` });
}

function goAddress() {
  uni.navigateTo({ url: '/pagesCenter/address/index?select=1' });
}

function goCoupons() {
  uni.navigateTo({ url: '/pagesMall/chooseCoupon/index' });
}

function goCatalog() {
  uni.switchTab({ url: '/pages/catalog/index' });
}

function onPointsChange(event: { detail: { value: string[] } }) {
  mall.setUsePoints(event.detail.value.includes('points'));
}

function onConsentChange(event: { detail: { value: string[] } }) {
  agreed.value = event.detail.value.includes('agree');
}

function submit() {
  if (!center.addressesLoaded || center.addressesLoading || center.addressesError) {
    uni.showToast({ title: '请先加载收货地址', icon: 'none' });
    return;
  }
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并勾选预订须知与退改规则', icon: 'none' });
    return;
  }
  const incomplete = mall.checkoutRows.some((x) => x.needsTravellers && mall.travellersOf(x.key).length !== x.qty);
  if (incomplete) {
    uni.showToast({ title: '请为每件商品填写完整出行人', icon: 'none' });
    return;
  }
  const order = mall.submitOrder();
  uni.redirectTo({ url: `/pagesMall/payment/index?id=${order.id}` });
}
</script>

<style scoped lang="scss">
// 对齐 design/orders/checkout.html：375px 原型尺寸 × 2，使用显式类避免微信元素选择器失效。
.checkout-page { min-height: 100vh; box-sizing: border-box; background: #f4f6fa; color: #495566; font-size: 28rpx; line-height: 45rpx; }
.page-body { padding: 24rpx; }
.checkout-body { padding-bottom: calc(176rpx + env(safe-area-inset-bottom)); }
.sheet-card { padding: 32rpx; margin-bottom: 20rpx; background: #fff; border-radius: 24rpx; }
.order-product { display: flex; align-items: flex-start; gap: 24rpx; padding: 20rpx 0; }
.product-cover, .product-symbol { flex: none; width: 152rpx; height: 152rpx; border-radius: 16rpx; background: #f4f6fa; }
.product-symbol { display: flex; align-items: center; justify-content: center; background: #eaf6fd; }
.placeholder-icon { width: 58rpx; height: 58rpx; }
.product-info { flex: 1; min-width: 0; }
.status-tag { display: inline-block; padding: 4rpx 14rpx; margin-right: 8rpx; background: #eaf6fd; color: #164e70; border-radius: 10rpx; font-size: 24rpx; line-height: 38rpx; }
.product-name { display: block; margin: 16rpx 0 4rpx; font-size: 30rpx; line-height: 45rpx; font-weight: 600; color: #202631; overflow-wrap: anywhere; }
.product-meta { display: block; font-size: 24rpx; line-height: 38rpx; color: #737d8c; overflow-wrap: anywhere; }
.kv { display: flex; align-items: center; justify-content: space-between; gap: 24rpx; padding: 24rpx 0; border-bottom: 2rpx solid #e3e8f0; font-size: 28rpx; line-height: 45rpx; }
.kv:last-child { border-bottom: 0; }
.menu-row { display: flex; align-items: center; justify-content: space-between; gap: 24rpx; min-height: 88rpx; padding: 28rpx 0; box-sizing: border-box; border-bottom: 2rpx solid #e3e8f0; }
.menu-row:last-child { border-bottom: 0; }
.row-main { flex: 1; min-width: 0; }
.row-title { display: block; font-size: 28rpx; line-height: 45rpx; color: #495566; }
.row-sub { display: block; font-size: 24rpx; line-height: 38rpx; color: #737d8c; overflow-wrap: anywhere; }
.entry-arrow { flex: none; width: 40rpx; height: 40rpx; }
.points-row { display: flex; align-items: center; justify-content: space-between; gap: 24rpx; padding: 24rpx 0; border-bottom: 2rpx solid #e3e8f0; }
.points-control { flex: none; }
.points-check-label { display: flex; align-items: center; justify-content: flex-end; min-width: 88rpx; min-height: 88rpx; }
.checkout-checkbox { flex: none; transform: scale(0.85); transform-origin: center; }
.points-note { display: block; font-size: 24rpx; line-height: 38rpx; color: #737d8c; }
.traveller-list { padding-top: 12rpx; }
.traveller-summary { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8rpx 16rpx; padding: 8rpx 0; font-size: 24rpx; line-height: 38rpx; }
.traveller-passport { color: #737d8c; }
.traveller-empty { display: block; margin: 12rpx 0; font-size: 24rpx; line-height: 38rpx; color: #737d8c; }
.card-h { margin: 0 0 24rpx; font-size: 32rpx; font-weight: 600; line-height: 51rpx; color: #202631; }
.mini-price { color: #164e70; }
.due-row { font-weight: 600; }
.due-price { font-size: 52rpx; line-height: 83rpx; font-weight: 500; color: #164e70; }
.consent-row { padding: 24rpx 8rpx; }
.consent-inner { display: flex; align-items: flex-start; gap: 16rpx; font-size: 24rpx; line-height: 41rpx; min-height: 88rpx; color: #495566; }
.bottom-bar { position: fixed; z-index: 10; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 24rpx; background: #fff; border-top: 2rpx solid #e3e8f0; padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom)); }
.bar-total { display: flex; flex: 1; min-width: 0; align-items: baseline; gap: 8rpx; flex-wrap: wrap; }
.bar-label { font-size: 24rpx; line-height: 38rpx; color: #737d8c; }
.bar-price { font-size: 52rpx; line-height: 68rpx; font-weight: 500; color: #164e70; overflow-wrap: anywhere; }
.btn { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-height: 88rpx; padding: 20rpx 32rpx; border-radius: 48rpx; font-size: 28rpx; line-height: 45rpx; font-weight: 500; }
.solid { background: #8ad0f9; color: #164e70; }
.submit-btn { flex: none; min-width: 280rpx; min-height: 96rpx; font-size: 32rpx; font-weight: 600; }
.empty-state { padding: 68rpx 20rpx; text-align: center; }
.empty-icon { width: 88rpx; height: 88rpx; margin-bottom: 24rpx; }
.empty-h { margin-bottom: 12rpx; color: #202631; font-size: 32rpx; font-weight: 600; }
.empty-p { margin-bottom: 28rpx; color: #737d8c; font-size: 26rpx; }
.traveller-entry { border-bottom: 0; padding: 20rpx 0 0; }
.traveller-action { flex: none; margin: 0; min-height: 88rpx; padding: 0 24rpx; border-radius: 44rpx; background: #8ad0f9; color: #164e70; font-size: 26rpx; line-height: 88rpx; }
.traveller-action::after, .rules-close::after { border: 0; }
.traveller-action--done { background: #eaf6fd; }
.address-card { padding-top: 8rpx; padding-bottom: 8rpx; }
.address-entry { padding: 16rpx 0; gap: 12rpx; }
.address-add { color: #164e70; font-size: 26rpx; }
.consent-inner { gap: 8rpx; }
.consent-check { display: flex; align-items: flex-start; justify-content: center; min-width: 72rpx; min-height: 88rpx; }
.consent-copy { flex: 1; min-width: 0; padding-top: 4rpx; }
.rule-link { display: inline; color: #164e70; text-decoration: underline; }
.rules-mask { position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-end; background: rgba(32, 38, 49, 0.45); }
.rules-sheet { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding-bottom: env(safe-area-inset-bottom); }
.rules-header { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 32rpx; border-bottom: 2rpx solid #e3e8f0; }
.rules-title { font-size: 32rpx; font-weight: 600; color: #202631; }
.rules-close { margin: 0; padding: 0 16rpx; min-height: 88rpx; line-height: 88rpx; background: transparent; color: #164e70; font-size: 28rpx; }
.rules-body { height: 60vh; }
.rule-product { padding: 24rpx 32rpx; overflow-wrap: anywhere; }
.rule-product-name { display: block; margin-bottom: 16rpx; font-weight: 600; color: #202631; }
.rules-state { display: block; padding: 24rpx 32rpx; color: #737d8c; }
</style>
