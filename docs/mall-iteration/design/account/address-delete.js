const Page={...AccountActions,render(){if(!data.addresses.some(x=>x.id===p.id)){mount('<div class="page-body">地址不存在或已删除。<button data-nav="address">返回地址列表</button></div>');return;}let html="";const a=data.addresses.find(a=>a.id===p.id);html=`<div class="page-body">${card(`<h3>确认删除这个地址？</h3><p>${esc(a.name)} · ${esc(a.region)} ${esc(a.street)}</p><div class="button-stack">${button('确认删除','confirmDelete',p.id)}${button('保留地址','back','','outline')}</div>`)}</div>`
mount(html)}};
if(Preview.guard())render();
