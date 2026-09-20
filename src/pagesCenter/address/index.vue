<template>
  <view class="center-page">
    <view class="page-body">
      <template v-if="center.addresses.length">
        <view v-for="a in center.addresses" :key="a.id" class="sheet-card">
          <view class="card-heading">
            <text class="card-h">{{ a.name }}</text>
            <text>{{ maskPhone(a.phone) }}</text>
          </view>
          <view class="address-copy">{{ a.region }} {{ a.street }}</view>
          <view class="address-actions">
            <text v-if="a.default" class="status-tag">默认地址</text>
            <view v-else class="text-link" @tap="center.setDefaultAddress(a.id)">设为默认</view>
            <view class="spring"></view>
            <view class="text-link" @tap="goEdit(a.id)">编辑</view>
            <view class="text-link" @tap="confirmDelete(a)">删除</view>
          </view>
        </view>
      </template>
      <view v-else class="sheet-card">
        <view class="empty-state">
          <image src="/static/images/center/map-pin.png" mode="aspectFit" />
          <view class="empty-h">还没有收货地址</view>
          <view class="empty-p">添加地址，用于护照或材料寄送。</view>
        </view>
      </view>
      <view class="bottom-action">
        <view class="btn solid full" @tap="goEdit()">新增收货地址</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type Address } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/address/index' }))) return;
});

function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}/, '$1****');
}

function goEdit(id?: number) {
  uni.navigateTo({ url: id ? `/pagesCenter/addressEdit/index?id=${id}` : '/pagesCenter/addressEdit/index' });
}

function confirmDelete(a: Address) {
  uni.showModal({
    title: '删除地址',
    content: `确认删除这个地址？${a.name} · ${a.region} ${a.street}`,
    success: (res) => {
      if (!res.confirm) return;
      center.deleteAddress(a.id);
      uni.showToast({ title: '地址已删除（模拟）', icon: 'none' });
    },
  });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
