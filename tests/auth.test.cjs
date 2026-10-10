const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export { createPinia, setActivePinia } from 'pinia'; export * from './src/store/global'; export * from './src/utils/request'; export * from './src/utils/invite'; export { requestOrderPayment } from './src/services/orders'; export { useMallStore } from './src/store/mall'; export { useCenterStore } from './src/store/center'; export { default as request } from './src/utils/request'; export * from './src/utils/wechat-privacy'; export { default as GoodsDetailPage } from './src/pagesMall/goodsDetail/index.vue'; export { default as CheckoutPage } from './src/pagesMall/checkout/index.vue'; export { default as LoginPage } from './src/pages/login/index.vue'; export { default as AgreementPage } from './src/pages/service-agreement/index.vue'; export * from './src/content/login-agreements';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_MALL_PREVIEW': '"false"', 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'vue-page-harness', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, (args) => {
        const compiler = require('@vue/compiler-sfc');
        const { descriptor } = compiler.parse(fs.readFileSync(args.path, 'utf8'));
        return { contents: compiler.compileScript(descriptor, { id: 'login-test' }).content, loader: 'ts' };
      });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'uni-hooks', namespace: 'test-hooks' }));
      build.onLoad({ filter: /.*/, namespace: 'test-hooks' }, () => ({ contents: 'export const onShow = fn => globalThis.__hooks.show = fn; export const onLoad = fn => globalThis.__hooks.load = fn; export const onUnload = fn => globalThis.__hooks.unload = fn;' }));
    } }, { name: 'weixin-conditionals', setup(build) {
      build.onLoad({ filter: /global\.ts$/ }, (args) => ({
        contents: fs.readFileSync(args.path, 'utf8').replace(/\/\/ #ifndef MP-WEIXIN[\s\S]*?\/\/ #endif/g, '').replace(/\/\/ #(?:ifdef MP-WEIXIN|endif)/g, ''), loader: 'ts',
      }));
    } }],
  });
  bundle = result.outputFiles[0].text;
});
function harness() {
  const storage = new Map();
  const requests = [];
  const navigation = [];
  const notices = [];
  let pages = [{ route: 'pages/mall/index', options: {} }];
  let wxListener;
  const uni = {
    getStorageSync: (key) => storage.get(key), setStorageSync: (key, val) => storage.set(key, val), removeStorageSync: (key) => storage.delete(key),
    getStorageInfoSync: () => ({ keys: [...storage.keys()] }),
    canIUse: () => true,
    request: (opts) => requests.push(opts), login: (opts) => opts.success({ code: 'wx-login-code' }), checkSession: (opts) => opts.success(),
    navigateTo: (opts) => navigation.push(['navigateTo', opts]), navigateBack: (opts) => navigation.push(['navigateBack', opts]),
    redirectTo: (opts) => navigation.push(['redirectTo', opts]), switchTab: (opts) => navigation.push(['switchTab', opts]), reLaunch: (opts) => navigation.push(['reLaunch', opts]),
    showToast: (opts) => notices.push(opts), setNavigationBarTitle: () => {},
  };
  const module = { exports: {} };
  const hooks = {};
  const context = { __hooks: hooks, module, exports: module.exports, require, console, process, setTimeout, clearTimeout, uni, getCurrentPages: () => pages,
    wx: { canIUse: () => true, getPrivacySetting: () => {}, onNeedPrivacyAuthorization: (fn) => { wxListener = fn; }, openPrivacyContract: () => {} },
  };
  vm.runInNewContext(bundle, context);
  const api = module.exports;
  api.setActivePinia(api.createPinia());
  const store = api.useGlobalStore();
  return { api, store, storage, uni, requests, navigation, notices, hooks, setPages: (val) => { pages = val; }, privacy: (resolve) => wxListener(resolve) };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const member = (id = 1) => ({ id, mini_program_id: 1, nickname: '', avatar: '', phone_masked: '138****0001', phone_bound: true });
const ok = (req, data) => req.success({ statusCode: 200, data: { status: 11, data, msg: '' } });

test('游客启动清理旧 token 和私人缓存，只凭微信身份静默登录一次，未注册保持游客', async () => {
  const h = harness(); h.storage.set('token', 'old'); h.storage.set('userInfo', { nickname: 'private' }); h.storage.set('cart', ['item']);
  const starting = h.store.initialize(); await tick();
  assert.equal(h.requests.length, 1); assert.ok(h.requests[0].url.endsWith('/auth/login'));
  assert.equal(h.requests[0].data.login_code, 'wx-login-code'); assert.equal(h.requests[0].header.Authorization, undefined);
  ok(h.requests[0], { registered: false }); await starting;
  assert.equal(h.store.isLogin, false); assert.equal(h.store.status, 'guest'); assert.equal(h.store.phoneRequired, true);
  assert.equal(h.storage.has('token'), false); assert.equal(h.storage.has('userInfo'), false); assert.ok(h.storage.has('cart'));
  await h.store.restoreSession(); assert.equal(h.requests.length, 1);
});
test('网络失败会拒绝 Promise，403 不重试或触发登录', async () => {
  const h = harness();
  const failed = h.api.request({ url: '/member/current' }); h.requests[0].fail();
  await assert.rejects(failed, /网络连接失败/);
  const forbidden = h.api.request({ url: '/member/current' }); h.requests[1].success({ statusCode: 403, data: { code: 'DENIED', msg: '禁止访问' } });
  await assert.rejects(forbidden, /禁止访问/); assert.equal(h.requests.length, 2); assert.equal(h.navigation.length, 0);
});
test('并发 401 仅清理匹配的旧会话，不影响新登录 token', async () => {
  const h = harness(); h.store.phoneRequired = true; await h.store.initialize(); h.api.setToken('old');
  const first = h.api.request({ url: '/member/current' }); const second = h.api.request({ url: '/member/current' });
  h.requests[0].success({ statusCode: 401, data: { msg: '失效' } }); await assert.rejects(first);
  h.api.setToken('new'); h.requests[1].success({ statusCode: 401, data: { msg: '失效' } }); await assert.rejects(second);
  assert.equal(h.api.getToken(), 'new'); assert.equal(h.requests.length, 2);
});
test('登录请求不携带旧 token，外部 URL 不泄漏 token', async () => {
  const h = harness(); h.api.setToken('secret');
  for (const opts of [{ url: '/auth/phone-login', auth: false }, { url: 'https://elsewhere.invalid/path' }]) {
    const p = h.api.request(opts); const req = h.requests.at(-1); assert.equal(req.header.Authorization, undefined); ok(req, {}); await p;
  }
});
test('缓存会话须校验后才显示资料，重复恢复合并为一个请求', async () => {
  const h = harness(); h.api.setToken('token');
  const one = h.store.initialize(); const two = h.store.restoreSession();
  assert.equal(h.store.isLogin, false); assert.equal(h.store.userInfo, null); assert.equal(h.requests.length, 1);
  ok(h.requests[0], member()); await Promise.all([one, two]); assert.equal(h.store.isLogin, true);
});
test('本机 token 过期时自动改用微信身份静默登录，不要求重新授权手机号', async () => {
  const h = harness(); h.api.setToken('expired');
  const restoring = h.store.initialize();
  h.requests[0].success({ statusCode: 401, data: { status: '00', msg: '登录已失效，请重新登录' } }); await tick();
  assert.equal(h.api.getToken(), ''); assert.ok(h.requests[1].url.endsWith('/auth/login')); assert.equal(h.store.status, 'checking');
  ok(h.requests[1], { registered: true, token: 'fresh', expires_at: '', member: member() }); await restoring;
  assert.equal(h.store.isLogin, true); assert.equal(h.api.getToken(), 'fresh'); assert.equal(h.store.sessionError, ''); assert.equal(h.requests.length, 2);
});
test('老会员启动即静默登录，回到前台不再请求也不清空资料', async () => {
  const h = harness(); const starting = h.store.initialize(); await tick();
  ok(h.requests[0], { registered: true, token: 'fresh', expires_at: '', member: member() }); await starting;
  assert.equal(h.store.isLogin, true); assert.equal(h.api.getToken(), 'fresh'); assert.equal(h.store.phoneRequired, false);
  await h.store.restoreSession(); assert.equal(h.requests.length, 1); assert.equal(h.store.isLogin, true); assert.equal(h.store.userInfo.id, 1);
  assert.equal(await h.store.ensureLogin(), true); assert.equal(h.navigation.length, 0);
});
test('启动校验遇到网络失败保留 token，需要登录时重试而不是当作失效', async () => {
  const h = harness(); h.api.setToken('token');
  const starting = h.store.initialize(); h.requests[0].fail(); await starting;
  assert.equal(h.store.isLogin, false); assert.equal(h.api.getToken(), 'token'); assert.match(h.store.sessionError, /网络/);
  const ensuring = h.store.ensureLogin(); assert.ok(h.requests[1].url.endsWith('/member/current'));
  ok(h.requests[1], member()); assert.equal(await ensuring, true); assert.equal(h.navigation.length, 0);
});
test('静默登录失败不打扰游客，需要登录时重试，确认未注册后才进入登录页', async () => {
  const h = harness(); const starting = h.store.initialize(); await tick();
  h.requests[0].fail(); await starting;
  assert.equal(h.store.status, 'guest'); assert.equal(h.store.sessionError, ''); assert.equal(h.store.phoneRequired, false);
  const ensuring = h.store.ensureLogin(); await tick();
  assert.ok(h.requests[1].url.endsWith('/auth/login')); ok(h.requests[1], { registered: false });
  assert.equal(await ensuring, false); assert.equal(h.store.phoneRequired, true);
  assert.equal(h.navigation.at(-1)[0], 'navigateTo'); assert.equal(h.navigation.at(-1)[1].url, '/pages/login/index');
  await h.store.restoreSession(); assert.equal(h.requests.length, 2);
});
test('离开登录页后迟到的一键登录结果不恢复登录，并撤销迟到会话', async () => {
  const h = harness(); const pending = h.store.completeWechatLogin(); await tick();
  h.store.cancelLogin(); ok(h.requests[0], { registered: true, token: 'late', expires_at: '', member: member() });
  assert.equal(await pending, false); assert.equal(h.store.isLogin, false); assert.equal(h.api.getToken(), '');
  assert.ok(h.requests[1].url.endsWith('/auth/logout')); ok(h.requests[1], null);
});
test('取消登录后的迟到成功响应不会重新登录，并尝试撤销迟到会话', async () => {
  const h = harness(); const pending = h.store.completePhoneLogin('phone-code', 'v1'); await tick();
  h.store.cancelLogin(); ok(h.requests[0], { token: 'late', expires_at: '', member: member() });
  assert.equal(await pending, false); assert.equal(h.store.isLogin, false); assert.equal(h.api.getToken(), '');
  assert.ok(h.requests[1].url.endsWith('/auth/logout')); ok(h.requests[1], null);
});
test('重复点击只发一次登录请求，两种 code 分别提交', async () => {
  const h = harness(); const one = h.store.completePhoneLogin('phone-code', 'v1'); const two = h.store.completePhoneLogin('phone-code', 'v1');
  await tick(); assert.equal(h.requests.length, 1); assert.equal(await two, false);
  assert.equal(h.requests[0].data.login_code, 'wx-login-code'); assert.equal(h.requests[0].data.phone_code, 'phone-code');
  ok(h.requests[0], { token: 'valid', expires_at: '', member: member() }); assert.equal(await one, true); assert.equal(h.store.isLogin, true);
});
test('登录失效清理实际地址和出行人，保留商品选择', () => {
  const h = harness(); const mall = h.api.useMallStore(); const center = h.api.useCenterStore();
  mall.travellers = { item: [{ passport: 'test-only' }] }; mall.cart = [{ key: 'item' }];
  center.addresses = [{ id: 1, phone: 'private' }];
  h.store.expireSession();
  assert.equal(Object.keys(mall.travellers).length, 0); assert.equal(center.addresses.length, 0); assert.equal(mall.cart.length, 1);
});
test('业务返回保留原页面实例和参数，不提交订单或支付', async () => {
  const h = harness(); h.store.phoneRequired = true; h.setPages([{ route: 'pagesMall/goodsDetail/index', options: { id: '42' } }]);
  assert.equal(await h.store.ensureLogin(), false); await h.store.ensureLogin(); assert.equal(h.navigation.length, 1);
  h.setPages([{ route: 'pagesMall/goodsDetail/index', options: { id: '42' } }, { route: 'pages/login/index', options: {} }]);
  h.store.finishLogin(); assert.equal(h.navigation.at(-1)[0], 'navigateBack'); assert.equal(h.requests.length, 0);
});
test('不同查询参数的目标重新跳转，外部返回地址回到首页', () => {
  const h = harness(); h.setPages([{ route: 'pagesMall/goodsDetail/index', options: { id: '1' } }, { route: 'pages/login/index', options: {} }]);
  h.api.returnFromLogin('/pagesMall/goodsDetail/index?id=2'); assert.equal(h.navigation[0][0], 'redirectTo');
  assert.equal(h.api.safeTarget('https://evil.invalid'), '/pages/mall/index');
});
test('退出立即清理身份和草稿；网络失败不阻碍本地退出', async () => {
  const h = harness(); h.api.setToken('token'); h.api.useMallStore().travellers = { item: [{ passport: 'private' }] }; h.storage.set('cart', ['item']);
  const leaving = h.store.logout(); assert.equal(h.api.getToken(), ''); assert.equal(Object.keys(h.api.useMallStore().travellers).length, 0);
  h.requests[0].fail(); await leaving; assert.ok(h.storage.has('cart')); assert.equal(h.notices.length, 1);
});
test('在 wx.login 返回前取消，不向服务端发送注册请求', async () => {
  const h = harness(); let callback; h.uni.login = (opts) => { callback = opts; };
  const pending = h.store.completePhoneLogin('phone', 'v1'); h.store.cancelLogin(); callback.success({ code: 'late-code' });
  assert.equal(await pending, false); assert.equal(h.requests.length, 0);
});
test('退出后迟到的校验响应不会恢复用户，也不触发静默登录', async () => {
  const h = harness(); h.api.setToken('token');
  const restoring = h.store.initialize(); const leaving = h.store.logout(); ok(h.requests[1], null); await leaving;
  ok(h.requests[0], member()); await restoring; assert.equal(h.requests.length, 2); assert.equal(h.store.isLogin, false);
});

test('好友分享带来的邀请码只在手机号注册时提交，注册或确认已是会员后清除', async () => {
  const h = harness(); h.api.rememberInviteCode('abcd2345'); h.api.rememberInviteCode('bad code');
  const logging = h.store.completePhoneLogin('phone-code', 'v1'); await tick();
  assert.equal(h.requests[0].data.invite_code, 'ABCD2345');
  ok(h.requests[0], { token: 'valid', expires_at: '', member: member() }); assert.equal(await logging, true); assert.equal(h.api.getInviteCode(), '');
  const plain = harness(); const registering = plain.store.completePhoneLogin('phone-code', 'v1'); await tick();
  assert.equal(Object.hasOwn(plain.requests[0].data, 'invite_code'), false);
  ok(plain.requests[0], { token: 'valid', expires_at: '', member: member() }); await registering;
  const existing = harness(); existing.api.rememberInviteCode('ABCD2345'); const starting = existing.store.initialize(); await tick();
  assert.equal(existing.requests[0].data.invite_code, undefined);
  ok(existing.requests[0], { registered: true, token: 'fresh', expires_at: '', member: member() }); await starting;
  assert.equal(existing.api.getInviteCode(), '');
  const guest = harness(); guest.api.rememberInviteCode('ABCD2345'); const browsing = guest.store.initialize(); await tick();
  ok(guest.requests[0], { registered: false }); await browsing; assert.equal(guest.api.getInviteCode(), 'ABCD2345');
});
// 手机号授权只在确认尚未注册后出现。
function loginPage(h) { h.store.phoneRequired = true; const page = h.api.LoginPage.setup({}, { expose() {} }); h.hooks.load(); return page; }
const signedOut = (h) => [...h.storage.keys()].some((key) => key.endsWith(':signed-out'));
test('主动退出后冷启动也不自动登录，登录页微信一键登录无需手机号', async () => {
  const h = harness(); h.api.setToken('token');
  const leaving = h.store.logout(); ok(h.requests[0], []); await leaving; assert.equal(signedOut(h), true);
  await h.store.initialize(); assert.equal(h.requests.length, 1);
  assert.equal(await h.store.ensureLogin(), false); assert.equal(h.requests.length, 1);
  assert.equal(h.navigation.at(-1)[1].url, '/pages/login/index');
  const page = h.api.LoginPage.setup({}, { expose() {} }); h.hooks.load();
  const logging = page.handleWechat(); await tick();
  assert.ok(h.requests[1].url.endsWith('/auth/login')); assert.equal(h.requests[1].data.phone_code, undefined);
  ok(h.requests[1], { registered: true, token: 'fresh', expires_at: '', member: member() }); await logging;
  assert.equal(h.store.isLogin, true); assert.equal(h.api.getToken(), 'fresh'); assert.equal(signedOut(h), false);
  assert.equal(h.navigation.at(-1)[0], 'switchTab');
});
test('一键登录发现尚未注册时切换为手机号授权，注册后清除标记', async () => {
  const h = harness(); const page = h.api.LoginPage.setup({}, { expose() {} }); h.hooks.load();
  const logging = page.handleWechat(); await tick();
  ok(h.requests[0], { registered: false }); await logging;
  assert.equal(h.store.phoneRequired, true); assert.equal(h.store.isLogin, false); assert.match(page.error.value, /授权手机号/);
  assert.equal(h.navigation.length, 0);
  page.changeConsent({ detail: { value: ['agree'] } }); const registering = page.handlePhone({ detail: { code: 'phone' } }); await tick();
  assert.ok(h.requests[1].url.endsWith('/auth/phone-login'));
  ok(h.requests[1], { token: 'valid', expires_at: '', member: member() }); await registering;
  assert.equal(h.store.isLogin, true); assert.equal(h.store.phoneRequired, false);
});
test('登录页面协议默认不勾选，未勾选时不请求手机号登录', async () => {
  const h = harness(); const page = loginPage(h); assert.equal(h.requests.length, 0);
  assert.equal(page.consent.value, false); await page.handlePhone({ detail: { code: 'phone' } });
  assert.match(page.error.value, /勾选/); assert.equal(h.requests.length, 0);
});
test('协议阅读返回保留勾选，手机号拒绝可继续浏览', async () => {
  const h = harness(); const page = loginPage(h); assert.equal(h.requests.length, 0);
  page.changeConsent({ detail: { value: ['agree'] } }); page.readAgreement(); assert.equal(page.consent.value, true);
  await page.handlePhone({ detail: { errMsg: 'getPhoneNumber:fail user deny' } }); assert.match(page.error.value, /未完成/);
  assert.equal(h.requests.length, 0); h.hooks.unload(); assert.equal(h.store.loginOpen, false);
});
test('默认隐私授权不注册自定义监听，用户拒绝不发登录请求', async () => {
  const h = harness(); const page = loginPage(h);
  assert.throws(() => h.privacy(() => {}), TypeError);
  page.changeConsent({ detail: { value: ['agree'] } });
  await page.handlePhone({ detail: { errMsg: 'getPhoneNumber:fail privacy permission is not authorized' } });
  assert.equal(h.requests.length, 0); assert.match(page.error.value, /未完成/);
  h.hooks.unload();
  await page.handlePhone({ detail: { code: 'late-phone-code' } });
  assert.equal(h.requests.length, 0);
});
test('登录直接提交前端协议版本，不加载后端协议', async () => {
  const h = harness(); const page = loginPage(h); assert.equal(h.requests.length, 0);
  page.changeConsent({ detail: { value: ['agree'] } }); const logging = page.handlePhone({ detail: { code: 'phone' } }); await tick();
  assert.equal(h.requests.length, 1); assert.ok(h.requests[0].url.endsWith('/auth/phone-login'));
  assert.equal(h.requests[0].data.agreement_version, h.api.LOGIN_AGREEMENT_VERSION);
  ok(h.requests[0], { token: 'valid', expires_at: '', member: member() }); await logging;
  assert.equal(h.store.isLogin, true);
});
test('两份本地协议可离线阅读，未知类型回到服务协议', () => {
  const h = harness(); const page = h.api.AgreementPage.setup({}, { expose() {} });
  h.hooks.load({ kind: 'privacy' }); assert.equal(page.agreement.value.title, '隐私保护指引'); assert.ok(page.agreement.value.content.length > 100);
  h.hooks.load({ kind: 'unknown' }); assert.equal(page.agreement.value.title, '用户服务协议'); assert.equal(h.requests.length, 0);
});

test('登录返回当前三个 tab 页面时使用 switchTab', () => {
  for (const target of ['/pages/mall/index', '/pages/catalog/index', '/pages/account/index']) {
    const h = harness(); h.api.returnFromLogin(target);
    assert.equal(h.navigation[0][0], 'switchTab'); assert.equal(h.navigation[0][1].url, target);
  }
});
test('HTTP 200 的业务失败保留提示且不误清理 token', async () => {
  for (const status of [0, '00']) {
    const h = harness(); h.api.setToken('current');
    const pending = h.api.request({ url: '/member/current' });
    h.requests[0].success({ statusCode: 200, data: { status, msg: '业务失败提示' } });
    await assert.rejects(pending, (error) => error.message === '业务失败提示');
    assert.equal(h.api.getToken(), 'current');
  }
});

test('新增分包登录回跳保留订单、筛选和地址参数及原页面实例', async () => {
  for (const [route, options] of [
    ['pagesOrder/orderDetail/index', { id: '42' }],
    ['pagesOrder/orders/index', { filter: 'pending' }],
    ['pagesCenter/addressEdit/index', { id: '7' }],
    ['pagesCenter/coupons/index', { purpose: 'use' }],
  ]) {
    const h = harness(); h.store.phoneRequired = true;
    const target = `/${route}?${new URLSearchParams(options)}`;
    assert.equal(h.api.safeTarget(target), target);
    h.setPages([{ route, options }]);
    assert.equal(await h.store.ensureLogin({ target }), false);
    assert.equal(h.store.pendingLogin, target);
    h.setPages([{ route, options }, { route: 'pages/login/index', options: {} }]);
    h.store.finishLogin();
    assert.equal(h.navigation.at(-1)[0], 'navigateBack');
    const direct = harness();
    direct.api.returnFromLogin(target);
    assert.equal(direct.navigation.at(-1)[0], 'redirectTo');
    assert.equal(direct.navigation.at(-1)[1].url, target);
  }
});

test('新增分包不放宽站外地址和登录协议页的回跳限制', () => {
  const h = harness();
  for (const target of ['https://evil.invalid/pagesOrder/orders/index', '/pagesOther/index', '/pagesCenter/../login/index', '/pages/login/index', '/pages/service-agreement/index']) {
    assert.equal(h.api.safeTarget(target), '/pages/mall/index');
  }
});


const tradeOrder = (no, status) => ({
  order_no: no, status, created_at: '', items: [], address: {},
  base_cents: 10000, group_discount_cents: 0, coupon_cents: 0,
  points_used: 0, points_cents: 0, due_cents: 10000, price_version: 0, adjustment_cents: 0,
});

test('订单切换筛选接受新请求，迟到的旧列表不覆盖新列表', async () => {
  const h = harness(); h.api.setToken('token');
  const center = h.api.useCenterStore();
  const old = center.loadOrders(true, 'pending');
  const latest = center.loadOrders(true, 'completed');
  assert.equal(h.requests.length, 2);
  ok(h.requests[1], { data: [tradeOrder('new', 'completed')], last_page: 1 });
  await latest;
  ok(h.requests[0], { data: [tradeOrder('old', 'pending')], last_page: 3 });
  await old;
  assert.equal(center.ordersFilter, 'completed');
  assert.equal(center.orders[0].id, 'new');
  assert.equal(center.ordersHasMore, false);
});

test('旧订单请求结束不清除新请求 loading，退出后旧响应不污染会话', async () => {
  const h = harness(); h.api.setToken('token');
  const center = h.api.useCenterStore();
  const old = center.loadOrders(true, 'pending');
  const latest = center.loadOrders(true, 'completed');
  ok(h.requests[0], { data: [], last_page: 1 }); await old;
  assert.equal(center.ordersLoading, true);
  center.clearPrivate(); h.api.setToken('other');
  ok(h.requests[1], { data: [tradeOrder('private', 'completed')], last_page: 1 }); await latest;
  assert.equal(center.orders.length, 0);
  assert.equal(center.ordersLoading, false);
});

function checkout(h) {
  h.api.setToken('token');
  const center = h.api.useCenterStore();
  center.addresses = [{ id: 1, is_default: true }];
  const mall = h.api.useMallStore();
  mall.buyNow({ goodsId: 1, packageKey: 'standard', personName: '成人', date: '2030-10-01', qty: 1 });
  return { page: h.api.CheckoutPage.setup({}, { expose() {} }), mall };
}

test('报价乱序返回只保留当前积分选择对应金额', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  const old = page.refreshQuote();
  mall.setUsePoints(false);
  const latest = page.refreshQuote();
  ok(h.requests[1], { due_cents: 10000, quote_token: 'latest' }); await latest;
  ok(h.requests[0], { due_cents: 9000, quote_token: 'old' }); await old;
  assert.equal(mall.quote.quote_token, 'latest');
  assert.equal(mall.quote.due_cents, 10000);
});

test('旧报价完成不提前结束加载，离开页面后不写入报价', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  const old = page.refreshQuote(); mall.setUsePoints(false);
  const latest = page.refreshQuote();
  ok(h.requests[0], { quote_token: 'old' }); await old;
  assert.equal(page.quoteLoading.value, true);
  assert.equal(mall.quote, null);
  h.hooks.unload();
  ok(h.requests[1], { quote_token: 'latest' }); await latest;
  assert.equal(mall.quote, null);
});

test('结算金额在报价前和报价失败时显示待报价，成功后显示服务端实付', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  assert.equal(page.dueText.value, '待报价');
  const failed = page.refreshQuote();
  assert.equal(page.dueText.value, '待报价');
  h.requests[0].success({ statusCode: 200, data: { status: '00', msg: '商品尚未配置可办理的签证类型' } });
  await failed;
  assert.equal(page.quoteError.value, '商品尚未配置可办理的签证类型');
  assert.equal(page.dueText.value, '待报价');
  const retry = page.refreshQuote();
  ok(h.requests[1], { base_cents: 12000, quantity: 1, group_discount_cents: 0, coupon_cents: 0, points_used: 0, points_cents: 0, due_cents: 12000 });
  await retry;
  assert.equal(page.dueText.value, '¥120.00');
  assert.equal(mall.totals().base, 120);
});

test('未选择地址也能获取金额，但提交订单仍要求地址', async () => {
  const h = harness(); const { page } = checkout(h);
  const center = h.api.useCenterStore();
  center.addresses = [];
  center.addressesLoaded = true;
  const quoting = page.refreshQuote();
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].data.address_id, null);
  ok(h.requests[0], { base_cents: 10000, quantity: 1, group_discount_cents: 0, coupon_cents: 0, points_used: 0, points_cents: 0, due_cents: 10000 });
  await quoting;
  assert.equal(page.quoteError.value, '');
  assert.equal(page.dueText.value, '¥100.00');
  await page.submit();
  assert.equal(h.requests.length, 1);
  assert.equal(h.notices.at(-1).title, '邮寄地址为必填，请先添加或选择地址');
});


test('日历价为零时日历和结算使用套餐价，有日历价时优先使用日历价', async () => {
  const h = harness();
  const page = h.api.GoodsDetailPage.setup({}, { expose() {} });
  const spec = { key: 'standard', title: '标准套餐', price: 12000, person: ['成人'], timeSlot: ['2030-10-01', '2030-10-02'],
    priceCalender: [{ date: '2030-10-01', list: [{ person: '成人', price: '0', quota: 2 }] }] };
  page.goodsDetail.value = { id: 2, name: '测试商品', specification: [spec] };
  page.selectPackage.value = page.goodsDetail.value.specification[0];
  await tick();
  assert.equal(page.calendarSelected.value[0].info, '¥120.00');
  assert.equal(page.buildItem().unitPrice, 12000);
  page.onBuyNow();
  assert.equal(h.api.useMallStore().checkoutRows[0].unitPrice, 12000);
  page.selectPackage.value.priceCalender[0].list[0].price = 15000;
  await tick();
  assert.equal(page.calendarSelected.value[0].info, '¥150.00');
  assert.equal(page.buildItem().unitPrice, 15000);
});

test('过期套餐不自动选中历史日期，立即购买不会进入确认订单', async () => {
  const h = harness();
  const page = h.api.GoodsDetailPage.setup({}, { expose() {} });
  const spec = { key: 'old', title: '过期套餐', price: 10000, person: ['成人'], timeSlot: ['2024-11-01', '2024-11-17'],
    priceCalender: [{ date: '2024-11-03', list: [{ person: '成人', price: 11000, quota: 10 }] }] };
  page.goodsDetail.value = { id: 2, name: '测试商品', specification: [spec] };
  page.selectPackage.value = page.goodsDetail.value.specification[0];
  await tick();
  assert.equal(page.calendarSelected.value.length, 0);
  assert.equal(page.selectedDate.value, '');
  page.selectedDate.value = '2024-11-03';
  page.onBuyNow();
  assert.equal(h.navigation.length, 0);
  assert.equal(h.api.useMallStore().directItem, null);
  assert.equal(h.notices.at(-1).title, '当前套餐暂无可预订日期');
});

test('购买前拦截旧日期、缺失日历、无效价格及名额不足，有效选择允许结算', async () => {
  const h = harness();
  const page = h.api.GoodsDetailPage.setup({}, { expose() {} });
  const spec = { key: 'standard', title: '标准套餐', price: 12000, person: ['成人'], timeSlot: ['2024-11-01', '2030-10-02'],
    priceCalender: [
      { date: '2024-11-03', list: [{ person: '成人', price: 10000, quota: 10 }] },
      { date: '2030-10-01', list: [{ person: '成人', price: 0, quota: 2 }] },
      { date: '2030-10-02', list: [{ person: '成人', price: -1, quota: 10 }] },
    ] };
  page.goodsDetail.value = { id: 2, name: '测试商品', specification: [spec] };
  page.selectPackage.value = page.goodsDetail.value.specification[0];
  await tick();
  assert.equal(page.calendarSelected.value.length, 1);
  assert.equal(page.selectedDate.value, '2030-10-01');
  for (const date of ['2024-11-03', '2030-10-02', '2030-10-03']) {
    page.selectedDate.value = date;
    page.onBuyNow();
    assert.equal(h.navigation.length, 0);
  }
  page.selectedDate.value = '2030-10-01';
  page.qty.value = 3;
  page.onBuyNow();
  assert.equal(h.navigation.length, 0);
  assert.equal(h.notices.at(-1).title, '购买人数超过可用名额或限购数量');
  page.qty.value = 2;
  page.onBuyNow();
  assert.equal(h.navigation.length, 1);
  assert.equal(h.api.useMallStore().directItem.unitPrice, 12000);
});


test('后台新建日历的空价格沿用套餐价，有名额时允许购买', async () => {
  const h = harness();
  const page = h.api.GoodsDetailPage.setup({}, { expose() {} });
  const spec = { key: 'standard', title: '123123', price: 10000, person: ['成人'], timeSlot: ['2030-10-01', '2030-10-02'],
    priceCalender: [{ date: '2030-10-01', list: [{ person: '成人', price: null, quota: 2 }] }] };
  page.goodsDetail.value = { id: 2, name: '测试商品', specification: [spec] };
  page.selectPackage.value = page.goodsDetail.value.specification[0];
  await tick();
  assert.equal(page.calendarSelected.value[0].info, '¥100.00');
  page.onBuyNow();
  assert.equal(h.navigation.length, 1);
  assert.equal(h.api.useMallStore().directItem.unitPrice, 10000);
});

test('空名额不限量，数值和字符串零名额均不可订', async () => {
  for (const quota of [null, '', 0, '0', 1]) {
    const h = harness();
    const page = h.api.GoodsDetailPage.setup({}, { expose() {} });
    const spec = { key: 'standard', title: '123123', price: 10000, person: ['成人'], timeSlot: ['2030-10-01', '2030-10-02'],
      priceCalender: [{ date: '2030-10-01', list: [{ person: '成人', price: null, quota }] }] };
    page.goodsDetail.value = { id: 2, name: '测试商品', specification: [spec] };
    page.selectPackage.value = page.goodsDetail.value.specification[0];
    page.qty.value = 2;
    await tick();
    page.onBuyNow();
    const unlimited = quota === null || quota === '';
    assert.equal(h.navigation.length, unlimited ? 1 : 0);
    if (unlimited) assert.equal(h.api.useMallStore().directItem.unitPrice, 10000);
  }
});

test('确认订单调整人数后重新报价，减少人数同步裁剪出行人', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  const item = mall.checkoutRows[0];
  mall.setTravellers(item.key, [{ name: '张女士' }, { name: '李先生' }]);
  const increasing = page.changeQuantity(item, 1);
  assert.equal(h.requests[0].data.quantity, 2);
  await page.changeQuantity(item, 1);
  assert.equal(h.requests.length, 1);
  ok(h.requests[0], { due_cents: 18000, quantity: 2 }); await increasing;
  assert.equal(item.qty, 2);
  const reducing = page.changeQuantity(item, -1);
  ok(h.requests[1], { due_cents: 10000, quantity: 1 }); await reducing;
  assert.equal(item.qty, 1);
  assert.equal(mall.travellersOf(item.key).length, 1);
  assert.equal(page.dueText.value, '¥100.00');
});

test('人数超库存时保留原数量和报价，积分开关使用布尔状态', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  const item = mall.checkoutRows[0];
  mall.quote = { due_cents: 10000 };
  const increasing = page.changeQuantity(item, 1);
  h.requests[0].success({ statusCode: 200, data: { status: '00', msg: '所选日期名额不足' } });
  await increasing;
  assert.equal(item.qty, 1);
  assert.equal(page.dueText.value, '¥100.00');
  assert.equal(h.notices.at(-1).title, '所选日期名额不足');
  page.onPointsChange({ detail: { value: false } });
  assert.equal(h.requests[1].data.use_points, false);
  ok(h.requests[1], { due_cents: 10000 }); await tick();
});

test('重新报价时保留全部显示金额，成功后一次更新且不允许提交旧报价', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  mall.quote = { unit_cents: 10000, base_cents: 10000, quantity: 1, group_discount_cents: 0, coupon_cents: 1000, points_used: 100, points_cents: 200, due_cents: 8800 };
  mall.setUsePoints(false);
  const refreshing = page.refreshQuote();
  assert.equal(mall.quote, null);
  assert.equal(page.dueText.value, '¥88.00');
  assert.equal(page.totals.value.base, 100);
  assert.equal(page.totals.value.couponAmount, 10);
  assert.equal(page.totals.value.pointsDeduct, 2);
  await page.submit();
  assert.equal(h.requests.length, 1);
  ok(h.requests[0], { unit_cents: 10000, base_cents: 10000, quantity: 1, group_discount_cents: 0, coupon_cents: 1000, points_used: 0, points_cents: 0, due_cents: 9000 });
  await refreshing;
  assert.equal(page.dueText.value, '¥90.00');
  assert.equal(page.totals.value.pointsDeduct, 0);
});

test('优惠券切换返回时保留旧金额，报价失败清除展示缓存', async () => {
  const h = harness(); const { page, mall } = checkout(h);
  mall.quote = { due_cents: 10000 };
  mall.setCoupon(3);
  assert.equal(page.dueText.value, '¥100.00');
  const refreshing = page.refreshQuote();
  h.requests[0].fail(); await refreshing;
  assert.equal(page.dueText.value, '待报价');
  assert.equal(mall.quote, null);
  assert.match(page.quoteError.value, /网络/);
});

test('全部订单请求不携带 status，具体状态筛选仍正确传递', async () => {
  const h = harness(); h.api.setToken('token');
  const center = h.api.useCenterStore();
  const all = center.loadOrders(true);
  assert.equal(Object.hasOwn(h.requests[0].data, 'status'), false);
  assert.equal(h.requests[0].data.page, 1);
  ok(h.requests[0], { data: [], last_page: 1 }); await all;
  for (const status of ['pending', 'processing', 'completed', 'cancelled']) {
    const loading = center.loadOrders(true, status);
    const req = h.requests.at(-1);
    assert.equal(req.data.status, status);
    ok(req, { data: [], last_page: 1 }); await loading;
  }
  const back = center.loadOrders(true, '');
  assert.equal(Object.hasOwn(h.requests.at(-1).data, 'status'), false);
  ok(h.requests.at(-1), { data: [], last_page: 1 }); await back;
});

test('订单详情保留下单单价、商品金额和空出行人列表', async () => {
  const h = harness(); h.api.setToken('token');
  const center = h.api.useCenterStore();
  const loading = center.loadOrder('price-detail');
  const data = tradeOrder('price-detail', 'pending');
  data.items = [{ goods_id: 2, goods_name: '测试商品', goods_cover: 'https://example.test/goods-cover.jpg', package_title: '123123', person_name: '成人', travel_date: '2030-10-01', quantity: 3, unit_cents: 12345, travellers: [] }];
  data.base_cents = 37035;
  ok(h.requests[0], data); await loading;
  const order = center.findOrder('price-detail');
  assert.equal(order.items[0].cover, 'https://example.test/goods-cover.jpg');
  assert.equal(order.items[0].unitPrice, 123.45);
  assert.equal(order.items[0].amount, 370.35);
  assert.equal(order.items[0].travellers.length, 0);
});


test('支付提交当前显示的金额版本，改价差额同步到订单', async () => {
  const h = harness(); h.api.setToken('token');
  const payment = h.api.requestOrderPayment('repriced-order', 3);
  assert.equal(h.requests[0].data.price_version, 3);
  ok(h.requests[0], { package: 'prepay_id=test' }); await payment;
  const center = h.api.useCenterStore();
  const loading = center.loadOrder('repriced-order');
  ok(h.requests[1], { ...tradeOrder('repriced-order', 'pending'), price_version: 3, due_cents: 9000, adjustment_cents: -1000 });
  await loading;
  assert.equal(center.orders[0].priceVersion, 3);
  assert.equal(center.orders[0].adjustment, -10);
  assert.equal(center.orders[0].due, 90);
});
