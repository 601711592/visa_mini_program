<template>
  <view class="login-page">
    <image class="illustration" src="/static/images/login-travel.png" mode="aspectFit" aria-hidden="true" />
    <view class="actions">
      <button
        v-if="consent && supported"
        class="primary"
        open-type="getPhoneNumber"
        :disabled="busy"
        :loading="busy"
        @getphonenumber="handlePhone"
      >
        手机号快捷登录
      </button>
      <button v-else class="primary" @tap="explainRequired">手机号快捷登录</button>

      <view class="consent-row">
        <checkbox-group @change="changeConsent">
          <label class="checkbox-label">
            <checkbox value="agree" :checked="consent" color="#164E70" :disabled="busy" />
            <text>我已阅读并同意</text>
          </label>
        </checkbox-group>
        <button class="agreement-link" @tap="readAgreement('service')">《用户服务协议》</button>
        <text>和</text>
        <button class="agreement-link" @tap="readAgreement('privacy')">《隐私保护指引》</button>
      </view>

      <text v-if="error" class="error" role="alert">{{ error }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { LOGIN_AGREEMENT_VERSION, type LoginAgreementKind } from '@/content/login-agreements';
import { useGlobalStore } from '@/store/global';
const global = useGlobalStore();
const consent = ref(false);
const supported = ref(false);
const busy = ref(false);
const error = ref('');
let alive = true;
// 不注册隐私授权监听，由微信在需要时展示官方默认弹窗。
onLoad(() => {
  global.loginOpen = true;
  // #ifdef MP-WEIXIN
  supported.value = uni.canIUse('button.open-type.getPhoneNumber');
  // #endif
});
// 页面卸载后取消未完成登录，不再接收或处理微信隐私回调。
onUnload(() => {
  alive = false;
  if (global.loginOpen) {
    global.cancelLogin();
  }
});
/** 只记录本次页面的主动勾选，不默认代用户同意。 */
function changeConsent(event: { detail: { value: string[] } }) {
  consent.value = event.detail.value.includes('agree');
}
/** 条件不满足时只提示，不发起手机号获取。 */
function explainRequired() {
  error.value = !supported.value ? '请在最新版微信小程序中使用手机号登录' : '请先阅读并勾选同意协议';
}
/** 阅读本地协议，返回后保留当前勾选状态。 */
function readAgreement(kind: LoginAgreementKind = 'service') {
  uni.navigateTo({ url: `/pages/service-agreement/index?kind=${kind}` });
}
/** 拿到手机号 code 后发起业务登录，卸载后不再更新页面或跳转。 */
async function handlePhone(event: { detail: { code?: string; errMsg?: string } }) {
  if (busy.value || !alive) {
    return;
  }
  if (!consent.value) {
    explainRequired();
    return;
  }
  if (!event.detail.code) {
    error.value = '手机号授权未完成，可继续浏览或主动重试';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const success = await global.completePhoneLogin(event.detail.code, LOGIN_AGREEMENT_VERSION);
    if (success && alive) {
      global.finishLogin();
    }
  } catch (e) {
    if (!alive) {
      return;
    }
    error.value = e instanceof Error ? e.message : '登录失败，请重试';
  } finally {
    if (alive) {
      busy.value = false;
    }
  }
}
</script>
<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 100rpx 48rpx 48rpx;
  background: #fff;
  color: #495566;
}

.illustration {
  display: block;
  width: 480rpx;
  height: 320rpx;
  margin: 32rpx auto 88rpx;
}

.actions {
  max-width: 654rpx;
  margin: auto;
}

button::after {
  border: 0;
}

.primary {
  background: #8AD0F9;
  color: #164E70;
  border-radius: 48rpx;
  min-height: 96rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1.4;
}

.primary[disabled] {
  background: #EAF6FD;
  color: #737D8C;
}

.consent-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin: 16rpx 0;
  font-size: 24rpx;
}

.checkbox-label {
  min-height: 88rpx;
  display: flex;
  align-items: center;
}

.agreement-link {
  display: inline-flex;
  align-items: center;
  min-height: 88rpx;
  background: transparent;
  color: #164E70;
  padding: 0;
  margin: 0;
  font-size: 24rpx;
  line-height: 1.5;
}

.error {
  display: block;
  color: #A33232;
  font-size: 26rpx;
  line-height: 1.6;
  text-align: center;
}

</style>
