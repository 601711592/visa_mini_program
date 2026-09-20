import request from '@/utils/request';

/** 后端公开的会员资料，不含原始手机号、openid 或 unionid。 */
export interface Member {
  id: number; // 会员 ID
  mini_program_id: number; // 所属小程序 ID
  nickname: string; // 昵称
  avatar: string; // 头像地址
  phone_masked: string; // 脱敏手机号
  phone_bound: boolean; // 是否已绑定手机号
}

/** 手机号登录成功后返回的凭证和会员资料。 */
export interface LoginResult {
  token: string; // 业务登录凭证
  expires_at: string; // 凭证到期时间
  member: Member; // 当前会员资料
}

/** 两种微信凭证各自获取，不能混用。 */
export type PhoneLoginParams = {
  login_code: string; // wx.login 返回的登录凭证
  phone_code: string; // getPhoneNumber 返回的手机号凭证
  agreement_version: string; // 用户同意的协议版本
};

/** 恢复登录时向后端校验，不能仅凭本地存在 token 判断已登录。 */
export function getCurrentUserInfo(token?: string) {
  return request<API.ResponseBody<Member>>({
    url: '/member/current',
    method: 'GET',
    token,
  });
}

/** 不带旧 token，分别提交两种微信 code 和前端协议版本。 */
export function phoneLogin(data: PhoneLoginParams) {
  return request<API.ResponseBody<LoginResult>>({
    url: '/auth/phone-login',
    method: 'POST',
    auth: false,
    data,
  });
}

/** 微信会话失效后核对身份，不延长业务 token 的有效期。 */
export function verifyWechatSession(loginCode: string, token?: string) {
  return request<API.ResponseBody<{ verified: boolean }>>({
    url: '/auth/wechat-session',
    method: 'POST',
    token,
    data: { login_code: loginCode },
  });
}

/** 撤销指定 token，退出流程将 401 视为已经失效。 */
export function revokeSession(token: string) {
  return request<API.ResponseBody<[]>>({
    url: '/auth/logout',
    method: 'POST',
    token,
  });
}
