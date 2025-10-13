<template>
  <div class="input-switch" :class="{ active: checked }" @click="$emit('change', !checked)"></div>
</template>

<script setup lang="ts">
defineProps({
  checked: Boolean,
});

const emit = defineEmits({
  change: (value: boolean) => Boolean,
});
</script>

<style lang="scss">
.input-switch {
  width: 80px;
  height: 44px;
  background: #efeff5;
  position: relative;
  border-radius: 22px;
  transition: background-color 0.3s;
  &.active {
    background: #4dd765;
    &::after {
      transform: translate(37px, -50%);
    }
  }
  &::after {
    content: ' ';
    width: 40px;
    height: 40px;
    background: #ffffff;
    position: absolute;
    top: 50%;
    left: 3px;
    transform: translate(0, -50%);
    border-radius: 50%;
    transition: transform 0.3s;
  }
}
</style>
