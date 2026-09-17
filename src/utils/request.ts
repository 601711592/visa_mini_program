import { API_PREFIX } from './constant';
import { getToken, invalidateSession } from './auth-session';

export const Method = { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' } as const;
export const ApiPrefix = API_PREFIX;
export interface RequestOptions {
  url: string;
  data?: Record<string, unknown>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  contentType?: string;
  header?: Record<string, string>;
  auth?: boolean;
  token?: string;
}
export class RequestError extends Error {
  constructor(public code: string, message: string, public statusCode = 0) { super(message); }
}

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

export const checkResponse = (data: { status?: number | string; resultCode?: string }) =>
  String(data.status) === '11' || data.resultCode === '0';
