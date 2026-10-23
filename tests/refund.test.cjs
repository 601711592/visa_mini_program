const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export {createPinia,setActivePinia} from 'pinia'; export * from './src/store/center'; export * from './src/pagesOrder/refund'; export {useGlobalStore} from './src/store/global'; export {setToken} from './src/utils/request'; export {default as RefundPage} from './src/pagesOrder/orderRefund/index.vue';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'pages', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, args => { const c = require('@vue/compiler-sfc'); return { contents: c.compileScript(c.parse(fs.readFileSync(args.path, 'utf8')).descriptor, { id: 'refund' }).content, loader: 'ts' }; });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'hooks', namespace: 'test' }));
      build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const onLoad=fn=>globalThis.__hooks.load=fn; export const onShow=fn=>globalThis.__hooks.show=fn; export const onUnload=fn=>globalThis.__hooks.unload=fn;' }));
    } }],
  }); bundle = result.outputFiles[0].text;
});
function harness() {
  const requests = [], storage = new Map(), hooks = {}, module = { exports: {} }, toasts = [], modals = [], navigations = [];
  const uni = {
    getStorageSync: k => storage.get(k), setStorageSync: (k, v) => storage.set(k, v), removeStorageSync: k => storage.delete(k),
    getStorageInfoSync: () => ({ keys: [...storage.keys()] }), request: opts => requests.push(opts),
    showToast: opts => toasts.push(opts.title), showModal: opts => modals.push(opts),
    navigateTo: opts => navigations.push(['navigateTo', opts.url]), redirectTo: opts => navigations.push(['redirectTo', opts.url]), navigateBack() {},
  };
  vm.runInNewContext(bundle, { module, exports: module.exports, require, console, process, setTimeout, clearTimeout, uni, __hooks: hooks });
  const api = module.exports; api.setActivePinia(api.createPinia()); api.setToken('test');
  const global = api.useGlobalStore(); global.status = 'authenticated'; global.userInfo = { id: 1, mini_program_id: 1, phone_bound: true };
  return { api, requests, hooks, toasts, modals, navigations, center: api.useCenterStore() };
}
const ok = (req, data) => req.success({ statusCode: 200, data: { status: 11, data } });
const tick = () => new Promise(resolve => setImmediate(resolve));
const trade = changes => ({
  order_no: 'MP1', status: 'completed', price_version: 0, adjustment_cents: 0, base_cents: 10000, group_discount_cents: 0,
  coupon_cents: 0, points_used: 500, points_cents: 1000, due_cents: 9000, created_at: '2026-10-01 10:00:00',
  expires_at: '2026-10-01 10:30:00', address: null, refunded_at: null, refund: null,
  refund_eligibility: { can_apply: true, reason: null, deadline: '2027-04-01 10:00:00' },
  items: [{ goods_id: 1, goods_name: '日本签证', goods_cover: '', package_title: '标准办理', person_name: '成人', travel_date: null, quantity: 1, unit_cents: 10000, travellers: [] }],
  ...changes,
});
const refund = changes => ({
  refund_no: 'MR1', source: 'member', status: 'reviewing', amount_cents: 9000, reason: '重复下单', note: null,
  reject_reason: null, requested_at: '2026-10-22 10:00:00', reviewed_at: null, refunded_at: null, ...changes,
});

test('订单映射退款状态和可申请结果，售后退款标签按服务端筛选', async () => {
  const h = harness();
  const loading = h.center.loadOrders(true, 'refund');
  assert.equal(h.requests[0].data.status, 'refund');
  ok(h.requests[0], { data: [
    trade({ refund: refund(), refund_eligibility: { can_apply: false, reason: '退款正在处理中', deadline: '2027-04-01 10:00:00' } }),
    trade({ order_no: 'MP2', status: 'refunded', refunded_at: '2026-10-22 12:00:00', refund: refund({ refund_no: 'MR2', source: 'admin', status: 'succeeded', refunded_at: '2026-10-22 12:00:00' }) }),
  ], current_page: 1, last_page: 1 });
  await loading;
  const [reviewing, refunded] = h.center.orders;
  assert.equal(reviewing.state, '已完成');
  assert.equal(reviewing.refund.label, '退款审核中');
  assert.equal(reviewing.canRefund, false);
  assert.equal(reviewing.refundBlockedReason, '退款正在处理中');
  assert.equal(h.api.showRefundButton(reviewing), false);
  assert.equal(refunded.state, '已退款');
  assert.equal(refunded.refund.byMerchant, true);
  assert.equal(refunded.refund.refundedAt, '2026-10-22 12:00:00');
});

test('已完成订单显示申请退款，超期时弹窗说明原因而不进入申请页', () => {
  const h = harness();
  const completed = h.api.toCenterOrder(trade());
  assert.equal(h.api.showRefundButton(completed), true);
  h.api.openRefund(completed);
  assert.deepEqual(h.navigations.pop(), ['navigateTo', '/pagesOrder/orderRefund/index?id=MP1']);
  const expired = h.api.toCenterOrder(trade({ refund_eligibility: { can_apply: false, reason: '订单已超过半年，无法在线申请退款，如需帮助请联系客服', deadline: '2026-04-01 10:00:00' } }));
  assert.equal(h.api.showRefundButton(expired), true);
  h.api.openRefund(expired);
  assert.equal(h.navigations.length, 0);
  assert.equal(h.modals[0].content, '订单已超过半年，无法在线申请退款，如需帮助请联系客服');
  // 被驳回后可以再次申请；办理中的订单不显示按钮。
  assert.equal(h.api.showRefundButton(h.api.toCenterOrder(trade({ refund: refund({ status: 'rejected' }) }))), true);
  assert.equal(h.api.showRefundButton(h.api.toCenterOrder(trade({ status: 'processing' }))), false);
});

test('申请页必须选择原因，网络失败后重试沿用同一提交键，成功后进入订单详情', async () => {
  const h = harness(), page = h.api.RefundPage.setup({}, { expose() {} });
  h.hooks.load({ id: 'MP1' });
  const showing = h.hooks.show();
  await tick();
  ok(h.requests[0], trade());
  await showing;
  assert.equal(page.order.value.canRefund, true);
  assert.match(page.returnsText.value, /500 积分/);

  await page.submit();
  assert.equal(h.requests.length, 1);
  assert.equal(h.toasts.pop(), '请选择退款原因');

  page.reason.value = '重复下单';
  page.note.value = '  多下了一单  ';
  const first = page.submit();
  await page.submit();
  assert.equal(h.requests.length, 2);
  assert.match(h.requests[1].url, /member\/orders\/MP1\/refunds$/);
  assert.equal(h.requests[1].method, 'POST');
  assert.equal(h.requests[1].data.reason, '重复下单');
  assert.equal(h.requests[1].data.note, '多下了一单');
  const key = h.requests[1].data.idempotency_key;
  h.requests[1].fail();
  await first;
  assert.equal(h.navigations.length, 0);

  const retry = page.submit();
  assert.equal(h.requests[2].data.idempotency_key, key);
  ok(h.requests[2], trade({ refund: refund({ note: '多下了一单' }), refund_eligibility: { can_apply: false, reason: '退款正在处理中', deadline: '2027-04-01 10:00:00' } }));
  await retry;
  assert.deepEqual(h.navigations.pop(), ['redirectTo', '/pagesOrder/orderDetail/index?id=MP1']);
  assert.equal(h.center.findOrder('MP1').refund.status, 'reviewing');
});

test('撤销申请用返回的订单更新缓存', async () => {
  const h = harness();
  const cancelling = h.center.cancelRefund('MP1');
  assert.match(h.requests[0].url, /member\/orders\/MP1\/refunds\/cancel$/);
  ok(h.requests[0], trade({ refund: refund({ status: 'cancelled' }) }));
  await cancelling;
  const order = h.center.findOrder('MP1');
  assert.equal(order.refund.label, '已撤销申请');
  assert.equal(order.canRefund, true);
});
