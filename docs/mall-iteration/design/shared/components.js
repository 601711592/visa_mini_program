const data=Preview.state.center,p=Preview.params;
for(const key of ['id'])if(p[key]&&['coupon','eligible','editAddress','deleteAddress'].includes(Preview.page))p[key]=Number(p[key]);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=n=>`<i data-lucide="${n}" aria-hidden="true"></i>`;
const money=n=>Number(n).toFixed(2),order=id=>data.orders.find(o=>o.id===id);
let consent=Preview.state.consent, addressDraft=null;
const push=(page,p={})=>Preview.go(page,p),back=()=>Preview.back(),say=Preview.notice;
function flow(page,p={}){if(page==='goods'&&Preview.page==='eligible')p.couponId=Preview.params.id;Preview.go(page,p)}
  const button=(label,action,id='',kind='solid')=>`<button class="${kind}" data-do="${action}" data-id="${esc(id)}">${label}</button>`;
  const link=(label,page,p={})=>`<button class="text-link" data-page="${page}" data-params='${esc(JSON.stringify(p))}'>${label}${ic('chevron-right')}</button>`;
  const card=body=>`<section class="sheet-card">${body}</section>`;
  const hint=t=>`<p class="hint">${t}</p>`;
  const empty=(icon,title,sub,extra='')=>`<div class="empty-state">${ic(icon)}<h3>${title}</h3><p>${sub}</p>${extra}</div>`;
  const row=(key,value)=>`<div class="kv"><span>${key}</span><span>${value}</span></div>`;
  const tabs=(values,current,key)=>`<div class="filter-tabs" role="tablist">${values.map(v=>`<button role="tab" aria-selected="${v===current}" class="${v===current?'selected':''}" data-filter-key="${key}" data-value="${v}">${v}</button>`).join('')}</div>`;
  function infoProduct(item){const g=data.goods[item.goods];return `<div class="order-product"><span class="product-symbol">${ic('book-open')}</span><div><h3>${g.name}</h3><p>${item.pack} · ${item.group}</p><p>${item.date} · ${item.qty} 人</p></div></div>`}
  function orderActions(o){return `<div class="actions">${o.state==='待付款'?button('取消订单','cancel',o.id,'outline')+button('继续付款','payment',o.id):o.state==='办理中'||o.state==='已完成'?button('申请退款','refund',o.id,'outline'):''}${button('查看详情','order',o.id,'outline')}</div>`}
  function orderCard(o){return card(`<div class="card-heading"><small>${o.id}</small><span class="status-tag">${o.state}</span></div>${o.items.map(infoProduct).join('')}<div class="order-total">共 ${o.items.reduce((n,i)=>n+i.qty,0)} 人<span>${o.state==='待付款'?'待支付':'实付'} <b>¥${money(o.due)}</b></span></div>${orderActions(o)}`)}
  function couponCard(c){return `<section class="coupon-card ${c.status!=='未使用'?'dim':''}"><div class="coupon-face"><strong><small>¥</small>${c.amount}</strong><span>${c.min?'满 '+c.min+' 元可用':'无门槛（演示）'}</span></div><div class="coupon-copy"><h3>${c.name}</h3><p>${c.scope} · ${c.end} 到期</p><div class="coupon-actions">${link('使用规则','coupon',{id:c.id})}${c.status==='未使用'?button('去使用','eligible',c.id,'compact'): `<span class="status-tag">${c.status}</span>`}</div></div></section>`}

function mount(html){document.querySelector('#page-content').innerHTML=html;Preview.state.consent=consent;Preview.save();Preview.icons()}
function render(){Page.render()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.page){push(b.dataset.page,JSON.parse(b.dataset.params||'{}'));return}if(b.dataset.filterKey){p[b.dataset.filterKey]=b.dataset.value;render();return}Page.click?.(b,e)});
document.addEventListener('submit',e=>{if(e.target.matches('form[data-form]')){e.preventDefault();if(e.target.reportValidity())Page.submit?.(e.target,Object.fromEntries(new FormData(e.target)))}});
document.addEventListener('change',e=>{if(e.target.id==='consent'){consent=e.target.checked;Preview.state.consent=consent;Preview.save()}Page.change?.(e)});
