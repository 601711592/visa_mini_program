import type { Goods } from '@/services/shop';
import { day, makeLine, type State, type Selection, type Order } from './model';
export const categories = [{id:1,name:'签证服务'},{id:2,name:'定制旅游'}];
const products = [
  {id:1,name:'美国旅游签证 · 专业办理',price:1299,category_id:1},
  {id:2,name:'日本单次旅游签证',price:699,category_id:1},
  {id:3,name:'欧洲定制旅行 · 行程规划',price:8999,category_id:2},
  {id:4,name:'日本定制旅行 · 行程规划',price:5999,category_id:2},
];
export function demoGoods(): Goods[] {
  const dates=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i+7);return day(d);});
  return products.map(p=>({ ...p,price:p.price*100,cover:`/static/mall/${p.category_id===1?'passport':'plane'}.png`,images:[`/static/mall/${p.category_id===1?'passport':'plane'}.png`],stock:20,limitBuy:20,
    content:'<p>商品内容沿用现有结构，此处为前端演示素材。</p>',highlights:'套餐、价格与日期均为演示数据，不构成正式报价。',
    trip_description:'<p>行程说明占位，沿用现有结构。</p>',price_description:'<p>费用说明占位，沿用现有结构。</p>',refund_description:'<p>退改规则占位，正式政策待确认。</p>',booking_description:'<p>预订前请核对套餐、出发日期及出行人信息。</p>',
    specification:[{key:'standard',title:p.category_id===1?'标准办理':'行程规划',person:['成人','儿童'],price:String(p.price*100),information:'护照资料\n出行信息',timeSlot:[dates[0],dates[dates.length-1]],priceCalender:dates.map(date=>({date,list:[{person:'成人',price:p.price*100,quota:20},{person:'儿童',price:p.price*100,quota:20}]}))}],
  }));
}
export function seedOrders(s:State){
  const g=demoGoods()[1];
  const base:Selection={productId:String(g.id),name:g.name,cover:g.cover,categoryId:g.category_id,specKey:'standard',specName:'标准办理',group:'成人',date:day(),unitCents:69900,quantity:1,stock:20,travellersRequired:true,shippingRequired:false};
  const statuses:Order['status'][]=['待付款','办理中','已完成','售后退款'];
  statuses.forEach((status,index)=>{
    const line=makeLine(base);line.travellers=[{name:'演示出行人',passport:'E12345628',birthday:'1992-05-12'}];
    const date=new Date();date.setDate(date.getDate()-index-1);
    s.orders.push({id:`DEMO-SAMPLE-${++s.sequence}`,status,createdAt:date.toISOString(),lines:[line],price:{base:69900,groupDiscount:0,coupon:0,points:0,pointsCents:0,due:69900},couponId:'',payment:status==='待付款'?'idle':'succeeded',...(status==='售后退款'?{reason:'出行计划变更'}:{})});
  });
}
