let loggedIn=true;
let mallSession=null;
const $=s=>document.querySelector(s);
const panel=$('#subpage'),frame=$('#flow');
function icons(){lucide.createIcons();document.querySelectorAll('.order-grid svg,.detail>svg,.services button>svg:first-child,.product-symbol svg,.empty-state>svg,.status-hero>svg,.menu-row>svg:first-child,.coupon-context>svg,.login-heading>svg').forEach(svg=>{const shapes=svg.querySelectorAll('path,line,circle,polyline');if(shapes.length>1)shapes[shapes.length-1].classList.add('accent')})}
function resize(){const width=Math.min(Number($('#width').value),window.innerWidth);document.documentElement.style.setProperty('--preview-width',width+'px');document.documentElement.style.setProperty('--scale',width/750)}
function state(){const avatar=$('.avatar'),d=Center.data;$('#screen').classList.toggle('guest',!loggedIn);$('#name').textContent=loggedIn?d.nickname:'点击登录';$('#phone').textContent=loggedIn?'138****6688':'登录后查看订单与权益';$('#points').textContent=loggedIn?'当前积分 '+d.balance:'登录后查看';$('#coupons').textContent=loggedIn?d.coupons.filter(c=>c.status==='未使用').length+' 张可用':'登录后查看';$('#toggle').textContent=loggedIn?'切换游客态':'切换已登录态';avatar.innerHTML=loggedIn?'':'<i data-lucide="user-round"></i>';avatar.removeAttribute('style');if(loggedIn&&d.avatar){avatar.style.backgroundImage=`url('${d.avatar}')`;avatar.style.backgroundSize='cover';avatar.style.backgroundPosition='center'}avatar.setAttribute('aria-label',loggedIn?'演示用户头像':'游客头像');icons()}
function backgroundInert(value){document.querySelectorAll('#screen > header,#screen > main,#screen > nav').forEach(el=>el.inert=value)}
function close(){panel.classList.remove('is-mall','is-catalog');backgroundInert(false);panel.hidden=true;frame.hidden=true;frame.src='about:blank';$('#local-content').innerHTML=''}
function show(title){panel.classList.remove('is-mall','is-catalog');backgroundInert(true);panel.hidden=false;frame.hidden=true;frame.src='about:blank';$('#local-content').hidden=false;$('#sub-title').textContent=title;panel.scrollTop=0}
function archivedFlow(route,p={}){panel.classList.add('is-mall');panel.classList.toggle('is-catalog',route==='catalog');backgroundInert(true);panel.hidden=false;$('#sub-title').textContent=route==='goods'?'商品详情':'商城';$('#local-content').hidden=true;frame.hidden=false;const query=new URLSearchParams({page:route,logged:loggedIn?'1':'0',...p});frame.src='flow.html?'+query}
function openRoute(route,filter='',purpose='',auth=false){if(route==='catalog'&&auth&&!loggedIn){Center.open('points',{useAfterLogin:true});return}if(!Center.open(route,{filter:filter||undefined,purpose}))archivedFlow(route)}
// Homepage controls only; subpage actions belong to Center.
$('#screen').addEventListener('click',e=>{if(e.target.closest('#subpage'))return;const el=e.target.closest('button');if(!el)return;if(el.dataset.route)openRoute(el.dataset.route,el.dataset.filter||'',el.dataset.purpose||'',el.dataset.auth==='true');if(el.dataset.local)Center.open(el.dataset.local)});
window.addEventListener('message',e=>{
  if(e.source!==frame.contentWindow||frame.hidden)return;
  if(e.origin!==location.origin&&location.origin!=='null')return;
  if(e.data?.type==='mall-ready'){
    const d=Center.data,a=d.addresses.find(a=>a.default)||d.addresses[0];
    frame.contentWindow.postMessage({type:'mall-init',snapshot:mallSession,profile:{logged:loggedIn,nickname:d.nickname,balance:d.balance,address:a?{name:a.name,phone:a.phone,area:[a.region,a.street].filter(Boolean).join(' ')}:null,orders:d.orders.filter(o=>o.mallSource).map(o=>o.mallSource)}},location.origin==='null'?'*':location.origin);return;
  }
  if(e.data?.type!=='personal-flow')return;
  if(e.data.snapshot){mallSession=e.data.snapshot;Center.syncMall(mallSession)}
  if(e.data.logged!==loggedIn)loggedIn=e.data.logged;
  if(e.data.nickname&&loggedIn)Center.data.nickname=e.data.nickname;
  state();panel.classList.toggle('is-catalog',e.data.page==='catalog');$('#sub-title').textContent=e.data.title||'商城';
  if(e.data.page==='mine'){if(Center.active())Center.resume();else close()}
});
Center.init({icons,show,close,flow:archivedFlow,logged:()=>loggedIn,login:()=>{loggedIn=true;state()},logout:()=>{loggedIn=false;if(mallSession){mallSession.travellers={};mallSession.address=null;mallSession.contact='';mallSession.consent=false;mallSession.loggedIn=false}close();state()},update:state});
$('#toggle').onclick=()=>{loggedIn=!loggedIn;if(!loggedIn){Center.clearPrivate();if(mallSession){mallSession.travellers={};mallSession.address=null;mallSession.contact='';mallSession.consent=false;mallSession.loggedIn=false}}else Center.reset();close();state()};$('#back').onclick=()=>{if(!frame.hidden){frame.contentWindow.postMessage({type:'mall-back'},location.origin==='null'?'*':location.origin)}else if(Center.active())Center.back();else close()};$('#width').onchange=resize;window.addEventListener('resize',resize);resize();state();

// Review links open directly to a page without changing the production scope.
const review=new URLSearchParams(location.search),reviewPage=review.get('page');
if(reviewPage){const options={};if(review.get('id'))options.id=['coupon','eligible'].includes(reviewPage)?Number(review.get('id')):review.get('id');if(review.get('filter'))options.filter=review.get('filter');if(reviewPage==='login'){loggedIn=false;state();Center.open('profile')}else if(!Center.open(reviewPage,options)&&['home','catalog','search','goods','cart','checkout','travellers','chooseCoupon','payment','success'].includes(reviewPage))archivedFlow(reviewPage,{scenario:review.get('scenario')||''})}

document.querySelectorAll('[data-mall-nav]').forEach(button=>button.addEventListener('click',()=>{if(!frame.hidden)frame.contentWindow.postMessage({type:'mall-nav',page:button.dataset.mallNav},location.origin==='null'?'*':location.origin)}));
