<template>
  <layout :show-navbar="false">
    <view class="center-page">
      <view class="page-body">
        <view class="sheet-card form-card">
          <form @submit="save">
            <view class="profile-edit">
              <view class="avatar">
                <image v-if="avatarUrl" :src="avatarUrl" mode="aspectFill" class="avatar-img" />
                <image v-else src="/static/images/center/user-round.png" mode="aspectFit" class="avatar-placeholder" />
              </view>
              <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">更换头像</button>
            </view>
            <view class="field">
              <text>昵称（选填）</text>
              <input v-model="nickname" name="nickname" type="nickname" :maxlength="20" placeholder="填写昵称" />
            </view>
            <view class="kv">
              <text>手机号码</text>
              <text>{{ global.userInfo?.phone_masked }}</text>
            </view>
            <view class="hint">头像、昵称自愿完善，不影响下单；头像图片不超过 2MB。</view>
            <button class="btn solid full save-btn" form-type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存资料' }}</button>
          </form>
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
  </layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/global';
import { AVATAR_MAX_BYTES } from '@/services/mine';
import { getToken } from '@/utils/request';
import { openPrivacyContract } from '@/utils/wechat-privacy';

const global = useGlobalStore();

const nickname = ref('');
// 新选择、尚未上传的头像本地路径；保存成功后清空，改用后端返回的地址显示。
const chosenAvatar = ref('');
const saving = ref(false);
let initialized = false;

const avatarUrl = computed(() => chosenAvatar.value || global.userInfo?.avatar || '');

onShow(async () => {
  if (!(await global.ensureLogin({ target: '/pagesCenter/profile/index' }))) return;
  if (!initialized) {
    nickname.value = global.userInfo?.nickname || '';
    initialized = true;
  }
});

/** 选择头像后先压缩再在本机预览，保存时才上传；压缩失败时沿用原图。 */
function onChooseAvatar(e: { detail?: { avatarUrl?: string } }) {
  const path = e.detail?.avatarUrl || '';
  if (!path) return;
  uni.compressImage({
    src: path,
    quality: 80,
    compressedWidth: 400,
    success: (res) => useAvatar(res.tempFilePath || path),
    fail: () => useAvatar(path),
  });
}

/** 超过大小上限的图片不采用；读不到大小时交由后端校验。 */
function useAvatar(path: string) {
  uni.getFileInfo({
    filePath: path,
    success: (res) => {
      if (res.size > AVATAR_MAX_BYTES) {
        uni.showToast({ title: '头像图片不能超过 2MB', icon: 'none' });
        return;
      }
      chosenAvatar.value = path;
    },
    fail: () => {
      chosenAvatar.value = path;
    },
  });
}

/** 保存资料：昵称以表单提交值为准（微信会在失焦后清空未通过安全检测的昵称），有新头像时一并上传。 */
async function save(e: { detail: { value: { nickname?: string } } }) {
  if (saving.value) return;
  const token = getToken();
  saving.value = true;
  try {
    await global.saveProfile({
      nickname: (e.detail.value.nickname ?? nickname.value).trim(),
      avatarPath: chosenAvatar.value || undefined,
    });
    chosenAvatar.value = '';
    nickname.value = global.userInfo?.nickname ?? nickname.value;
    uni.showToast({ title: '个人资料已保存', icon: 'success' });
  } catch (error) {
    if (global.isLogin && token === getToken()) uni.showToast({ title: error instanceof Error ? error.message : '保存失败，请重试', icon: 'none' });
  } finally {
    saving.value = false;
  }
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

.save-btn {
  margin: 0;
  line-height: 1.4;
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
