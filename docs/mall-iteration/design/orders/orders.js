const Page={...OrderActions,render(){let html="";p.filter??='全部';const list=data.orders.filter(o=>p.filter==='全部'||o.state===p.filter);html=tabs(['全部','待付款','办理中','已完成','售后退款'],p.filter,'filter')+`<div class="page-body">${hint('订单与金额均为演示数据')}${list.length?list.map(orderCard).join(''):empty('package-open','暂无相关订单','您可以先浏览喜欢的签证服务',button('去逛逛','browse'))}</div>`
mount(html)}};
if(Preview.guard())render();
