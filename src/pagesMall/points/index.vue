<template><MallPage><view class="mx-hero"><view class="mx-between"><text>可用积分</text><button class="mx-button mx-plain" @tap="go('pointsRules')">积分规则 ›</button></view><view class="mx-number">{{ mall.data.balance }}</view><view>积分永久有效 · 500 积分可抵 10 元</view><button class="mx-button mx-light" @tap="go('category')">去使用积分</button></view><view class="mx-tabs"><button v-for="item in filters" :key="item" class="mx-tab" :class="{ active: filter === item }" @tap="filter = item">{{ item }}</button></view><view class="mx-body"><view class="mx-card"><view class="mx-title">积分明细</view><view v-for="entry in entries" :key="entry.id" class="mx-row"><view><view>{{ entry.title }}</view><view class="mx-muted mx-wrap">{{ entry.detail }}</view><view class="mx-muted">{{ entry.at }}</view></view><text class="mx-ledger-amount">{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}</text></view><view v-if="!entries.length" class="mx-empty mx-muted">暂无相关记录</view></view></view></MallPage></template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMallPreviewStore } from '@/store/mall-preview';
import { go } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
const mall = useMallPreviewStore(), filters = ['全部', '收入', '支出'], filter = ref('全部');
const entries = computed(() => mall.data.member ? mall.data.ledger.filter(item => filter.value === '全部' || (filter.value === '收入' ? item.amount > 0 : item.amount < 0)) : []);
</script>
