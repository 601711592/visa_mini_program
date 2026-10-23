<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view v-if="loading && !order" class="sheet-card">正在加载订单…</view>
        <view v-else-if="loadError && !order" class="sheet-card">
          <view>{{ loadError }}</view>
          <view class="text-link" @tap="load">重试</view>
        </view>
        <view v-else-if="order && !order.canRefund" class="sheet-card empty-state">
          <view class="empty-h">无法申请退款</view>
          <view class="empty-p">{{ order.refundBlockedReason || '当前订单不能申请退款' }}</view>
          <view class="btn solid full" @tap="back">返回订单</view>
        </view>
        <template v-else-if="order">
          <view class="sheet-card">
            <view class="card-title">整单退款申请</view>
            <view v-for="(item, index) in order.items" :key="index" class="kv">
              <text>{{ item.goodsName }}</text>
              <text>{{ item.qty }} 人</text>
            </view>
            <view class="kv"><text>订单编号</text><text>{{ order.id }}</text></view>
            <view class="kv"><text>申请金额</text><text class="refund-amount">¥{{ money(order.due) }}</text></view>
            <view class="hint">提交后由商家审核，审核通过后原路退回实付金额。{{ returnsText }}</view>
          </view>
          <view class="sheet-card form-card">
            <view class="field">
              <text>退款原因</text>
              <view class="reason-list">
                <view
                  v-for="item in reasons"
                  :key="item"
                  class="reason"
                  :class="{ selected: reason === item }"
                  @tap="reason = item"
                >
                  {{ item }}
                </view>
              </view>
            </view>
            <view class="field">
              <text>补充说明（选填）</text>
              <textarea v-model="note" :maxlength="300" placeholder="请补充说明退款原因" />
              <text class="counter">{{ note.length }}/300</text>
            </view>
            <view class="btn solid full" :class="{ disabled: submitting }" @tap="submit">{{ submitting ? '提交中…' : '提交申请' }}</view>
          </view>
        </template>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

// 与服务端校验的选项一致。
const reasons = ['出行计划变更', '重复下单', '其他原因'];
const orderId = ref('');
const reason = ref('');
const note = ref('');
const loading = ref(false);
const loadError = ref('');
const submitting = ref(false);
// 同一份原因和说明复用提交键，网络超时后的重试不会生成第二笔申请。
let idempotencyKey = '';
let submissionFingerprint = '';

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesOrder/orderRefund/index?id=${orderId.value}` }))) return;
  await load();
});

const order = computed(() => center.findOrder(orderId.value));

const returnsText = computed(() => {
  if (!order.value) return '';
  const parts: string[] = [];
  if (order.value.points > 0) parts.push(`${order.value.points} 积分`);
  if (order.value.coupon > 0) parts.push('优惠券');
  const returned = parts.length ? `本单使用的${parts.join('和')}将同时退回，` : '';
  return `${returned}本单赠送的积分将扣回。`;
});

/** 读取最新订单，以服务端的可申请判断为准。 */
async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    await center.loadOrder(orderId.value);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '订单加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

/** 将金额格式化为两位小数。 */
const money = (n: number) => Number(n).toFixed(2);

/** 提交退款申请，成功后进入订单详情查看审核进度。 */
async function submit() {
  if (submitting.value || !order.value) return;
  if (!reason.value) {
    uni.showToast({ title: '请选择退款原因', icon: 'none' });
    return;
  }
  const data = { reason: reason.value, note: note.value.trim() };
  const fingerprint = JSON.stringify(data);
  if (submissionFingerprint !== fingerprint) {
    idempotencyKey = `refund-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    submissionFingerprint = fingerprint;
  }
  submitting.value = true;
  try {
    await center.applyRefund(orderId.value, { ...data, idempotency_key: idempotencyKey });
    uni.showToast({ title: '已提交退款申请', icon: 'none' });
    uni.redirectTo({ url: `/pagesOrder/orderDetail/index?id=${orderId.value}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '提交失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

/** 返回订单页面。 */
function back() {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pagesOrder/orders/index' }) });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text;
  margin-bottom: 20rpx;
}

.refund-amount {
  font-weight: 600;
  color: $text;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.reason {
  padding: 16rpx 28rpx;
  border: 1rpx solid #ccd5e2;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: $body;
  background: #fafbfd;

  &.selected {
    border-color: $brand-ink;
    color: $brand-ink;
    background: $brand-soft;
  }
}

.counter {
  align-self: flex-end;
  font-size: 22rpx;
  color: $muted;
}

.btn.disabled {
  opacity: 0.6;
}
</style>
