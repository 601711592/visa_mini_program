import { RequestError } from './request';
export const getWechatLoginCode = (): Promise<string> => new Promise((resolve, reject) => {
  // #ifdef MP-WEIXIN
  uni.login({ provider: 'weixin', timeout: 10000,
    success: (result) => result.code ? resolve(result.code) : reject(new RequestError('LOGIN_CODE_INVALID', '微信登录失败，请重试')),
    fail: () => reject(new RequestError('WECHAT_LOGIN_FAILED', '微信登录失败，请重试')),
  });
  // #endif
  // #ifndef MP-WEIXIN
  reject(new RequestError('PLATFORM_UNSUPPORTED', '请在微信小程序中登录'));
  // #endif
});
export const checkWechatSession = (): Promise<boolean> => new Promise((resolve) => {
  // #ifdef MP-WEIXIN
  uni.checkSession({ success: () => resolve(true), fail: () => resolve(false) });
  // #endif
  // #ifndef MP-WEIXIN
  resolve(false);
  // #endif
});
