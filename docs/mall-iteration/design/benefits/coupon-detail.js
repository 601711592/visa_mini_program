const Page={...BenefitActions,render(){let html="";const c=data.coupons.find(c=>c.id===p.id);html=`<div class="page-body">${couponCard(c)}${card(`<h3>使用规则</h3>${row('使用门槛',c.min?'订单满足 ¥'+c.min:'无门槛（演示）')}${row('适用范围',c.scope)}${row('有效期至',c.end)}${row('当前状态',c.status)}<p>每个订单限用一张优惠券，可叠加积分使用。</p><p>退款后退回已使用优惠券；过期券返还后的有效性待确认。</p>${hint('本页金额、门槛与有效期均为演示配置，以正式券规则为准。')}`)}</div>`
mount(html)}};
if(Preview.guard())render();
