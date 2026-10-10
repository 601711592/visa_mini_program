<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="card-h">如何成为邀请好友</view>
        <view class="para">好友通过你分享的小程序卡片进入，并在本小程序首次完成手机号注册，即成为你的邀请好友。</view>
        <view class="para">每位好友只能被邀请一次；已经注册过的好友不能再成为邀请好友。</view>
        <view class="card-h">奖励如何计算</view>
        <view class="para">好友的首笔订单办理完成后，你获得与好友该笔订单相同数量的积分，自动发放到积分账户。好友之后的订单不再产生推荐奖励。</view>
        <view v-if="loaded" class="para">{{ rewardText }}</view>
        <view class="para">订单办理完成后才发放奖励，支付成功不立即发放。</view>
        <view v-if="error" class="hint" @tap="load">{{ error }} · 点击重试</view>
        <view class="hint">好友退款后的奖励处理规则随退款功能另行公布。</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { getInviteSummary, type InviteSummary } from '@/services/invite';

const global = useGlobalStore();
const rules = ref<InviteSummary['rules']>(null);
const loaded = ref(false);
const error = ref('');
let requestId = 0;
onUnload(() => { requestId++; });

// 奖励与好友本单的消费赠分相同，按后台实际配置展示，不写固定比例。
const rewardText = computed(() => {
  if (!rules.value || !rules.value.reward_bps) return '当前小程序未开启消费赠分，好友成交暂无积分奖励。';
  const basis = rules.value.reward_basis === 'paid' ? '实付金额' : '商品原价';
  return `按当前规则，好友订单每 1 元${basis}对应 ${rules.value.reward_bps / 10000} 积分，结果四舍五入至整数。`;
});

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/inviteRules/index' }))) return;
  await load();
});

/** 读取当前小程序的赠分规则。 */
async function load() {
  const current = ++requestId;
  error.value = '';
  try {
    const response = await getInviteSummary();
    if (current !== requestId) return;
    rules.value = response.data.rules;
    loaded.value = true;
  } catch (e) {
    if (current === requestId) error.value = e instanceof Error ? e.message : '奖励规则加载失败';
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';
</style>
