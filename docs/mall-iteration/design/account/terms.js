const Page={...AccountActions,render(){let html="";html=`<div class="page-body">${card(`<h3>${p.kind==='privacy'?'隐私保护指引':'用户服务协议'}</h3><span class="status-tag">原型摘要 · 非正式协议</span><p>${p.kind==='privacy'?'手机号用于账号绑定与订单联系。头像昵称在您自愿完善时用于个人资料展示。收货地址用于材料或护照寄送。':'账号使用、下单、支付与售后处理应遵循商品信息、确认订单和正式公布的服务条款。'}</p><p>正式上线前需补齐运营主体、联系方式、保存期限及撤回授权、删除信息等条款。</p>`)}</div>`;
mount(html)}};
if(Preview.guard())render();
