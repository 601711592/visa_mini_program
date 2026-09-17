<template>
  <div class="layout flex-c" :style="`--navbar-height: ${navBarHeight}px`">
    <div class="layout-navbar flex-s-0" v-if="navbar">
      <uni-nav-bar v-bind="_navbar" @clickLeft="handleClickLeft" ref="navBar">
        <template v-slot:left>
          <slot name="navbarLeft">
            <!-- <iconfont v-if="_navbar.leftSearch" type="sousuo" size="20" color="#1F1F1F" /> -->
            <iconfont v-if="_navbar.leftBack" type="left" size="20" color="#1F1F1F" />
          </slot>
        </template>
        <template v-slot:default class="uni-navbar__header-container-inner uni-nav-bar-text flex-r-c-c">
          <slot name="navbarDefault">
            <image v-if="logoUrl" :src="logoUrl" class="navbar-logo" mode="aspectFit" />
            <text>{{ _navbar.title }}</text>
          </slot>
        </template>
      </uni-nav-bar>
    </div>
    <div class="layout-body flex-c flex-1">
      <not-login v-if="needLogin && !global.isLogin" />
      <slot v-else></slot>
    </div>
    <login-popup ref="loginPopupRef" />
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/store/global';
import type { UniNavBarProps } from '@uni-helper/uni-ui-types';
import { computed, getCurrentInstance, onMounted, ref, watch, type PropType } from 'vue';
import notLogin from './not-login.vue';

defineOptions({
  options: {
    styleIsolation: 'shared',
  },
});

const props = defineProps({
  navbar: {
    type: Object as PropType<UniNavBarProps & Partial<{ leftSearch: boolean; leftBack: boolean }>>,
    default: () => ({}),
  },
  needLogin: {
    type: Boolean,
    default: false,
  },
});

const _navbar = computed(() => {
  return {
    title: import.meta.env.VITE_APP_TITLE,
    statusBar: true,
    border: false,
    backgroundColor: '#fff',
    ...props.navbar,
  };
});

const logoUrl = computed(() => import.meta.env.VITE_LOGO_URL);

const navBar = ref<any>();
const navBarHeight = ref((uni.getSystemInfoSync().statusBarHeight || 0) + 44);

const instance = getCurrentInstance();

function handleClickLeft() {
  if (instance?.slots.navbarLeft) return;
  if (props.navbar.leftSearch) {
    return uni.navigateTo({
      url: '/pages/search/index',
    });
  }
  uni.navigateBack();
}

const loginPopupRef = ref<any>();

const global = useGlobalStore();

watch(
  () => global.showLoginDialog,
  (val) => {
    if (val) {
      loginPopupRef.value?.open();
    } else {
      loginPopupRef.value?.close();
    }
  },
);
</script>

<style lang="scss">
@import './index.scss';
</style>
