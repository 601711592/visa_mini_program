<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card">
        <view class="card-h">邀请方式</view>
        <view class="para">把小程序分享给微信好友或群聊。好友通过你的分享卡片进入并完成注册，就会成为你的邀请好友。</view>
        <button class="btn solid full share-btn" open-type="share" :disabled="!code">
          <image src="/static/images/center/send.png" mode="aspectFit" />
          <text>{{ code ? '分享给微信好友' : '正在准备分享…' }}</text>
        </button>
        <view v-if="error" class="hint" @tap="load">{{ error }} · 点击重试</view>
        <view v-else class="hint">已经注册过的好友不会成为邀请好友，每位好友只能被邀请一次。</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow, onUnload, onShareAppMessage } from '@dcloudio/uni-app';
import { HOME_PAGE, useGlobalStore } from '@/store/global';
import { getInviteSummary } from '@/services/invite';
import { INVITE_QUERY } from '@/utils/invite';

const global = useGlobalStore();
const code = ref('');
const error = ref('');
let requestId = 0;
onUnload(() => { requestId++; });

// 邀请码未就绪时分享的是普通首页，不会建立邀请关系。
const sharePath = computed(() => (code.value ? `${HOME_PAGE}?${INVITE_QUERY}=${code.value}` : HOME_PAGE));
onShareAppMessage(() => ({
  title: '我在这里办签证，推荐给你',
  path: sharePath.value,
  imageUrl: '/static/images/center/invite-share-cover.png',
}));

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/inviteShare/index' }))) return;
  await load();
});

/** 读取当前会员的邀请码。 */
async function load() {
  const current = ++requestId;
  error.value = '';
  try {
    const response = await getInviteSummary();
    if (current === requestId && global.isLogin) code.value = response.data.invite_code;
  } catch (e) {
    if (current === requestId) error.value = e instanceof Error ? e.message : '邀请码加载失败';
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.btn image {
  width: 30rpx;
  height: 30rpx;
}

// 原生 button 自带外边距和行高，对齐页面内其他按钮。
.share-btn {
  margin: 0;
  line-height: 1.4;
}
</style>
