<template>
  <view class="catalog-page" :style="{ height: viewportHeight + 'px' }">
    <view class="catalog-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="catalog-nav-row" :style="{ height: navHeight + 'px', paddingRight: capsuleSpace + 'px' }">
        <view class="nav-search" role="button" aria-label="搜索国家或商品" @tap="goSearch">
          <image class="search-icon" src="/static/images/center/search-ink.png" mode="aspectFit" />
          <text class="search-text">搜索国家或商品</text>
        </view>
        <view class="cart-entry" role="button" aria-label="购物车" @tap="goCart">
          <image class="cart-icon" src="/static/images/center/shopping-cart.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="catalog-split">
      <scroll-view scroll-y class="catalog-rail" :show-scrollbar="false">
        <view class="rail-content">
          <view
            v-for="item in categories"
            :key="item.id"
            class="rail-item"
            :class="{ 'rail-item--active': currentCategory === item.id }"
            role="button"
            :aria-label="item.name"
            @tap="selectCategory(item.id)"
          >
            <text class="rail-label">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="catalog-goods-area" :scroll-top="goodsScrollTop" :show-scrollbar="false" @scroll="onGoodsScroll">
        <view class="goods-content">
          <view class="goods-header">
            <text class="goods-title">{{ activeCategoryName || '产品分类' }}</text>
            <text v-if="!loading && !loadError" class="goods-count">{{ list.length }}款商品</text>
          </view>
          <view v-if="loading" class="catalog-state">正在加载商品…</view>
          <view v-else-if="loadError" class="catalog-state">
            <text>商品加载失败，请重试</text>
            <button class="retry-button" @tap="loadCatalog">重新加载</button>
          </view>
          <view v-else-if="!list.length" class="catalog-state">该分类暂无商品</view>
          <view v-else class="tiles-grid">
            <view v-for="item in list" :key="item.id" class="catalog-tile" role="button" :aria-label="item.name" @tap="goGoods(item.id)">
              <view class="catalog-goods">
                <view class="cover-frame">
                  <image v-if="item.cover && !failedCovers[item.id]" class="tile-cover" :src="item.cover" mode="aspectFill" @error="failedCovers[item.id] = true" />
                  <view v-else class="cover-placeholder"><text class="cover-placeholder-text">暂无图片</text></view>
                </view>
                <text class="tile-name">{{ item.name }}</text>
              </view>
              <view class="tile-bottom">
                <text class="tile-price">¥<text class="tile-price-num" :class="{ 'tile-price-num--compact': priceLabel(item.price).length > 6 }">{{ priceLabel(item.price) }}</text></text>
                <view class="tile-arrow" aria-hidden="true">
                  <view class="arrow-disc"><image class="arrow-icon" src="/static/images/center/chevron-right.png" mode="aspectFit" /></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Goods, GoodsCategory } from '@/services/shop';
import { getGoodsList, getShopCategories } from '@/services/shop';
import { formatMoney } from '@/utils';
import { onResize, onShow } from '@dcloudio/uni-app';
import { computed, nextTick, ref } from 'vue';

const viewportHeight = ref(0);
const statusBarHeight = ref(0);
const navHeight = ref(44);
const capsuleSpace = ref(0);
// 原生胶囊由微信绘制；窗口与胶囊测量使用 px，不随 rpx 稿机械缩放。
function updateWindow() {
  const windowInfo = uni.getWindowInfo();
  const capsule = uni.getMenuButtonBoundingClientRect();
  viewportHeight.value = windowInfo.windowHeight;
  statusBarHeight.value = windowInfo.statusBarHeight || 0;
  const validCapsule = capsule.width > 0 && capsule.height > 0 && capsule.left > 0;
  const gap = validCapsule ? Math.max(0, capsule.top - statusBarHeight.value) : 6;
  navHeight.value = validCapsule ? capsule.height + gap * 2 : 44;
  capsuleSpace.value = validCapsule ? windowInfo.windowWidth - capsule.left + 8 : 12;
}
updateWindow();
onResize(updateWindow);

const currentCategory = ref(0);
const categories = ref<GoodsCategory[]>([]);
const goods = ref<Goods[]>([]);
const loading = ref(true);
const loadError = ref(false);
const failedCovers = ref<Record<number, boolean>>({});
const goodsScrollTop = ref(0);
let currentScrollTop = 0;
let requestPending = false;

async function loadCatalog() {
  if (requestPending) return;
  requestPending = true;
  loading.value = true;
  loadError.value = false;
  try {
    const [categoryResult, goodsResult] = await Promise.all([getShopCategories(), getGoodsList({ pageSize: 100 })]);
    categories.value = categoryResult.data;
    goods.value = goodsResult.data.data;
    if (!categories.value.some(category => category.id === currentCategory.value)) {
      currentCategory.value = categories.value[0]?.id || 0;
    }
    failedCovers.value = {};
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
    requestPending = false;
  }
}
onShow(() => { updateWindow(); loadCatalog(); });

const list = computed(() => currentCategory.value
  ? goods.value.filter(item => item.category_id === currentCategory.value)
  : []);
const activeCategoryName = computed(() => categories.value.find(category => category.id === currentCategory.value)?.name || '');
function onGoodsScroll(event: { detail: { scrollTop: number } }) { currentScrollTop = event.detail.scrollTop; }
async function selectCategory(id: number) {
  if (currentCategory.value === id) return;
  currentCategory.value = id;
  goodsScrollTop.value = currentScrollTop;
  await nextTick();
  goodsScrollTop.value = 0;
}
const priceLabel = (price: number) => formatMoney(price).replace(/\.00$/, '');
const goGoods = (id: number) => uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${id}` });
const goSearch = () => uni.navigateTo({ url: '/pages/search/index' });
const goCart = () => uni.navigateTo({ url: '/pagesMall/cart/index' });
</script>

<style scoped lang="scss">
// 750rpx 确认稿；仅使用类选择器，兼容微信小程序样式编译。
.catalog-page { display: flex; flex-direction: column; overflow: hidden; background: #fff; color: #202631; }
.catalog-nav { flex: none; background: #8ad0f9; }
.catalog-nav-row { display: flex; align-items: center; gap: 8rpx; padding-left: 24rpx; box-sizing: border-box; }
.nav-search { display: flex; align-items: center; flex: 1; min-width: 0; height: 70rpx; max-height: 100%; padding: 0 16rpx; gap: 12rpx; box-sizing: border-box; background: #eaf6fd; border-radius: 36rpx; }
.search-icon { flex: none; width: 30rpx; height: 30rpx; }
.search-text { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #495566; font-size: 25rpx; }
.cart-entry { flex: none; width: 64rpx; height: 100%; display: flex; align-items: center; justify-content: center; }
.cart-icon { width: 38rpx; height: 38rpx; }
.catalog-split { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.catalog-rail { flex: none; width: 156rpx; height: 100%; background: #f4f6fa; }
.rail-content { padding-top: 28rpx; }
.rail-item { position: relative; display: flex; align-items: center; min-height: 104rpx; padding: 24rpx 12rpx; box-sizing: border-box; color: #495566; }
.rail-label { font-size: 28rpx; line-height: 42rpx; overflow-wrap: anywhere; }
.rail-item--active { background: #eaf6fd; color: #164e70; font-weight: 600; }
.rail-item--active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6rpx; background: #8ad0f9; }
.catalog-goods-area { flex: 1; width: 0; min-width: 0; height: 100%; background: #fff; }
.goods-content { padding: 36rpx 20rpx; }
.goods-header { margin: 0 8rpx 36rpx; }
.goods-title { display: block; font-size: 48rpx; font-weight: 600; line-height: 67rpx; color: #202631; overflow-wrap: anywhere; }
.goods-count { display: block; margin-top: 8rpx; font-size: 28rpx; line-height: 45rpx; color: #737d8c; }
.tiles-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20rpx; }
.catalog-tile { display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: #fff; border: 2rpx solid #e3e8f0; border-radius: 24rpx; box-sizing: border-box; }
.catalog-goods { flex: 1; min-width: 0; padding: 14rpx 14rpx 0; }
// 百分比正方形容器避免微信 image 默认尺寸、固定高度及旧基础库 aspect-ratio 差异。
.cover-frame { position: relative; width: 100%; height: 0; padding-top: 100%; overflow: hidden; border-radius: 14rpx; background: #f4f6fa; }
.tile-cover, .cover-placeholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.cover-placeholder { display: flex; align-items: center; justify-content: center; }
.cover-placeholder-text { color: #737d8c; font-size: 24rpx; }
.tile-name { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; height: 88rpx; margin: 20rpx 2rpx 0; font-size: 28rpx; font-weight: 500; line-height: 44rpx; color: #202631; overflow-wrap: anywhere; }
.tile-bottom { display: flex; align-items: center; justify-content: space-between; gap: 0; padding: 4rpx 6rpx 10rpx 16rpx; }
.tile-price { min-width: 0; font-size: 24rpx; color: #164e70; white-space: nowrap; }
.tile-price-num { margin-left: 2rpx; font-size: 40rpx; font-weight: 600; }
.tile-price-num--compact { font-size: 26rpx; }
.tile-arrow { display: flex; flex: none; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; }
.arrow-disc { display: flex; align-items: center; justify-content: center; width: 60rpx; height: 60rpx; border-radius: 50%; background: #eaf6fd; }
.arrow-icon { width: 40rpx; height: 40rpx; }
.catalog-state { padding: 60rpx 8rpx; text-align: center; color: #737d8c; font-size: 26rpx; line-height: 44rpx; }
.retry-button { margin: 24rpx auto 0; padding: 0 24rpx; width: 200rpx; min-height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #eaf6fd; color: #164e70; font-size: 28rpx; }
.retry-button::after { border: 0; }
</style>
