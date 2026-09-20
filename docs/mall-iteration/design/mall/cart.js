const Page={render(){let html="",foot="";const t=total();html=s.cart.length?s.cart.map((x,i)=>`<section class="panel"><div class="row"><label><input type="checkbox" data-cart="${i}" ${x.selected?'checked':''}> 选择商品</label>${btn('删除','remove:'+i,'link')}</div>${checkoutProduct(x)}<div class="row"><span class="mini-price">¥${itemPrice(x)} / 人</span><div class="stepper">${btn('−',`cartQty:${i}:-1`,'')}${x.qty}${btn('+',`cartQty:${i}:1`,'')}</div></div></section>`).join(''):`<div class="panel empty">${icon('shopping-cart')}<h3>购物车还是空的</h3>${btn('去选购','go:catalog','primary')}</div>`;if(s.cart.length)foot=`<div class="row wrap"><label><input type="checkbox" data-field="all" ${s.cart.every(x=>x.selected)?'checked':''}> 全选</label><div>已选 ${s.cart.filter(x=>x.selected).reduce((a,x)=>a+x.qty,0)} 人</div>${btn('去结算','cartCheckout','primary')}</div>`
mountCommerce(html,foot)},click(a,v,z){if(a==='remove'){s.cart.splice(+v,1);render()}
if(a==='cartQty'){s.cart[+v].qty=Math.max(1,Math.min(9,s.cart[+v].qty+ +z));render()}

if(a==='cartCheckout'){if(!s.cart.some(x=>x.selected)){s.notice='请先选择要结算的商品';render()}else{s.checkoutCart=true;go('checkout')}}
},change(el){if(el.dataset.field==='all'){s.cart.forEach(x=>x.selected=el.checked);render()}if(el.dataset.cart!==undefined){s.cart[Number(el.dataset.cart)].selected=el.checked;render()}}};
if(Preview.guard())render();
