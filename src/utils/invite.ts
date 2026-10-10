import { authNamespace } from './request';

/** 分享卡片路径上的邀请码参数名。 */
export const INVITE_QUERY = 'inviter';

// 好友分享带来的邀请码只在本机暂存，注册时提交一次；确认已是会员后清除。
const inviteKey = `${authNamespace}:invite-code`;

/** 记录进入小程序时携带的邀请码；格式不符的参数直接忽略。 */
export function rememberInviteCode(code: unknown) {
  if (typeof code === 'string' && /^[A-Za-z0-9]{8}$/.test(code)) {
    uni.setStorageSync(inviteKey, code.toUpperCase());
  }
}
export const getInviteCode = (): string => uni.getStorageSync(inviteKey) || '';
export const clearInviteCode = () => uni.removeStorageSync(inviteKey);
