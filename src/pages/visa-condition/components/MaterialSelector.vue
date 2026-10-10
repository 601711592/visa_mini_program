<template>
  <view class="material-selector">
    <view class="selector-label text-28px c-white mb-16px">申请条件</view>
    <picker mode="selector" :range="options" range-key="label" :value="modelValue" @change="handleChange">
      <view class="selector-box">
        <text class="selector-text text-26px c-#333">{{ currentOption.label }}</text>
        <text class="selector-arrow text-24px c-#666">▼</text>
      </view>
    </picker>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisaCondition } from '../constants.js';

// 类型直接写在宏里：vite-plugin-vue-type-imports 遇到具名 Props/Emits 会重写 import 并丢掉 type 关键字，
// 数组类型又不会被它内联，结果 constants 被当成值导入，构建时报 "is not exported"。
const props = defineProps<{
  modelValue: number;
  options: VisaCondition[];
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
}>();

const currentOption = computed(() => props.options[props.modelValue] || props.options[0]);

const handleChange = (e: any) => {
  const value = e.detail.value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style lang="scss" scoped>
.material-selector {
  margin-bottom: 24px;
}

.selector-label {
  font-weight: 500;
}

.selector-box {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.selector-text {
  flex: 1;
}

.selector-arrow {
  margin-left: 12px;
}
</style>
