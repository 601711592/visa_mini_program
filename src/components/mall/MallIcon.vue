<template><image v-if="source" class="mall-icon" :src="source" :style="box" mode="aspectFit" aria-hidden="true" /></template>
<script setup lang="ts">
import { computed } from 'vue';
import { designIcon } from '@/mall/design-icons';
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 44 });
const source = computed(() => designIcon(props.name));
const box = computed(() => ({ width: props.size + 'rpx', height: props.size + 'rpx' }));
</script>
<style scoped>
.mall-icon { display: inline-block; flex-shrink: 0; vertical-align: middle; }
</style>
