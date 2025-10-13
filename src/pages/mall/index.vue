<template>
  <layout :navbar="{ backgroundColor: '#fff', fixed: true }">
    <view class="page">
      <view class="search m-[0_24px] rd-1 h60 center mt-2 c-#cacaca" border="1px solid #DCDCDC" @click="gotoSearchPage">点击搜索商品</view>
      <view class="w700 h500 m-[24px_auto_0] company"></view>
      <view class="category flex justify-between p-[0_24px]">
        <view
          class="category-item center"
          :class="{ active: currentCategory === item.id }"
          v-for="(item, index) in shopCagetorys"
          :key="item.id"
          @click="currentCategory = item.id"
          >{{ item.name }}</view
        >
      </view>
      <view class="p-[0_24px] flex flex-wrap justify-between">
        <view @click="gotoGoodsDetail(item.id)" class="product-card" v-for="(item, index) in list" :key="index">
          <view class="product-image" :style="`background-image: url(${item.cover})`"></view>
          <view class="product-card__text">
            <view class="description">{{ item.name }}</view>
            <view class="price">¥ {{ formatMoney(item.price) }}</view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { Goods, GoodsCategory } from '@/services/shop';
import { getGoodsList, getShopCagetorys } from '@/services/shop';
import { debounce, formatMoney } from '@/utils';
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

const currentCategory = ref(0);
const shopCagetorys = ref<GoodsCategory[]>([]);
const goods = ref<Goods[]>([]);

onShow(() => {
  getShopCagetorys().then((res) => {
    shopCagetorys.value = res.data;
    currentCategory.value = res.data[0].id;
  });
  getGoodsList({ pageSize: 100 }).then((res) => {
    goods.value = res.data.data;
  });
});

const list = computed(() => {
  if (!currentCategory.value) return goods.value;
  return goods.value.filter((item) => item.category_id === currentCategory.value);
});

const gotoGoodsDetail = (id: number) => {
  uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${id}` });
};

const gotoSearchPage = () => {
  uni.navigateTo({ url: `/pages/search/index` });
};

onShareAppMessage(() => {
  return {
    title: '董大象签证',
  };
});
</script>

<style lang="scss">
@import './index.scss';
</style>
