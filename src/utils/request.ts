import { API_PREFIX } from './constant';

/** 缓存按后端环境和小程序隔离；不读取旧版裸 token。 */
export const authNamespace = `mini:${import.meta.env.VITE_ID || 'unconfigured'}:${API_PREFIX}`;
const tokenKey = `${authNamespace}:token`;
export const getToken = (): string => uni.getStorageSync(tokenKey) || '';
export const setToken = (token: string) => uni.setStorageSync(tokenKey, token);
export const removeToken = () => uni.removeStorageSync(tokenKey);

let sessionInvalidatedHandler: (() => void) | undefined;
/** 通知全局状态清理身份，请求工具不直接依赖业务 store。 */
export function onSessionInvalidated(handler: () => void) {
  sessionInvalidatedHandler = handler;
}
export function invalidateSession(requestToken: string) {
  // 老请求不能清除后来登录的新会话。
  if (requestToken && getToken() === requestToken) {
    removeToken();
    sessionInvalidatedHandler?.();
  }
}

/** 清除历史登录和敏感缓存；当前 token、购物车由各自流程管理。 */
export function clearSensitiveStorage() {
  const legacy = ['token', 'userInfo', 'travellers', 'travelers', 'address', 'addresses', 'contactPhone', 'checkoutDraft'];
  uni.getStorageInfoSync().keys.forEach((key: string) => {
    if (legacy.includes(key) || key.startsWith(`${authNamespace}:sensitive:`)) {
      uni.removeStorageSync(key);
    }
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
  constructor(public code: string, message: string, public statusCode = 0) {
    super(message);
  }
}

/** 仅向本站 API 自动附带 token；HTTP 成功还需检查业务 status。 */
export default function request<T = unknown>(options: RequestOptions | string): Promise<T> {
  const requestOptions = typeof options === 'string' ? { url: options } : options;
  const url = /^https?:\/\//.test(requestOptions.url) ? requestOptions.url : API_PREFIX + requestOptions.url;
  const isOwnApi = url.startsWith(API_PREFIX + '/');
  const token = requestOptions.auth === false || !isOwnApi ? '' : (requestOptions.token ?? getToken());
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url,
      data: { ...requestOptions.data, mini_program_id: import.meta.env.VITE_ID },
      method: requestOptions.method || 'GET',
      timeout: 30000,
      header: {
        'content-type': requestOptions.contentType || 'application/json',
        ...requestOptions.header,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => settle<T>(res.statusCode, res.data, token, resolve, reject),
      fail: () => reject(new RequestError('NETWORK_ERROR', '网络连接失败，请检查网络后重试')),
    });
  });
}

/** 普通请求和上传共用的结果判定：401 清理会话，HTTP 或业务失败抛出 RequestError。 */
function settle<T>(statusCode: number, data: unknown, token: string, resolve: (value: T) => void, reject: (reason: RequestError) => void) {
  const body = data as { status?: number | string; code?: string; msg?: string } | null;
  if (statusCode === 401) {
    invalidateSession(token);
  }
  const httpFailed = statusCode < 200 || statusCode >= 300;
  const businessFailed = body?.status !== undefined && String(body.status) !== '11';
  if (httpFailed || businessFailed) {
    reject(new RequestError(body?.code || `HTTP_${statusCode}`, body?.msg || '请求失败，请稍后重试', statusCode));
    return;
  }
  resolve(data as T);
}

export interface UploadOptions {
  url: string;
  /** 本地文件路径，如选择头像返回的临时路径。 */
  filePath: string;
  /** 文件在表单中的字段名。 */
  name: string;
  /** 随文件一起提交的表单字段。 */
  data?: Record<string, string | number>;
}

/** 向本站 API 上传单个本地文件；附带 token，结果判定与 request 相同。 */
export function upload<T = unknown>(options: UploadOptions): Promise<T> {
  const token = getToken();
  return new Promise<T>((resolve, reject) => {
    uni.uploadFile({
      url: API_PREFIX + options.url,
      filePath: options.filePath,
      name: options.name,
      formData: { ...options.data, mini_program_id: import.meta.env.VITE_ID },
      timeout: 30000,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        // 上传返回原始字符串；网关错误页等非 JSON 内容（如文件超出服务器限制）按失败处理。
        let body: unknown;
        try {
          body = JSON.parse(res.data);
        } catch {
          reject(new RequestError(`HTTP_${res.statusCode}`, res.statusCode === 413 ? '上传的文件过大' : '请求失败，请稍后重试', res.statusCode));
          return;
        }
        settle<T>(res.statusCode, body, token, resolve, reject);
      },
      fail: () => reject(new RequestError('NETWORK_ERROR', '网络连接失败，请检查网络后重试')),
    });
  });
}

/** 兼容仍使用旧响应结构的业务页面。 */
export const checkResponse = (data: { status?: number | string; resultCode?: string }) =>
  String(data.status) === '11' || data.resultCode === '0';
