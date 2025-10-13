<template>
  <view
    class="optional-material-item"
    :class="{ selected: isSelected }"
    @click="handleSelect"
  >
    <view class="optional-item-content">
      <view class="radio-button" :class="{ checked: isSelected }">
        <text class="radio-number">{{ index + 1 }}</text>
      </view>

      <view class="optional-material-info">
        <view class="optional-material-title text-28px font-600 c-#333">{{ option.label }}</view>
        <view class="optional-material-desc text-24px c-#666">{{ option.description }}</view>
      </view>

      <view class="optional-media-buttons">
        <MediaPreview
          v-if="option.imageUrl"
          :image-url="option.imageUrl"
          @click.stop
        />
        <MediaPreview
          v-if="option.videoUrl"
          :image-url="option.imageUrl"
          :video-url="option.videoUrl"
          @click.stop
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import MediaPreview from './MediaPreview.vue';
import type { MaterialOption } from '../constants.js';

interface Props {
  option: MaterialOption;
  index: number;
  isSelected: boolean;
}

interface Emits {
  (e: 'select', optionId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleSelect = () => {
  emit('select', props.option.id);
};
</script>

<style lang="scss" scoped>
.optional-material-item {
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border-bottom: 1px solid #e8ecf4;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }

  &.selected {
    border-color: #007aff;
    background-color: #f0f4ff;
  }

  &:active {
    transform: scale(0.98);
  }
}

.optional-item-content {
  display: flex;
  align-items: flex-start;
  padding: 20px;
}

.radio-button {
  width: 48px;
  height: 48px;
  border: 2px solid #ccc;
  border-radius: 50%;
  margin-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;

  &.checked {
    border-color: #007aff;
    background-color: #007aff;
    color: white;
  }
}

.radio-number {
  font-size: 20px;
  font-weight: 600;
  color: #666;

  .checked & {
    color: white;
  }
}

.optional-material-info {
  flex: 1;
  margin-right: 16px;
}

.optional-material-title {
  margin-bottom: 8px;
  line-height: 1.4;
}

.optional-material-desc {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #666;
}

.optional-media-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: center;
}
</style>