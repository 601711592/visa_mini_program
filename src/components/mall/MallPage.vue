<template><view class="mx-page"><PreviewBadge/>
  <template v-if="publicPage || (mall.enabled && mall.data.member)"><slot/><template v-if="footer"><view class="mx-footer-space"/><view class="mx-footer"><slot name="footer"/></view></template></template>
  <view v-else class="mx-empty"><MallIcon name="user" :size="100"/><view class="mx-title">{{mall.enabled?'登录后查看':'业务数据待接入'}}</view><view class="mx-muted">{{mall.enabled?'游客可继续浏览商品，登录后恢复当前页面。':'本轮仅完成前端页面，不读取或修改真实业务数据。'}}</view><button class="mx-button" @tap="mall.enabled?login():go('home')">{{mall.enabled?'手机号快捷登录':'返回首页'}}</button></view>
</view></template>
<script setup lang="ts">
import {useMallPreviewStore} from '@/store/mall-preview';import {go} from '@/mall/navigation';import {currentUrl} from '@/utils/auth-routing';import PreviewBadge from './PreviewBadge.vue';import MallIcon from './MallIcon.vue';
defineOptions({options:{styleIsolation:'shared'}});
withDefaults(defineProps<{publicPage?:boolean;footer?:boolean}>(),{publicPage:false,footer:false});
const mall=useMallPreviewStore();
function login(){mall.pendingTarget=currentUrl();mall.pendingOrigin=currentUrl();go('login');}
</script><style lang="scss">@import '@/mall/theme.scss';</style>
