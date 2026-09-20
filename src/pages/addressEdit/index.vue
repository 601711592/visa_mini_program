<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card form-card">
        <view class="field">
          <text>收件人</text>
          <input v-model="name" :maxlength="30" placeholder="请输入收件人姓名" />
        </view>
        <view class="field">
          <text>手机号码</text>
          <input v-model="phone" type="number" :maxlength="11" placeholder="请输入 11 位手机号" />
        </view>
        <view class="field">
          <text>所在地区</text>
          <input v-model="region" :maxlength="80" placeholder="省 / 市 / 区" />
        </view>
        <view class="field">
          <text>详细地址</text>
          <textarea v-model="street" :maxlength="160" placeholder="街道、楼栋与门牌号" />
        </view>
        <view class="check-row">
          <switch :checked="isDefault" color="#164E70" @change="onDefaultChange" />
          <text>设为默认地址</text>
        </view>
        <view class="btn solid full" @tap="save">保存地址</view>
        <view class="hint">仅在本次会话中保存，接口接入后同步到服务端；正式版本使用原生地区选择器。</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const editingId = ref<number | undefined>(undefined);
const name = ref('');
const phone = ref('');
const region = ref('');
const street = ref('');
const isDefault = ref(false);

onLoad((query) => {
  const id = Number(query?.id) || undefined;
  editingId.value = id;
  const existing = id ? center.addresses.find((a) => a.id === id) : undefined;
  if (existing) {
    name.value = existing.name;
    phone.value = existing.phone;
    region.value = existing.region;
    street.value = existing.street;
    isDefault.value = existing.default;
  }
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pages/addressEdit/index' }))) return;
});

function onDefaultChange(e: { detail: { value: boolean } }) {
  isDefault.value = e.detail.value;
}

function save() {
  if (!name.value.trim() || !region.value.trim() || !street.value.trim()) {
    uni.showToast({ title: '请完整填写收件人和地址。', icon: 'none' });
    return;
  }
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入有效的 11 位手机号。', icon: 'none' });
    return;
  }
  center.saveAddress({
    id: editingId.value,
    name: name.value.trim(),
    phone: phone.value,
    region: region.value.trim(),
    street: street.value.trim(),
    default: isDefault.value,
  });
  uni.showToast({ title: '地址已保存，本次会话有效（模拟）', icon: 'none' });
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
