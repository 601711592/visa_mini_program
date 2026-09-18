<template>
  <PreviewLogin v-if="MALL_PREVIEW" />
  <view v-else class="login-page">
    <view class="login-content">
      <image class="illustration" src="/static/images/login-travel.png" mode="aspectFit" aria-hidden="true" />
      <view class="actions">
        <button v-if="consent && agreement && supported" class="primary" open-type="getPhoneNumber" :disabled="busy" :loading="busy" @getphonenumber="handlePhone">手机号快捷登录</button>
        <button v-else class="primary" :disabled="loading" @tap="explainRequired">手机号快捷登录</button>
        <view class="consent-row">
          <checkbox-group @change="changeConsent"><label class="checkbox-label"><checkbox value="agree" :checked="consent" color="#164E70" :disabled="busy" /><text class="sr-text">同意协议</text></label></checkbox-group>
          <view class="consent-copy"><view>我已阅读并同意</view><view class="consent-links"><button class="agreement-link" @tap="readAgreement">《用户服务协议》</button><text>和</text><button class="agreement-link" @tap="openPrivacyContract">《隐私保护指引》</button></view></view>
        </view>
        <text v-if="error" class="error" role="alert">{{ error }}</text>
        <button v-if="!agreement && !loading" class="text-button" @tap="loadAgreement">重新加载协议</button>
        <button class="text-button skip" @tap="cancel">暂不登录，继续浏览</button>
      </view>
    </view>
    <view v-if="showPrivacy" class="privacy-mask">
      <view class="privacy-card">
        <text class="privacy-title">手机号使用说明</text>
        <text class="privacy-copy">为绑定账号并联系订单服务，我们需要在您主动授权后使用手机号。拒绝授权仍可继续浏览。</text>
        <button class="agreement-link" @tap="openPrivacyContract">阅读《隐私保护指引》</button>
        <button id="login-privacy-agree" class="primary" open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="agreePrivacy">同意并继续</button>
        <button class="text-button" @tap="rejectPrivacy">拒绝并返回</button>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getServiceAgreement, type ServiceAgreement } from '@/services/login';
import { useGlobalStore } from '@/store/global';
import { privacyApi, receivePrivacy, openPrivacyContract, type PrivacyResolve } from '@/utils/wechat-privacy';
import { RequestError } from '@/utils/request';
import { MALL_PREVIEW } from '@/mall/config';
import PreviewLogin from '@/components/mall/PreviewLogin.vue';
const global = useGlobalStore();
const agreement = ref<ServiceAgreement | null>(null);
const consent = ref(false);
const supported = ref(false);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const showPrivacy = ref(false);
let resolves: PrivacyResolve[] = [];
let dispose = () => {};
let alive = true;
async function loadAgreement() {
  if (loading.value || MALL_PREVIEW) return;
  loading.value = true;
  try { const result = await getServiceAgreement(); if (alive) { agreement.value = result.data; error.value = ''; } }
  catch (e) { if (alive) error.value = e instanceof Error ? e.message : '协议加载失败，请重试'; }
  finally { if (alive) loading.value = false; }
}
onLoad(() => {
  if (MALL_PREVIEW) return;
  global.loginOpen = true;
  const api = privacyApi();
  supported.value = !!api;
  dispose = receivePrivacy((resolve) => { resolves.push(resolve); showPrivacy.value = true; });
  api?.getPrivacySetting({ success: () => {}, fail: () => { error.value = '隐私状态读取失败，请重试'; } });
  void loadAgreement();
});
onUnload(() => {
  alive = false;
  if (MALL_PREVIEW) return;
  resolvePrivacy(false);
  dispose();
  if (global.loginOpen) global.cancelLogin(false);
});
function changeConsent(event: { detail: { value: string[] } }) { consent.value = event.detail.value.includes('agree'); }
function explainRequired() {
  error.value = !supported.value ? '请在最新版微信小程序中使用手机号登录' : !agreement.value ? '请先加载并阅读服务协议' : '请先阅读并勾选同意协议';
}
function readAgreement() { uni.navigateTo({ url: '/pages/service-agreement/index' }); }
function resolvePrivacy(agree: boolean) {
  const waiting = resolves;
  resolves = [];
  showPrivacy.value = false;
  waiting.forEach((resolve) => resolve(agree ? { event: 'agree', buttonId: 'login-privacy-agree' } : { event: 'disagree' }));
}
function agreePrivacy() { resolvePrivacy(true); }
function rejectPrivacy() { resolvePrivacy(false); error.value = '您未同意隐私授权，可继续浏览或主动重试'; }
function cancel() { resolvePrivacy(false); global.cancelLogin(); }
async function handlePhone(event: { detail: { code?: string; errMsg?: string } }) {
  if (busy.value || !alive || MALL_PREVIEW) return;
  if (!consent.value || !agreement.value) { explainRequired(); return; }
  if (!event.detail.code) { error.value = '手机号授权未完成，可继续浏览或主动重试'; return; }
  busy.value = true;
  error.value = '';
  try {
    const success = await global.completePhoneLogin(event.detail.code, agreement.value.version);
    if (success && alive) global.finishLogin();
  } catch (e) {
    if (!alive) return;
    error.value = e instanceof Error ? e.message : '登录失败，请重试';
    if (e instanceof RequestError && e.code === 'AGREEMENT_CHANGED') {
      consent.value = false;
      agreement.value = null;
      await loadAgreement();
      error.value = '服务协议已更新，请重新阅读并同意';
    }
  } finally { if (alive) busy.value = false; }
}
</script>
<style scoped lang="scss">@import '@/mall/login.scss';</style>
