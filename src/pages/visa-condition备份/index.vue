<template>
  <layout :navbar="{ backgroundColor: '#fff', fixed: true }">
    <view class="visa-condition-page">
      <!-- 顶部区域 -->
      <view class="header-section">
        <view class="page-title text-36px font-700 c-white">签证材料助手</view>
        <MaterialSelector
          v-model="currentConditionIndex"
          :options="conditionOptions"
          @change="onConditionChange"
        />
      </view>

      <!-- 材料清单 -->
      <MaterialList :materials="currentCondition.materials" />

      <!-- 单选材料组 -->
      <OptionalMaterialGroup
        v-for="optionalGroup in currentCondition.optionalMaterials"
        :key="optionalGroup.id"
        :group="optionalGroup"
        :selected-option-id="selectedOptions[optionalGroup.id]"
        @select="selectOption"
      />

      <!-- 综合说明 -->
      <ComprehensiveNotes
        :description="comprehensiveNotes.description"
        :image-url="comprehensiveNotes.imageUrl"
        :video-url="comprehensiveNotes.videoUrl"
      />
    </view>
  </layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShareAppMessage } from '@dcloudio/uni-app';
import MaterialSelector from './components/MaterialSelector.vue';
import MaterialList from './components/MaterialList.vue';
import OptionalMaterialGroup from './components/OptionalMaterialGroup.vue';
import ComprehensiveNotes from './components/ComprehensiveNotes.vue';
import { CONDITION_OPTIONS, COMPREHENSIVE_NOTES } from './constants.js';

const currentConditionIndex = ref(0);
const selectedOptions = ref<Record<string, string>>({});

const conditionOptions = CONDITION_OPTIONS;
const comprehensiveNotes = COMPREHENSIVE_NOTES;
const currentCondition = computed(() => conditionOptions[currentConditionIndex.value]);

const onConditionChange = (value: number) => {
  currentConditionIndex.value = value;
  selectedOptions.value = {};
};

const selectOption = (groupId: string, optionId: string) => {
  selectedOptions.value[groupId] = optionId;
};

onShareAppMessage(() => {
  return {
    title: '签证申请条件 - 董大象签证',
  };
});
</script>

<style lang="scss" scoped>
.visa-condition-page {
  background-color: #f5f6fa;
  min-height: 100vh;
}

.header-section {
  background: #0f345b;
  padding: 32px 24px;
}

.page-title {
  text-align: center;
  margin-bottom: 24px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
