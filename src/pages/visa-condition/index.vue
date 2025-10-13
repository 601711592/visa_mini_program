<template>
  <layout :navbar="{ backgroundColor: '#fff', fixed: true }">
    <view class="visa-condition-page">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在加载签证材料信息...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error-container">
        <text class="error-icon">⚠️</text>
        <text class="error-text">{{ error }}</text>
        <button class="retry-button" @click="loadVisaData(id)">重新加载</button>
      </view>

      <!-- 正常内容 -->
      <template v-else-if="conditionOptions.length > 0">
        <!-- 顶部区域 -->
        <view class="header-section">
          <view class="page-title text-36px font-700 c-white">签证材料助手</view>
          <MaterialSelector v-model="currentConditionIndex" :options="conditionOptions" @change="onConditionChange" />
        </view>

        <!-- 材料清单 -->
        <MaterialList :materials="currentCondition.materials" />

        <!-- 单选材料组 -->
        <OptionalMaterialGroup
          v-for="(optionalGroup, index) in currentCondition.optionalMaterials"
          :key="optionalGroup.id"
          :group="optionalGroup"
          :selected-option-id="selectedOptions[optionalGroup.id]"
          :index="currentCondition.materials.length + index"
          @select="selectOption"
        />

        <!-- 综合说明 -->
        <ComprehensiveNotes
          v-if="currentCondition?.descriptions?.content"
          :description="currentCondition?.descriptions?.content"
          :image-url="currentCondition?.descriptions?.image_url"
          :video-url="currentCondition?.descriptions?.video_url"
        />
      </template>

      <!-- 无数据状态 -->
      <view v-else class="empty-container">
        <text class="empty-icon">📄</text>
        <text class="empty-text">暂无签证材料信息</text>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import MaterialSelector from './components/MaterialSelector.vue';
import MaterialList from './components/MaterialList.vue';
import OptionalMaterialGroup from './components/OptionalMaterialGroup.vue';
import ComprehensiveNotes from './components/ComprehensiveNotes.vue';
import type { VisaCondition } from './constants.js';
import { transformApiDataToVisaConditions, isApiResponseSuccess } from './utils.js';
import { getVisaApplicationMaterialsByTypeId } from '@/services/visa';

const currentConditionIndex = ref(0);
const selectedOptions = ref<Record<string, string>>({});
const loading = ref(false);
const error = ref('');
const id = ref('');
const conditionOptions = ref<VisaCondition[]>([]);

const currentCondition = computed(
  () =>
    conditionOptions.value[currentConditionIndex.value] || {
      type: '',
      label: '暂无数据',
      description: '',
      requirements: [],
      materials: [],
      optionalMaterials: [],
    },
);

// 从接口加载数据
const loadVisaData = async (id: string) => {
  if (!id) {
    error.value = '缺少签证类型ID参数';
    return;
  }

  try {
    loading.value = true;
    error.value = '';

    const response = await getVisaApplicationMaterialsByTypeId(id);
    console.log(response);

    if (!isApiResponseSuccess(response)) {
      throw new Error(response?.msg || '获取数据失败');
    }

    const transformedData = transformApiDataToVisaConditions(response.data);
    conditionOptions.value = transformedData.conditions;

    // 重置选择状态
    currentConditionIndex.value = 0;
    selectedOptions.value = {};
  } catch (err: any) {
    console.error('加载签证数据失败:', err);
    error.value = err.message || '加载数据失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const onConditionChange = (value: number) => {
  currentConditionIndex.value = value;
  selectedOptions.value = {};
};

const selectOption = (groupId: string, optionId: string) => {
  selectedOptions.value[groupId] = optionId;
};

// 页面加载时获取参数并加载数据
onLoad((options: any) => {
  const _id = options?.id || options?.visaTypeId;
  if (_id) {
    id.value = _id;
    loadVisaData(_id);
  } else {
    error.value = '缺少签证类型ID参数';
  }
});

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

// 加载状态样式
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28px;
  color: #666;
  text-align: center;
}

// 错误状态样式
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 28px;
  color: #ff4757;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

.retry-button {
  background: #007aff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 26px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:active {
    background: #005bb5;
  }
}

// 空状态样式
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 28px;
  color: #999;
  text-align: center;
}
</style>
