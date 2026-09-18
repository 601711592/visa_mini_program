<template>
  <MallPage public-page>
    <view v-if="logged" class="mx-body"><view class="mx-card"><view class="mx-row"><text>头像</text><button class="avatar-button" :disabled="!MALL_PREVIEW" @tap="chooseAvatar"><image v-if="avatar" :src="avatar" mode="aspectFill" /><MallIcon v-else name="user" :size="80" /></button></view><view class="mx-field"><text class="mx-field-title">昵称</text><input v-model="nickname" class="mx-input" :disabled="!MALL_PREVIEW" placeholder="自愿填写昵称" :maxlength="32" /></view><view class="mx-row"><text>手机号</text><text class="mx-muted">{{ phone }}</text></view></view><view class="mx-hint">头像和昵称自愿完善，不影响浏览和下单。{{ MALL_PREVIEW ? '演示资料仅保存在当前内存，退出或刷新后清理。' : '资料保存接口待后续接入，本页不提交修改。' }}</view><button v-if="MALL_PREVIEW" class="mx-button mx-wide" @tap="save">保存资料</button><button class="mx-button mx-plain mx-wide" @tap="privacy">隐私保护指引</button><button class="mx-button mx-danger mx-wide" @tap="logout">退出登录</button></view>
    <view v-else class="mx-empty"><view class="mx-title">登录后查看个人资料</view><button class="mx-button" @tap="login">手机号快捷登录</button></view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';import { onUnload } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';import { useGlobalStore } from '@/store/global';import { MALL_PREVIEW } from '@/mall/config';
import { go, back, routes, confirm } from '@/mall/navigation';import { openPrivacyContract } from '@/utils/wechat-privacy';import { currentUrl } from '@/utils/auth-routing';
import MallPage from '@/components/mall/MallPage.vue';import MallIcon from '@/components/mall/MallIcon.vue';
const mall = useMallPreviewStore(), global = useGlobalStore();
const nickname = ref(''), avatar = ref('');let alive = true;
const logged = computed(() => MALL_PREVIEW ? mall.data.member : global.isLogin);
const phone = computed(() => MALL_PREVIEW ? '前端演示账号' : global.userInfo?.phone_masked || '');
watch(logged, value => { nickname.value = value ? (MALL_PREVIEW ? mall.data.nickname : global.userInfo?.nickname || '') : ''; avatar.value = value ? (MALL_PREVIEW ? mall.data.avatar : global.userInfo?.avatar || '') : ''; }, { immediate: true });
function chooseAvatar() { if (!MALL_PREVIEW || !logged.value) return; uni.chooseImage({ count: 1, sourceType: ['album'], success: result => { if (alive && mall.data.member) avatar.value = result.tempFilePaths[0] || ''; } }); }
function save() { if (!MALL_PREVIEW || !mall.data.member) return; mall.data.nickname = nickname.value.trim().slice(0, 32); mall.data.avatar = avatar.value; back(); }
function login() { if (MALL_PREVIEW) { mall.pendingTarget = routes.profile; mall.pendingOrigin = currentUrl(); go('login'); } else void global.ensureLogin({ target: routes.profile }); }
function privacy() { if (MALL_PREVIEW) uni.showModal({ title: '隐私保护指引（演示）', content: '演示模式不读取正式协议、不注册账号、不上传头像或手机号。', showCancel: false }); else openPrivacyContract(); }
function logout() { confirm('退出登录', '退出后清理本机出行人、地址和资料草稿，保留非敏感商品选择。', () => { if (MALL_PREVIEW) { mall.logout(); go('account'); } else void global.logout().then(() => go('account')); }); }
onUnload(() => { alive = false; nickname.value = ''; avatar.value = ''; });
</script>
<style scoped>.avatar-button { display: flex; align-items: center; justify-content: center; width: 112rpx; height: 112rpx; margin: 0; padding: 8rpx; background: #EAF6FD; border-radius: 56rpx; }.avatar-button image { width: 96rpx; height: 96rpx; border-radius: 48rpx; }.avatar-button::after { border: 0; }</style>
