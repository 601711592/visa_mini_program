import { login } from '@/services/login';
import { getCurrentUserInfo } from '@/services/mine';
import { getToken, setToken } from '@/utils';
import { defineStore } from 'pinia';

/**
 * @description 全局状态管理
 */
export const useGlobalStore = defineStore('global', {
  state: () => {
    return {
      // 是否登录
      isLogin: !!getToken(),
      // 是否显示登录弹窗
      showLoginDialog: false,
      // 用户信息
      userInfo: uni.getStorageSync('userInfo') || {
        nickname: '',
        avatar: '',
      },
    };
  },
  actions: {
    // 更新用户信息
    async updateUserInfo() {
      const res = await getCurrentUserInfo();
      this.userInfo = res.data;
      // 缓存用户信息
      uni.setStorage({ key: 'userInfo', data: this.userInfo });
    },
    // 自动登录
    async autoLogin() {
      uni.login({
        success: (result) => {
          login(result.code).then((res) => {
            setToken(res.data.token);
            this.isLogin = true;
            this.updateUserInfo();
          });
        },
      });
    },
  },
});
