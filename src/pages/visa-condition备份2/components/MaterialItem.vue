<template>
  <view class="material-item">
    <view class="material-header">
      <view class="status-icon status-required">
        <text class="icon-text">✓</text>
      </view>
      <view class="material-info">
        <view class="material-name text-28px font-600 c-#333">
          材料{{ index + 1 }}：{{ material.name }}
        </view>
        <view class="material-desc text-24px c-#666">{{ material.description }}</view>
      </view>
      <view class="detail-button">
        <text class="button-text text-26px c-#333">查看材料样本</text>
        <text class="button-arrow text-24px c-#333">▼</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { MaterialItem as MaterialItemType } from '../constants.js';

interface Props {
  material: MaterialItemType;
  index: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.material-item {
  margin-top: 16px;
  overflow: hidden;
  border-top: 1px solid #e8ecf4;

  &:first-child {
    border-top: none;
    margin-top: 0;
  }
}

.material-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;

  &.status-required {
    background: #4caf50;
    color: white;
  }
}

.icon-text {
  font-size: 24px;
  font-weight: 600;
}

.material-info {
  flex: 1;
  margin-right: 16px;
}

.material-name {
  margin-bottom: 8px;
  line-height: 1.4;
}

.material-desc {
  line-height: 1.5;
  color: #666;
}

.detail-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f7f8f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:active {
    background: #e8ecff;
  }
}

.button-text {
  flex: 1;
  font-weight: 500;
}

.button-arrow {
  margin-left: 12px;
}
</style>