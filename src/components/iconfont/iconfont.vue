<template>
  <uni-icons :type="`${type}`" :size="size" :color="color" @click="$emit('click')" class="center"></uni-icons>
</template>

<script setup lang="ts">
// import type { UniIcons } from '@uni-helper/uni-ui-types';

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
});

const props = defineProps<{ type: string; size: string; color: string }>();

defineEmits(['click']);
</script>

<style lang="scss">
@import './index.scss';
</style>
