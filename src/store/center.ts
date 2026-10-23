import { defineStore } from 'pinia';
import { addAddress, updateAddress, deleteAddress, setDefaultAddress, getAddresses, type Address, type AddressInput } from '@/services/address';
import {
  getOrders,
  getOrder,
  cancelOrder as cancelTradeOrder,
  applyRefund as applyTradeRefund,
  cancelRefund as cancelTradeRefund,
  type OrderFilter,
  type RefundStatus,
  type TradeOrder,
} from '@/services/orders';
import { getMemberPoints, getMemberCoupons, type PointRules } from '@/services/benefits';

export type { Address } from '@/services/address';

let addressRequestId = 0;
let ordersRequestId = 0;
let pointsRequestId = 0;
let couponsRequestId = 0;
// 退出登录时递增；订单详情和取消请求据此丢弃迟到的响应。
let sessionEpoch = 0;

/** 个人中心只缓存当前登录会员的服务端订单和权益；退出登录立即清空。 */

export type OrderState = '待付款' | '办理中' | '已完成' | '已取消' | '退款中' | '已退款';
export type CouponStatus = '未使用' | '已使用' | '已过期' | '未生效' | '已收回';

export interface OrderTraveller {
  name: string;
  passport: string; // 护照尾号
  birthday?: string;
}

export interface OrderItem {
  goodsId: number;
  goodsName: string;
  cover: string; // 商品封面
  pack: string;
  group: string;
  date: string;
  qty: number;
  unitPrice: number; // 下单时商品单价（元）
  amount: number; // 商品明细金额（优惠前，元）
  travellers: OrderTraveller[];
}

export const refundLabels: Record<RefundStatus, string> = {
  reviewing: '退款审核中',
  rejected: '退款未通过',
  cancelled: '已撤销申请',
  refunding: '退款处理中',
  succeeded: '已退款',
  closed: '退款已关闭',
};

export interface CenterRefund {
  status: RefundStatus;
  label: string;
  byMerchant: boolean; // 商家主动退款
  amount: number; // 退款金额（元）
  reason: string;
  note: string;
  rejectReason: string;
  requestedAt: string;
  refundedAt: string;
}

export interface CenterOrder {
  id: string;
  state: OrderState;
  created: string;
  items: OrderItem[];
  base: number; // 商品原价总额
  discount: number; // 多人优惠
  coupon: number; // 优惠券金额
  couponId: number | null;
  points: number; // 使用积分
  pointsAmount: number; // 积分抵扣金额（元）
  due: number; // 实付/待支付
  priceVersion: number; // 当前展示金额版本
  adjustment: number; // 人工调价累计差额（元）
  address?: Pick<Address, 'name' | 'phone' | 'province' | 'city' | 'district' | 'street'> | null; // 下单时的邮寄地址快照
  refund: CenterRefund | null; // 最近一笔退款
  canRefund: boolean; // 能否在线申请退款，以服务端判断为准
  refundBlockedReason: string; // 不能申请时的原因，点击申请退款时提示
}

export interface LedgerEntry {
  id: number;
  name: string;
  note: string;
  date: string;
  amount: number;
}

export interface Coupon {
  id: number;
  name: string;
  amount: number;
  min: number; // 使用门槛，0 表示无门槛
  status: CouponStatus;
  scope: string;
  scopeType: 'all' | 'category' | 'goods'; // 发放时的范围类型
  scopeIds: number[]; // 发放时的分类或商品编号
  start: string;
  end: string;
  revokeReason: string; // 后台收回原因
  orderNo: string | null; // 使用该券的订单
  orderStatus: string | null; // 关联订单的支付及履约状态
}

/** 页面仍使用元金额和中文状态，转换只发生在 API 边界。 */
export function toCenterOrder(order: TradeOrder): CenterOrder {
  const states: Record<TradeOrder['status'], OrderState> = {
    pending: '待付款',
    processing: '办理中', completed: '已完成', cancelled: '已取消',
    refunding: '退款中', refunded: '已退款',
  };
  const refund = order.refund;
  const eligibility = order.refund_eligibility;
  return {
    id: order.order_no, state: states[order.status], created: order.created_at,
    items: order.items.map(item => ({
      goodsId: item.goods_id, goodsName: item.goods_name, cover: item.goods_cover || '', pack: item.package_title,
      group: item.person_name, date: item.travel_date || '', qty: item.quantity,
      unitPrice: item.unit_cents / 100, amount: item.unit_cents * item.quantity / 100,
      travellers: item.travellers.map(p => ({ name: p.name, passport: p.passport_tail })),
    })),
    base: order.base_cents / 100, discount: order.group_discount_cents / 100,
    coupon: order.coupon_cents / 100, couponId: null, points: order.points_used, pointsAmount: order.points_cents / 100,
    due: order.due_cents / 100, priceVersion: order.price_version, adjustment: order.adjustment_cents / 100, address: order.address,
    refund: refund ? {
      status: refund.status, label: refundLabels[refund.status], byMerchant: refund.source === 'admin',
      amount: refund.amount_cents / 100, reason: refund.reason, note: refund.note || '', rejectReason: refund.reject_reason || '',
      requestedAt: refund.requested_at, refundedAt: refund.refunded_at || order.refunded_at || '',
    } : null,
    canRefund: !!eligibility?.can_apply,
    refundBlockedReason: eligibility?.reason || '',
  };
}

export const useCenterStore = defineStore('center', {
  state: () => ({
    balance: 0, // 当前会员可用积分
    ledger: [] as LedgerEntry[], // 当前会员积分流水
    pointRules: null as PointRules | null, // 当前小程序积分规则
    pointsLoading: false, // 是否正在读取积分及流水
    pointsError: '', // 积分读取错误提示
    pointsPage: 0, // 已成功读取的积分流水页码
    pointsHasMore: true, // 积分流水是否还有下一页
    pointsDirection: '' as '' | 'in' | 'out', // 服务端积分收支筛选条件
    coupons: [] as Coupon[], // 当前会员优惠券
    orders: [] as CenterOrder[], // 当前筛选下已加载的订单
    ordersLoading: false, // 是否正在加载订单列表
    ordersError: '', // 订单列表加载错误提示
    ordersPage: 0, // 当前已加载的订单页码
    ordersHasMore: true, // 是否还有下一页订单
    ordersFilter: '' as OrderFilter | '', // 订单列表当前服务端筛选条件
    addresses: [] as Address[], // 当前会员的服务端收货地址
    addressesLoading: false, // 是否正在加载地址列表
    addressesLoaded: false, // 当前会话是否成功加载过地址列表
    addressesError: '', // 地址列表加载错误提示
  }),
  getters: {
    availableCouponCount: (state) => state.coupons.filter((c) => c.status === '未使用').length,
    findOrder: (state) => (id: string) => state.orders.find((o) => o.id === id),
    findCoupon: (state) => (id: number) => state.coupons.find((c) => c.id === id),
  },
  actions: {
    /** 按筛选条件加载或追加订单列表。 */
    async loadOrders(reset = true, status: OrderFilter | '' = '') {
      if (status !== this.ordersFilter) reset = true;
      if (!reset && (this.ordersLoading || !this.ordersHasMore)) return;
      const requestId = ++ordersRequestId;
      if (reset) {
        this.orders = [];
        this.ordersPage = 0;
        this.ordersHasMore = true;
        this.ordersFilter = status;
      }
      this.ordersLoading = true;
      this.ordersError = '';
      try {
        const page = reset ? 1 : this.ordersPage + 1;
        const response = await getOrders(page, status || undefined);
        if (requestId === ordersRequestId) {
          const next = response.data.data.map(toCenterOrder);
          this.orders = reset ? next : [...this.orders, ...next.filter(x => !this.orders.some(o => o.id === x.id))];
          this.ordersPage = page;
          this.ordersHasMore = page < response.data.last_page;
          this.ordersFilter = status;
        }
      } catch (error) {
        if (requestId === ordersRequestId) this.ordersError = error instanceof Error ? error.message : '订单加载失败';
        throw error;
      } finally {
        if (requestId === ordersRequestId) this.ordersLoading = false;
      }
    },
    /** 获取订单详情并更新缓存。 */
    async loadOrder(id: string) {
      const epoch = sessionEpoch;
      const response = await getOrder(id);
      if (epoch !== sessionEpoch) return;
      const order = toCenterOrder(response.data);
      this.orders = [order, ...this.orders.filter(x => x.id !== id)];
    },
    /** 取消订单并刷新会员权益。 */
    async cancelOrder(id: string) {
      const epoch = sessionEpoch;
      const response = await cancelTradeOrder(id);
      if (epoch !== sessionEpoch) return;
      const order = toCenterOrder(response.data);
      this.orders = [order, ...this.orders.filter(x => x.id !== id)];
      try { await this.loadBenefits(); } catch { /* 服务端取消已经成功，权益可稍后重试 */ }
    },
    /** 申请整单退款并用返回的订单更新缓存；幂等键由页面在重试时沿用。 */
    async applyRefund(id: string, data: { reason: string; note: string; idempotency_key: string }) {
      const epoch = sessionEpoch;
      const response = await applyTradeRefund(id, data);
      if (epoch !== sessionEpoch) return;
      const order = toCenterOrder(response.data);
      this.orders = [order, ...this.orders.filter(x => x.id !== id)];
    },
    /** 撤销待审核的退款申请。 */
    async cancelRefund(id: string) {
      const epoch = sessionEpoch;
      const response = await cancelTradeRefund(id);
      if (epoch !== sessionEpoch) return;
      const order = toCenterOrder(response.data);
      this.orders = [order, ...this.orders.filter(x => x.id !== id)];
    },
    /** 券页面独立加载会员券，避免积分请求失败阻断选券。 */
    async loadCoupons() {
      const seq = ++couponsRequestId;
      const result = await getMemberCoupons();
      if (seq !== couponsRequestId) return;
      const labels: Record<string, CouponStatus> = { available: '未使用', upcoming: '未生效', used: '已使用', expired: '已过期', revoked: '已收回' };
      this.coupons = result.data.map(c => ({
        id: c.id, name: c.name, amount: c.amount_cents / 100, min: c.minimum_cents / 100,
        status: labels[c.status], scope: c.scope_label, scopeType: c.scope, scopeIds: c.scope_ids,
        start: c.starts_at, end: c.ends_at, revokeReason: c.revoke_reason || '',
        orderNo: c.order_no, orderStatus: c.order_status,
      }));
    },
    /** 分页和筛选均在服务端完成；过期响应不能覆盖新筛选或恢复已退出账号。 */
    async loadPoints(reset = true, direction?: '' | 'in' | 'out') {
      direction = direction === undefined ? this.pointsDirection : direction;
      if (direction !== this.pointsDirection) reset = true;
      if (!reset && (this.pointsLoading || !this.pointsHasMore)) return;
      const seq = ++pointsRequestId;
      if (reset) {
        this.ledger = [];
        this.pointsPage = 0;
        this.pointsDirection = direction;
        this.pointsHasMore = true;
      }
      this.pointsLoading = true;
      this.pointsError = '';
      try {
        const response = await getMemberPoints(reset ? 1 : this.pointsPage + 1, direction);
        if (seq !== pointsRequestId) return;
        const points = response.data;
        this.balance = points.available;
        this.pointRules = points.rules;
        const rows = points.ledger.data.map(entry => ({
          id: entry.id, name: entry.reason, note: entry.order_no || '', date: entry.created_at, amount: entry.amount,
        }));
        this.ledger.push(...rows.filter(row => !this.ledger.some(old => old.id === row.id)));
        this.pointsPage = points.ledger.current_page;
        this.pointsHasMore = this.ledger.length < points.ledger.total;
      } catch (error) {
        if (seq === pointsRequestId) this.pointsError = error instanceof Error ? error.message : '积分加载失败，请重试';
        throw error;
      } finally { if (seq === pointsRequestId) this.pointsLoading = false; }
    },
    /** 首页刷新权益；积分不依赖优惠券请求是否成功。 */
    async loadBenefits() {
      await Promise.all([this.loadPoints(true, ''), this.loadCoupons()]);
    },
    /** 刷新收货地址列表。 */
    async loadAddresses() {
      const requestId = ++addressRequestId;
      this.addressesLoading = true;
      this.addressesError = '';
      try {
        const response = await getAddresses();
        if (requestId !== addressRequestId) return;
        this.addresses = response.data;
        this.addressesLoaded = true;
      } catch (error) {
        if (requestId !== addressRequestId) return;
        this.addressesError = error instanceof Error ? error.message : '地址加载失败，请重试';
        throw error;
      } finally {
        if (requestId === addressRequestId) this.addressesLoading = false;
      }
    },
    /** 保存收货地址并刷新列表。 */
    async saveAddress(input: AddressInput & { id?: number }) {
      const { id, ...data } = input;
      await (id ? updateAddress(id, data) : addAddress(data));
      try { await this.loadAddresses(); } catch { /* 已保存，列表可稍后重试 */ }
    },
    /** 删除收货地址并刷新列表。 */
    async deleteAddress(id: number) {
      await deleteAddress(id);
      try { await this.loadAddresses(); } catch { /* 服务端删除已经成功 */ }
    },
    /** 设置默认收货地址并刷新列表。 */
    async setDefaultAddress(id: number) {
      await setDefaultAddress(id);
      try { await this.loadAddresses(); } catch { /* 服务端设置已经成功 */ }
    },
    /** 退出登录时清理地址缓存及可能包含邮寄信息的订单。 */
    clearPrivate() {
      sessionEpoch++;
      pointsRequestId++;
      couponsRequestId++;
      addressRequestId++;
      ordersRequestId++;
      this.ordersLoading = false;
      this.addresses = [];
      this.addressesLoading = false;
      this.addressesLoaded = false;
      this.addressesError = '';
      this.orders = [];
      this.coupons = [];
      this.balance = 0;
      this.ledger = [];
      this.pointRules = null;
      this.pointsLoading = false;
      this.pointsError = '';
      this.pointsPage = 0;
      this.pointsHasMore = true;
      this.pointsDirection = '';
      this.ordersError = '';
      this.ordersPage = 0;
      this.ordersHasMore = true;
      this.ordersFilter = '';
    },
  },
});
