import request from '@/utils/request';

/** 后端公开的会员资料，不含原始手机号、openid 或 unionid。 */
export interface Member {
  id: number;
  mini_program_id: number;
  nickname: string;
  avatar: string;
  phone_masked: string;
  phone_bound: boolean;
}
/** 恢复登录时向后端校验，不能仅凭本地存在 token 判断已登录。 */
export const getCurrentUserInfo = (token?: string) => request<AuthResponse<Member>>({ url: '/member/current', token });

export interface AuthResponse<T> { status: number; msg: string; data: T }
export interface LoginResult { token: string; expires_at: string; member: Member }

/** 不带旧 token，分别提交两种微信 code 和前端协议版本。 */
export const phoneLogin = (data: { login_code: string; phone_code: string; agreement_version: string }) =>
  request<AuthResponse<LoginResult>>({ url: '/auth/phone-login', method: 'POST', auth: false, data });
/** 微信会话失效后核对身份，不延长业务 token 的有效期。 */
export const verifyWechatSession = (login_code: string, token?: string) => request<AuthResponse<{ verified: boolean }>>({
  url: '/auth/wechat-session', method: 'POST', token, data: { login_code },
});
/** 撤销指定 token，退出流程将 401 视为已经失效。 */
export const revokeSession = (token: string) => request<AuthResponse<null>>({ url: '/auth/logout', method: 'POST', token });
