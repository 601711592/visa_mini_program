import request from '@/utils/request';
import type { Goods } from './shop';

export interface MemberCoupon {
  id: number;
  status: 'available' | 'upcoming' | 'used' | 'expired' | 'revoked';
  name: string;
  amount_cents: number;
  minimum_cents: number;
  scope: 'all' | 'category' | 'goods';
  scope_ids: number[];
  scope_label: string;
  starts_at: string;
  ends_at: string;
  revoke_reason: string | null;
  order_no: string | null;
  order_status: string | null;
}

export interface PointRules {
  points_max_bps: number;
  reward_bps: number;
  reward_basis: 'paid' | 'base';
  stack_order: 'group_coupon_points' | 'coupon_group_points' | 'points_group_coupon';
}

/** 按服务端收支方向分页查询积分，规则和余额来自同一小程序。 */
export function getMemberPoints(page = 1, direction: '' | 'in' | 'out' = '') {
  return request<
    API.ResponseBody<{
      balance: number;
      available: number;
      ledger: { data: Array<{ id: number; amount: number; reason: string; order_no: string | null; created_at: string }>; current_page: number; total: number };
      rules: PointRules | null;
    }>
  >({ url: '/member/points', method: 'GET', data: { page, ...(direction ? { direction } : {}) } });
}

/** 获取会员优惠券。 */
export function getMemberCoupons() {
  return request<API.ResponseBody<MemberCoupon[]>>({ url: '/member/coupons', method: 'GET' });
}

/** 按会员券的规则快照筛选商品，再由服务端分页。 */
export function getCouponGoods(id: number, page = 1) {
  return request<API.ResponseBodyPage<Goods>>({ url: `/member/coupons/${id}/goods`, method: 'GET', data: { page } });
}
