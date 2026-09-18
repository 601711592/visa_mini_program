<template><view class="mall-icon" :style="box"><image :src="source" :style="sprite" mode="scaleToFill" aria-hidden="true" /></view></template>
<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 44 });
const names = ['home', 'grid', 'user', 'cart', 'order', 'clock', 'check', 'refund', 'points', 'coupon', 'map', 'address', 'gift', 'chevron', 'search', 'passport', 'plane'];
const index = computed(() => Math.max(0, names.indexOf(props.name === 'invite' ? 'gift' : props.name)));
const group = computed(() => Math.floor(index.value / 6));
const count = computed(() => Math.min(6, names.length - group.value * 6));
const source = computed(() => `/static/mall/icons-${group.value}.png`);
const box = computed(() => ({ width: props.size + 'rpx', height: props.size + 'rpx' }));
const sprite = computed(() => ({ width: props.size + 'rpx', height: props.size * count.value + 'rpx', marginTop: -(index.value % 6) * props.size + 'rpx' }));
</script>
<style scoped>.mall-icon { display: inline-block; overflow: hidden; flex-shrink: 0; vertical-align: middle; }.mall-icon image { display: block; max-width: none; }</style>
