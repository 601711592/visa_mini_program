<template>
  <layout :navbar="{ backgroundColor: '#fff', fixed: true, leftBack: true }">
    <view class="page">
      <view class="search m-[0_24px] rd-1 h60 flex items-center mt-2 pos-relative" border="1px solid #DCDCDC">
        <input v-model="value" @input="onInput" type="text" class="input" :focus="true" />
        <view class="placeholder" v-if="!value">请输入您要搜索的商品关键词</view>
      </view>
      <view class="text-center color-#cacaca line-height-10" v-if="value && !loading && !searchResult.length">没有找到相关商品</view>
      <view class="text-center color-#cacaca line-height-10" v-else-if="value && loading">搜索中...</view>
      <view class="p-[24px] flex flex-wrap justify-between" v-else>
        <view @click="gotoGoodsDetail(item.id)" class="product-card" v-for="(item, index) in searchResult" :key="index">
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

const gotoGoodsDetail = (id: number) => {
  uni.navigateTo({ url: `/pagesMall/goodsDetail/index?id=${id}` });
};
const loading = ref(false);
const value = ref('');
const searchResult = ref<Goods[]>([]);
const onInput = debounce(async () => {
  if (!value.value) {
    searchResult.value = [];
    return;
  }
  loading.value = true;
  const res = await getGoodsList({ pageSize: 100, name: value.value });
  loading.value = false;
  searchResult.value = res.data.data;
}, 500);

onShareAppMessage(() => {
  return {
    title: '董大象签证',
  };
});
</script>

<style lang="scss">
@import './index.scss';
</style>
