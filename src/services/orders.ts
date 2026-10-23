import request from '@/utils/request';

/** 小程序交易接口只传选择与权益意愿，价格由服务端重新计算。金额单位均为分。 */
export interface OrderSelection {
  goods_id: number;
  package_key: string;
  person_name: string | null; // 套餐未开启出游人群时为空
  travel_date: string | null; // 套餐未开启价格日历时为空
  quantity: number;
  address_id?: number | null;
  coupon_id?: number | null;
  use_points: boolean;
}

export interface CheckoutCoupon {
  id: number;
  name: string;
  amount_cents: number;
  minimum_cents: number;
  scope_label: string;
  ends_at: string;
  unavailable_reason: string;
}

export interface OrderQuote extends OrderSelection {
  goods_name: string;
  package_title: string;
  unit_cents: number;
  base_cents: number;
  group_discount_cents: number;
  coupon_cents: number;
  coupon_enabled: boolean;
  coupon_options: CheckoutCoupon[];
  points_available: number; // 本次报价时会员可用积分
  points_max_bps: number; // 本次报价的积分抵扣上限（万分比）
  points_used: number;
  points_cents: number;
  due_cents: number;
  rule_version: number;
  quote_token: string;
  /** 本单命中的多件优惠档位，未达到条件时为空。 */
  discount_rule: {
    id: number;
    version: number;
    name: string;
    quantity: number;
    discount: number;
    starts_at: string;
    ends_at: string;
  } | null;
  needs_travellers: boolean;
}

// 会员端的退款状态；后台提交失败和微信异常都显示为 refunding。
export type RefundStatus = 'reviewing' | 'rejected' | 'cancelled' | 'refunding' | 'succeeded' | 'closed';

export interface OrderRefund {
  refund_no: string;
  source: 'member' | 'admin'; // 会员申请或商家主动退款
  status: RefundStatus;
  amount_cents: number;
  reason: string;
  note: string | null;
  reject_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  refunded_at: string | null;
}

export interface TradeOrder {
  order_no: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
  price_version: number; // 付款前校验的金额版本
  adjustment_cents: number; // 人工调价累计差额
  base_cents: number;
  group_discount_cents: number;
  coupon_cents: number;
  points_used: number;
  points_cents: number;
  due_cents: number;
  created_at: string;
  expires_at: string;
  address: { name: string; phone: string; province: string; city: string; district: string; street: string };
  refunded_at: string | null;
  refund: OrderRefund | null; // 最近一笔退款
  refund_eligibility: { can_apply: boolean; reason: string | null; deadline: string }; // 能否在线申请退款，以服务端判断为准
  items: Array<{
    goods_id: number;
    goods_name: string;
    goods_cover: string; // 商品封面
    package_title: string;
    person_name: string;
    travel_date: string | null;
    quantity: number;
    unit_cents: number;
    travellers: Array<{ name: string; passport_tail: string }>;
  }>;
}

/** 获取服务端订单报价。 */
export function quoteOrder(data: OrderSelection) {
  return request<API.ResponseBody<OrderQuote>>({ url: '/member/orders/quote', method: 'POST', data: { ...data } });
}

/** 提交商品选择和出行人资料创建订单。 */
export function createOrder(
  data: OrderSelection & {
    address_id: number;
    quote_token: string;
    idempotency_key: string;
    travellers: Array<{ name: string; passport: string; birthday: string }>;
  },
) {
  return request<API.ResponseBody<TradeOrder>>({ url: '/member/orders', method: 'POST', data: { ...data } });
}

// refund 为“售后退款”标签：有退款记录的订单。
export type OrderFilter = TradeOrder['status'] | 'refund';

/** 分页查询会员订单。 */
export function getOrders(page = 1, status?: OrderFilter) {
  return request<API.ResponseBody<{ data: TradeOrder[]; current_page: number; last_page: number }>>({
    url: '/member/orders',
    method: 'GET',
    // 全部订单不传状态，避免小程序将 undefined 序列化为字符串。
    data: { page, pageSize: 20, ...(status ? { status } : {}) },
  });
}

/** 查询订单详情。 */
export function getOrder(no: string) {
  return request<API.ResponseBody<TradeOrder>>({ url: `/member/orders/${encodeURIComponent(no)}`, method: 'GET' });
}

/** 取消未付款订单。 */
export function cancelOrder(no: string) {
  return request<API.ResponseBody<TradeOrder>>({ url: `/member/orders/${encodeURIComponent(no)}/cancel`, method: 'POST' });
}

/** 申请整单退款，返回最新订单。 */
export function applyRefund(no: string, data: { reason: string; note: string; idempotency_key: string }) {
  return request<API.ResponseBody<TradeOrder>>({ url: `/member/orders/${encodeURIComponent(no)}/refunds`, method: 'POST', data: { ...data } });
}

/** 撤销待审核的退款申请，返回最新订单。 */
export function cancelRefund(no: string) {
  return request<API.ResponseBody<TradeOrder>>({ url: `/member/orders/${encodeURIComponent(no)}/refunds/cancel`, method: 'POST' });
}

/** 获取微信支付参数。 */
export function requestOrderPayment(no: string, priceVersion: number) {
  return request<API.ResponseBody<{ timeStamp: string; nonceStr: string; package: string; signType: 'RSA'; paySign: string }>>({
    url: `/member/orders/${encodeURIComponent(no)}/pay`,
    method: 'POST',
    data: { price_version: priceVersion },
  });
}

/** 核对微信收款状态并返回订单。 */
export function getPaymentStatus(no: string) {
  return request<API.ResponseBody<TradeOrder>>({ url: `/member/orders/${encodeURIComponent(no)}/payment-status`, method: 'GET' });
}
