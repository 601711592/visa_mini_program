<template>
  <layout :show-navbar="false">
    <view class="center-page"><view class="page-body">
      <view v-if="coupon" class="coupon-context">
        <image src="/static/images/center/ticket.png" mode="aspectFit" />
        <view><text class="ctx-title">{{ coupon.name }} · ¥{{ coupon.amount }}</text><view class="ctx-desc">{{ coupon.scope }}{{ coupon.min > 0 ? ` · 满 ¥${coupon.min} 可用` : '' }}</view></view>
      </view>
      <view v-if="initialLoading" class="hint">加载中…</view>
      <template v-else>
        <view v-for="item in goods" :key="item.id" class="sheet-card">
          <view class="order-product">
            <image v-if="item.cover" class="product-cover" :src="item.cover" mode="aspectFill" />
            <view v-else class="product-symbol"><image src="/static/images/center/book-open.png" mode="aspectFit" /></view>
            <view><view class="product-name">{{ item.name }}</view><text class="price">¥{{ formatMoney(item.price) }}<text class="price-unit"> 起</text></text></view>
          </view>
          <view class="actions"><view class="btn outline" @tap="goGoods(item.id)">查看商品</view></view>
        </view>
        <view v-if="error" class="sheet-card"><view class="para">{{ error }}</view><view class="btn outline" @tap="retry">重试</view></view>
        <view v-else-if="!coupon" class="empty-state"><view class="empty-h">未找到优惠券</view></view>
        <view v-else-if="!goods.length" class="empty-state"><view class="empty-h">暂无适用商品</view></view>
        <view v-else class="hint">按券适用范围展示商品，是否满足门槛以最终结算为准。</view>
        <view v-if="hasMore && !error" class="btn outline full" @tap="loadMore">{{ loadingMore ? '加载中…' : '加载更多商品' }}</view>
      </template>
    </view></view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { getCouponGoods } from '@/services/benefits';
import type { Goods } from '@/services/shop';
import { formatMoney } from '@/utils';

const global = useGlobalStore();
const center = useCenterStore();
const id = ref(0);
const coupon = computed(() => center.findCoupon(id.value));
const goods = ref<Goods[]>([]);
const initialLoading = ref(true);
const loadingMore = ref(false);
const error = ref('');
const page = ref(0);
const hasMore = ref(false);
let requestId = 0;
onLoad(query => { id.value = Number(query?.id) || 0; });
onUnload(() => { requestId++; });
onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesCenter/couponGoods/index?id=${id.value}` }))) return;
  await reload();
});

/** 券与商品都重新读取，先服务端筛选范围再分页。 */
async function reload() {
  const seq = ++requestId;
  initialLoading.value = true;
  error.value = '';
  goods.value = [];
  page.value = 0;
  hasMore.value = false;
  try {
    await center.loadCoupons();
    if (seq !== requestId || !coupon.value) return;
    const result = await getCouponGoods(id.value, 1);
    if (seq !== requestId) return;
    goods.value = result.data.data;
    page.value = result.data.current_page;
    hasMore.value = goods.value.length < result.data.total;
  } catch { if (seq === requestId) error.value = '适用商品加载失败，请重试'; }
  finally { if (seq === requestId) initialLoading.value = false; }
}

async function loadMore() {
  if (loadingMore.value || initialLoading.value || !hasMore.value) return;
  const seq = requestId;
  loadingMore.value = true;
  error.value = '';
  try {
    const result = await getCouponGoods(id.value, page.value + 1);
    if (seq !== requestId) return;
    goods.value.push(...result.data.data.filter(item => !goods.value.some(old => old.id === item.id)));
    page.value = result.data.current_page;
    hasMore.value = goods.value.length < result.data.total;
  } catch { if (seq === requestId) error.value = '更多商品加载失败，请重试'; }
  finally { loadingMore.value = false; }
}
function retry() { return page.value ? loadMore() : reload(); }
function goGoods(goodsId: number) { uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${goodsId}` }); }
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
.product-cover { flex: none; width: 112rpx; height: 128rpx; border-radius: 14rpx; background: $brand-soft; }
</style>
