import request from '@/utils/request';
import type { Member } from './mine';
export interface AuthResponse<T> { status: number; msg: string; data: T }
export interface ServiceAgreement { version: string; title: string; content: string }
export interface LoginResult { token: string; expires_at: string; member: Member }

export const phoneLogin = (data: { login_code: string; phone_code: string; agreement_version: string }) =>
  request<AuthResponse<LoginResult>>({ url: '/auth/phone-login', method: 'POST', auth: false, data });
export const getServiceAgreement = () => request<AuthResponse<ServiceAgreement>>({ url: '/auth/service-agreement', auth: false });
export const verifyWechatSession = (login_code: string, token?: string) => request<AuthResponse<{ verified: boolean }>>({
  url: '/auth/wechat-session', method: 'POST', token, data: { login_code },
});
export const revokeSession = (token: string) => request<AuthResponse<null>>({ url: '/auth/logout', method: 'POST', token });
