<template>
  <view class="center-page">
    <view v-if="row" class="page-body">
      <view class="sheet-card">
        <view class="order-product">
          <image v-if="row.cover" class="cover-img" :src="row.cover" mode="aspectFill" />
          <view v-else class="product-symbol">
            <image src="/static/images/center/book-open.png" />
          </view>
          <view class="product-info">
            <text class="product-name">{{ row.goodsName }}</text>
            <text class="product-meta">{{ row.packTitle }} · {{ row.personName }} · {{ row.date }}</text>
          </view>
        </view>
        <view class="hint">仅填写此商品的 {{ row.qty }} 位出行人，信息须与护照一致。</view>
      </view>
      <view v-for="(t, i) in list" :key="i" class="sheet-card form-card">
        <view class="card-h">本商品出行人 {{ i + 1 }}</view>
        <view class="field">
          <text>中文姓名</text>
          <input v-model="t.name" placeholder="请输入姓名" />
        </view>
        <view class="field">
          <text>护照号码</text>
          <input v-model="t.passport" :maxlength="20" placeholder="请输入护照号码" />
        </view>
        <view class="field">
          <text>出生日期</text>
          <picker mode="date" :value="t.birthday" :end="today" @change="onBirthdayChange(i, $event)">
            <view class="picker-input" :class="{ placeholder: !t.birthday }">
              {{ t.birthday || '请选择出生日期' }}
            </view>
          </picker>
        </view>
      </view>
      <view v-if="row" class="btn solid full save-btn" @tap="save">保存此商品出行人</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useMallStore, type Traveller } from '@/store/mall';

const global = useGlobalStore();
const mall = useMallStore();

const key = ref('');
const list = ref<Traveller[]>([]);

const today = (() => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const row = computed(() => mall.checkoutRows.find((x) => x.key === key.value));

onLoad((query) => {
  key.value = decodeURIComponent(query?.key || '');
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesMall/travellers/index?key=${encodeURIComponent(key.value)}` }))) return;
  const item = row.value;
  if (!item) {
    uni.showToast({ title: '结算信息已失效', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 800);
    return;
  }
  const saved = mall.travellersOf(item.key);
  list.value = Array.from({ length: item.qty }, (_, i) => ({
    name: saved[i]?.name || '',
    passport: saved[i]?.passport || '',
    birthday: saved[i]?.birthday || '',
  }));
});

function onBirthdayChange(index: number, e: { detail: { value: string } }) {
  const t = list.value[index];
  if (t) t.birthday = e.detail.value;
}

function save() {
  if (!row.value) return;
  for (let i = 0; i < list.value.length; i++) {
    const t = list.value[i];
    const label = `请填写第 ${i + 1} 位出行人的`;
    if (!t.name.trim()) {
      uni.showToast({ title: `${label}姓名`, icon: 'none' });
      return;
    }
    if (!t.passport.trim()) {
      uni.showToast({ title: `${label}护照号码`, icon: 'none' });
      return;
    }
    if (!t.birthday) {
      uni.showToast({ title: `${label}出生日期`, icon: 'none' });
      return;
    }
  }
  mall.setTravellers(
    row.value.key,
    list.value.map((t) => ({ name: t.name.trim(), passport: t.passport.trim(), birthday: t.birthday })),
  );
  uni.showToast({ title: '已保存', icon: 'none' });
  setTimeout(() => uni.navigateBack(), 800);
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.order-product {
  .cover-img {
    flex: none;
    width: 112rpx;
    height: 128rpx;
    border-radius: 14rpx;
    background: $brand-soft;
  }

  .product-info {
    flex: 1;
    min-width: 0;
  }
}

.form-card {
  .picker-input {
    font-size: 28rpx;
    width: 100%;
    border: 1rpx solid #ccd5e2;
    border-radius: 12rpx;
    padding: 22rpx 20rpx;
    min-height: 88rpx;
    background: #fafbfd;
    color: $text;
    box-sizing: border-box;

    &.placeholder {
      color: $muted;
    }
  }
}

.save-btn {
  margin-top: 4rpx;
}
</style>
