<template>
  <view class="center-page">
    <view v-if="coupon" class="page-body">
      <view class="coupon-context">
        <image src="/static/images/center/ticket.png" mode="aspectFit" />
        <view>
          <text class="ctx-title">{{ coupon.name }} · ¥{{ coupon.amount }}</text>
          <view class="ctx-desc">{{ coupon.scope }}{{ coupon.min > 0 ? ` · 满 ¥${coupon.min} 可用` : '' }}</view>
        </view>
      </view>
      <view v-if="loading" class="hint">加载中…</view>
      <view v-else-if="error" class="sheet-card">
        <view class="para">{{ error }}</view>
        <view class="actions">
          <view class="btn outline" @tap="loadGoods">重试</view>
        </view>
      </view>
      <template v-else-if="list.length">
        <view v-for="item in list" :key="item.id" class="sheet-card">
          <view class="order-product">
            <image v-if="item.cover" class="product-cover" :src="item.cover" mode="aspectFill" />
            <view v-else class="product-symbol">
              <image src="/static/images/center/book-open.png" mode="aspectFit" />
            </view>
            <view>
              <view class="product-name">{{ item.name }}</view>
              <view class="product-meta">{{ categoryName(item.category_id) }}</view>
              <text class="price">¥{{ formatMoney(item.price) }}<text class="price-unit"> 起</text></text>
            </view>
          </view>
          <view class="actions">
            <view class="btn outline" @tap="goGoods(item.id)">查看商品</view>
          </view>
        </view>
        <view class="hint">这里按券适用范围筛选商品；是否满足金额门槛以最终结算为准。</view>
      </template>
      <view v-else class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-h">暂无适用商品</view>
        <view class="empty-p">可看看其他商品</view>
      </view>
    </view>
    <view v-else class="page-body">
      <view class="empty-state">
        <image src="/static/images/center/package-open.png" mode="aspectFit" />
        <view class="empty-h">未找到优惠券</view>
        <view class="empty-p">该优惠券不存在或已下线</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { getGoodsList, getShopCagetorys, type Goods, type GoodsCategory } from '@/services/shop';
import { formatMoney } from '@/utils';

const global = useGlobalStore();
const center = useCenterStore();

const id = ref(0);
const coupon = computed(() => center.findCoupon(id.value));

const categories = ref<GoodsCategory[]>([]);
const goods = ref<Goods[]>([]);
const loading = ref(false);
const error = ref('');

const list = computed(() => {
  const keyword = coupon.value?.categoryKeyword || '';
  if (!keyword) return goods.value;
  const ids = categories.value.filter((c) => c.name.includes(keyword)).map((c) => c.id);
  return goods.value.filter((g) => ids.includes(g.category_id));
});

function categoryName(categoryId: number) {
  return categories.value.find((c) => c.id === categoryId)?.name || '全部商品';
}

onLoad((query) => {
  id.value = Number(query?.id) || 0;
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesCenter/couponGoods/index?id=${id.value}` }))) return;
  if (!goods.value.length && !loading.value) loadGoods();
});

async function loadGoods() {
  if (!coupon.value) return;
  loading.value = true;
  error.value = '';
  try {
    const [categoryRes, goodsRes] = await Promise.all([getShopCagetorys(), getGoodsList({ pageSize: 100 })]);
    categories.value = categoryRes.data;
    goods.value = goodsRes.data.data;
  } catch {
    error.value = '商品列表加载失败，请检查网络后重试。';
  } finally {
    loading.value = false;
  }
}

function goGoods(goodsId: number) {
  uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${goodsId}` });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.product-cover {
  flex: none;
  width: 112rpx;
  height: 128rpx;
  border-radius: 14rpx;
  background: $brand-soft;
}
</style>
