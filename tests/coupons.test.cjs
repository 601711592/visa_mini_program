const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export {useMallStore} from './src/store/mall'; export {default as ChooseCoupon} from './src/pagesMall/chooseCoupon/index.vue'; export {createPinia,setActivePinia} from 'pinia'; export * from './src/store/center'; export {useGlobalStore} from './src/store/global'; export {setToken} from './src/utils/request'; export {default as CouponList} from './src/pagesCenter/coupons/index.vue'; export {default as CouponGoods} from './src/pagesCenter/couponGoods/index.vue';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'pages', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, args => { const c = require('@vue/compiler-sfc'); return { contents: c.compileScript(c.parse(fs.readFileSync(args.path, 'utf8')).descriptor, { id: 'coupons' }).content, loader: 'ts' }; });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'hooks', namespace: 'test' }));
      build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const onLoad=fn=>globalThis.__hooks.load=fn; export const onShow=fn=>globalThis.__hooks.show=fn; export const onUnload=fn=>globalThis.__hooks.unload=fn;' }));
    } }],
  }); bundle = result.outputFiles[0].text;
});
function harness() {
  const requests = [], storage = new Map(), hooks = {}, module = { exports: {} };
  const uni = { getStorageSync: k => storage.get(k), setStorageSync: (k,v) => storage.set(k,v), removeStorageSync: k => storage.delete(k), getStorageInfoSync: () => ({keys: [...storage.keys()]}), request: opts => requests.push(opts), showToast() {}, navigateTo() {}, navigateBack() {} };
  vm.runInNewContext(bundle, { module, exports: module.exports, require, console, process, setTimeout, clearTimeout, uni, __hooks: hooks });
  const api = module.exports; api.setActivePinia(api.createPinia()); api.setToken('test');
  const global = api.useGlobalStore(); global.status = 'authenticated'; global.userInfo = {id:1,mini_program_id:1,phone_bound:true};
  return { api, requests, hooks, center: api.useCenterStore() };
}
const ok = (req, data) => req.success({ statusCode: 200, data: { status: 11, data } });
const tick = () => new Promise(resolve => setImmediate(resolve));
const coupon = overrides => ({ id:1,name:'自定义券',status:'available',amount_cents:1880,minimum_cents:10000,scope:'goods',scope_ids:[110],scope_label:'日本签证',starts_at:'2026-09-22 00:00:00',ends_at:'2030-10-01 23:59:59',revoke_reason:null,...overrides });

test('会员券读取服务端状态，收回和未生效不会计入可用数量', async () => {
  const h = harness(), loading = h.center.loadCoupons();
  ok(h.requests[0], [coupon(), coupon({id:2,status:'revoked',revoke_reason:'误发收回'}), coupon({id:3,status:'upcoming'})]); await loading;
  assert.equal(h.center.availableCouponCount, 1); assert.equal(h.center.coupons[1].status, '已收回'); assert.equal(h.center.coupons[1].revokeReason, '误发收回');
  assert.equal(h.center.coupons[2].status, '未生效'); assert.equal(h.center.coupons[0].amount, 18.8);
});

test('退出后迟到响应不能恢复会员优惠券，新请求优先于旧请求', async () => {
  const h = harness(), old = h.center.loadCoupons(); h.center.clearPrivate(); ok(h.requests[0], [coupon()]); await old; assert.equal(h.center.coupons.length,0);
  const first=h.center.loadCoupons(), last=h.center.loadCoupons(); ok(h.requests[2],[coupon({id:2})]); await last; ok(h.requests[1],[coupon()]); await first;
  assert.equal(h.center.coupons[0].id,2);
});

test('适用商品页使用按券过滤接口，第二页失败可重试且不重复追加', async () => {
  const h=harness(), page=h.api.CouponGoods.setup({}, {expose(){}});h.hooks.load({id:'1'});
  const showing=h.hooks.show();await tick();ok(h.requests[0],[coupon()]);await tick();
  assert.match(h.requests[1].url,/member\/coupons\/1\/goods$/);
  ok(h.requests[1],{data:[{id:110,name:'范围内商品'}],current_page:1,total:2});await showing;
  assert.equal(page.hasMore.value,true);const more=page.loadMore(); assert.equal(h.requests[2].data.page,2);h.requests[2].fail();await more;
  assert.match(page.error.value,/更多商品/);assert.equal(page.goods.value.length,1);
  const retry=page.retry();ok(h.requests[3],{data:[{id:110},{id:111}],current_page:2,total:2});await retry;
  assert.equal(page.goods.value.length,2);assert.equal(page.hasMore.value,false);
});

test('初次权益请求失败展示错误，重试会重新读取券与商品', async () => {
  const h=harness(), page=h.api.CouponGoods.setup({}, {expose(){}});h.hooks.load({id:'1'});
  const loading=page.reload();h.requests[0].fail();await loading;assert.match(page.error.value,/加载失败/);assert.equal(page.initialLoading.value,false);
  const retry=page.retry();ok(h.requests[1],[coupon()]);await tick();ok(h.requests[2],{data:[],current_page:1,total:0});await retry;
  assert.equal(page.error.value,'');assert.equal(page.goods.value.length,0);
});


test('三个标签合并未生效和失效券，待付款券归入已使用且不可重复选择', async () => {
  const h = harness(), loading = h.center.loadCoupons();
  ok(h.requests[0], [coupon(), coupon({id:2,status:'upcoming'}), coupon({id:3,status:'used',order_no:'TEST',order_status:'pending'}), coupon({id:4,status:'used',order_status:'completed'}), coupon({id:5,status:'expired'}), coupon({id:6,status:'revoked'})]);
  await loading;
  const page = h.api.CouponList.setup({}, {expose(){}});
  assert.equal(h.center.availableCouponCount,1);
  assert.equal(page.list.value.length,2);
  page.filter.value='已使用';
  assert.equal(page.list.value.length,2);
  assert.equal(page.list.value[0].orderStatus,'pending');
  page.filter.value='已失效';
  assert.equal(page.list.value.length,2);
});

function choose() {
  const h = harness(), mall = h.api.useMallStore();
  mall.buyNow({goodsId:10,categoryId:2,packIndex:0,personIndex:0,packageKey:'standard',personName:'成人',date:'2030-10-01',qty:2});
  return {...h, mall, page:h.api.ChooseCoupon.setup({}, {expose(){}})};
}
test('选券直接采用服务端资格，并携带当前人数与积分意愿重新报价', async () => {
  const h=choose(); h.mall.couponId=99;
  const loading=h.page.loadCoupons();
  assert.match(h.requests[0].url,/orders\/quote$/);
  assert.equal(h.requests[0].data.quantity,2);
  assert.equal(h.requests[0].data.use_points,true);
  assert.equal(h.requests[0].data.coupon_id,null);
  ok(h.requests[0],{coupon_enabled:true,coupon_options:[{id:1,minimum_cents:19000,unavailable_reason:''},{id:2,minimum_cents:17000,unavailable_reason:'未达门槛'}]});
  await loading;
  h.page.pick(h.page.list.value[1]); assert.equal(h.mall.couponId,99);
  h.page.pick(h.page.list.value[0]); assert.equal(h.mall.couponId,1);
});
test('开关关闭会清除旧券；读取失败可重试，不能沿用旧资格', async () => {
  const h=choose();h.mall.couponId=99;
  let loading=h.page.loadCoupons();ok(h.requests[0],{coupon_enabled:false,coupon_options:[]});await loading;
  assert.equal(h.mall.couponId,0);h.page.pick({id:1,unavailable_reason:''});assert.equal(h.mall.couponId,0);
  loading=h.page.loadCoupons();h.requests[1].fail();await loading;assert.ok(h.page.error.value);assert.equal(h.page.list.value.length,0);
  loading=h.page.loadCoupons();ok(h.requests[2],{coupon_enabled:true,coupon_options:[{id:1,unavailable_reason:''}]});await loading;
  assert.equal(h.page.error.value,'');h.page.pick(h.page.list.value[0]);assert.equal(h.mall.couponId,1);
});
test('选券页退出登录或卸载后不接受迟到的资格', async () => {
  const h=choose();let loading=h.page.loadCoupons();h.hooks.unload();ok(h.requests[0],{coupon_enabled:true,coupon_options:[{id:1,unavailable_reason:''}]});await loading;
  assert.equal(h.page.list.value.length,0);
  loading=h.page.loadCoupons();h.api.useGlobalStore().status='guest';ok(h.requests[1],{coupon_enabled:true,coupon_options:[{id:1,unavailable_reason:''}]});await loading;
  assert.equal(h.page.list.value.length,0);
});
