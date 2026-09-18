<template><MallPage><view class="mx-body"><view class="mx-card" v-if="coupon"><view class="mx-title">{{ coupon.name }} · 适用商品</view><view class="mx-hint">{{ coupon.scope }}。选好套餐、日期及人数后，在结算页选择此券；是否达到门槛以结算为准。</view></view><view v-if="catalog.loading" class="mx-empty">正在加载商品…</view><view v-else-if="catalog.error" class="mx-empty"><view>{{ catalog.error }}</view><button class="mx-button" @tap="catalog.load(true)">重试</button></view><CatalogCards v-else :items="items" cart-entry /><view v-if="!catalog.loading && !items.length" class="mx-empty mx-muted">暂无适用商品</view></view></MallPage></template>
<script setup lang="ts">
import { computed, ref } from 'vue';import { onLoad, onShow } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';import { useCatalogStore } from '@/store/catalog';
import MallPage from '@/components/mall/MallPage.vue';import CatalogCards from '@/components/mall/CatalogCards.vue';
const mall = useMallPreviewStore(), catalog = useCatalogStore(), id = ref('');
const coupon = computed(() => mall.data.member ? mall.data.coupons.find(item => item.id === id.value) : undefined);
const items = computed(() => coupon.value ? catalog.goods.filter(item => !coupon.value!.categoryIds.length || coupon.value!.categoryIds.includes(item.category_id)) : []);
onLoad(options => { id.value = String(options?.id || ''); });
onShow(() => { if (mall.enabled && mall.data.member) void catalog.load(); });
</script>
