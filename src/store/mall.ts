import { defineStore } from 'pinia';
import type { OrderQuote, OrderSelection } from '@/services/orders';

/**
 * 商品选择与出行人草稿只保存在内存；金额采用服务端报价，不在客户端推算优惠。
 */

export interface Traveller {
  name: string;
  passport: string;
  birthday: string;
}

export interface CartItem {
  key: string; // 商品明细 key：goodsId|packIndex|personIndex|date
  goodsId: number;
  goodsName: string;
  cover: string;
  category: string; // 分类名，用于优惠券适用范围匹配
  categoryId?: number; // 服务端商品分类编号
  packIndex: number;
  packageKey?: string; // 商品配置中的稳定套餐 key；旧购物车草稿不参与真实结算
  packTitle: string;
  personIndex: number;
  personName: string;
  date: string;
  qty: number;
  unitPrice: number; // 单价（分/人）
  selected: boolean;
  needsTravellers: boolean;
}

export interface MallTotals {
  base: number; // 商品原价总额（元）
  people: number;
  discount: number; // 多人优惠（元）
  couponAmount: number; // 优惠券（元）
  points: number; // 使用积分
  pointsDeduct: number; // 积分抵扣金额（元）
  due: number; // 实付（元）
}

/** 根据商品、套餐、人群和日期生成明细键。 */
export function lineKeyOf(x: { goodsId: number; packIndex: number; personIndex: number; date: string }) {
  return `${x.goodsId}|${x.packIndex}|${x.personIndex}|${x.date}`;
}

export const useMallStore = defineStore('mall', {
  state: () => ({
    cart: [] as CartItem[], // 保留的购物车草稿，本轮不参与结算
    travellers: {} as Record<string, Traveller[]>, // 按商品选择键保存的出行人草稿
    checkoutFromCart: true, // 是否来自购物车，当前只开放立即购买
    directItem: null as CartItem | null, // 立即购买的商品选择
    couponId: 0, // 选中的优惠券编号，0 表示不使用
    usePoints: true, // 是否希望使用积分抵扣
    checkoutAddressId: null as number | null, // null 使用默认地址；提交时必须落实为有效 ID
    quote: null as OrderQuote | null, // 与当前选择匹配的服务端报价
  }),
  getters: {
    cartCount: (state) => state.cart.reduce((n, x) => n + x.qty, 0),
    /** 获取当前参与结算的商品。 */
    checkoutRows(state): CartItem[] {
      // 本轮只开放商品详情的单明细「立即购买」。
      return state.checkoutFromCart ? [] : state.directItem ? [state.directItem] : [];
    },
  },
  actions: {
    /** 加入购物车：同明细合并数量。 */
    addToCart(item: Omit<CartItem, 'key' | 'selected'>) {
      const key = lineKeyOf(item);
      const existing = this.cart.find((x) => x.key === key);
      if (existing) existing.qty += item.qty;
      else this.cart.push({ ...item, key, selected: true });
      return key;
    },
    /** 立即购买：不入购物车，直接作为结算行。 */
    buyNow(item: Omit<CartItem, 'key' | 'selected'>) {
      const key = lineKeyOf(item);
      this.directItem = { ...item, key, selected: true };
      this.checkoutFromCart = false;
      this.couponId = 0;
      this.usePoints = true;
      this.checkoutAddressId = null;
      this.quote = null;
      return key;
    },
    /** 调整购买数量并裁剪多余出行人。 */
    setQty(key: string, delta: number) {
      const item = this.cart.find((x) => x.key === key);
      if (!item) return;
      item.qty = Math.max(1, item.qty + delta);
      const list = this.travellers[key];
      if (list && list.length > item.qty) this.travellers[key] = list.slice(0, item.qty);
    },
    /** 切换商品选中状态。 */
    toggleSelect(key: string) {
      const item = this.cart.find((x) => x.key === key);
      if (item) item.selected = !item.selected;
    },
    /** 全选或取消选择购物车商品。 */
    toggleAll(selected: boolean) {
      this.cart.forEach((x) => (x.selected = selected));
    },
    /** 移除商品及其出行人草稿。 */
    removeItem(key: string) {
      this.cart = this.cart.filter((x) => x.key !== key);
      delete this.travellers[key];
    },
    /** 从购物车结算选中的商品。 */
    checkoutSelected() {
      this.checkoutFromCart = true;
      this.directItem = null;
      this.couponId = 0;
      this.usePoints = true;
      this.checkoutAddressId = null;
      this.quote = null;
    },
    /** 两个结算页面共用当前选择，金额与券资格均由服务端计算。 */
    selection(): OrderSelection | null {
      const item = this.checkoutRows[0];
      if (!item?.packageKey) return null;
      return {
        goods_id: item.goodsId, package_key: item.packageKey, person_name: item.personName,
        travel_date: item.date, quantity: item.qty, coupon_id: this.couponId || null,
        use_points: this.usePoints,
      };
    },
    /** 选择优惠券并清空旧报价。 */
    setCoupon(id: number) {
      this.couponId = id;
      this.quote = null;
    },
    /** 切换积分抵扣并清空旧报价。 */
    setUsePoints(value: boolean) {
      this.usePoints = value;
      this.quote = null;
    },
    /** 保存当前商品的出行人资料。 */
    setTravellers(key: string, list: Traveller[]) {
      this.travellers[key] = list;
    },
    /** 获取当前商品的出行人资料。 */
    travellersOf(key: string): Traveller[] {
      return this.travellers[key] || [];
    },
    /** 将服务端分金额转换成页面使用的元金额。 */
    totals(q: OrderQuote | null = this.quote): MallTotals {
      return q ? {
        base: q.base_cents / 100, people: q.quantity, discount: q.group_discount_cents / 100,
        couponAmount: q.coupon_cents / 100, points: q.points_used,
        pointsDeduct: q.points_cents / 100, due: q.due_cents / 100,
      } : { base: 0, people: 0, discount: 0, couponAmount: 0, points: 0, pointsDeduct: 0, due: 0 };
    },
  },
});
