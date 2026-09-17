<template>
  <view class="materials-section">
    <view class="section-header bg-#fae5cd">
      <text class="header-title text-28px font-600 c-#ff0000">固定{{ materials.length }}项基本材料</text>
    </view>
    <view class="materials-list">
      <MaterialItem v-for="(material, index) in materials" :key="material.id" :material="material" :index="index" />
    </view>
  </view>
</template>

<script setup lang="ts">
import MaterialItem from './MaterialItem.vue';
import type { MaterialItem as MaterialItemType } from '../constants.js';

interface Props {
  materials: MaterialItemType[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.materials-section {
  background: white;
}

.section-header {
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 24px;
  margin-bottom: 24px;
}

.materials-list {
  background-color: #fff;
  padding: 0 24px 24px;
}
</style>
