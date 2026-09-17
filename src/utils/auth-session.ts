import { API_PREFIX } from './constant';

/** 缓存按后端环境和小程序隔离；不读取旧版裸 token。 */
export const authNamespace = `mini:${import.meta.env.VITE_ID || 'unconfigured'}:${API_PREFIX}`;
const tokenKey = `${authNamespace}:token`;
export const getToken = (): string => uni.getStorageSync(tokenKey) || '';
export const setToken = (token: string) => uni.setStorageSync(tokenKey, token);
export const removeToken = () => uni.removeStorageSync(tokenKey);

let invalidated: (() => void) | undefined;
export const onSessionInvalidated = (handler: () => void) => { invalidated = handler; };
export function invalidateSession(requestToken: string) {
  // 老请求不能清除后来登录的新会话。
  if (requestToken && getToken() === requestToken) {
    removeToken();
    invalidated?.();
  }
}

export function clearSensitiveStorage() {
  const legacy = ['token', 'userInfo', 'travellers', 'travelers', 'address', 'addresses', 'contactPhone', 'checkoutDraft'];
  uni.getStorageInfoSync().keys.forEach((key: string) => {
    if (legacy.includes(key) || key.startsWith(`${authNamespace}:sensitive:`)) uni.removeStorageSync(key);
  });
}
