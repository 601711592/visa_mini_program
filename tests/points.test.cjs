const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export {createPinia,setActivePinia} from 'pinia'; export * from './src/store/center'; export {setToken} from './src/utils/request'; export {useGlobalStore} from './src/store/global'; export {useMallStore} from './src/store/mall'; export {default as PointsPage} from './src/pagesCenter/points/index.vue'; export {default as Checkout} from './src/pagesMall/checkout/index.vue';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'pages', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, args => { const c = require('@vue/compiler-sfc'); return { contents: c.compileScript(c.parse(fs.readFileSync(args.path, 'utf8')).descriptor, { id: 'points' }).content, loader: 'ts' }; });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'hooks', namespace: 'test' }));
      build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const onShow=fn=>globalThis.__hooks.show=fn; export const onUnload=fn=>globalThis.__hooks.unload=fn;' }));
    } }],
  }); bundle = result.outputFiles[0].text;
});
function harness() {
  const requests = [], storage = new Map(), hooks = {}, navigation = [], module = { exports: {} };
  const uni = { getStorageSync:k=>storage.get(k), setStorageSync:(k,v)=>storage.set(k,v), removeStorageSync:k=>storage.delete(k),
    getStorageInfoSync:()=>({keys:[...storage.keys()]}), request:opts=>requests.push(opts), showToast(){}, redirectTo:opts=>navigation.push(opts), showModal(){}, navigateTo:opts=>navigation.push(opts) };
  vm.runInNewContext(bundle, {module,exports:module.exports,require,console,process,setTimeout,clearTimeout,uni,__hooks:hooks});
  const api=module.exports;api.setActivePinia(api.createPinia());api.setToken('test');
  const global=api.useGlobalStore();global.status='authenticated';global.userInfo={id:1,mini_program_id:1,phone_bound:true};
  return {api,hooks,navigation,requests,center:api.useCenterStore(),mall:api.useMallStore()};
}
const row=id=>({id,amount:100,reason:'人工调整',order_no:null,created_at:'2026-09-27 10:00:00'});
const data=(ids,page=1,total=ids.length)=>({available:800,balance:1000,ledger:{data:ids.map(row),current_page:page,total},rules:{points_max_bps:2000,reward_bps:5000,reward_basis:'paid',stack_order:'group_coupon_points'}});
const ok=(req,data)=>req.success({statusCode:200,data:{status:11,data}});
test('积分不依赖优惠券，收支筛选和第二页由服务端查询',async()=>{
  const h=harness();const first=h.center.loadPoints(true,'out');assert.equal(h.requests.length,1);assert.equal(h.requests[0].data.direction,'out');
  ok(h.requests[0],data([2,1],1,3));await first;assert.equal(h.center.pointsHasMore,true);assert.equal(h.center.pointRules.reward_bps,5000);
  const more=h.center.loadPoints(false);assert.equal(h.requests[1].data.page,2);assert.equal(h.requests[1].data.direction,'out');
  ok(h.requests[1],data([1,3],2,3));await more;assert.equal(h.center.ledger.length,3);assert.equal(h.center.pointsHasMore,false);assert.equal(h.center.balance,800);
});
test('翻页失败保留已加载流水，重试相同页码且重复点击只请求一次',async()=>{
  const h=harness();const first=h.center.loadPoints();ok(h.requests[0],data([1],1,2));await first;
  const more=h.center.loadPoints(false);await h.center.loadPoints(false);assert.equal(h.requests.length,2);h.requests[1].fail();await assert.rejects(more);
  assert.equal(h.center.ledger.length,1);assert.equal(h.center.pointsPage,1);assert.ok(h.center.pointsError);
  const retry=h.center.loadPoints(false);assert.equal(h.requests[2].data.page,2);ok(h.requests[2],data([2],2,2));await retry;assert.equal(h.center.pointsError,'');assert.equal(h.center.ledger.length,2);
});
test('切换收支及退出登录后忽略迟到响应，不恢复旧账号资产',async()=>{
  const h=harness();const old=h.center.loadPoints(true,'in');const current=h.center.loadPoints(true,'out');
  ok(h.requests[1],data([2]));await current;ok(h.requests[0],data([1]));await old;assert.equal(h.center.ledger[0].id,2);
  const late=h.center.loadPoints();h.center.clearPrivate();ok(h.requests[2],data([3]));await late;
  assert.equal(h.center.ledger.length,0);assert.equal(h.center.balance,0);assert.equal(h.center.pointRules,null);assert.equal(h.center.pointsPage,0);
});
test('初次请求失败可重试，空页和未配置规则可正确展示',async()=>{
  const h=harness();const first=h.center.loadPoints();h.requests[0].fail();await assert.rejects(first);assert.equal(h.center.pointsLoading,false);assert.equal(h.center.pointsPage,0);
  const retry=h.center.loadPoints();ok(h.requests[1],{...data([]),rules:null});await retry;assert.equal(h.center.pointsHasMore,false);assert.equal(h.center.pointRules,null);assert.equal(h.center.pointsError,'');
});

const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('全部明细不传空筛选参数，页面显示余额与人工调分流水',async()=>{
  const h=harness(),page=h.api.PointsPage.setup({}, {expose(){}});
  const loading=h.hooks.show();await tick();
  assert.equal(Object.hasOwn(h.requests[0].data,'direction'),false);
  assert.equal(new URLSearchParams(h.requests[0].data).has('direction'),false);
  ok(h.requests[0],data([1]));await loading;
  assert.equal(page.balanceText.value,(800).toLocaleString());assert.equal(h.center.ledger[0].name,'人工调整');
  const outgoing=page.reload('out');assert.equal(h.requests[1].data.direction,'out');
  ok(h.requests[1],data([]));await outgoing;assert.equal(page.balanceText.value,(800).toLocaleString());assert.equal(h.center.ledger.length,0);
});
const quote=changes=>({goods_id:10,quantity:1,base_cents:10000,group_discount_cents:0,coupon_cents:0,points_available:1000,points_max_bps:2000,points_used:1000,points_cents:2000,due_cents:8000,rule_version:1,quote_token:'a'.repeat(64),...changes});
function checkout() {
  const h=harness();h.mall.buyNow({goodsId:10,packIndex:0,personIndex:0,packageKey:'standard',personName:'成人',date:'2030-10-01',qty:1,needsTravellers:false});
  const page=h.api.Checkout.setup({}, {expose(){}});return {...h,page};
}
test('确认订单使用同一次报价的余额，勾选抵扣传入报价和创建订单',async()=>{
  const h=checkout(),showing=h.hooks.show();await tick();
  ok(h.requests[0],[{id:1,is_default:true}]);await tick();
  assert.match(h.requests[1].url,/orders\/quote$/);assert.equal(h.requests[1].data.use_points,true);
  ok(h.requests[1],quote());await showing;
  assert.equal(h.mall.quote.points_available,1000);assert.equal(h.page.pointsHint.value,'使用 1000 积分，抵扣 ¥20.00');assert.equal(h.page.dueText.value,'¥80.00');
  h.page.onPointsChange({detail:{value:false}});assert.equal(h.requests[2].data.use_points,false);
  assert.match(h.page.pointsHint.value,/正在计算/);ok(h.requests[2],quote({points_used:0,points_cents:0,due_cents:10000}));await tick();
  assert.equal(h.page.pointsHint.value,'未使用积分');
  h.page.onPointsChange({detail:{value:true}});assert.equal(h.requests[3].data.use_points,true);
  ok(h.requests[3],quote());await tick();
  const submitting=h.page.submit();assert.equal(h.requests[4].data.use_points,true);assert.equal(h.requests[4].data.quote_token,'a'.repeat(64));
  ok(h.requests[4],{order_no:'TEST'});await submitting;assert.match(h.navigation[0].url,/TEST/);
});
test('报价失败不显示旧抵扣结果，零余额和未开放抵扣有明确提示',async()=>{
  const h=checkout(),first=h.page.refreshQuote();ok(h.requests[0],quote());await first;
  const retry=h.page.refreshQuote();h.requests[1].fail();await retry;
  assert.equal(h.mall.quote,null);assert.match(h.page.pointsHint.value,/未确认/);
  const empty=h.page.refreshQuote();ok(h.requests[2],quote({points_available:0,points_used:0,points_cents:0}));await empty;
  assert.match(h.page.pointsHint.value,/暂无可用积分/);
  const disabled=h.page.refreshQuote();ok(h.requests[3],quote({points_max_bps:0,points_used:0,points_cents:0}));await disabled;
  assert.equal(h.page.pointsHint.value,'当前未开放积分抵扣');
});

test('结算券开关关闭时禁止进入选券并同步清除旧券',async()=>{
 const h=checkout();h.mall.couponId=1;
 const loading=h.page.refreshQuote();ok(h.requests[0],quote({coupon_enabled:false,coupon_id:null,coupon_options:[]}));await loading;
 assert.equal(h.mall.couponId,0);h.page.goCoupons();assert.equal(h.navigation.length,0);
 h.mall.quote=quote({coupon_enabled:true,coupon_options:[]});h.page.goCoupons();assert.match(h.navigation[0].url,/chooseCoupon/);
});

test('已选券使报价失败时可放弃该券重新报价',async()=>{
 const h=checkout();h.mall.couponId=7;
 const failing=h.page.refreshQuote();assert.equal(h.requests[0].data.coupon_id,7);h.requests[0].fail();await failing;
 assert.equal(h.mall.quote,null);assert.match(h.page.quoteError.value,/网络/);h.page.goCoupons();assert.equal(h.navigation.length,0);
 h.page.clearCoupon();assert.equal(h.mall.couponId,0);assert.equal(h.requests[1].data.coupon_id,null);
 ok(h.requests[1],quote({coupon_enabled:true,coupon_id:null,coupon_options:[]}));await tick();
 assert.equal(h.page.quoteError.value,'');assert.equal(h.mall.quote.due_cents,8000);
});

const tradeOrder=changes=>({order_no:'MP1',status:'pending',price_version:0,adjustment_cents:0,base_cents:10000,group_discount_cents:0,coupon_cents:0,points_used:0,points_cents:0,due_cents:10000,created_at:'2026-09-27 10:00:00',expires_at:'2026-09-27 10:30:00',address:{name:'张三',phone:'13800138000',province:'广东',city:'广州',district:'白云',street:'测试路 1 号'},items:[],...changes});
test('取消成功后权益刷新失败不算取消失败',async()=>{
 const h=harness(),cancelling=h.center.cancelOrder('MP1');
 assert.match(h.requests[0].url,/orders\/MP1\/cancel$/);ok(h.requests[0],tradeOrder({status:'cancelled'}));await tick();
 assert.equal(h.requests.length,3);h.requests[1].fail();h.requests[2].fail();await cancelling;
 assert.equal(h.center.orders[0].id,'MP1');assert.equal(h.center.orders[0].state,'已取消');
});

test('退出登录后迟到的订单详情和取消结果不写回缓存',async()=>{
 const h=harness(),loading=h.center.loadOrder('MP1'),cancelling=h.center.cancelOrder('MP2');
 h.center.clearPrivate();ok(h.requests[0],tradeOrder());ok(h.requests[1],tradeOrder({order_no:'MP2',status:'cancelled'}));await loading;await cancelling;
 assert.equal(h.center.orders.length,0);assert.equal(h.requests.length,2);
 const again=h.center.loadOrder('MP1');ok(h.requests[2],tradeOrder());await again;assert.equal(h.center.orders[0].id,'MP1');
});
