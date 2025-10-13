<template>
  <view class="optional-materials-section">
    <view class="optional-section-header">
      <text class="optional-header-title text-28px font-600 c-#ff0000"> 材料{{ index + 1 }}：{{ group.title }} </text>
    </view>
    <view class="optional-materials-list">
      <OptionalMaterialItem
        v-for="(option, index) in group.options"
        :key="option.id"
        :option="option"
        :index="index"
        :is-selected="selectedOptionId === option.id"
        @select="handleSelect"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import OptionalMaterialItem from './OptionalMaterialItem.vue';
import type { OptionalMaterialGroup as OptionalMaterialGroupType } from '../constants.js';

interface Props {
  group: OptionalMaterialGroupType;
  selectedOptionId?: string;
  index: number;
}

interface Emits {
  (e: 'select', groupId: string, optionId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleSelect = (optionId: string) => {
  emit('select', props.group.id, optionId);
};
</script>

<style lang="scss" scoped>
.optional-materials-section {
  background: white;
  margin-top: 0;
}

.optional-section-header {
  background: #fae5cd;
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  margin-bottom: 0;
}

.optional-header-title {
  color: #ff0000;
}

.optional-materials-list {
  background-color: #fff;
  padding: 24px;
}
</style>
