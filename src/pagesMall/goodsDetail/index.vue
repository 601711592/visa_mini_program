<template>
  <MallPage public-page :footer="!!goods">
    <view v-if="loading" class="mx-empty">正在加载商品…</view>
    <view v-else-if="error" class="mx-empty"><view>{{ error }}</view><button class="mx-button" @tap="load">重新加载</button></view>
    <template v-else-if="goods">
      <swiper class="goods-gallery" indicator-dots><swiper-item v-for="(image, index) in goods.images" :key="index"><image :src="image" class="goods-image" mode="aspectFit" /></swiper-item></swiper>
      <view class="mx-body">
        <view class="mx-card"><view class="mx-title">{{ goods.name }}</view><view class="mx-price">¥{{ money(currentPrice) }}</view></view>
        <view class="mx-card"><view class="mx-title">商家说亮点</view><view class="mx-hint">{{ goods.highlights }}</view></view>
        <view class="mx-card"><view class="mx-title">套餐</view><view class="choices"><button v-for="item in goods.specification" :key="item.key" class="choice" :class="{ active: specKey === item.key }" @tap="specKey = item.key">{{ item.title }}</button></view></view>
        <template v-if="spec">
          <view class="mx-card"><view class="mx-title">出游人群</view><view class="choices"><button v-for="item in spec.person" :key="item" class="choice" :class="{ active: group === item }" @tap="group = item">{{ item }}</button></view></view>
          <view class="mx-card"><view class="mx-title">出发日期</view><view class="mx-muted">{{ date || '请选择下方有价格的日期' }}</view><uni-calendar :selected="calendar" :start-date="spec.timeSlot?.[0]" :end-date="spec.timeSlot?.[1]" @change="chooseDate" /></view>
          <view class="mx-card mx-row"><view class="mx-title">购买人数</view><view class="mx-stepper"><button :disabled="quantity <= 1" @tap="quantity--">−</button><text>{{ quantity }}</text><button :disabled="quantity >= 99" @tap="quantity++">＋</button></view></view>
          <view class="mx-card"><view class="mx-title">材料清单</view><view v-for="(item, index) in materials" :key="index" class="material"><MallIcon name="check" :size="32" /><text>{{ item }}</text></view></view>
        </template>
        <view class="mx-card"><view class="mx-title">商品详细</view><rich-text :nodes="content(goods.content)" /></view>
        <view class="mx-tabs"><button v-for="(item, index) in sections" :key="item.key" class="mx-tab" :class="{ active: sectionIndex === index }" @tap="sectionIndex = index">{{ item.title }}</button></view>
        <view v-if="sections.length" class="mx-card"><rich-text :nodes="content(sections[sectionIndex]?.content || '')" /></view>
      </view>
    </template>
    <view v-else class="mx-empty">商品不存在或已下架</view>
    <template #footer><button class="goods-cart" aria-label="购物车" @tap="go('cart')"><MallIcon name="cart" :size="40" /><text>购物车</text></button><button class="mx-button mx-light" @tap="purchase(false)">加入购物车</button><button class="mx-button" @tap="purchase(true)">立即购买</button></template>
  </MallPage>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getGoodsDetail } from '@/services/shop';
import { useMallPreviewStore } from '@/store/mall-preview';
import { demoGoods } from '@/mall/fixtures';
import { MALL_PREVIEW } from '@/mall/config';
import { makeLine, money } from '@/mall/model';
import { calendarSlots, selectionFor, type MallGoods } from '@/mall/product-selection';
import { attempt, go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import MallIcon from '@/components/mall/MallIcon.vue';
const mall = useMallPreviewStore();
const goods = ref<MallGoods>(), loading = ref(false), error = ref('');
const specKey = ref(''), group = ref(''), date = ref(''), quantity = ref(1), sectionIndex = ref(0);
let id = '', alive = true;
const spec = computed(() => goods.value?.specification?.find(item => item.key === specKey.value));
const slots = computed(() => calendarSlots(spec.value, group.value));
const calendar = computed(() => slots.value.map(item => ({ date: item.date, info: '¥' + money(item.price) })));
const currentPrice = computed(() => slots.value.find(item => item.date === date.value)?.price ?? Number(spec.value?.price || goods.value?.price || 0));
const materials = computed(() => (spec.value?.information || '').split('\n').filter(Boolean));
const sections = computed(() => {
  const g = goods.value;
  if (!g) return [];
  return [{ key: 'trip', title: '行程说明', content: g.trip_description }, { key: 'price', title: '费用说明', content: g.price_description }, { key: 'refund', title: '退改规则', content: g.refund_description }, { key: 'booking', title: '预订须知', content: g.booking_description }].filter(item => g.visibleSections?.[item.key as 'trip' | 'price' | 'refund' | 'booking'] !== false);
});
watch(spec, value => { group.value = value?.person?.[0] || ''; date.value = ''; });
watch(group, () => { date.value = ''; });
function content(html: string) { return (html || '').replace(/<img/gi, '<img style="max-width:100%;height:auto"'); }
async function load() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  try {
    const result = MALL_PREVIEW ? demoGoods().find(item => String(item.id) === id) : (await getGoodsDetail(id)).data;
    if (!alive) return;
    goods.value = result; specKey.value = result?.specification?.[0]?.key || '';
  } catch (e) { if (alive) error.value = e instanceof Error ? e.message : '商品加载失败'; }
  finally { if (alive) loading.value = false; }
}
function chooseDate(event: { fulldate: string }) { if (slots.value.some(item => item.date === event.fulldate)) date.value = event.fulldate; else uni.showToast({ title: '该日期暂无可用名额', icon: 'none' }); }
function purchase(buy: boolean) {
  attempt(() => {
    if (!goods.value) throw new Error('商品尚未加载');
    const selection = selectionFor(goods.value, spec.value, group.value, date.value, quantity.value);
    if (buy) { mall.checkout([makeLine(selection)], 'buy'); go('checkout'); }
    else { mall.add(selection); uni.showToast({ title: '已加入演示购物车', icon: 'none' }); }
  });
}
onLoad(options => { id = String(options?.id || ''); if (id) void load(); });
onUnload(() => { alive = false; });
</script>
<style scoped>
.goods-gallery,.goods-image { display: block; width: 100%; height: 480rpx; background: #EAF6FD; }.choices { display: flex; flex-wrap: wrap; margin-top: 16rpx; }.choice { padding: 18rpx 24rpx; min-height: 88rpx; margin: 8rpx 16rpx 8rpx 0; font-size: 28rpx; line-height: 1.5; border-radius: 16rpx; background: #F4F6FA; color: #495566; }.choice::after { border: 0; }.choice.active { background: #DCEFFC; color: #164E70; box-shadow: inset 0 0 0 1px #8AD0F9; }.material { display: flex; align-items: center; padding-top: 20rpx; }.material text { margin-left: 16rpx; }.goods-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 100rpx; padding: 0; margin: 0; background: transparent; font-size: 22rpx; color: #495566; line-height: 1.5; }.goods-cart::after { border: 0; }
</style>
