const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const ts=require('typescript');
const root=process.env.MALL_SOURCE_ROOT || path.resolve(__dirname,'../src');
const source=fs.readFileSync(path.join(root,'mall/model.ts'));
const sha=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+source.length+'\0'),source])).digest('hex');
console.log('model git blob:',sha);
const compiled=ts.transpileModule(source.toString(),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},reportDiagnostics:true});
assert.equal(compiled.diagnostics.length,0);
const mod={exports:{}};new Function('module','exports',compiled.outputText)(mod,mod.exports);const m=mod.exports;
const now=new Date('2026-09-18T10:00:00Z');
const selection=(changes={})=>({productId:'1',name:'测试商品',cover:'/static/mall/passport.png',categoryId:1,specKey:'standard',specName:'标准办理',group:'成人',date:'2026-10-12',unitCents:69900,quantity:1,stock:20,travellersRequired:true,shippingRequired:false,...changes});
const people=count=>Array.from({length:count},(_,i)=>({name:'测试出行人'+i,passport:'ETEST000'+i,birthday:'1990-01-01'}));
function member(){const s=m.createState();s.member=true;return s;}
function ready(s,changes={}){const line=m.makeLine(selection(changes));m.beginCheckout(s,[line],'buy');s.draft.consent=true;if(line.travellersRequired)m.saveTravellers(s,line.id,people(line.quantity));return line;}
test('领域模型可由 TypeScript 正常转译',()=>assert.equal(compiled.diagnostics.length,0));
test('默认游客不可提交订单',()=>{const s=m.createState();assert.equal(s.member,false);assert.equal(s.orders.length,0);assert.throws(()=>m.submitOrder(s,now),/登录/);});
test('稳定明细ID区分商品、套餐、人群和日期',()=>{const entries=[selection(),selection({specKey:'fast'}),selection({group:'儿童'}),selection({date:'2026-10-13'}),selection({productId:'2'})];assert.equal(new Set(entries.map(m.lineId)).size,5);});
test('相同规格合并购物车',()=>{const s=m.createState();m.addToCart(s,selection());m.addToCart(s,selection({quantity:2}));assert.equal(s.cart.length,1);assert.equal(s.cart[0].quantity,3);});
test('数量、库存、价格、日期校验',()=>{for(const quantity of [0,-1,1.5,21,NaN])assert.throws(()=>m.makeLine(selection({quantity})));assert.throws(()=>m.makeLine(selection({unitCents:-1})));assert.throws(()=>m.makeLine(selection({date:'2026-02-30'})));});
test('排序后出行人仍归属对应商品',()=>{const s=member(),a=m.makeLine(selection()),b=m.makeLine(selection({date:'2026-10-13'}));m.beginCheckout(s,[a,b],'cart');m.saveTravellers(s,a.id,people(1));m.beginCheckout(s,[b,a],'cart');assert.equal(s.draft.lines[1].travellers[0].name,'测试出行人0');assert.equal(s.draft.lines[0].travellers.length,0);});
test('增加人数要求补齐、减少人数保留名单',()=>{const s=member();ready(s);m.beginCheckout(s,[m.makeLine(selection({quantity:2}))],'buy');assert.match(m.validateTravellers(s.draft.lines[0]),/2 位/);m.saveTravellers(s,s.draft.lines[0].id,people(2));m.beginCheckout(s,[m.makeLine(selection())],'buy');assert.equal(s.draft.lines[0].travellers.length,1);});
test('重复护照及未来生日被拦截',()=>{const line=m.makeLine(selection({quantity:2})),list=people(2);list[1].passport=list[0].passport;assert.match(m.validateTravellers(line,list,'2026-09-18'),/重复/);list[1].passport='EOTHER001';list[1].birthday='2099-01-01';assert.match(m.validateTravellers(line,list,'2026-09-18'),/生日/);});
test('无需出行人的商品可不填名单',()=>{const s=member();ready(s,{travellersRequired:false});assert.equal(m.submitOrder(s,now).lines[0].travellers.length,0);});
test('预订确认未勾选不能提交',()=>{const s=member();ready(s);s.draft.consent=false;assert.throws(()=>m.submitOrder(s,now),/勾选/);});
test('必须邮寄的商品需地址',()=>{const s=member();ready(s,{shippingRequired:true});assert.throws(()=>m.submitOrder(s,now),/地址/);});
test('券类别、门槛、日期与占用校验',()=>{const s=member(),coupon=s.coupons.find(c=>c.id==='visa');assert.match(m.couponIssue(coupon,[m.makeLine(selection({categoryId:2}))],'2026-09-18'),/不适用/);assert.match(m.couponIssue(coupon,[m.makeLine(selection())],'2026-09-18'),/门槛/);assert.equal(m.couponIssue(coupon,[m.makeLine(selection({quantity:2}))],'2026-09-18'),'');assert.match(m.couponIssue(coupon,[m.makeLine(selection({quantity:2}))],'2027-01-01'),/过期/);coupon.reservedBy='other';assert.match(m.couponIssue(coupon,[m.makeLine(selection({quantity:2}))],'2026-09-18'),/占用/);});
test('金额分单位、折扣顺序与非负总额',()=>{const s=member();assert.deepEqual(m.quote([m.makeLine(selection({quantity:2}))],s.coupons.find(c=>c.id==='visa'),true,1280,'2026-09-18'),{base:139800,groupDiscount:13980,coupon:5000,points:1280,pointsCents:2560,due:118260});assert.ok(m.quote([m.makeLine(selection({unitCents:1}))],undefined,true,100000).due>=0);});
test('重复提交不重复扣分或占券',()=>{const s=member();ready(s,{quantity:2});s.draft.usePoints=true;s.draft.couponId='visa';const first=m.submitOrder(s,now),balance=s.balance;assert.equal(m.submitOrder(s,now).id,first.id);assert.equal(s.orders.length,1);assert.equal(s.balance,balance);assert.equal(s.coupons.find(c=>c.id==='visa').reservedBy,first.id);});
test('订单快照独立于后续商品和地址编辑',()=>{const s=member();ready(s,{shippingRequired:true});const a=m.saveAddress(s,{id:'',name:'测试',phone:'13800000000',region:['广东省','广州市','天河区'],detail:'测试路1号',isDefault:true});s.draft.addressId=a.id;const o=m.submitOrder(s,now);s.draft.lines[0].name='已改';a.detail='已改';assert.equal(o.lines[0].name,'测试商品');assert.equal(o.address.detail,'测试路1号');});
test('支付失败、取消、成功重试状态正确',()=>{const s=member();ready(s);const o=m.submitOrder(s,now);m.payment(s,o.id,'failed');assert.equal(o.status,'待付款');m.payment(s,o.id,'cancelled');assert.equal(o.status,'待付款');m.payment(s,o.id,'succeeded');assert.equal(o.status,'办理中');m.payment(s,o.id,'succeeded');assert.equal(s.orders.length,1);});
test('取消仅返还一次积分及释放券',()=>{const s=member();ready(s,{quantity:2});s.draft.usePoints=true;s.draft.couponId='visa';const balance=s.balance,o=m.submitOrder(s,now);m.cancelOrder(s,o.id);m.cancelOrder(s,o.id);assert.equal(s.balance,balance);assert.equal(s.coupons.find(c=>c.id==='visa').reservedBy,undefined);assert.throws(()=>m.payment(s,o.id,'succeeded'),/不可付款/);});
test('退款申请只进入审核，不预退权益',()=>{const s=member();ready(s);s.draft.usePoints=true;const o=m.submitOrder(s,now);m.payment(s,o.id,'succeeded');const balance=s.balance;m.requestRefund(s,o.id,'出行计划变更','测试',now);assert.equal(o.status,'售后退款');assert.equal(s.balance,balance);assert.throws(()=>m.requestRefund(s,o.id,'其他','',now),/不可申请/);});
test('半年限制暂定口径可拦截',()=>{const s=member();ready(s);const o=m.submitOrder(s,now);m.payment(s,o.id,'succeeded');assert.throws(()=>m.requestRefund(s,o.id,'其他','',new Date('2027-04-18')),/半年/);});
test('地址唯一默认及失效选择清理',()=>{const s=member(),data={id:'',name:'测试',phone:'13800000000',region:['广东省','广州市','天河区'],detail:'测试路1号',isDefault:false};const a=m.saveAddress(s,data),b=m.saveAddress(s,{...data,isDefault:true});assert.equal(s.addresses.filter(x=>x.isDefault).length,1);assert.equal(a.isDefault,false);ready(s);s.draft.addressId=b.id;m.deleteAddress(s,b.id);assert.equal(a.isDefault,true);assert.equal(s.draft.addressId,'');});
test('退出清理私人数据，保留非敏感商品选择',()=>{const s=member();m.addToCart(s,selection());ready(s);m.signOut(s);assert.equal(s.member,false);assert.equal(s.orders.length,0);assert.equal(s.addresses.length,0);assert.equal(s.cart.length,1);assert.equal(s.draft.lines[0].travellers.length,0);});

function moduleFrom(relative,uni={},pages=()=>[]){
  const bytes=fs.readFileSync(path.join(root,relative));
  console.log(relative+' git blob:',crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'));
  const output=ts.transpileModule(bytes.toString(),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
  assert.equal(output.diagnostics.length,0);
  const module={exports:{}};new Function('module','exports','uni','getCurrentPages',output.outputText)(module,module.exports,uni,pages);return module.exports;
}
const product=moduleFrom('mall/product-selection.ts');
const spec={key:'standard',title:'标准办理',person:['成人','儿童'],price:'69900',priceCalender:[{date:'2026-10-12',list:[{person:'成人',price:69900,quota:8},{person:'儿童',price:49900,quota:5}]},{date:'2026-10-13',list:[{person:'成人',price:69900,quota:0}]}],information:'护照信息',timeSlot:['2026-10-12','2026-10-13']};
const goods={id:12,name:'测试签证',cover:'/static/mall/passport.png',category_id:1,stock:20,limitBuy:3};
test('详情选择按人群和日期传递分单位价格及库存限制',()=>{const value=product.selectionFor(goods,spec,'儿童','2026-10-12',2);assert.equal(value.unitCents,49900);assert.equal(value.stock,3);assert.equal(value.productId,'12');assert.equal(value.specKey,'standard');assert.equal(value.group,'儿童');assert.equal(value.quantity,2);});
test('详情没有可用日历名额时不可购买',()=>{assert.throws(()=>product.selectionFor(goods,spec,'成人','2026-10-13',1),/日历/);assert.throws(()=>product.selectionFor(goods,spec,'未定义人群','2026-10-12',1),/人群/);assert.throws(()=>product.selectionFor(goods,undefined,'成人','2026-10-12',1),/套餐/);});
test('商品出行人与邮寄配置传递到结算',()=>{const value=product.selectionFor({...goods,travellersRequired:false,shippingRequired:true},spec,'成人','2026-10-12',1);assert.equal(value.travellersRequired,false);assert.equal(value.shippingRequired,true);});
function routerHarness(){const calls=[];let stack=[];const uni=Object.fromEntries(['switchTab','redirectTo','navigateBack','reLaunch'].map(name=>[name,opts=>calls.push([name,opts])]));return{api:moduleFrom('utils/auth-routing.ts',uni,()=>stack),calls,setPages:p=>{stack=p;}};}
test('三个原生 Tab 登录后使用 switchTab',()=>{const h=routerHarness();for(const target of ['/pages/mall/index','/pages/category/index','/pages/account/index']){h.api.returnFromLogin(target);const [name,options]=h.calls.pop();assert.equal(name,'switchTab');assert.equal(options.url,target);}});
test('非 Tab 登录后返回原实例并保留筛选',()=>{const h=routerHarness();h.setPages([{route:'pagesMall/orders/index',options:{filter:'办理中'}},{route:'pages/login/index'}]);h.api.returnFromLogin('/pagesMall/orders/index?filter='+encodeURIComponent('办理中'));assert.equal(h.calls[0][0],'navigateBack');assert.equal(h.calls[0][1].delta,1);});
test('不同筛选参数不错误复用现有页面',()=>{const h=routerHarness();h.setPages([{route:'pagesMall/orders/index',options:{filter:'已完成'}},{route:'pages/login/index'}]);h.api.returnFromLogin('/pagesMall/orders/index?filter='+encodeURIComponent('办理中'));assert.equal(h.calls[0][0],'redirectTo');});
test('外部或登录循环目标安全回首页',()=>{const h=routerHarness();for(const url of ['https://external.invalid','//external.invalid','/pages/login/index','/pages/service-agreement/index'])assert.equal(h.api.safeTarget(url),'/pages/mall/index');});
test('Tab 导航失败可回退首页',()=>{const h=routerHarness();h.api.returnFromLogin('/pages/account/index');h.calls[0][1].fail();assert.equal(h.calls[1][0],'reLaunch');assert.equal(h.calls[1][1].url,'/pages/mall/index');});
