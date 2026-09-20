window.Preview=(()=>{
const routes={"mine": "account/personal-center.html", "orders": "orders/orders.html", "order": "orders/order-detail.html", "points": "benefits/points.html", "pointsRules": "benefits/points-rules.html", "coupons": "benefits/coupons.html", "coupon": "benefits/coupon-detail.html", "eligible": "benefits/coupon-products.html", "home": "mall/home.html", "catalog": "mall/catalog.html", "search": "mall/search.html", "goods": "mall/product-detail.html", "cart": "mall/cart.html", "checkout": "orders/checkout.html", "travellers": "orders/travellers.html", "chooseCoupon": "orders/checkout-coupons.html", "payment": "orders/payment.html", "success": "orders/payment-success.html", "refund": "orders/refund.html", "cancel": "orders/cancel.html", "profile": "account/profile.html", "login": "account/login.html", "address": "account/address.html", "editAddress": "account/address-edit.html", "map": "account/map.html", "invite": "invite/invite.html", "inviteRecords": "invite/invite-records.html", "inviteRules": "invite/invite-rules.html", "share": "invite/invite-share.html", "privacy": "account/privacy.html", "phone": "account/phone.html", "terms": "account/terms.html", "logout": "account/logout.html", "deleteAddress": "account/address-delete.html"};
const key='visa-design-pages-v2';let saved;try{saved=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
const state=saved||{center:structuredClone(DemoSeed.center),mall:structuredClone(DemoSeed.mall),logged:true,consent:false,pending:null,trail:[]};
const page=document.body.dataset.page,params=Object.fromEntries(new URLSearchParams(location.search));
const defaults=Object.fromEntries(new URLSearchParams(document.body.dataset.defaults||''));
for(const [k,v] of Object.entries(defaults))if(!(k in params)&&!(k==='scenario'&&params.via))params[k]=v;
function save(){try{sessionStorage.setItem(key,JSON.stringify(state))}catch{}}
function url(id,p={}){const path=routes[id];if(!path)throw Error('Unknown page: '+id);const q=new URLSearchParams();for(const[k,v]of Object.entries(p))if(v!=null)q.set(k,v);return new URL(path+(q.size?'?'+q:''),document.baseURI).href}
function go(id,p={},replace=false){if(!replace)state.trail.push({page,params});save();const target=url(id,{...p,via:1});const event=new CustomEvent('preview:navigate',{detail:{page:id,params:p,url:target},cancelable:true});if(!window.dispatchEvent(event))return;if(replace)location.replace(target);else location.assign(target)}
function back(){const last=state.trail.pop();save();go(last?.page||'mine',last?.params||{},true)}
function icons(){window.lucide?.createIcons()}
function resize(){const width=Math.min(Number(document.querySelector('#width')?.value||390),innerWidth);document.documentElement.style.setProperty('--preview-width',width+'px');document.documentElement.style.setProperty('--scale',width/750)}
function notice(text){const n=document.querySelector('#page-notice');if(n){n.hidden=false;n.textContent=text}}
function guard(){const publicPages=['mine','home','catalog','search','goods','cart','map','login','privacy','phone','terms'];if(!state.logged&&!publicPages.includes(page)){state.pending={page,params};go('login',{},true);return false}return true}
window.addEventListener('pagehide',save);document.addEventListener('click',e=>{const b=e.target.closest('[data-nav],[data-back]');if(b){if(b.hasAttribute('data-back'))back();else go(b.dataset.nav)}});
window.addEventListener('resize',resize);document.querySelector('#width')?.addEventListener('change',resize);
document.querySelector('#reset-preview')?.addEventListener('click',()=>{sessionStorage.removeItem(key);location.assign(url('mine'))});resize();
return {state,page,params,save,go,back,url,icons,notice,guard};})();
