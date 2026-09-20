import { defineStore } from 'pinia';
import { getToken } from '@/utils/request';
import { addAddress, updateAddress, deleteAddress, setDefaultAddress, getAddresses, type Address, type AddressInput } from '@/services/address';

export type { Address } from '@/services/address';

let addressRequestId = 0;

/**
 * 个人中心数据中心。收货地址从服务端加载；订单、积分和优惠券仍为内存演示，
 * 不发生真实支付。正式金额、库存、优惠资格与订单状态以后续服务端接口为准。
 */

export type OrderState = '待付款' | '办理中' | '已完成' | '售后退款' | '已取消';
export type CouponStatus = '未使用' | '已使用' | '已过期';

export interface OrderTraveller {
  name: string;
  passport: string; // 护照尾号
  birthday: string;
}

export interface OrderItem {
  goodsId: number;
  goodsName: string;
  pack: string;
  group: string;
  date: string;
  qty: number;
  travellers: OrderTraveller[];
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
  due: number; // 实付/待支付
  address?: Pick<Address, 'name' | 'phone' | 'province' | 'city' | 'district' | 'street'> | null; // 下单时的邮寄地址快照
  reason?: string;
  note?: string;
}

export interface LedgerEntry {
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
  categoryKeyword: string; // 适用商品分类匹配关键词，空串表示全店
  end: string;
}

const demoTraveller: OrderTraveller = { name: '张女士', passport: '5628', birthday: '1992-05-12' };

function demoOrders(): CenterOrder[] {
  return [
    {
      id: 'DDX202609160001', state: '待付款', created: '2026-09-16 10:24',
      items: [{ goodsId: 0, goodsName: '日本单次旅游签证', pack: '标准办理', group: '成人', date: '2026-10-12', qty: 1, travellers: [demoTraveller] }],
      base: 699, discount: 0, coupon: 0, couponId: null, points: 0, due: 699,
    },
    {
      id: 'DDX202609150002', state: '办理中', created: '2026-09-15 14:30',
      items: [
        { goodsId: 0, goodsName: '美国旅游签证 · 专业办理', pack: '标准办理', group: '成人', date: '2026-10-15', qty: 1, travellers: [demoTraveller] },
        { goodsId: 0, goodsName: '美国旅游签证 · 专业办理', pack: '标准办理', group: '成人', date: '2026-10-20', qty: 1, travellers: [{ name: '李先生', passport: '9031', birthday: '1990-08-21' }] },
      ],
      base: 2598, discount: 0, coupon: 50, couponId: 2, points: 500, due: 2538,
    },
    {
      id: 'DDX202609080003', state: '已完成', created: '2026-09-08 09:12',
      items: [{ goodsId: 0, goodsName: '日本单次旅游签证', pack: '标准办理', group: '成人', date: '2026-09-20', qty: 1, travellers: [demoTraveller] }],
      base: 699, discount: 0, coupon: 10, couponId: 1, points: 0, due: 689,
    },
    {
      id: 'DDX202609010004', state: '售后退款', created: '2026-09-01 11:40',
      items: [{ goodsId: 0, goodsName: '美国旅游签证 · 专业办理', pack: '标准办理', group: '成人', date: '2026-09-25', qty: 1, travellers: [demoTraveller] }],
      base: 1299, discount: 0, coupon: 0, couponId: null, points: 0, due: 1299, reason: '出行计划变更',
    },
  ];
}

function demoCoupons(): Coupon[] {
  return [
    { id: 1, name: '新人专享券', amount: 10, min: 0, status: '未使用', scope: '全店商品', categoryKeyword: '', end: '2026.10.15' },
    { id: 2, name: '签证满减券', amount: 50, min: 1000, status: '未使用', scope: '签证服务', categoryKeyword: '签证', end: '2026.10.31' },
    { id: 3, name: '旅行满减券', amount: 100, min: 3000, status: '已使用', scope: '定制旅游', categoryKeyword: '旅游', end: '2026.09.30' },
    { id: 4, name: '签证优惠券', amount: 20, min: 800, status: '已过期', scope: '签证服务', categoryKeyword: '签证', end: '2026.08.31' },
  ];
}

export const useCenterStore = defineStore('center', {
  state: () => ({
    balance: 1280,
    ledger: [
      { name: '订单完成奖励', note: '日本单次旅游签证', date: '2026-09-15 15:20', amount: 699 },
      { name: '下单积分抵扣', note: '美国旅游签证', date: '2026-09-12 09:30', amount: -500 },
      { name: '订单完成奖励', note: '签证办理服务', date: '2026-09-08 11:10', amount: 1081 },
    ] as LedgerEntry[],
    coupons: demoCoupons(),
    orders: demoOrders(),
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
    /** 模拟支付成功，不发起真实扣款。 */
    mockPaySuccess(id: string) {
      const order = this.findOrder(id);
      if (order?.state === '待付款') order.state = '办理中';
    },
    /** 模拟取消待付款订单：返还已用积分与优惠券。 */
    mockCancelOrder(id: string) {
      const order = this.findOrder(id);
      if (order?.state !== '待付款') return;
      order.state = '已取消';
      if (order.points) {
        this.balance += order.points;
        this.ledger.unshift({ name: '订单取消返还', note: '商城订单积分变动', date: '2026-09-16（模拟）', amount: order.points });
      }
      const coupon = this.coupons.find((c) => c.id === order.couponId);
      if (coupon && coupon.status === '已使用') coupon.status = '未使用';
    },
    /** 模拟整单退款申请。 */
    mockRefund(id: string, reason: string, note: string) {
      const order = this.findOrder(id);
      if (!order || !['办理中', '已完成'].includes(order.state)) return;
      order.state = '售后退款';
      order.reason = reason;
      order.note = note;
    },
    async loadAddresses() {
      const token = getToken();
      if (!token) return;
      const requestId = ++addressRequestId;
      this.addressesLoading = true;
      this.addressesError = '';
      try {
        const response = await getAddresses();
        if (requestId !== addressRequestId || token !== getToken()) return;
        this.addresses = response.data;
        this.addressesLoaded = true;
      } catch (error) {
        if (requestId !== addressRequestId || token !== getToken()) return;
        this.addressesError = error instanceof Error ? error.message : '地址加载失败，请重试';
        throw error;
      } finally {
        if (requestId === addressRequestId) this.addressesLoading = false;
      }
    },
    async saveAddress(input: AddressInput & { id?: number }) {
      const token = getToken();
      const { id, ...data } = input;
      const response = id ? await updateAddress(id, data) : await addAddress(data);
      if (token !== getToken()) return;
      this.addresses = this.addresses.filter((a) => a.id !== response.data.id);
      if (response.data.is_default) this.addresses.forEach((a) => (a.is_default = false));
      this.addresses.unshift(response.data);
      try { await this.loadAddresses(); } catch { /* 已保存，列表可稍后重试 */ }
    },
    async deleteAddress(id: number) {
      const token = getToken();
      await deleteAddress(id);
      if (token !== getToken()) return;
      const wasDefault = this.addresses.find((a) => a.id === id)?.is_default;
      this.addresses = this.addresses.filter((a) => a.id !== id);
      if (wasDefault) {
        const next = [...this.addresses].sort((a, b) => b.id - a.id)[0];
        if (next) next.is_default = true;
      }
      try { await this.loadAddresses(); } catch { /* 服务端删除已经成功 */ }
    },
    async setDefaultAddress(id: number) {
      const token = getToken();
      await setDefaultAddress(id);
      if (token !== getToken()) return;
      this.addresses.forEach((a) => (a.is_default = a.id === id));
      try { await this.loadAddresses(); } catch { /* 服务端设置已经成功 */ }
    },
    /** 退出登录时清理地址缓存及可能包含邮寄信息的模拟订单。 */
    clearPrivate() {
      addressRequestId++;
      this.addresses = [];
      this.addressesLoading = false;
      this.addressesLoaded = false;
      this.addressesError = '';
      this.orders = demoOrders();
    },
  },
});
