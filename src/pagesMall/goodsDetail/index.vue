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
        <view class="mt-1 flex flex-wrap">
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
      <view class="goods-detail mt-3 mb-3 p-2" v-if="selectPackage?.bookingEnabled">
        <view class="font-bold">出游人群</view>
        <view class="mt-1 flex flex-wrap">
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
      <view class="goods-detail mt-3 mb-3 p-2" v-if="selectPackage?.bookingEnabled">
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
        <view class="muted-tip mt-2"
          >已选：{{ selectedDate || (calendarSelected.length ? '请选择' : '暂无可预订日期') }}<text v-if="currentPersonName"> · {{ currentPersonName }}</text></view
        >
      </view>
      <view class="goods-detail mt-3 mb-3 p-2" v-if="materialList.length">
        <view class="font-bold">材料清单</view>
        <view class="mt-1 flex materialList" v-if="materialIsShort">
          <view class="item" v-for="(item, index) in materialList" :key="index"
            ><iconfont type="checkmarkempty" size="16" color="#245B7A" />{{ item }}</view
          >
        </view>
        <!-- 后台多为整段说明（编号、空行分段、注意事项），按原文逐行展示 -->
        <view class="mt-1 materialText" v-else>
          <view v-for="(line, index) in materialLines" :key="index" :class="line.trim() ? 'line' : 'gap'">{{ line }}</view>
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
        <view class="muted-tip mt-2">优惠金额以结算页服务端报价为准</view>
      </view>
      <view class="footer-bar">
        <view class="footer-btn primary" @tap="onBuyNow">立即购买</view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { Goods, GoodsSpecification } from '@/services/shop';
import { computed, ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
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
const today = ref(moment().format('YYYY-MM-DD'));
onShow(() => { today.value = moment().format('YYYY-MM-DD'); });
const categoryName = ref('');

// 未开启出游人群/价格日历的套餐不选人群
const currentPersonName = computed(() => (selectPackage.value?.bookingEnabled ? selectPackage.value.person?.[selectPersonIndex.value] || '' : ''));

const maxQty = computed(() => (goodsDetail.value?.purchase_limit && goodsDetail.value.purchase_limit > 0 ? goodsDetail.value.purchase_limit : 0));

watch(selectPackage, () => {
  if (!selectPackage.value?.person) return;
  selectPersonIndex.value = selectPackage.value?.person.length <= selectPersonIndex.value ? 0 : selectPersonIndex.value;
});

const calendarSelected = computed(() => {
  if (!selectPackage.value?.bookingEnabled) return [];

  const currentPerson = currentPersonName.value;
  const res: any = [];
  (selectPackage.value.priceCalender || []).forEach((item: any) => {
    const obj = item.list?.find((v: any) => v.person === currentPerson);
    const price = (obj?.price == null || Number(obj.price) === 0) ? Number(selectPackage.value.price) : Number(obj?.price);
    if (obj && Number.isFinite(price) && price > 0 && (obj.quota == null || obj.quota === '' || obj.quota > 0)
      && moment(item.date, 'YYYY-MM-DD', true).isValid() && item.date >= today.value) {
      res.push({
        date: item.date,
        info: '¥' + formatMoney(price),
      });
    }
  });
  return res;
});

const calendarRange = computed(() => {
  const timeSlot = selectPackage.value?.timeSlot;
  if (!timeSlot?.[0] || !timeSlot?.[1]) return [undefined, undefined];
  return [moment(timeSlot[0]).format('YYYY-MM-DD'), moment(timeSlot[1]).format('YYYY-MM-DD')];
});

// 后台未填写材料清单时 information 为 null
const materialLines = computed(() => {
  const text = (selectPackage.value?.information || '').replace(/\r\n?/g, '\n').trim();
  // 连续空行合并为一个段落间距
  return text ? text.replace(/\n\s*\n+/g, '\n\n').split('\n') : [];
});
const materialList = computed(() => materialLines.value.map((item) => item.trim()).filter(Boolean));
// 全部是“护照”“身份证”这类短条目时才用三列勾选样式
const materialIsShort = computed(() => materialList.value.every((item) => item.length <= 8));

watch(calendarSelected, (list) => {
  if (!list.length) {
    selectedDate.value = '';
    return;
  }
  if (!selectedDate.value || !list.some((d: any) => d.date === selectedDate.value)) {
    selectedDate.value = list[0].date;
  }
});

/** 更新选择的出发日期。 */
const onCalendarChange = (e: { fulldate: string }) => {
  const date = e.fulldate;
  if (calendarSelected.value.some((d: any) => d.date === date)) {
    selectedDate.value = date;
  }
};

/** 在限购范围内调整购买人数。 */
const changeQty = (delta: number) => {
  const next = qty.value + delta;
  if (next < 1) return;
  if (maxQty.value > 0 && next > maxQty.value) return;
  qty.value = next;
};

/** 检查商品选择并组装结算明细。 */
const buildItem = (): Omit<CartItem, 'key' | 'selected'> | null => {
  const goods = goodsDetail.value;
  const spec = selectPackage.value;
  if (!goods || !spec) {
    uni.showToast({ title: '请先选择套餐', icon: 'none' });
    return null;
  }
  const bookingEnabled = !!spec.bookingEnabled;
  let unitPrice = +spec.price;
  // 未开启出游人群/价格日历：按套餐价格、不限名额
  let quota: any = null;
  if (bookingEnabled) {
    if (!spec.person?.length) {
      uni.showToast({ title: '当前套餐暂未配置出游人群', icon: 'none' });
      return null;
    }
    if (!currentPersonName.value) {
      uni.showToast({ title: '请选择出游人群', icon: 'none' });
      return null;
    }
    today.value = moment().format('YYYY-MM-DD');
    if (!calendarSelected.value.length) {
      uni.showToast({ title: '当前套餐暂无可预订日期', icon: 'none' });
      return null;
    }
    if (!selectedDate.value) {
      uni.showToast({ title: '请选择出发日期', icon: 'none' });
      return null;
    }
    if (!moment(selectedDate.value, 'YYYY-MM-DD', true).isValid() || selectedDate.value < today.value) {
      uni.showToast({ title: '所选日期已失效，请重新选择', icon: 'none' });
      return null;
    }
    const day = spec.priceCalender?.find((item: any) => item.date === selectedDate.value);
    const hit = day?.list?.find((v: any) => v.person === currentPersonName.value);
    if (!hit) {
      uni.showToast({ title: '所选日期暂无有效价格，请重新选择', icon: 'none' });
      return null;
    }
    if (hit.price != null && Number(hit.price) !== 0) unitPrice = Number(hit.price);
    quota = hit.quota;
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    uni.showToast({ title: bookingEnabled ? '所选日期暂无有效价格，请重新选择' : '当前套餐暂无有效价格', icon: 'none' });
    return null;
  }
  if (!Number.isInteger(qty.value) || qty.value < 1 || qty.value > 50
    || (maxQty.value > 0 && qty.value > maxQty.value) || (quota != null && quota !== '' && (Number(quota) < qty.value || !Number.isFinite(Number(quota))))) {
    uni.showToast({ title: '购买人数超过可用名额或限购数量', icon: 'none' });
    return null;
  }
  return {
    goodsId: goods.id,
    goodsName: goods.name,
    cover: goods.images?.[0] || '',
    category: categoryName.value,
    categoryId: goods.category_id,
    packIndex: goods.specification.indexOf(spec),
    packageKey: String(spec.key),
    packTitle: spec.title,
    // 未开启时不区分人群，固定为 0，避免明细键随之前浏览过的套餐变化
    personIndex: bookingEnabled ? selectPersonIndex.value : 0,
    personName: currentPersonName.value,
    date: bookingEnabled ? selectedDate.value : '',
    qty: qty.value,
    unitPrice,
    needsTravellers: goods.needs_travellers !== false,
  };
};

/** 保存立即购买的商品并进入结算页。 */
const onBuyNow = () => {
  const item = buildItem();
  if (!item) return;
  mall.buyNow(item);
  uni.navigateTo({ url: '/pagesMall/checkout/index' });
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
