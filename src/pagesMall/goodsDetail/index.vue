<template>
  <layout :navbar="{ backgroundColor: '#fff', leftBack: true, fixed: true }">
    <view class="page" v-show="goodsDetail">
      <view class="header-image">
        <!-- 轮播图 -->
        <swiper class="swiper" :indicator-dots="true" :autoplay="false" :interval="3000" :duration="500">
          <swiper-item v-for="(item, index) in goodsDetail?.images" :key="index">
            <image :src="item" mode="aspectFill" class="swiper-image" />
          </swiper-item>
        </swiper>
      </view>
      <view class="goods-base p-4">
        <view class="goods-name">{{ goodsDetail?.name }}</view>
        <view class="goods-price mt-1">¥ {{ formatMoney(selectPackage ? +selectPackage.price : goodsDetail?.price) }}</view>
      </view>
      <view class="goods-detail mt-3 mb-3 p-2">
        <view class="font-bold">商家说亮点</view>
        <view class="mt-1 color-coolgray">
          <text>{{ goodsDetail?.highlights }}</text>
        </view>
      </view>

      <view class="goods-detail mt-3 mb-3 p-2">
        <view class="font-bold">套餐</view>
        <view class="mt-1 flex">
          <view
            class="package"
            :class="{ active: selectPackage === item }"
            v-for="item in goodsDetail?.specification"
            :key="item.key"
            @click="selectPackage = item"
            >{{ item.title }}</view
          >
        </view>
      </view>
      <view class="goods-detail mt-3 mb-3 p-2" v-if="selectPackage">
        <view class="font-bold">出游人群</view>
        <view class="mt-1 flex">
          <view
            class="package"
            :class="{ active: selectPersonIndex === index }"
            v-for="(item, index) in selectPackage?.person"
            :key="item"
            @click="selectPersonIndex = index"
            >{{ item }}</view
          >
        </view>
      </view>
      <view class="goods-detail mt-3 mb-3 p-2" v-if="selectPackage">
        <view class="font-bold">出发日期</view>
        <view class="mt-1 calendar-wrap">
          <uni-calendar
            :selected="calendarSelected"
            :startDate="calendarRange[0]"
            :endDate="calendarRange[1]"
            :insert="true"
            @change="onCalendarChange"
          />
        </view>
        <view class="muted-tip mt-2">已选：{{ selectedDate || '请选择' }} · {{ currentPersonName }}</view>
      </view>
      <view class="goods-detail mt-3 mb-3 p-2" v-if="selectPackage">
        <view class="font-bold">材料清单</view>
        <view class="mt-1 flex materialList">
          <view class="item" v-for="item in selectPackage.information.split('\n')" :key="item"
            ><iconfont type="checkmarkempty" size="16" color="#245B7A" />{{ item }}</view
          >
        </view>
      </view>
      <view class="goods-detail mt-3 mb-3 p-2">
        <view class="font-bold mb-2">商品详细</view>
        <rich-text :nodes="goodsDetail?.content"></rich-text>
      </view>
      <view class="tabs">
        <view
          class="tab-item"
          @click="currentDescriptionIndex = index"
          :class="{ active: index === currentDescriptionIndex }"
          v-for="(item, index) in descriptionList"
          :key="item"
          >{{ item }}</view
        >
      </view>
      <view class="goods-detail p-2">
        <rich-text :nodes="goodsDetail?.trip_description" v-show="currentDescriptionIndex === 0"></rich-text>
        <rich-text :nodes="goodsDetail?.price_description" v-show="currentDescriptionIndex === 1"></rich-text>
        <rich-text :nodes="goodsDetail?.refund_description" v-show="currentDescriptionIndex === 2"></rich-text>
        <rich-text :nodes="goodsDetail?.booking_description" v-show="currentDescriptionIndex === 3"></rich-text>
      </view>
      <view class="goods-detail mt-3 p-2">
        <view class="flex justify-between items-center">
          <view class="font-bold">购买人数</view>
          <view class="stepper">
            <view class="stepper-btn" :class="{ disabled: qty <= 1 }" @tap="changeQty(-1)">−</view>
            <view class="stepper-value">{{ qty }}</view>
            <view class="stepper-btn" :class="{ disabled: maxQty > 0 && qty >= maxQty }" @tap="changeQty(1)">+</view>
          </view>
        </view>
        <view class="muted-tip mt-2">演示活动：同商品同套餐满 2 人享 9 折</view>
      </view>
      <view class="footer-bar">
        <view class="cart-btn" @tap="goCart">
          <image src="/static/images/center/shopping-cart.png" class="cart-icon" mode="aspectFit" />
          <view class="cart-badge" v-if="mall.cartCount > 0">{{ mall.cartCount > 99 ? '99+' : mall.cartCount }}</view>
        </view>
        <view class="footer-btn outline" @tap="onAddCart">加入购物车</view>
        <view class="footer-btn primary" @tap="onBuyNow">立即购买</view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { Goods, GoodsSpecification } from '@/services/shop';
import { computed, ref, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGoodsDetail, getShopCategories } from '@/services/shop';
import { useMallStore, type CartItem } from '@/store/mall';
import { formatMoney } from '@/utils';
import moment from 'moment';

const mall = useMallStore();

const goodsDetail = ref<Goods | undefined>(undefined);

const selectPackage = ref<GoodsSpecification | undefined>();
const selectPersonIndex = ref(0);
const selectedDate = ref('');
const qty = ref(1);
const categoryName = ref('');

const currentPersonName = computed(() => selectPackage.value?.person?.[selectPersonIndex.value] || '');

const maxQty = computed(() => (goodsDetail.value?.limitBuy && goodsDetail.value.limitBuy > 0 ? goodsDetail.value.limitBuy : 0));

watch(selectPackage, () => {
  if (!selectPackage.value?.person) return;
  selectPersonIndex.value = selectPackage.value?.person.length < selectPersonIndex.value ? 0 : selectPersonIndex.value;
});

const calendarSelected = computed(() => {
  if (!selectPackage.value?.person) return [];

  const currentPerson = selectPackage.value?.person[selectPersonIndex.value];
  const res: any = [];
  selectPackage.value.priceCalender.forEach((item: any) => {
    const obj = item.list.find((v: any) => v.person === currentPerson);
    if (obj && obj.quota > 0) {
      res.push({
        date: item.date,
        info: '¥' + obj.price,
      });
    }
  });
  return res;
});

const calendarRange = computed(() => {
  if (!selectPackage.value) return [undefined, undefined];
  return [moment(selectPackage.value.timeSlot[0]).format('YYYY-MM-DD'), moment(selectPackage.value.timeSlot[1]).format('YYYY-MM-DD')];
});

watch(calendarSelected, (list) => {
  if (!list.length) {
    selectedDate.value = '';
    return;
  }
  if (!selectedDate.value || !list.some((d: any) => d.date === selectedDate.value)) {
    selectedDate.value = list[0].date;
  }
});

const onCalendarChange = (e: { fulldate: string }) => {
  const date = e.fulldate;
  if (calendarSelected.value.some((d: any) => d.date === date)) {
    selectedDate.value = date;
  }
};

const changeQty = (delta: number) => {
  const next = qty.value + delta;
  if (next < 1) return;
  if (maxQty.value > 0 && next > maxQty.value) return;
  qty.value = next;
};

const buildItem = (): Omit<CartItem, 'key' | 'selected'> | null => {
  const goods = goodsDetail.value;
  const spec = selectPackage.value;
  if (!goods || !spec) {
    uni.showToast({ title: '请先选择套餐', icon: 'none' });
    return null;
  }
  if (!selectedDate.value) {
    uni.showToast({ title: '请选择出发日期', icon: 'none' });
    return null;
  }
  let unitPrice = +spec.price;
  const day = spec.priceCalender?.find((item: any) => item.date === selectedDate.value);
  const hit = day?.list?.find((v: any) => v.person === currentPersonName.value);
  if (hit) unitPrice = Math.round(Number(hit.price) * 100);
  return {
    goodsId: goods.id,
    goodsName: goods.name,
    cover: goods.images?.[0] || '',
    category: categoryName.value,
    packIndex: goods.specification.indexOf(spec),
    packTitle: spec.title,
    personIndex: selectPersonIndex.value,
    personName: currentPersonName.value,
    date: selectedDate.value,
    qty: qty.value,
    unitPrice,
    needsTravellers: true,
  };
};

const onAddCart = () => {
  const item = buildItem();
  if (!item) return;
  mall.addToCart(item);
  uni.showToast({ title: '已加入购物车', icon: 'success' });
};

const onBuyNow = () => {
  const item = buildItem();
  if (!item) return;
  mall.buyNow(item);
  uni.navigateTo({ url: '/pagesMall/checkout/index' });
};

const goCart = () => {
  uni.navigateTo({ url: '/pagesMall/cart/index' });
};

const descriptionList = ['行程说明', '费用说明', '退改规划', '预定须知'];

const currentDescriptionIndex = ref(0);

interface Options {
  id?: string;
}

onLoad((options) => {
  const { id } = options as Options;
  if (id) {
    getGoodsDetail(id).then((res) => {
      goodsDetail.value = res.data;
      goodsDetail.value.content = goodsDetail.value.content.replace(/\<img/gi, '<img style="max-width:100%;height:auto"');
      getShopCategories().then((cateRes) => {
        categoryName.value = cateRes.data.find((c) => c.id === goodsDetail.value?.category_id)?.name || '';
      });
    });
  }
});
</script>

<style lang="scss">
@import './index.scss';
</style>
