<template>
  <layout :navbar="{ title: editingId ? '编辑收货地址' : '新增收货地址', leftBack: true, backgroundColor: '#8AD0F9', fixed: true }">
  <view class="center-page">
    <view class="page-body">
      <view v-if="loading" class="sheet-card">正在加载地址…</view>
      <view v-else-if="loadError" class="sheet-card">
        <view>{{ loadError }}</view>
        <view class="text-link" @tap="loadExisting">重试</view>
      </view>
      <view v-else class="sheet-card form-card">
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
          <picker mode="region" :value="regionValue" @change="onRegionChange">
            <view class="region-picker" :class="{ 'region-placeholder': !district }">{{ district ? regionValue.join(' ') : '请选择省 / 市 / 区' }}</view>
          </picker>
        </view>
        <view class="field">
          <text>详细地址</text>
          <textarea v-model="street" :maxlength="160" placeholder="街道、楼栋与门牌号" />
        </view>
        <view class="check-row">
          <switch :checked="isDefault" :disabled="currentDefault" color="#164E70" @change="onDefaultChange" />
          <text>设为默认地址</text>
        </view>
        <view class="btn solid full" @tap="save">{{ saving ? '保存中…' : '保存地址' }}</view>
      </view>
    </view>
  </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';
import { getToken } from '@/utils/request';

const global = useGlobalStore();
const center = useCenterStore();

const editingId = ref<number | undefined>(undefined);
const name = ref('');
const phone = ref('');
const province = ref('');
const city = ref('');
const district = ref('');
const street = ref('');
const isDefault = ref(false);
const currentDefault = ref(false);
const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const invalidId = ref(false);
const regionValue = computed(() => [province.value, city.value, district.value]);

onLoad((query) => {
  if (query?.id !== undefined) {
    const id = Number(query.id);
    invalidId.value = !Number.isSafeInteger(id) || id <= 0;
    editingId.value = invalidId.value ? undefined : id;
  }
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: editingId.value ? `/pagesCenter/addressEdit/index?id=${editingId.value}` : '/pagesCenter/addressEdit/index' }))) return;
  await loadExisting();
});

/** 加载待编辑地址，新建时设置默认值。 */
async function loadExisting() {
  if (invalidId.value) {
    loadError.value = '地址编号无效';
    return;
  }
  loading.value = true;
  loadError.value = '';
  try {
    await center.loadAddresses();
    if (!global.isLogin) return;
    const existing = editingId.value ? center.addresses.find((a) => a.id === editingId.value) : undefined;
    if (editingId.value && !existing) {
      loadError.value = '地址不存在或已删除';
      return;
    }
    if (existing) {
      name.value = existing.name;
      phone.value = existing.phone;
      province.value = existing.province;
      city.value = existing.city;
      district.value = existing.district;
      street.value = existing.street;
      currentDefault.value = existing.is_default;
      isDefault.value = existing.is_default;
    } else {
      isDefault.value = center.addresses.length === 0;
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '地址加载失败，请重试';
  } finally { loading.value = false; }
}

/** 更新选择的省市区。 */
function onRegionChange(e: { detail: { value: string[] } }) {
  const values = e.detail.value;
  if (!Array.isArray(values) || values.length < 3 || values.some((v) => !v)) return;
  [province.value, city.value, district.value] = values;
}

/** 更新是否设为默认地址。 */
function onDefaultChange(e: { detail: { value: boolean } }) {
  isDefault.value = e.detail.value;
}

/** 校验并保存收货地址。 */
async function save() {
  if (saving.value || loading.value || loadError.value) return;
  if (!name.value.trim() || !province.value || !city.value || !district.value || !street.value.trim()) {
    uni.showToast({ title: '请完整填写收件人和地址', icon: 'none' });
    return;
  }
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入有效的 11 位手机号。', icon: 'none' });
    return;
  }
  saving.value = true;
  const token = getToken();
  try {
    await center.saveAddress({
      id: editingId.value,
      name: name.value.trim(),
      phone: phone.value,
      province: province.value,
      city: city.value,
      district: district.value,
      street: street.value.trim(),
      is_default: isDefault.value,
    });
    if (global.isLogin && token === getToken()) {
      uni.showToast({ title: '地址已保存', icon: 'none' });
      uni.navigateBack();
    }
  } catch (error) {
    if (global.isLogin && token === getToken()) uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
.region-picker { box-sizing: border-box; min-height: 88rpx; padding: 22rpx 20rpx; border: 1rpx solid #ccd5e2; border-radius: 12rpx; background: #fafbfd; color: #202631; font-size: 28rpx; }
.region-placeholder { color: #999; }
</style>
