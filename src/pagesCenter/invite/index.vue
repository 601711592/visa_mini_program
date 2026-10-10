<template>
  <view class="center-page">
    <view class="balance-hero">
      <text>与好友分享出行服务</text>
      <view class="hero-h2">邀请好友</view>
      <view class="hero-p">好友首单办理完成后，你获得同等积分</view>
    </view>
    <view class="page-body">
      <view class="sheet-card">
        <view class="invite-metrics">
          <view>
            <text class="metric-value">{{ summary ? summary.invited_count : '—' }}</text>
            <text>已邀请好友</text>
          </view>
          <view>
            <text class="metric-value">{{ summary ? summary.reward_points : '—' }}</text>
            <text>推荐奖励积分</text>
          </view>
        </view>
        <view v-if="error" class="hint" @tap="load">{{ error }} · 点击重试</view>
        <view v-else-if="summary" class="hint">{{ summary.completed_count }} 位好友已成交</view>
        <view v-else class="hint">正在读取邀请信息…</view>
        <view class="btn solid full" @tap="go('/pagesCenter/inviteShare/index')">去邀请好友</view>
      </view>
      <view class="sheet-card">
        <view class="menu-row" @tap="go('/pagesCenter/inviteRecords/index')">
          <image src="/static/images/center/users.png" mode="aspectFit" />
          <text>邀请记录</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="menu-row" @tap="go('/pagesCenter/inviteRules/index')">
          <image src="/static/images/center/file-text.png" mode="aspectFit" />
          <text>奖励规则</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { getInviteSummary, type InviteSummary } from '@/services/invite';

const global = useGlobalStore();
const summary = ref<InviteSummary | null>(null);
const error = ref('');
let requestId = 0;
onUnload(() => { requestId++; });

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/invite/index' }))) return;
  await load();
});

/** 读取邀请统计；离开页面或退出登录后的迟到结果不再显示。 */
async function load() {
  const current = ++requestId;
  error.value = '';
  try {
    const response = await getInviteSummary();
    if (current === requestId && global.isLogin) summary.value = response.data;
  } catch (e) {
    if (current === requestId) error.value = e instanceof Error ? e.message : '邀请信息加载失败';
  }
}

function go(url: string) {
  uni.navigateTo({ url });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.sheet-card .btn {
  margin-top: 20rpx;
}
</style>
