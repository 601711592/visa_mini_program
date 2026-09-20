import { API_PREFIX } from './constant';


/** 缓存按后端环境和小程序隔离；不读取旧版裸 token。 */
export const authNamespace = `mini:${import.meta.env.VITE_ID || 'unconfigured'}:${API_PREFIX}`;
const tokenKey = `${authNamespace}:token`;
export const getToken = (): string => uni.getStorageSync(tokenKey) || '';
export const setToken = (token: string) => uni.setStorageSync(tokenKey, token);
export const removeToken = () => uni.removeStorageSync(tokenKey);

let invalidated: (() => void) | undefined;
/** 通知全局状态清理身份，请求工具不直接依赖业务 store。 */
export const onSessionInvalidated = (handler: () => void) => { invalidated = handler; };
export function invalidateSession(requestToken: string) {
  // 老请求不能清除后来登录的新会话。
  if (requestToken && getToken() === requestToken) {
    removeToken();
    invalidated?.();
  }
}

/** 清除历史登录和敏感缓存；当前 token、购物车由各自流程管理。 */
export function clearSensitiveStorage() {
  const legacy = ['token', 'userInfo', 'travellers', 'travelers', 'address', 'addresses', 'contactPhone', 'checkoutDraft'];
  uni.getStorageInfoSync().keys.forEach((key: string) => {
    if (legacy.includes(key) || key.startsWith(`${authNamespace}:sensitive:`)) uni.removeStorageSync(key);
  });
}

export const Method = { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' } as const;
export const ApiPrefix = API_PREFIX;
export interface RequestOptions {
  url: string;
  data?: Record<string, unknown>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  contentType?: string;
  header?: Record<string, string>;
  auth?: boolean;
  /** 固定本次请求的 token，避免异步操作误用后来登录的新 token。 */
  token?: string;
}
export class RequestError extends Error {
  constructor(public code: string, message: string, public statusCode = 0) { super(message); }
}

/** 仅向本站 API 自动附带 token；HTTP 成功还需检查业务 status。 */
export default function request<T = unknown>(options: RequestOptions | string): Promise<T> {
  const opts = typeof options === 'string' ? { url: options } : options;
  const url = /^https?:\/\//.test(opts.url) ? opts.url : API_PREFIX + opts.url;
  const trusted = url.startsWith(API_PREFIX + '/');
  const token = opts.auth === false || !trusted ? '' : (opts.token ?? getToken());
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url,
      data: { ...opts.data, mini_program_id: import.meta.env.VITE_ID },
      method: opts.method || 'GET',
      timeout: 30000,
      header: {
        'content-type': opts.contentType || 'application/json',
        ...opts.header,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const body = res.data as { status?: number | string; code?: string; msg?: string } | null;
        if (res.statusCode === 401) invalidateSession(token);
        if (res.statusCode < 200 || res.statusCode >= 300 || (body?.status !== undefined && String(body.status) !== '11')) {
          reject(new RequestError(body?.code || `HTTP_${res.statusCode}`, body?.msg || '请求失败，请稍后重试', res.statusCode));
          return;
        }
        resolve(res.data as T);
      },
      fail: () => reject(new RequestError('NETWORK_ERROR', '网络连接失败，请检查网络后重试')),
    });
  });
}

/** 兼容仍使用旧响应结构的业务页面。 */
export const checkResponse = (data: { status?: number | string; resultCode?: string }) =>
  String(data.status) === '11' || data.resultCode === '0';
