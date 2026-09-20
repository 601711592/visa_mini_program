const Page={...BenefitActions,render(){let html="";p.filter??='未使用';html=tabs(['未使用','已使用','已过期'],p.filter,'filter')+`<div class="page-body">${hint(p.purpose==='use'?'先选择一张券，再查看适用商品。':'一单一张，可与积分叠加使用；券条件为演示配置。')}${data.coupons.filter(c=>c.status===p.filter).map(couponCard).join('')}</div>`
mount(html)}};
if(Preview.guard())render();
