<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <template v-if="rows.length">
          <view v-for="row in rows" :key="row.id" class="ledger-row">
            <view class="invite-info">
              <text class="name">{{ row.phone_masked }}</text>
              <text class="note">{{ row.reward_revoked ? '首单已退款，奖励已扣回' : row.status === 'completed' ? '首单已办理完成' : '已注册，等待首单完成' }}</text>
              <text class="date">{{ row.joined_at }} 注册</text>
            </view>
            <text v-if="row.status === 'completed' && !row.reward_revoked" class="amount">+{{ row.reward_points }}</text>
          </view>
        </template>
        <view v-else-if="!loading && !error" class="empty-state">
          <image src="/static/images/center/users.png" mode="aspectFit" />
          <view class="empty-h">暂无邀请记录</view>
          <view class="empty-p">好友通过你的分享完成注册后，会显示在这里。</view>
        </view>
        <view v-if="error" class="empty-state">
          <view class="empty-p">{{ error }}</view>
          <view class="btn" @tap="retry">重新加载</view>
        </view>
        <view v-else-if="loading" class="empty-state"><view class="empty-p">正在加载邀请记录…</view></view>
        <view v-else-if="hasMore" class="btn" @tap="loadMore">加载更多</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { getInviteRecords, type InviteRecord } from '@/services/invite';

const global = useGlobalStore();
const rows = ref<InviteRecord[]>([]);
const loading = ref(false);
const error = ref('');
const hasMore = ref(false);
let page = 0;
let requestId = 0;
onUnload(() => { requestId++; });

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/inviteRecords/index' }))) return;
  await load(true);
});

/** 加载首页或下一页；失败保留已加载的记录，重试时请求同一页。 */
async function load(reset: boolean) {
  if (!reset && (loading.value || !hasMore.value)) return;
  const current = ++requestId;
  const target = reset ? 1 : page + 1;
  loading.value = true;
  error.value = '';
  try {
    const response = await getInviteRecords(target);
    if (current !== requestId || !global.isLogin) return;
    const next = response.data.data;
    rows.value = reset ? next : [...rows.value, ...next.filter((x) => !rows.value.some((row) => row.id === x.id))];
    page = target;
    hasMore.value = response.data.current_page < response.data.last_page;
  } catch (e) {
    if (current === requestId) error.value = e instanceof Error ? e.message : '邀请记录加载失败';
  } finally {
    if (current === requestId) loading.value = false;
  }
}
const loadMore = () => load(false);
const retry = () => load(page === 0);
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

// center.scss 的 ledger-row 以元素选择器排版，小程序 text 不命中，这里用类补齐。
.invite-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;

  .name {
    font-size: 28rpx;
    font-weight: 500;
    color: $text;
  }

  .note {
    font-size: 24rpx;
    color: $body;
  }

  .date {
    font-size: 22rpx;
    color: $muted;
  }
}

.amount {
  flex: none;
  font-size: 36rpx;
  color: $brand-ink;
}
</style>
