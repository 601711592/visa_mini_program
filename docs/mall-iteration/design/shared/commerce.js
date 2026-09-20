const root=document.getElementById('visa-proto'),s=Preview.state.mall;
s.loggedIn=Preview.state.logged;s.boundPhone=s.loggedIn;s.firstPhoneReward=s.loggedIn;s.nickname=Preview.state.center.nickname;s.balance=Preview.state.center.balance;
s.orders=Preview.state.center.orders.filter(x=>x.mallSource).map(x=>x.mallSource);
const a=Preview.state.center.addresses.find(x=>x.default)||Preview.state.center.addresses[0];s.address=a?{name:a.name,phone:a.phone,area:[a.region,a.street].join(' ')}:null;
s.page=Preview.page;s.notice='';
const packs=[{name:'标准办理',price:1299},{name:'加急办理',price:1599}];
const coupons=[{id:1,name:'新人专享券',amount:10,min:0,scope:'全店商品可用',end:'2026.10.15'},{id:2,name:'签证满减券',amount:50,min:1000,scope:'签证商品可用',end:'2026.10.31'}];
const icon=n=>`<i data-lucide="${n}" aria-hidden="true"></i>`;
const btn=(text,action,cls='secondary')=>`<button class="${cls}" data-action="${action}">${text}</button>`;
const money=n=>Number(n).toFixed(2);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const protectedPages=['invite','checkout','travellers','orders','order','points','coupons','chooseCoupon','address','editAddress','profile','payment','success','refund','avatar'];

const covers=["assets/product-1.jpg", "assets/product-2.jpg"];
const inventory=[{name:'美国旅游签证 · 专业办理',category:'签证服务',price:1299},{name:'日本单次旅游签证',category:'签证服务',price:699},{name:'欧洲定制旅行 · 行程规划',category:'定制旅游',price:8999},{name:'日本定制旅行 · 行程规划',category:'定制旅游',price:5999}];
const categories=['签证服务','定制旅游'];
function currentGoods(){return inventory[s.goodsId]}
function itemPrice(x){return inventory[x.goodsId??0].price+(x.pack===1?300:0)}
function rows(){return s.checkoutCart?s.cart.filter(x=>x.selected):[{goodsId:s.goodsId,person:s.person,pack:s.pack,qty:s.qty,date:s.date}];}
function couponEligible(c,items){return c.id!==2||items.every(x=>inventory[x.goodsId??0].category==='签证服务')}
function total(){const items=rows(),base=items.reduce((a,x)=>a+itemPrice(x)*x.qty,0),people=items.reduce((a,x)=>a+x.qty,0),discount=items.reduce((a,x)=>a+(x.qty>=2?itemPrice(x)*x.qty*.1:0),0),c=coupons.find(x=>x.id===s.coupon),cp=c&&couponEligible(c,items)&&(c.id!==1||s.firstPhoneReward)&&base-discount>=c.min?c.amount:0,pt=s.points?Math.min(s.balance,Math.floor(base*.2/.02),Math.max(0,Math.floor((base-discount-cp)/.02))):0;return{base,people,discount,cp,pt,due:Math.max(0,base-discount-cp-pt*.02)}}
function lineKey(x){return [x.goodsId??0,x.pack,x.person??0,x.date].join('|')}
function assigned(x){return (s.travellers[lineKey(x)]||[]).slice(0,x.qty)}
function cover(x){return '<img class="checkout-cover" src="'+covers[(x.goodsId??0)%2]+'" alt="'+esc(inventory[x.goodsId??0].name)+'商品封面（示例）">'}
function checkoutProduct(x){return '<div class="checkout-product">'+cover(x)+'<div class="checkout-product-info">'+product(x)+'</div></div>'}
function travellerSummary(x){const people=assigned(x);return people.length?people.map((p,i)=>'<div class="traveller-summary"><span>出行人 '+(i+1)+' · '+esc(p.name)+'</span><small>护照尾号 '+esc(p.passport.slice(-4))+'</small></div>').join(''):'<p class="muted">请为此商品填写出行人信息</p>'}
function checkoutLine(x,i){return '<section class="panel checkout-line" data-line-key="'+lineKey(x)+'">'+checkoutProduct(x)+'<div class="line row"><span>¥'+money(itemPrice(x))+' / 人</span><span>共 '+x.qty+' 人</span></div>'+entry('本商品出行人', '需 '+x.qty+' 位 · 已填写 '+assigned(x).length+' 位','editTravellers:'+i)+travellerSummary(x)+'</section>'}
function product(x){return `<div class="visa-heading"><span class="tag">${inventory[x.goodsId??0].category}</span><h3 style="margin:8px 0 2px">${inventory[x.goodsId??0].name}</h3><small>${packs[x.pack].name} · ${['成人','儿童'][x.person??0]} · ${x.date} · ${x.qty} 人</small></div>`}
function breakdown(t){return `<div class="line row"><span>商品总额</span><span>¥${money(t.base)}</span></div><div class="line row"><span>多人优惠</span><span class="mini-price">−¥${money(t.discount)}</span></div><div class="line row"><span>优惠券</span><span class="mini-price">−¥${money(t.cp)}</span></div><div class="line row"><span>积分抵扣（${t.pt} 积分）</span><span class="mini-price">−¥${money(t.pt*.02)}</span></div><div class="line row"><strong>实付金额</strong><span class="price">¥${money(t.due)}</span></div>`}
function entry(name,sub,action,ic='chevron-right'){return `<button class="entry" data-action="${action}"><div class="row"><div>${name}${sub?`<div class="muted">${sub}</div>`:''}</div>${icon(ic)}</div></button>`}
function nav(){return [['home','首页','house'],['catalog','产品分类','layout-grid'],['mine','我的','user-round']].map(([p,n,i])=>`<button class="${s.page===p?'active':''}" data-action="go:${p}">${icon(i)}${n}</button>`).join('')}
function goodsCard(g,i){return `<button class="browse-product" data-action="goods:${i}"><div class="product-cover-label">${g.category}<small>原商品封面</small></div><div class="product-copy"><h3>${g.name}</h3><span>¥ ${g.price}</span></div></button>`}
  function syncMall(snapshot){
    const previous=Preview.state.center.balance;
    if(Number.isFinite(snapshot.balance))Preview.state.center.balance=snapshot.balance;
    if(previous!==Preview.state.center.balance){Preview.state.center.ledger.unshift({name:Preview.state.center.balance<previous?'下单积分抵扣':'订单取消返还',date:'2026-09-20'+'（模拟）',amount:Preview.state.center.balance-previous,note:'商城订单积分变动'})}
    for(const source of snapshot.orders||[]){
      const old=Preview.state.center.orders.find(o=>o.id===source.no);
      const converted={id:source.no,state:source.state,created:'2026-09-20'+'（模拟）',items:source.items.map(i=>({goods:i.goodsId??0,pack:i.pack===1?'加急办理':'标准办理',group:i.person===1?'儿童':'成人',date:i.date,qty:i.qty,travellers:(i.travellers||[]).map(t=>({name:t.name,passport:t.passport.slice(-4),birthday:t.birthday}))})),base:source.t.base,discount:source.t.discount,coupon:source.t.cp,points:source.t.pt,due:source.t.due,reason:source.reason||'出行计划变更',mallSource:source};
      if(old)Object.assign(old,converted);else Preview.state.center.orders.unshift(converted);
    }
    for(const c of Preview.state.center.coupons.filter(c=>c.id<=2)){const used=(snapshot.orders||[]).some(o=>o.coupon===c.id&&o.state!=='已取消');c.status=used?'已使用':'未使用'}
    if(snapshot.address){const a=snapshot.address;const existing=Preview.state.center.addresses.find(x=>x.mallAddress);if(existing)Object.assign(existing,{name:a.name,phone:a.phone,region:'',street:a.area});else if(!Preview.state.center.addresses.some(x=>x.name===a.name&&x.phone===a.phone&&[x.region,x.street].filter(Boolean).join(' ')===a.area))Preview.state.center.addresses.push({id:Date.now(),name:a.name,phone:a.phone,region:'',street:a.area,default:!Preview.state.center.addresses.length,mallAddress:true})}
  }

function saveCommerce(){syncMall(s);Preview.save()}
function go(page){if(s.page==='cart'&&page==='checkout')s.checkoutCart=true;saveCommerce();const params={};if(['payment','order','refund','success'].includes(page)&&s.order)params.id=s.order.no;Preview.go(page,params)}
function render(){Page.render();saveCommerce()}
function mountCommerce(html,foot=''){root.querySelector('main').innerHTML=html;root.querySelector('footer').innerHTML=foot;root.querySelector('footer').hidden=!foot;root.querySelector('nav').innerHTML=nav();root.querySelector('nav').hidden=!['home','catalog','cart'].includes(s.page);if(s.notice)Preview.notice(s.notice);Preview.icons()}
const q=Preview.params;if(q.goodsId!==undefined&&inventory[Number(q.goodsId)])s.goodsId=Number(q.goodsId);if(q.couponId)s.coupon=Number(q.couponId);
if(q.scenario==='checkout'){s.checkoutCart=false;s.goodsId=1;s.qty=1;s.pack=0;s.person=0}
if(s.page==='travellers'&&!rows().some(x=>lineKey(x)===s.editingItem))s.editingItem=lineKey(rows()[0]||{});
if(q.id)s.order=s.orders.find(o=>o.no===q.id)||s.order;
if(s.page==='success'&&!s.order)s.order={no:'DEMO-PREVIEW-SUCCESS',state:'办理中',t:{due:699}};
root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const [a,v,z]=b.dataset.action.split(':');if(a==='go')return go(v);if(a==='back')return Preview.back();if(a==='goods'){s.goodsFrom=s.page;s.goodsId=Number(v);s.pack=0;s.person=0;s.qty=1;s.slide=0;return go('goods')}Page.click?.(a,v,z)});
root.addEventListener('change',e=>{Page.change?.(e.target);saveCommerce()});
root.addEventListener('submit',e=>{e.preventDefault();if(e.target.reportValidity())Page.submit?.(e.target,new FormData(e.target))});
window.addEventListener('pagehide',saveCommerce);
