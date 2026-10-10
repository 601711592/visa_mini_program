import request from '@/utils/request';

/** 邀请概览。奖励与好友首笔完成订单的赠分相同，规则来自小程序交易设置。 */
export interface InviteSummary {
  invite_code: string; // 写入分享卡片路径的邀请码
  invited_count: number; // 已注册的邀请好友数
  completed_count: number; // 首单已办理完成的好友数
  reward_points: number; // 累计获得的推荐奖励积分
  rules: { reward_bps: number; reward_basis: 'paid' | 'base' } | null;
}

/** 邀请好友记录，只含脱敏手机号和成交状态。 */
export interface InviteRecord {
  id: number;
  phone_masked: string;
  status: 'pending' | 'completed';
  reward_points: number | null; // 尚未成交时为空
  joined_at: string;
  rewarded_at: string | null;
}

/** 获取当前会员的邀请码和邀请统计。 */
export function getInviteSummary() {
  return request<API.ResponseBody<InviteSummary>>({ url: '/member/invite', method: 'GET' });
}

/** 分页查询邀请好友记录。 */
export function getInviteRecords(page = 1) {
  return request<API.ResponseBody<{ data: InviteRecord[]; current_page: number; last_page: number }>>({
    url: '/member/invite/records',
    method: 'GET',
    data: { page },
  });
}
