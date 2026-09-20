const Page={...OrderActions,render(){if(['order','payment','refund','cancel'].includes(Preview.page)&&!order(p.id)){mount('<div class="page-body">订单不存在或已重置。<button data-nav="orders">查看订单</button></div>');return;}let html="";html=`<div class="page-body">${card(`<h3>确认取消这笔订单？</h3><p>取消后将无法继续支付这笔订单，您可以重新选购。</p>${row('订单号',p.id)}<div class="button-stack">${button('确认取消','confirmCancel',p.id)}${button('保留订单','back','','outline')}</div>`)}</div>`
mount(html)}};
if(Preview.guard())render();
