<template>
  <div class="fold-animation" :style="`height:${containerHeight}`" :class="{ show: visible === 1, hide: visible === 2 }">
    <div class="fold-animation__body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { queryNode } from '@/utils';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  show: Boolean;
}>();

const visible = ref(0);

watch(
  () => props.show,
  () => {
    checkStatus();
  },
);

const checkStatus = () => {
  if (props.show) {
    initHeight();
    onShow();
  } else {
    onHide();
  }
};

let timer: number | undefined;

const onShow = () => {
  clearTimeout(timer);
  visible.value = 1;
};

const onHide = () => {
  visible.value = 2;
  clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = 0;
  }, 300);
};

const containerHeight = computed(() => {
  if (visible.value === 1) {
    return height.value;
  }
  return 0;
});

const height = ref<string>('auto');

const that = getCurrentInstance();

const initHeight = () => {
  queryNode('.fold-animation__body', false, 350, that).then((res: any) => {
    if (!res[0] || res[0].height === 0) return;
    if (height.value === 'auto' || res[0].height > +height.value) height.value = res[0].height + 'px';
  });
};

onMounted(() => {
  initHeight();
  checkStatus();
});
</script>

<style lang="scss">
.fold-animation {
  overflow: hidden;
  transition: height 0.3s;
  &__body {
    overflow: hidden;
  }
}
</style>
