<template>
  <view class="center-page">
    <view v-if="eligible" class="page-body">
      <view class="sheet-card">
        <view class="card-title">整单退款申请</view>
        <view class="kv">
          <text>申请金额</text>
          <text>¥{{ money(order?.due ?? 0) }}</text>
        </view>
        <view class="hint">提交后由商家审核，退款成功后返还已使用积分及优惠券。</view>
      </view>
      <view class="sheet-card form-card">
        <view class="field">
          <text>退款原因</text>
          <picker mode="selector" :range="reasons" :value="reasonIndex" @change="onReasonChange">
            <view class="picker-input" :class="{ placeholder: reasonIndex < 0 }">
              {{ reasonIndex < 0 ? '请选择退款原因' : reasons[reasonIndex] }}
            </view>
          </picker>
        </view>
        <view class="field">
          <text>补充说明</text>
          <textarea
            v-model="note"
            class="note-input"
            :maxlength="300"
            placeholder="请补充说明退款原因（选填）"
          />
        </view>
        <view class="btn solid full submit-btn" @tap="submit">提交申请（模拟）</view>
      </view>
      <view class="hint page-hint">超半年在线申请限制及期限起算点待业务确认；本页演示近期订单。</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { useCenterStore } from '@/store/center';

const global = useGlobalStore();
const center = useCenterStore();

const orderId = ref('');
const reasons = ['出行计划变更', '重复下单', '其他原因'];
const reasonIndex = ref(-1);
const note = ref('');

onLoad((query) => {
  orderId.value = query?.id || '';
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: `/pagesOrder/orderRefund/index?id=${orderId.value}` }))) return;
  if (!eligible.value) {
    uni.showToast({ title: '当前订单状态不支持申请退款', icon: 'none' });
    setTimeout(() => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pagesOrder/orders/index' }) }), 800);
  }
});

const order = computed(() => center.findOrder(orderId.value));
const eligible = computed(() => !!order.value && ['办理中', '已完成'].includes(order.value.state));

const money = (n: number) => Number(n).toFixed(2);

function onReasonChange(e: { detail: { value: string | number } }) {
  reasonIndex.value = Number(e.detail.value);
}

function submit() {
  if (reasonIndex.value < 0) {
    uni.showToast({ title: '请选择退款原因', icon: 'none' });
    return;
  }
  center.mockRefund(orderId.value, reasons[reasonIndex.value], note.value.trim());
  uni.showToast({ title: '退款申请已提交，等待商家审核（模拟）', icon: 'none' });
  setTimeout(() => uni.navigateBack(), 800);
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

  .note-input {
    height: 220rpx;
  }

  .submit-btn {
    margin-top: 4rpx;
  }
}

.page-hint {
  margin-top: 4rpx;
}
</style>
