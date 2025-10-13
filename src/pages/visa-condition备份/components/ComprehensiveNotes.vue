<template>
  <view class="comprehensive-notes">
    <view class="section-header bg-#F5F5F5! justify-center">
      <text class="header-title text-32px font-600 c-#ff0000!">综合说明</text>
    </view>
    <view class="notes-content">
      <view class="notes-item">
        <view class="item-content">
          <view class="notes-text">
            <view class="description text-24px c-#666">{{ description }}</view>
          </view>
          <view class="media-buttons">
            <MediaPreview :image-url="imageUrl" />
            <MediaPreview
              :image-url="imageUrl"
              :video-url="videoUrl"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import MediaPreview from './MediaPreview.vue';

interface Props {
  description: string;
  imageUrl: string;
  videoUrl: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.comprehensive-notes {
  background: white;
  margin-top: 0;
}

.section-header {
  background: #f5f5f5;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  margin-bottom: 0;
}

.header-title {
  color: #ff0000;
}

.notes-content {
  background-color: #fff;
  padding: 24px;
}

.notes-item {
  border-radius: 8px;
  overflow: hidden;
}

.item-content {
  display: flex;
  align-items: flex-start;
  padding: 20px;
}

.notes-text {
  flex: 1;
  margin-right: 16px;
}

.description {
  line-height: 1.5;
  color: #666;
}

.media-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-self: center;
}
</style>