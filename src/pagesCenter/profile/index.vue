<template>
  <view class="center-page">
    <view class="page-body">
      <view class="sheet-card form-card">
        <view class="profile-edit">
          <view class="avatar">
            <image v-if="avatarUrl" :src="avatarUrl" mode="aspectFill" class="avatar-img" />
            <image v-else src="/static/images/center/user-round.png" mode="aspectFit" class="avatar-placeholder" />
          </view>
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">更换头像</button>
        </view>
        <view class="field">
          <text>昵称（选填）</text>
          <input v-model="nickname" type="nickname" :maxlength="20" placeholder="填写昵称" />
        </view>
        <view class="kv">
          <text>手机号码</text>
          <text>{{ global.userInfo?.phone_masked }}</text>
        </view>
        <view class="hint">头像、昵称自愿完善，不影响下单。保存仅本次会话生效，同步接口待接入。</view>
        <view class="btn solid full" @tap="save">保存资料</view>
      </view>
      <view class="sheet-card">
        <view class="menu-row" @tap="openPrivacyContract">
          <text>隐私保护指引</text>
          <image src="/static/images/center/chevron-right.png" mode="aspectFit" />
        </view>
      </view>
      <view class="btn outline full" @tap="confirmLogout">退出登录</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { openPrivacyContract } from '@/utils/wechat-privacy';

const global = useGlobalStore();

const nickname = ref('');
const chosenAvatar = ref('');
let initialized = false;

const avatarUrl = computed(() => chosenAvatar.value || global.userInfo?.avatar || '');

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/profile/index' }))) return;
  if (!initialized) {
    nickname.value = global.userInfo?.nickname || '';
    initialized = true;
  }
});

function onChooseAvatar(e: any) {
  chosenAvatar.value = e.detail?.avatarUrl || '';
}

function save() {
  const patch: { nickname: string; avatar?: string } = {
    nickname: nickname.value.trim() || '微信用户',
  };
  if (chosenAvatar.value) patch.avatar = chosenAvatar.value;
  global.updateProfileLocal(patch);
  uni.showToast({ title: '个人资料已保存（本次会话生效）', icon: 'none' });
}

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '退出后将清理本机出行人、地址和联系电话草稿，商品选择会保留。',
    success: async (res) => {
      if (!res.confirm) return;
      await global.logout();
      uni.navigateBack();
    },
  });
}
</script>

<style scoped lang="scss">
@import '@/styles/center.scss';

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .avatar-img {
    width: 120rpx;
    height: 120rpx;
  }

  .avatar-placeholder {
    width: 60rpx;
    height: 60rpx;
  }
}

.avatar-btn {
  margin: 0;
  padding: 0;
  background: none;
  color: $brand-ink;
  font-size: 25rpx;
  line-height: 1.6;
  min-height: 88rpx;
  display: inline-flex;
  align-items: center;

  &::after {
    border: 0;
  }
}
</style>
