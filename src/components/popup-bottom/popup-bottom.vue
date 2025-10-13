<template>
  <uni-popup ref="popup" background-color="#ffffff" @change="$emit('change', $event)" borderRadius="16rpx 16rpx 0 0" v-bind="popupProps">
    <view class="pupop-bottom__content">
      <iconfont class="close-button" type="closeempty" size="20" color="rgba(0, 0, 0, 0.90)" @click="close" />
      <view class="pupop-bottom__title" v-if="title">{{ title }}</view>
      <slot></slot>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import type { UniPopupInstance, UniPopupProps } from '@uni-helper/uni-ui-types';
import { ref } from 'vue';

defineProps<{
  title?: string;
  popupProps?: UniPopupProps;
}>();

const popup = ref<UniPopupInstance | null>(null);

const open = () => {
  popup.value!.open!('bottom');
};

const close = () => {
  popup.value!.close!();
};

defineEmits(['change']);

const apis = {
  open,
  close,
};

export type API = typeof apis;

defineExpose(apis);
</script>

<style lang="scss">
.pupop-bottom {
  &__content {
    position: relative;
    border-radius: inherit;
    .close-button {
      position: absolute;
      top: 32px;
      right: 32px;
    }
  }
  &__title {
    font-weight: bold;
    font-size: 28px;
    color: #000000;
    line-height: 46px;
    padding: 32px;
  }
}
</style>
