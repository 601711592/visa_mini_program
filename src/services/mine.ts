import request, { upload } from '@/utils/request';

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

/** 微信身份登录结果：已注册返回凭证和资料，未注册只返回标记。 */
export type WechatLoginResult = ({ registered: true } & LoginResult) | { registered: false };

/** 两种微信凭证各自获取，不能混用。 */
export type PhoneLoginParams = {
  login_code: string; // wx.login 返回的登录凭证
  phone_code: string; // getPhoneNumber 返回的手机号凭证
  agreement_version: string; // 用户同意的协议版本
  invite_code?: string; // 好友分享带来的邀请码，仅注册时生效
};

/** 恢复登录时向后端校验，不能仅凭本地存在 token 判断已登录。 */
export function getCurrentUserInfo(token?: string) {
  return request<API.ResponseBody<Member>>({
    url: '/member/current',
    method: 'GET',
    token,
  });
}

/** 头像大小上限（字节），与后端校验一致。 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/**
 * 保存昵称（空字符串表示清空）；传入 avatarPath 时同时上传新头像，后端会删除旧头像文件。
 * 两种提交方式走同一接口，返回更新后的会员资料。
 */
export function updateProfile(data: { nickname: string; avatarPath?: string }) {
  if (data.avatarPath) {
    return upload<API.ResponseBody<Member>>({
      url: '/member/profile',
      filePath: data.avatarPath,
      name: 'avatar',
      data: { nickname: data.nickname },
    });
  }
  return request<API.ResponseBody<Member>>({
    url: '/member/profile',
    method: 'POST',
    data: { nickname: data.nickname },
  });
}

/** 已注册会员只凭 wx.login 的凭证登录，不带旧 token，也不需要手机号授权。 */
export function wechatLogin(loginCode: string) {
  return request<API.ResponseBody<WechatLoginResult>>({
    url: '/auth/login',
    method: 'POST',
    auth: false,
    data: { login_code: loginCode },
  });
}

/** 首次注册：不带旧 token，分别提交两种微信 code 和前端协议版本。 */
export function phoneLogin(data: PhoneLoginParams) {
  return request<API.ResponseBody<LoginResult>>({
    url: '/auth/phone-login',
    method: 'POST',
    auth: false,
    data,
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
