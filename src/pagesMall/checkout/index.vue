<template>
  <layout :show-navbar="false">
    <view class="center-page checkout-page">
      <template v-if="rows.length">
        <view class="page-body checkout-body">
          <view v-for="item in rows" :key="item.key" class="sheet-card product-card">
            <view class="order-product">
              <image v-if="item.cover" class="product-cover" :src="item.cover" mode="aspectFill" />
              <view v-else class="product-symbol"><image class="placeholder-icon" src="/static/images/center/book-open.png" mode="aspectFit" /></view>
              <view class="product-info">
                <text class="product-name">{{ item.goodsName }}</text>
                <text class="product-meta">套餐：{{ item.packTitle }}</text>
                <text class="product-meta" v-if="item.date || item.personName">{{ item.date }}<text v-if="item.date && item.personName"> · </text>{{ item.personName }}</text>
                <text class="product-unit">单价：<text class="unit-price">¥{{ formatMoney(displayQuote?.unit_cents ?? item.unitPrice) }}</text></text>
              </view>
            </view>
            <view class="purchase-row">
              <text class="purchase-label">购买人数</text>
              <view class="quantity-control">
                <button class="quantity-button" :disabled="item.qty <= 1 || quoteLoading || submitting" aria-label="减少购买人数" @tap="changeQuantity(item, -1)"><uni-icons type="minus" size="20" color="#164e70" /></button>
                <text class="quantity-value">{{ item.qty }}</text>
                <button class="quantity-button" :disabled="item.qty >= 50 || quoteLoading || submitting" aria-label="增加购买人数" @tap="changeQuantity(item, 1)"><uni-icons type="plus" size="20" color="#164e70" /></button>
              </view>
            </view>
            <view v-if="displayQuote?.discount_rule" class="group-offer">
              <text>满 {{ displayQuote.discount_rule.quantity }} 人享 {{ displayQuote.discount_rule.discount }} 折</text>
              <text class="offer-badge">多人折扣已生效</text>
            </view>
          </view>

          <template v-for="item in rows" :key="'traveller-' + item.key">
            <view v-if="item.needsTravellers" class="sheet-card">
              <view class="section-heading"><text class="card-h">出行人信息</text><text class="row-sub">已填写 {{ mall.travellersOf(item.key).length }}/{{ item.qty }} 人</text></view>
              <view v-for="(traveller, index) in mall.travellersOf(item.key)" :key="index" class="traveller-summary" @tap="goTravellers(item)">
                <text>出行人{{ index + 1 }}：{{ traveller.name }}</text><image class="entry-arrow" src="/static/images/center/chevron-right.png" mode="aspectFit" />
              </view>
              <text v-if="!mall.travellersOf(item.key).length" class="traveller-empty">请填写 {{ item.qty }} 位出行人的信息</text>
              <button class="edit-travellers" @tap="goTravellers(item)">{{ travellersComplete(item) ? '编辑出行人' : '新增 / 编辑出行人' }}</button>
            </view>
          </template>

          <view class="sheet-card address-card">
            <view class="menu-row address-entry" @tap="goAddress">
              <view class="row-main">
                <text class="row-title">邮寄地址</text>
                <text class="row-sub">{{ addressHint }}</text>
              </view>
              <text v-if="!selectedAddress" class="address-add">添加地址</text>
              <image class="entry-arrow" src="/static/images/center/chevron-right.png" mode="aspectFit" />
            </view>
            <view v-if="center.addressesError" class="row-sub" @tap="refreshAddresses">{{ center.addressesError }} · 点击重试</view>
          </view>

          <view class="sheet-card benefit-card">
            <view class="section-heading"><text class="card-h">优惠选择</text><button class="text-action" :disabled="!mall.quote?.coupon_enabled || quoteLoading || submitting" @tap="goCoupons">去选择<uni-icons type="right" size="14" color="#164e70" /></button></view>
            <view class="benefit-options">
              <view class="coupon-tile" role="button" @tap="goCoupons">
                <text class="benefit-title">优惠券</text>
                <text class="benefit-caption">{{ !mall.quote ? '优惠券状态待确认' : !mall.quote.coupon_enabled ? '当前未开放优惠券' : totals.couponAmount > 0 ? `已抵扣 ¥${totals.couponAmount.toFixed(2)}` : (mall.couponId ? '已选择，等待报价' : '选择可用优惠券') }}</text>
              </view>
              <view class="points-tile">
                <view class="points-heading"><text class="benefit-title">积分抵扣</text><switch :checked="mall.usePoints" :disabled="submitting || quoteLoading" color="#164e70" class="points-switch" aria-label="使用积分抵扣" @change="onPointsChange" /></view>
                <text class="benefit-caption">可用 {{ mall.quote ? mall.quote.points_available : '—' }} 积分</text>
                <text class="benefit-caption">{{ pointsHint }}</text>
              </view>
            </view>
          </view>

          <view class="sheet-card">
            <view class="amount-heading"><text class="card-h">金额明细</text><text class="quote-progress" :class="{ 'quote-progress--visible': quoteLoading }">更新中…</text></view>
            <view v-if="quoteError && !quoteLoading" class="quote-status">
              <text class="row-sub">{{ quoteError }}</text>
              <button v-if="quoteError" class="retry-quote" @tap="refreshQuote">重试</button>
              <button v-if="mall.couponId" class="retry-quote" @tap="clearCoupon">不使用优惠券</button>
            </view>
            <view class="amount-grid">
            <view class="kv">
              <text>商品总额</text>
              <text>{{ displayQuote ? `¥${totals.base.toFixed(2)}` : '待报价' }}</text>
            </view>
            <view v-if="totals.discount > 0" class="kv">
              <view>
                <text>多人优惠</text>
              </view>
              <text class="mini-price">−¥{{ totals.discount.toFixed(2) }}</text>
            </view>
            <view v-if="totals.couponAmount > 0" class="kv">
              <text>优惠券</text>
              <text class="mini-price">−¥{{ totals.couponAmount.toFixed(2) }}</text>
            </view>
            <view v-if="totals.pointsDeduct > 0" class="kv">
              <text>积分抵扣</text>
              <text class="mini-price">−¥{{ totals.pointsDeduct.toFixed(2) }}</text>
            </view>
            </view>
            <view class="kv due-row">
              <text>实付金额</text>
              <text class="due-price">{{ dueText }}</text>
            </view>
          </view>


        </view>

        <view class="bottom-bar">
          <view class="bar-total">
            <text class="bar-label">实付</text>
            <text class="bar-price">{{ dueText }}</text>
          </view>
          <button class="btn solid submit-btn" :class="{ 'submit-btn--updating': quoteLoading && displayQuote }" :disabled="submitting || quoteLoading || !mall.quote" @tap="submit">{{ submitting ? '提交中…' : '提交订单' }}</button>
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

    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore, CATALOG_PAGE } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { useMallStore, type CartItem } from '@/store/mall';
import { formatMoney } from '@/utils';
import { createOrder, quoteOrder, type OrderSelection } from '@/services/orders';

const global = useGlobalStore();
const center = useCenterStore();
const mall = useMallStore();

const quoteLoading = ref(false);
const quoteError = ref('');
const submitting = ref(false);
let idempotencyKey = '';
let submissionFingerprint = '';
let quoteRequestId = 0;
onUnload(() => { quoteRequestId++; });
/** 检查当前商品的出行人数是否齐全。 */
function travellersComplete(item: CartItem) { return mall.travellersOf(item.key).length === item.qty; }

const rows = computed(() => mall.checkoutRows);
// 旧报价仅用于展示；实际提交仍要求有效的 mall.quote，避免更新时金额闪回空态。
const displayQuote = shallowRef(mall.quote);
watch(() => mall.quote, (quote) => {
  if (quote) displayQuote.value = quote;
}, { flush: 'sync' });
watch(() => rows.value[0]?.key, () => { displayQuote.value = mall.quote; }, { flush: 'sync' });
watch(() => global.isLogin, (loggedIn) => { if (!loggedIn) displayQuote.value = null; });
const totals = computed(() => mall.totals(displayQuote.value));
const dueText = computed(() => displayQuote.value ? `¥${totals.value.due.toFixed(2)}` : '待报价');
/** 积分余额与抵扣金额来自同一次报价，避免权益加载失败时显示默认余额。 */
const pointsHint = computed(() => {
  if (quoteLoading.value) return '正在计算积分抵扣…';
  const quote = mall.quote;
  if (!quote) return '积分抵扣未确认，请重试报价';
  if (!mall.usePoints) return '未使用积分';
  if (quote.points_used > 0) return `使用 ${quote.points_used} 积分，抵扣 ¥${(quote.points_cents / 100).toFixed(2)}`;
  if (!quote.points_available) return '暂无可用积分，本单未抵扣';
  if (!quote.points_max_bps) return '当前未开放积分抵扣';
  return '本单可抵扣金额不足，未使用积分';
});

const selectedAddress = computed(() => mall.checkoutAddressId === null
    ? center.addresses.find((a) => a.is_default) || center.addresses[0]
    : center.addresses.find((a) => a.id === mall.checkoutAddressId));
const addressHint = computed(() => {
  const address = selectedAddress.value;
  return address ? `${address.name} · ${address.province} ${address.city} ${address.district} ${address.street}` : '请选择邮寄地址';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesMall/checkout/index' }))) return;
  await refreshAddresses();
  await refreshQuote();
});

/** 刷新地址并重置已失效的选择。 */
async function refreshAddresses() {
  try {
    await center.loadAddresses();
    if (global.isLogin && center.addressesLoaded && mall.checkoutAddressId && !selectedAddress.value) {
      mall.checkoutAddressId = null;
      mall.quote = null;
      uni.showToast({ title: '所选地址已删除，请重新选择', icon: 'none' });
    }
  } catch { /* 地址卡片显示错误与重试入口 */ }
}

/** 打开当前商品的出行人填写页。 */
function goTravellers(item: CartItem) {
  uni.navigateTo({ url: `/pagesMall/travellers/index?key=${encodeURIComponent(item.key)}` });
}

/** 打开收货地址选择页。 */
function goAddress() {
  uni.navigateTo({ url: '/pagesCenter/address/index?select=1' });
}

/** 打开优惠券选择页。 */
function goCoupons() {
  if (!mall.quote?.coupon_enabled || quoteLoading.value || submitting.value) return;
  uni.navigateTo({ url: '/pagesMall/chooseCoupon/index' });
}

/** 报价失败时放弃已选优惠券并重新报价，避免失效的券让结算停在错误状态。 */
function clearCoupon() {
  if (quoteLoading.value || submitting.value) return;
  mall.setCoupon(0);
  void refreshQuote();
}

/** 返回商品分类页。 */
function goCatalog() {
  uni.switchTab({ url: CATALOG_PAGE });
}

/** 切换积分抵扣并重新报价。 */
function onPointsChange(event: { detail: { value: boolean } }) {
  if (submitting.value || quoteLoading.value) return;
  mall.setUsePoints(event.detail.value);
  void refreshQuote();
}

/** 人数变更先向服务端确认名额和优惠，成功后才更新购买人数与出行人。 */
async function changeQuantity(item: CartItem, delta: number) {
  if (submitting.value || quoteLoading.value) return;
  const quantity = item.qty + delta;
  const input = selection();
  if (!input || quantity < 1 || quantity > 50) return;
  const requestId = ++quoteRequestId;
  quoteLoading.value = true;
  try {
    const result = await quoteOrder({ ...input, quantity });
    if (requestId !== quoteRequestId) return;
    item.qty = quantity;
    const travellers = mall.travellersOf(item.key);
    if (travellers.length > quantity) mall.setTravellers(item.key, travellers.slice(0, quantity));
    mall.couponId = result.data.coupon_id || 0;
    mall.quote = result.data;
    quoteError.value = '';
  } catch (error) {
    if (requestId === quoteRequestId) uni.showToast({ title: error instanceof Error ? error.message : '人数更新失败，请重试', icon: 'none' });
  } finally {
    if (requestId === quoteRequestId) quoteLoading.value = false;
  }
}

/** 组装当前下单选择。 */
function selection(): OrderSelection | null {
  const input = mall.selection();
  return input ? { ...input, address_id: selectedAddress.value?.id ?? null } : null;
}

/** 获取当前选择的最新报价。 */
async function refreshQuote() {
  const requestId = ++quoteRequestId;
  const input = selection();
  quoteLoading.value = false;
  mall.quote = null;
  quoteError.value = '';
  if (!input) {
    displayQuote.value = null;
    quoteError.value = '请先选择商品套餐';
    return;
  }
  quoteLoading.value = true;
  try {
    const result = await quoteOrder(input);
    if (requestId === quoteRequestId) {
      mall.couponId = result.data.coupon_id || 0;
      mall.quote = result.data;
    }
  } catch (error) {
    if (requestId === quoteRequestId) {
      displayQuote.value = null;
      quoteError.value = error instanceof Error ? error.message : '报价失败，请重试';
    }
  } finally {
    if (requestId === quoteRequestId) quoteLoading.value = false;
  }
}

/** 检查结算资料并创建订单，成功后进入付款页。 */
async function submit() {
  if (submitting.value || quoteLoading.value) return;
  if (!center.addressesLoaded || center.addressesLoading || center.addressesError) {
    uni.showToast({ title: '请先加载收货地址', icon: 'none' });
    return;
  }
  if (!selectedAddress.value) {
    uni.showToast({ title: '邮寄地址为必填，请先添加或选择地址', icon: 'none' });
    return;
  }
  const incomplete = mall.checkoutRows.some((x) => x.needsTravellers && mall.travellersOf(x.key).length !== x.qty);
  if (incomplete) {
    uni.showToast({ title: '请为每件商品填写完整出行人', icon: 'none' });
    return;
  }
  const input = selection();
  if (!input || !mall.quote) {
    uni.showToast({ title: '请先获取最新报价', icon: 'none' });
    await refreshQuote();
    return;
  }
  // 同一份报价和出行人资料复用提交键，网络超时后的重试不会生成第二笔订单。
  const travellers = mall.travellersOf(rows.value[0].key);
  const fingerprint = JSON.stringify({ input, travellers, quote: {
    rule_version: mall.quote.rule_version, base_cents: mall.quote.base_cents,
    group_discount_cents: mall.quote.group_discount_cents, coupon_cents: mall.quote.coupon_cents,
    points_used: mall.quote.points_used, due_cents: mall.quote.due_cents,
  } });
  if (submissionFingerprint !== fingerprint) {
    idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}-${input.goods_id}`;
    submissionFingerprint = fingerprint;
  }
  submitting.value = true;
  try {
    const order = await createOrder({ ...input, address_id: selectedAddress.value.id, quote_token: mall.quote.quote_token, idempotency_key: idempotencyKey,
      travellers });
    uni.redirectTo({ url: `/pagesMall/payment/index?id=${order.data.order_no}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : '提交失败，请重试';
    if (message.includes('报价') || message.includes('变化')) {
      await refreshQuote();
      uni.showModal({ title: '报价已更新', content: '商品价格或优惠发生变化，请确认页面上的新金额后再次提交。', showCancel: false });
    } else {
      uni.showToast({ title: message, icon: 'none' });
    }
  } finally { submitting.value = false; }
}
</script>

<style scoped lang="scss">
/* 参考信息分区，沿用小程序已有的蓝色视觉样式。 */
.checkout-page { min-height: 100vh; box-sizing: border-box; background: #f4f6fa; color: #202b30; font-size: 28rpx; line-height: 1.55; }
.page-body { padding: 24rpx 28rpx; }
.checkout-body { padding-bottom: calc(164rpx + env(safe-area-inset-bottom)); }
.sheet-card { padding: 26rpx 28rpx; margin-bottom: 20rpx; background: #fff; border-radius: 24rpx; }
.product-card { background: #fff; color: #202631; padding: 28rpx; }
.order-product { display: flex; gap: 24rpx; padding-bottom: 26rpx; border-bottom: 1rpx dashed #e3e8f0; }
.product-cover, .product-symbol { flex: none; width: 138rpx; height: 138rpx; border-radius: 14rpx; background: #eaf6fd; }
.product-symbol { display: flex; align-items: center; justify-content: center; }
.placeholder-icon { width: 56rpx; height: 56rpx; }
.product-info { flex: 1; min-width: 0; }
.product-name { display: block; font-size: 30rpx; line-height: 1.45; font-weight: 600; overflow-wrap: anywhere; }
.product-meta { display: block; margin-top: 6rpx; color: #737d8c; font-size: 24rpx; }
.product-unit { display: block; margin-top: 8rpx; font-size: 26rpx; }
.unit-price { color: #164e70; font-size: 32rpx; font-weight: 600; }
.purchase-row, .quantity-control, .group-offer, .section-heading, .points-heading { display: flex; align-items: center; justify-content: space-between; }
.purchase-row { justify-content: flex-start; gap: 28rpx; padding-top: 18rpx; }
.purchase-label { font-size: 28rpx; font-weight: 600; }
.quantity-control { gap: 10rpx; }
.quantity-button { color: #164e70; margin: 0; padding: 0; width: 72rpx; height: 72rpx; line-height: 72rpx; background: transparent; }
.quantity-button[disabled] { background: transparent; }
.quantity-value { min-width: 32rpx; text-align: center; font-size: 32rpx; font-weight: 600; }
.group-offer { flex-wrap: wrap; gap: 12rpx; margin-top: 8rpx; font-size: 24rpx; }
.offer-badge { background: #8ad0f9; border-radius: 32rpx; padding: 8rpx 18rpx; font-weight: 600; }
.section-heading { gap: 12rpx; margin-bottom: 14rpx; }
.card-h { font-size: 30rpx; font-weight: 600; }
.row-main { flex: 1; min-width: 0; }
.row-title { display: block; font-size: 28rpx; font-weight: 600; }
.row-sub, .traveller-empty { display: block; color: #7d898e; font-size: 24rpx; overflow-wrap: anywhere; }
.traveller-summary { display: flex; align-items: center; justify-content: space-between; padding: 10rpx 0; font-size: 28rpx; }
.entry-arrow { width: 32rpx; height: 32rpx; flex: none; }
.edit-travellers, .text-action { margin: 0; padding: 0; background: transparent; color: #164e70; font-size: 25rpx; line-height: 64rpx; }
.edit-travellers { text-align: right; }
.text-action { display: flex; align-items: center; }
.menu-row { display: flex; align-items: center; gap: 14rpx; }
.address-add { color: #164e70; font-size: 24rpx; flex: none; }
.address-card .row-sub { margin-top: 8rpx; }
.benefit-options { display: flex; gap: 14rpx; }
.coupon-tile { flex: 1; min-width: 0; padding: 20rpx; background: #eaf6fd; border-radius: 12rpx; color: #164e70; }
.points-tile { flex: 1.4; min-width: 0; padding: 20rpx; background: #eaf6fd; border-radius: 12rpx; }
.benefit-title { display: block; font-size: 28rpx; font-weight: 600; }
.benefit-caption { display: block; font-size: 21rpx; margin-top: 8rpx; }
.coupon-tile .benefit-caption { color: #737d8c; }
.points-tile .benefit-caption { color: #526e70; }
.points-switch { transform: scale(.72); transform-origin: right center; margin: -12rpx -4rpx -12rpx -22rpx; }
.amount-grid { display: flex; flex-wrap: wrap; gap: 12rpx 28rpx; margin-top: 20rpx; }
.kv { display: flex; align-items: baseline; justify-content: space-between; gap: 12rpx; font-size: 24rpx; padding: 8rpx 0; }
.amount-grid .kv { width: calc(50% - 14rpx); flex-wrap: wrap; }
.mini-price { color: #164e70; }
.due-row { margin-top: 16rpx; padding-top: 20rpx; border-top: 1rpx solid #edf0f1; font-size: 28rpx; font-weight: 600; }
.due-price { font-variant-numeric: tabular-nums; font-size: 34rpx; }
.amount-heading { display: flex; align-items: center; justify-content: space-between; }
.quote-progress { font-size: 22rpx; color: #7d898e; opacity: 0; transition: opacity .18s ease; }
.quote-progress--visible { opacity: 1; }
.quote-status { display: flex; align-items: center; gap: 12rpx; padding-top: 14rpx; }
.retry-quote { margin: 0; padding: 0 16rpx; line-height: 56rpx; flex: none; color: #164e70; background: #eaf6fd; font-size: 24rpx; }
.bottom-bar { position: fixed; z-index: 10; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; gap: 16rpx; padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); background: #fff; border-top: 1rpx solid #eef1f1; }
.bar-total { display: flex; flex: 1; min-width: 0; align-items: baseline; flex-wrap: wrap; gap: 8rpx; }
.bar-label { font-size: 26rpx; }
.bar-price { font-variant-numeric: tabular-nums; color: #164e70; font-size: 44rpx; line-height: 1.2; font-weight: 600; overflow-wrap: anywhere; }
.btn { display: flex; align-items: center; justify-content: center; padding: 16rpx 28rpx; border-radius: 60rpx; }
.solid { background: #8ad0f9; color: #164e70; }
.submit-btn { flex: none; min-width: 248rpx; height: 88rpx; margin: 0; font-size: 30rpx; font-weight: 600; }
.submit-btn[disabled] { background: #c6e6f9; color: #fff; }
.submit-btn--updating[disabled] { background: #8ad0f9; color: #164e70; }
.quantity-button::after, .submit-btn::after, .edit-travellers::after, .text-action::after, .retry-quote::after { border: 0; }
.empty-state { padding: 68rpx 20rpx; text-align: center; }
.empty-icon { width: 88rpx; height: 88rpx; margin-bottom: 24rpx; }
.empty-h { font-size: 32rpx; font-weight: 600; }
.empty-p { color: #7d898e; margin: 16rpx 0 28rpx; }
</style>
