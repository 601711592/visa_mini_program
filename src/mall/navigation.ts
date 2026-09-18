export const routes = {
  home:'/pages/mall/index',category:'/pages/category/index',account:'/pages/account/index',login:'/pages/login/index',
  cart:'/pagesMall/cart/index',checkout:'/pagesMall/checkout/index',travellers:'/pagesMall/travellers/index',chooseCoupon:'/pagesMall/chooseCoupon/index',
  success:'/pagesMall/success/index',cancel:'/pagesMall/cancel/index',payment:'/pagesMall/payment/index',orders:'/pagesMall/orders/index',order:'/pagesMall/order/index',refund:'/pagesMall/refund/index',
  points:'/pagesMall/points/index',pointsRules:'/pagesMall/pointsRules/index',coupons:'/pagesMall/coupons/index',coupon:'/pagesMall/coupon/index',eligible:'/pagesMall/eligible/index',
  addresses:'/pagesMall/addresses/index',addressEdit:'/pagesMall/addressEdit/index',profile:'/pagesMall/profile/index',map:'/pagesMall/map/index',
  invite:'/pagesMall/invite/index',inviteRecords:'/pagesMall/inviteRecords/index',inviteRules:'/pagesMall/inviteRules/index',inviteShare:'/pagesMall/inviteShare/index',
} as const;
export type PageName=keyof typeof routes;
export function go(page:PageName,params:Record<string,string>={}){
  const url=routes[page];
  if(page==='home'||page==='category'||page==='account'){uni.switchTab({url});return;}
  const query=Object.entries(params).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  uni.navigateTo({url:url+(query?'?'+query:'')});
}
export function back(){if(getCurrentPages().length>1)uni.navigateBack();else go('account');}
export function attempt<T>(action:()=>T):T|undefined{try{return action();}catch(error){uni.showToast({title:error instanceof Error?error.message:'操作未完成，请重试',icon:'none',duration:3000});}}
export function confirm(title:string,content:string,action:()=>void){uni.showModal({title,content,success:result=>{if(result.confirm)attempt(action);}});}
