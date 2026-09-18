<template><view class="mx-grid"><view v-for="goods in items" :key="goods.id" class="mx-product-tile" @tap="open(goods.id)"><image :src="goods.cover" mode="aspectFill"/><view class="mx-copy"><view class="mx-name">{{goods.name}}</view><view class="mx-between"><text class="mx-price">¥{{money(goods.price)}}</text><button v-if="cartEntry" class="card-cart" aria-label="选择规格后加入购物车" @tap.stop="open(goods.id)"><MallIcon name="cart" :size="32"/></button></view></view></view></view></template>
<script setup lang="ts">
import type {Goods} from '@/services/shop';import MallIcon from './MallIcon.vue';import {money} from '@/mall/model';
defineOptions({options:{styleIsolation:'shared'}});defineProps<{items:Goods[];cartEntry?:boolean}>();
function open(id:number){uni.navigateTo({url:`/pagesMall/goodsDetail/index?id=${id}`});}
</script><style scoped>.card-cart{display:flex;align-items:center;justify-content:center;width:64rpx;min-height:88rpx;margin:-16rpx -8rpx -16rpx 0;padding:0;background:transparent;}.card-cart::after{border:0;}</style>
