<template>
  <MallPage footer><view class="mx-body"><view v-if="selecting" class="mx-hint">请选择本次订单的邮寄地址。</view><view v-for="address in mall.data.addresses" :key="address.id" class="mx-card" @tap="select(address.id)"><view class="mx-between"><view class="mx-subtitle">{{ address.name }}　{{ masked(address.phone) }}</view><text v-if="address.isDefault" class="mx-badge">默认</text></view><view class="mx-hint">{{ address.region.join(' ') }} {{ address.detail }}</view><view class="mx-actions"><button class="mx-button mx-plain" :disabled="address.isDefault" @tap.stop="setDefault(address)">设为默认</button><button class="mx-button mx-outline" @tap.stop="go('addressEdit', { id: address.id })">编辑</button><button class="mx-button mx-danger" @tap.stop="remove(address.id)">删除</button></view></view><view v-if="!mall.data.addresses.length" class="mx-empty"><MallIcon name="address" :size="100" /><view class="mx-title">还没有收货地址</view><view class="mx-muted">添加用于护照或材料邮寄的地址</view></view></view><template #footer><button class="mx-button mx-wide" @tap="go('addressEdit')">新增收货地址</button></template></MallPage>
</template>
<script setup lang="ts">
import { ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';import { saveAddress, deleteAddress, type Address } from '@/mall/model';
import { go, back, attempt, confirm } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';import MallIcon from '@/components/mall/MallIcon.vue';
const mall = useMallPreviewStore(), selecting = ref(false);
onLoad(options => { selecting.value = options?.select === '1'; });
function masked(phone: string) { return phone.slice(0, 3) + '****' + phone.slice(-4); }
function setDefault(address: Address) { attempt(() => saveAddress(mall.data, { ...address, isDefault: true })); }
function remove(id: string) { confirm('删除地址', '确定删除此收货地址？已提交订单的地址快照不会被改变。', () => deleteAddress(mall.data, id)); }
function select(id: string) {
  if (!selecting.value || !mall.data.member) return;
  const draft = mall.data.draft;
  if (!draft || mall.data.submitted[draft.id]) { uni.showToast({ title: '结算单已变化，请返回确认订单', icon: 'none' }); return; }
  draft.addressId = id; back();
}
</script>
