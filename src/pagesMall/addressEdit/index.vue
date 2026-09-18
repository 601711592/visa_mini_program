<template>
  <MallPage><view class="mx-body"><view class="mx-card"><view class="mx-field"><text class="mx-field-title">收件人</text><input v-model="form.name" class="mx-input" placeholder="请输入收件人姓名" :maxlength="40" /></view><view class="mx-field"><text class="mx-field-title">手机号</text><input v-model="form.phone" class="mx-input" type="number" placeholder="请输入 11 位手机号" :maxlength="11" /></view><view class="mx-field"><text class="mx-field-title">所在地区</text><view class="region-inputs"><input v-model="province" class="mx-input" placeholder="省／直辖市" :maxlength="30" /><input v-model="city" class="mx-input" placeholder="城市" :maxlength="30" /><input v-model="district" class="mx-input" placeholder="区／县" :maxlength="30" /></view></view><view class="mx-field"><text class="mx-field-title">详细地址</text><textarea v-model="form.detail" class="mx-textarea" placeholder="街道、小区、楼栋、门牌号" :maxlength="200" /></view><view class="mx-row"><text>设为默认地址</text><switch :checked="form.isDefault" color="#164E70" @change="form.isDefault = $event.detail.value" /></view></view><view v-if="error" class="mx-error" role="alert">{{ error }}</view><button class="mx-button mx-wide" @tap="save">保存地址</button></view></MallPage>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';import { clone, saveAddress, type Address } from '@/mall/model';import { back } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
const mall = useMallPreviewStore(), id = ref(''), error = ref('');
const empty = (): Address => ({ id: '', name: '', phone: '', region: [], detail: '', isDefault: false });
const form = ref<Address>(empty()), province = ref(''), city = ref(''), district = ref('');
function clear() { form.value = empty(); province.value = ''; city.value = ''; district.value = ''; }
watch(() => [id.value, mall.data.member], () => {
  clear(); if (!mall.data.member) return;
  const address = mall.data.addresses.find(item => item.id === id.value);
  if (address) { form.value = clone(address); [province.value, city.value, district.value] = [address.region[0] || '', address.region[1] || '', address.region[2] || '']; }
  else if (id.value) error.value = '地址已不存在，请返回列表';
}, { immediate: true });
onLoad(options => { id.value = String(options?.id || ''); uni.setNavigationBarTitle({ title: id.value ? '编辑收货地址' : '新增收货地址' }); });
onUnload(clear);
function save() { try {
  if (id.value && !mall.data.addresses.some(item => item.id === id.value)) throw new Error('地址已不存在，请返回列表');
  if (!province.value.trim() || !city.value.trim() || !district.value.trim()) throw new Error('请完整填写省市区');
  saveAddress(mall.data, { ...form.value, region: [province.value.trim(), city.value.trim(), district.value.trim()] }); back();
} catch (e) { error.value = e instanceof Error ? e.message : '保存失败'; } }
</script>
<style scoped>.region-inputs { display: flex; flex-wrap: wrap; }.region-inputs input { flex: 1; min-width: 160rpx; padding-right: 12rpx; box-sizing: border-box; }</style>
