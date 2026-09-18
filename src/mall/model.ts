/** 前端演示领域；不请求接口、不触发授权或支付、不持久化私人数据。 */
export type OrderStatus = '待付款' | '办理中' | '已完成' | '售后退款' | '已取消';
export interface Traveller { name: string; passport: string; birthday: string }
export interface Address { id: string; name: string; phone: string; region: string[]; detail: string; isDefault: boolean }
export interface Selection {
  productId: string; name: string; cover: string; categoryId: number;
  specKey: string; specName: string; group: string; date: string;
  unitCents: number; quantity: number; stock: number;
  travellersRequired: boolean; shippingRequired: boolean;
}
export interface Line extends Selection { id: string; selected: boolean; travellers: Traveller[] }
export interface Coupon {
  id: string; name: string; cents: number; minimumCents: number; categoryIds: number[];
  scope: string; end: string; status: '未使用' | '已使用' | '已过期'; reservedBy?: string;
}
export interface Price { base: number; groupDiscount: number; coupon: number; points: number; pointsCents: number; due: number }
export interface Draft { id: string; lines: Line[]; couponId: string; usePoints: boolean; consent: boolean; addressId: string; source: 'cart' | 'buy' }
export interface Order { id: string; status: OrderStatus; createdAt: string; lines: Line[]; price: Price; couponId: string; address?: Address; reason?: string; note?: string; payment: 'idle' | 'failed' | 'cancelled' | 'succeeded' }
export interface Ledger { id: string; title: string; detail: string; at: string; amount: number }
export interface State {
  member: boolean; nickname: string; avatar: string; balance: number; cart: Line[];
  addresses: Address[]; coupons: Coupon[]; orders: Order[]; ledger: Ledger[];
  draft: Draft | null; submitted: Record<string, string>; sequence: number;
}
export const money = (cents: number) => (cents / 100).toFixed(2);
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const day = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const lineId = (s: Selection) => 'sku-' + Array.from(JSON.stringify([String(s.productId), s.specKey, s.group, s.date])).map(c => c.codePointAt(0)!.toString(16)).join('-');
export const newTraveller = (): Traveller => ({ name: '', passport: '', birthday: '' });
const fail = (message: string): never => { throw new Error(message); };
const requireMember = (s: State) => { if (!s.member) fail('请先登录演示账号'); };
const quantityValid = (n: number, max = 99) => Number.isInteger(n) && n >= 1 && n <= Math.min(99, max);
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0,10) === s;
export function createState(): State {
  return { member: false, nickname: '张女士', avatar: '', balance: 1280, cart: [], addresses: [], orders: [], draft: null, submitted: {}, sequence: 0,
    coupons: [
      { id:'new', name:'新人专享券', cents:1000, minimumCents:0, categoryIds:[], scope:'全店商品', end:'2026-10-15', status:'未使用' },
      { id:'visa', name:'签证满减券', cents:5000, minimumCents:100000, categoryIds:[1], scope:'签证服务', end:'2026-10-31', status:'未使用' },
      { id:'travel-used', name:'旅行满减券', cents:10000, minimumCents:300000, categoryIds:[2], scope:'定制旅游', end:'2026-09-30', status:'已使用' },
      { id:'expired', name:'签证优惠券', cents:2000, minimumCents:80000, categoryIds:[1], scope:'签证服务', end:'2026-08-31', status:'已过期' },
    ],
    ledger: [
      { id:'seed1',title:'订单完成奖励',detail:'日本单次旅游签证',at:'2026-09-15 15:20',amount:699 },
      { id:'seed2',title:'下单积分抵扣',detail:'美国旅游签证',at:'2026-09-12 09:30',amount:-500 },
      { id:'seed3',title:'订单完成奖励',detail:'签证办理服务',at:'2026-09-08 11:10',amount:1081 },
    ],
  };
}
export function makeLine(selection: Selection): Line {
  if (!selection.productId || !selection.specKey || !selection.group || !validDate(selection.date)) fail('请选择商品套餐、人群和有效出发日期');
  if (!Number.isSafeInteger(selection.unitCents) || selection.unitCents < 0) fail('商品价格无效');
  if (!quantityValid(selection.quantity, selection.stock)) fail('购买人数超出可选范围');
  return { ...clone(selection), id: lineId(selection), selected: true, travellers: [] };
}
export function addToCart(s: State, selection: Selection): Line {
  const line = makeLine(selection);
  const old = s.cart.find(i => i.id === line.id);
  if (old) {
    if (!quantityValid(old.quantity + line.quantity, Math.min(old.stock, line.stock))) fail('已超出该套餐可购买人数');
    old.quantity += line.quantity; old.selected = true; return old;
  }
  s.cart.push(line); return line;
}
export function setQuantity(s: State, id: string, quantity: number) {
  const line = s.cart.find(i => i.id === id) || fail('购物车商品已不存在');
  if (!quantityValid(quantity, line.stock)) fail('人数需在 1 至可购买数量之间');
  line.quantity = quantity;
}
export function beginCheckout(s: State, lines: Line[], source: 'cart' | 'buy'): Draft {
  if (!lines.length) fail('请先选择商品');
  const previous = s.draft;
  const copy = clone(lines);
  copy.forEach(line => {
    makeLine(line);
    const old = previous?.lines.find(i => i.id === line.id);
    line.travellers = clone((old?.travellers || []).slice(0,line.quantity));
  });
  s.draft = { id: `draft-${++s.sequence}`, lines: copy, couponId:'', usePoints:false, consent:false, addressId:s.addresses.find(a=>a.isDefault)?.id || '', source };
  return s.draft;
}
export function validateTravellers(line: Line, values = line.travellers, today = day()): string {
  if (!line.travellersRequired) return '';
  if (values.length !== line.quantity) return `请完善「${line.name}」的 ${line.quantity} 位出行人`;
  const seen = new Set<string>();
  for (let i=0; i<values.length; i++) {
    const t=values[i], label=`第 ${i+1} 位出行人`;
    if (!t.name.trim() || t.name.trim().length > 80) return `${label}姓名未填写或过长`;
    if (!/^[A-Za-z0-9]{5,20}$/.test(t.passport.trim())) return `${label}护照号码需为 5–20 位字母或数字`;
    const passport=t.passport.trim().toUpperCase();
    if (seen.has(passport)) return '同一商品的出行人护照号码不能重复';
    seen.add(passport);
    if (!validDate(t.birthday) || t.birthday>today) return `${label}生日无效`;
  }
  return '';
}
export function saveTravellers(s: State, id: string, values: Traveller[]) {
  requireMember(s);
  if(s.draft&&s.submitted[s.draft.id])fail('订单已提交，请在订单详情查看出行人');
  const line=s.draft?.lines.find(i=>i.id===id) || fail('当前商品已变化，请返回确认订单');
  const error=validateTravellers(line,values); if(error) fail(error);
  line.travellers=values.map(t=>({name:t.name.trim(),passport:t.passport.trim().toUpperCase(),birthday:t.birthday}));
}
const discounted = (i: Line) => i.unitCents*i.quantity - (i.quantity>=2 ? Math.round(i.unitCents*i.quantity*0.1) : 0);
export function couponIssue(c: Coupon, lines: Line[], today = day()): string {
  if (c.status !== '未使用' || c.end < today) return '优惠券已使用或已过期';
  if (c.reservedBy) return '该券已被待付款订单占用';
  const eligible=lines.filter(i=>!c.categoryIds.length || c.categoryIds.includes(i.categoryId));
  if(!eligible.length) return '不适用于本单商品';
  if(eligible.reduce((n,i)=>n+discounted(i),0)<c.minimumCents) return '适用商品金额未达到使用门槛';
  return '';
}
export function quote(lines: Line[], coupon: Coupon | undefined, usePoints: boolean, balance: number, today = day()): Price {
  const base=lines.reduce((n,i)=>n+i.unitCents*i.quantity,0);
  const afterGroup=lines.reduce((n,i)=>n+discounted(i),0);
  const eligible= coupon ? lines.filter(i=>!coupon.categoryIds.length||coupon.categoryIds.includes(i.categoryId)).reduce((n,i)=>n+discounted(i),0) : 0;
  const saving= coupon && !couponIssue(coupon,lines,today) ? Math.min(coupon.cents,eligible) : 0;
  // 仅演示：1 积分抵 2 分，上限暂用原价 20%，不代表正式结算策略。
  const points=usePoints ? Math.max(0,Math.min(Math.floor(balance),Math.floor(base*.2/2),Math.floor((afterGroup-saving)/2))) : 0;
  return {base,groupDiscount:base-afterGroup,coupon:saving,points,pointsCents:points*2,due:afterGroup-saving-points*2};
}
export function draftPrice(s: State): Price {
  return quote(s.draft?.lines||[],s.coupons.find(c=>c.id===s.draft?.couponId),!!s.draft?.usePoints,s.member?s.balance:0);
}
function ledger(s: State,title: string,amount: number,detail: string,at=day()) {
  if(amount) s.ledger.unshift({id:`ledger-${++s.sequence}`,title,amount,detail,at});
}
export function submitOrder(s: State, now = new Date()): Order {
  requireMember(s);
  const draft=s.draft || fail('请重新选择商品');
  const existing=s.orders.find(o=>o.id===s.submitted[draft.id]); if(existing) return existing;
  if(!draft.consent) fail('请先阅读并勾选预订确认');
  if(!draft.lines.length) fail('请先选择商品');
  draft.lines.forEach(i=>{makeLine(i);const error=validateTravellers(i,i.travellers,day(now));if(error)fail(error);});
  const address=s.addresses.find(a=>a.id===draft.addressId);
  if(draft.lines.some(i=>i.shippingRequired)&&!address) fail('请为需要邮寄的商品选择收货地址');
  const coupon=s.coupons.find(c=>c.id===draft.couponId);
  if(draft.couponId && !coupon) fail('优惠券已不存在，请重新选择');
  if(coupon){const error=couponIssue(coupon,draft.lines,day(now));if(error)fail(error);}
  const price=quote(draft.lines,coupon,draft.usePoints,s.balance,day(now));
  const id=`DEMO${day(now).replace(/-/g,'')}${String(++s.sequence).padStart(6,'0')}`;
  const order: Order={id,status:'待付款',createdAt:now.toISOString(),lines:clone(draft.lines),price,couponId:coupon?.id||'',payment:'idle'};
  if(address)order.address=clone(address);
  s.balance-=price.points; ledger(s,'下单积分抵扣',-price.points,id,day(now));
  if(coupon)coupon.reservedBy=id;
  s.orders.unshift(order);s.submitted[draft.id]=id;
  if(draft.source==='cart')s.cart=s.cart.filter(i=>!draft.lines.some(line=>line.id===i.id));
  return order;
}
export function payment(s: State,id: string,result:'succeeded'|'failed'|'cancelled') {
  requireMember(s);
  const order=s.orders.find(o=>o.id===id)||fail('订单不存在');
  if(order.status==='办理中'&&result==='succeeded')return;
  if(order.status!=='待付款')fail('当前订单不可付款');
  order.payment=result;
  if(result==='succeeded'){
    order.status='办理中';const coupon=s.coupons.find(c=>c.id===order.couponId);
    if(coupon&&coupon.reservedBy===id){coupon.status='已使用';delete coupon.reservedBy;}
  }
}
export function cancelOrder(s:State,id:string) {
  requireMember(s);
  const order=s.orders.find(o=>o.id===id)||fail('订单不存在');
  if(order.status==='已取消')return;
  if(order.status!=='待付款')fail('只有待付款订单可以取消');
  order.status='已取消';s.balance+=order.price.points;ledger(s,'取消订单退回积分',order.price.points,id);
  const coupon=s.coupons.find(c=>c.id===order.couponId);if(coupon?.reservedBy===id)delete coupon.reservedBy;
}
export function requestRefund(s:State,id:string,reason:string,note:string,now=new Date()) {
  requireMember(s);
  const order=s.orders.find(o=>o.id===id)||fail('订单不存在');
  if(!['办理中','已完成'].includes(order.status))fail('当前订单不可申请退款');
  if(!reason.trim())fail('请选择退款原因');
  // 仅演示订单创建时间起算；正式起算口径待业务确认。
  const deadline=new Date(order.createdAt);deadline.setMonth(deadline.getMonth()+6);
  if(now>deadline)fail('该演示订单已超过半年，请联系商家');
  order.reason=reason;order.note=note.trim().slice(0,300);order.status='售后退款';
  // 申请不等于批准，不在这里返还资金、券或积分。
}
export function saveAddress(s:State,value:Address):Address {
  requireMember(s);
  if(!value.name.trim())fail('请填写收件人');
  if(!/^1\d{10}$/.test(value.phone.trim()))fail('请填写 11 位手机号码');
  if(value.region.length<2||!value.detail.trim())fail('请完善所在地区和详细地址');
  const old=s.addresses.find(a=>a.id===value.id);
  if(value.id&&!old)fail('地址已不存在，请返回列表');
  const address={...clone(value),name:value.name.trim(),phone:value.phone.trim(),detail:value.detail.trim(),id:value.id||`addr-${++s.sequence}`,isDefault:value.isDefault||!s.addresses.some(a=>a.id!==value.id&&a.isDefault)};
  if(address.isDefault)s.addresses.forEach(a=>a.isDefault=false);
  if(old)Object.assign(old,address);else s.addresses.push(address);
  return address;
}
export function deleteAddress(s:State,id:string){
  requireMember(s);s.addresses=s.addresses.filter(a=>a.id!==id);
  if(s.addresses.length&&!s.addresses.some(a=>a.isDefault))s.addresses[0].isDefault=true;
  if(s.draft?.addressId===id)s.draft.addressId='';
}
export function signOut(s:State){
  const clean=createState();clean.sequence=s.sequence;
  clean.cart=s.cart.map(i=>({...i,travellers:[]}));
  if(s.draft&&!s.submitted[s.draft.id])clean.draft={...clone(s.draft),couponId:'',usePoints:false,consent:false,addressId:'',lines:s.draft.lines.map(i=>({...i,travellers:[]}))};
  Object.assign(s,clean);
}
