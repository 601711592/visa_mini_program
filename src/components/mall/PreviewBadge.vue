<template><view v-if="mall.enabled" class="preview-badge" @longpress="controls">前端演示 · 不产生真实订单或支付</view></template>
<script setup lang="ts">
import { useMallPreviewStore } from '@/store/mall-preview';
const mall=useMallPreviewStore();
function controls(){uni.showActionSheet({itemList:['体验已登录态','体验游客态','重置演示数据'],success:({tapIndex})=>{if(tapIndex===0)mall.login();else if(tapIndex===1)mall.logout();else mall.reset();}});}
</script><style scoped>.preview-badge{padding:12rpx 24rpx;background:#EDF5FA;color:#526B7B;font-size:22rpx;text-align:center;line-height:1.6;}</style>
