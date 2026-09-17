<template>
  <view class="media-preview-wrapper">
    <view class="preview-overlay">
      <text class="preview-text">{{ videoUrl ? '视频指引' : '图片指引' }}</text>
    </view>
    <view class="media-preview" :class="{ 'video-preview': videoUrl }" @click="handleClick">
      <image :src="imageUrl || '/static/video-placeholder.png'" mode="aspectFill" class="preview-thumbnail" />
      <view v-if="videoUrl" class="play-icon">▶</view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  imageUrl?: string;
  videoUrl?: string;
}

const props = defineProps<Props>();

const handleClick = () => {
  if (props.videoUrl) {
    // uni.showToast({
    //   title: '视频预览功能开发中',
    //   icon: 'none',
    // });
    uni.previewMedia({
      sources: [
        {
          url: props.videoUrl,
          type: 'video',
        },
      ],
      current: 0,
    });
  } else if (props.imageUrl) {
    uni.previewImage({
      urls: [props.imageUrl],
      current: props.imageUrl,
    });
  }
};
</script>

<style lang="scss" scoped>
.media-preview {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  // overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  &:active {
    transform: scale(0.95);
  }
}

.preview-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  // position: absolute;
  // bottom: 100%;
  // left: 0;
  // right: 0;
  // background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 4px 6px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-text {
  font-size: 20px;
  font-weight: 500;
  color: black;
  // text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}
</style>
