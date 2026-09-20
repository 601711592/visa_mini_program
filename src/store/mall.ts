import { defineStore } from 'pinia';
import { useCenterStore, type CenterOrder } from './center';

/**
 * 商城下单链路静态阶段数据中心（购物车 / 结算 / 出行人 / 模拟支付）。
 * 全部为内存模拟数据，不接真实下单与支付接口；正式金额、库存、优惠资格以后续服务端为准。
 * 金额内部以"分"计算（与商品接口一致），写入个人中心订单时换算为元。
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
  packIndex: number;
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

export function lineKeyOf(x: { goodsId: number; packIndex: number; personIndex: number; date: string }) {
  return `${x.goodsId}|${x.packIndex}|${x.personIndex}|${x.date}`;
}

const now = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

let orderSeq = 0;

export const useMallStore = defineStore('mall', {
  state: () => ({
    cart: [] as CartItem[],
    travellers: {} as Record<string, Traveller[]>,
    checkoutFromCart: true,
    directItem: null as CartItem | null,
    couponId: 0,
    usePoints: true,
    checkoutAddressId: null as number | null, // null 使用默认地址，0 不使用地址，正数为本单选中的地址 ID
  }),
  getters: {
    cartCount: (state) => state.cart.reduce((n, x) => n + x.qty, 0),
    checkoutRows(state): CartItem[] {
      return state.checkoutFromCart ? state.cart.filter((x) => x.selected) : state.directItem ? [state.directItem] : [];
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
      return key;
    },
    setQty(key: string, delta: number) {
      const item = this.cart.find((x) => x.key === key);
      if (!item) return;
      item.qty = Math.max(1, item.qty + delta);
      const list = this.travellers[key];
      if (list && list.length > item.qty) this.travellers[key] = list.slice(0, item.qty);
    },
    toggleSelect(key: string) {
      const item = this.cart.find((x) => x.key === key);
      if (item) item.selected = !item.selected;
    },
    toggleAll(selected: boolean) {
      this.cart.forEach((x) => (x.selected = selected));
    },
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
    },
    setCoupon(id: number) {
      this.couponId = id;
    },
    setUsePoints(value: boolean) {
      this.usePoints = value;
    },
    setTravellers(key: string, list: Traveller[]) {
      this.travellers[key] = list;
    },
    travellersOf(key: string): Traveller[] {
      return this.travellers[key] || [];
    },
    /**
     * 统一演示计价：多人优惠（同明细满 2 人 9 折）→ 优惠券 → 积分。
     * 门槛、上限均为演示值，正式规则以服务端为准。
     */
    totals(): MallTotals {
      const center = useCenterStore();
      const rows = this.checkoutRows;
      const baseCents = rows.reduce((a, x) => a + x.unitPrice * x.qty, 0);
      const people = rows.reduce((a, x) => a + x.qty, 0);
      const discountCents = rows.reduce((a, x) => a + (x.qty >= 2 ? Math.round(x.unitPrice * x.qty * 0.1) : 0), 0);
      const base = baseCents / 100;
      const discount = discountCents / 100;
      const coupon = center.coupons.find((c) => c.id === this.couponId);
      const eligible =
        !!coupon &&
        coupon.status === '未使用' &&
        (!coupon.categoryKeyword || rows.every((x) => x.category.includes(coupon.categoryKeyword))) &&
        base - discount >= coupon.min;
      const couponAmount = eligible ? coupon!.amount : 0;
      const points = this.usePoints
        ? Math.min(center.balance, Math.floor((base * 0.2) / 0.02), Math.max(0, Math.floor((base - discount - couponAmount) / 0.02)))
        : 0;
      const pointsDeduct = Number((points * 0.02).toFixed(2));
      const due = Math.max(0, Number((base - discount - couponAmount - pointsDeduct).toFixed(2)));
      return { base: Number(base.toFixed(2)), people, discount: Number(discount.toFixed(2)), couponAmount, points, pointsDeduct, due };
    },
    /** 提交订单（模拟）：写入个人中心订单、扣减积分、占用优惠券、清理已购明细。 */
    submitOrder(): CenterOrder {
      const center = useCenterStore();
      const selectedAddress = this.checkoutAddressId === 0 ? undefined
        : this.checkoutAddressId === null
          ? center.addresses.find((a) => a.is_default) || center.addresses[0]
          : center.addresses.find((a) => a.id === this.checkoutAddressId);
      const t = this.totals();
      const rows = this.checkoutRows;
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const order: CenterOrder = {
        id: `DDX${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${String(++orderSeq + 100).padStart(4, '0')}`,
        state: '待付款',
        created: now(),
        items: rows.map((x) => ({
          goodsId: x.goodsId,
          goodsName: x.goodsName,
          pack: x.packTitle,
          group: x.personName,
          date: x.date,
          qty: x.qty,
          travellers: this.travellersOf(x.key).map((v) => ({ name: v.name, passport: v.passport.slice(-4), birthday: v.birthday })),
        })),
        base: t.base,
        discount: t.discount,
        coupon: t.couponAmount,
        couponId: t.couponAmount ? this.couponId : null,
        points: t.points,
        due: t.due,
        address: selectedAddress ? {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          province: selectedAddress.province,
          city: selectedAddress.city,
          district: selectedAddress.district,
          street: selectedAddress.street,
        } : null,
      };
      center.orders.unshift(order);
      if (t.points) {
        center.balance -= t.points;
        center.ledger.unshift({ name: '下单积分抵扣', note: order.items[0]?.goodsName || '商城订单', date: now(), amount: -t.points });
      }
      if (order.couponId) {
        const coupon = center.coupons.find((c) => c.id === order.couponId);
        if (coupon) coupon.status = '已使用';
      }
      rows.forEach((x) => delete this.travellers[x.key]);
      if (this.checkoutFromCart) this.cart = this.cart.filter((x) => !x.selected);
      this.directItem = null;
      this.couponId = 0;
      this.usePoints = true;
      this.checkoutAddressId = null;
      return order;
    },
    /** 模拟支付成功：订单转办理中，按实付金额四舍五入发放积分。 */
    completePayment(orderId: string) {
      const center = useCenterStore();
      const order = center.findOrder(orderId);
      if (!order || order.state !== '待付款') return;
      center.mockPaySuccess(orderId);
      const reward = Math.round(order.due);
      if (reward > 0) {
        center.balance += reward;
        center.ledger.unshift({ name: '订单完成奖励', note: order.items[0]?.goodsName || '商城订单', date: now(), amount: reward });
      }
    },
  },
});
