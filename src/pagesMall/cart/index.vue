<template>
  <view class="center-page">
    <view class="page-body cart-body">
      <template v-if="mall.cart.length">
        <view v-for="item in mall.cart" :key="item.key" class="sheet-card">
          <view class="cart-top">
            <view class="cart-check">
              <checkbox :checked="item.selected" color="#164E70" @change="mall.toggleSelect(item.key)" />
              <text>选择商品</text>
            </view>
            <text class="text-link" @tap="mall.removeItem(item.key)">删除</text>
          </view>
          <view class="order-product">
            <image v-if="item.cover" class="product-cover" :src="item.cover" mode="aspectFill" />
            <view v-else class="product-symbol">
              <image src="/static/images/center/book-open.png" mode="aspectFit" />
            </view>
            <view class="product-info">
              <text v-if="item.category" class="status-tag">{{ item.category }}</text>
              <text class="product-name">{{ item.goodsName }}</text>
              <text class="product-meta">{{ item.packTitle }} · {{ item.personName }} · {{ item.date }}</text>
            </view>
          </view>
          <view class="cart-bottom">
            <text class="unit-price">¥{{ formatMoney(item.unitPrice) }} / 人</text>
            <view class="stepper">
              <view class="stepper-btn" @tap="mall.setQty(item.key, -1)">−</view>
              <text class="stepper-qty">{{ item.qty }}</text>
              <view class="stepper-btn" @tap="mall.setQty(item.key, 1)">+</view>
            </view>
          </view>
        </view>
      </template>
      <view v-else class="empty-state">
        <image src="/static/images/center/shopping-cart.png" mode="aspectFit" />
        <view class="empty-h">购物车还是空的</view>
        <view class="btn solid" @tap="goCatalog">去选购</view>
      </view>
    </view>
    <view v-if="mall.cart.length" class="checkout-bar">
      <view class="cart-check">
        <checkbox :checked="allSelected" color="#164E70" @change="onToggleAll" />
        <text>全选</text>
      </view>
      <text class="selected-count">已选 {{ selectedPeople }} 人</text>
      <view class="btn solid checkout-btn" @tap="goCheckout">去结算</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMallStore } from '@/store/mall';
import { formatMoney } from '@/utils';

const mall = useMallStore();

const allSelected = computed(() => mall.cart.length > 0 && mall.cart.every((x) => x.selected));
const selectedPeople = computed(() => mall.cart.filter((x) => x.selected).reduce((n, x) => n + x.qty, 0));

function onToggleAll(e: any) {
  mall.toggleAll(!!e.detail.value);
}

function goCheckout() {
  if (!mall.cart.some((x) => x.selected)) {
    uni.showToast({ title: '请先选择商品', icon: 'none' });
    return;
  }
  mall.checkoutSelected();
  uni.navigateTo({ url: '/pagesMall/checkout/index' });
}

function goCatalog() {
  uni.switchTab({ url: '/pages/catalog/index' });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.cart-body {
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.cart-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .text-link {
    min-height: 0;
  }
}

.cart-check {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: $text;
}

.order-product {
  .product-cover {
    flex: none;
    width: 112rpx;
    height: 128rpx;
    border-radius: 14rpx;
    background: $brand-soft;
  }

  .product-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6rpx;
  }
}

.cart-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid $line;
  margin-top: 18rpx;
  padding-top: 24rpx;

  .unit-price {
    font-size: 32rpx;
    font-weight: 600;
    color: $brand-ink;
  }
}

.stepper {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44rpx;
    height: 44rpx;
    border: 1.5rpx solid #becbde;
    border-radius: 50%;
    font-size: 30rpx;
    color: $brand-ink;
    box-sizing: border-box;
    line-height: 1;
  }

  .stepper-qty {
    min-width: 40rpx;
    text-align: center;
    font-size: 28rpx;
    color: $text;
  }
}

.checkout-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: $surface;
  border-top: 1rpx solid $line;

  .selected-count {
    flex: 1;
    text-align: right;
    font-size: 26rpx;
    color: $body;
  }

  .checkout-btn {
    flex: none;
    min-height: 80rpx;
    padding: 10rpx 48rpx;
  }
}
</style>
