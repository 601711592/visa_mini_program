const Page={render(){let html="",foot="";const t=total();html=`<div class="panel success">${icon('circle-check')}<h2>支付成功</h2><p class="price">¥${money(s.order.t.due)}</p><p class="muted">订单已提交，顾问将尽快与您联系</p>${btn('查看订单','go:order','primary full')}${btn('返回个人中心','go:mine','secondary full')}<div class="notice">交易完成后发放消费积分</div></div>`;
mountCommerce(html,foot)},click(a,v,z){}};
if(Preview.guard())render();
