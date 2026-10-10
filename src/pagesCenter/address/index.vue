<template>
  <layout :navbar="{ title: '收货地址管理', leftBack: true, backgroundColor: '#8AD0F9', fixed: true }">
  <view class="center-page">
    <view class="page-body">
      <view v-if="center.addressesError && center.addressesLoaded" class="sheet-card">
        <view>{{ center.addressesError }}</view>
        <view class="text-link" @tap="refresh">重试</view>
      </view>
      <view v-if="center.addressesLoading && !center.addressesLoaded" class="sheet-card">正在加载地址…</view>
      <view v-else-if="center.addressesError && !center.addressesLoaded" class="sheet-card">
        <view>{{ center.addressesError }}</view>
        <view class="text-link" @tap="refresh">重试</view>
      </view>
      <template v-else-if="center.addresses.length">
        <view v-for="a in center.addresses" :key="a.id" class="sheet-card" @tap="chooseAddress(a.id)">
          <view class="card-heading">
            <text class="card-h">{{ a.name }}</text>
            <text>{{ maskPhone(a.phone) }}</text>
          </view>
          <view class="address-copy">{{ addressText(a) }}</view>
          <view class="address-actions">
            <text v-if="a.is_default" class="status-tag">默认地址</text>
            <view v-else class="text-link" @tap.stop="makeDefault(a.id)">设为默认</view>
            <view class="spring"></view>
            <view v-if="selectMode" class="text-link">{{ mall.checkoutAddressId === a.id || (mall.checkoutAddressId === null && a.is_default) ? '本单已选' : '选择本单' }}</view>
            <view class="text-link" @tap.stop="goEdit(a.id)">编辑</view>
            <view class="text-link" @tap.stop="confirmDelete(a)">删除</view>
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
  </layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore, type Address } from '@/store/center';
import { useMallStore } from '@/store/mall';
import { getToken } from '@/utils/request';

const global = useGlobalStore();
const center = useCenterStore();
const mall = useMallStore();
const selectMode = ref(false);
const busy = ref(false);

onLoad((query) => { selectMode.value = query?.select === '1'; });

onShow(async () => {
  if (!(await global.ensureLogin({ target: selectMode.value ? '/pagesCenter/address/index?select=1' : '/pagesCenter/address/index' }))) return;
  await refresh();
});

/** 刷新地址列表。 */
async function refresh() {
  try { await center.loadAddresses(); } catch { /* 错误状态由 Store 展示 */ }
}

/** 拼接完整收货地址。 */
function addressText(a: Address) {
  return `${a.province} ${a.city} ${a.district} ${a.street}`;
}

/** 隐藏手机号中间四位。 */
function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}/, '$1****');
}

/** 打开新增或编辑地址页。 */
function goEdit(id?: number) {
  if (busy.value) return;
  uni.navigateTo({ url: id ? `/pagesCenter/addressEdit/index?id=${id}` : '/pagesCenter/addressEdit/index' });
}

/** 选用当前地址并返回结算页。 */
function chooseAddress(id: number) {
  if (!selectMode.value || busy.value || center.addressesLoading || center.addressesError || !center.addressesLoaded) return;
  mall.checkoutAddressId = id;
  uni.navigateBack();
}

/** 设置默认收货地址。 */
async function makeDefault(id: number) {
  if (busy.value) return;
  const token = getToken();
  busy.value = true;
  try {
    await center.setDefaultAddress(id);
    if (global.isLogin && token === getToken()) uni.showToast({ title: '已设为默认地址', icon: 'none' });
  } catch (error) {
    if (global.isLogin && token === getToken()) uni.showToast({ title: error instanceof Error ? error.message : '设置失败', icon: 'none' });
  } finally { busy.value = false; }
}

/** 确认后删除地址并清理结算选择。 */
function confirmDelete(a: Address) {
  if (busy.value) return;
  uni.showModal({
    title: '删除地址',
    content: `确认删除这个地址？${a.name} · ${addressText(a)}`,
    success: async (res) => {
      if (!res.confirm) return;
      const token = getToken();
      busy.value = true;
      try {
        await center.deleteAddress(a.id);
        // 退出登录后才返回的结果不再提示，也不改动结算选择。
        if (!global.isLogin || token !== getToken()) return;
        const wasSelected = mall.checkoutAddressId === a.id;
        if (wasSelected) {
          mall.checkoutAddressId = null;
          mall.quote = null;
        }
        uni.showToast({ title: wasSelected ? '地址已删除，请在结算页重新选择' : '地址已删除', icon: 'none' });
      } catch (error) {
        if (global.isLogin && token === getToken()) uni.showToast({ title: error instanceof Error ? error.message : '删除失败', icon: 'none' });
      } finally { busy.value = false; }
    },
  });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
