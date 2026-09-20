const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export { createPinia, setActivePinia } from 'pinia'; export * from './src/store/global'; export * from './src/utils/request'; export { useMallStore } from './src/store/mall'; export { useCenterStore } from './src/store/center'; export { default as request } from './src/utils/request'; export * from './src/utils/wechat-privacy'; export { default as LoginPage } from './src/pages/login/index.vue'; export { default as AgreementPage } from './src/pages/service-agreement/index.vue'; export * from './src/content/login-agreements';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_MALL_PREVIEW': '"false"', 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'vue-page-harness', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, (args) => {
        const compiler = require('@vue/compiler-sfc');
        const { descriptor } = compiler.parse(fs.readFileSync(args.path, 'utf8'));
        return { contents: compiler.compileScript(descriptor, { id: 'login-test' }).content, loader: 'ts' };
      });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'uni-hooks', namespace: 'test-hooks' }));
      build.onLoad({ filter: /.*/, namespace: 'test-hooks' }, () => ({ contents: 'export const onLoad = fn => globalThis.__hooks.load = fn; export const onUnload = fn => globalThis.__hooks.unload = fn;' }));
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

test('游客启动忽略旧 token 和私人缓存，保留商品选择，不发登录请求', async () => {
  const h = harness(); h.storage.set('token', 'old'); h.storage.set('userInfo', { nickname: 'private' }); h.storage.set('cart', ['item']);
  await h.store.initialize();
  assert.equal(h.store.isLogin, false); assert.equal(h.requests.length, 0);
  assert.equal(h.storage.has('token'), false); assert.equal(h.storage.has('userInfo'), false); assert.ok(h.storage.has('cart'));
});
test('网络失败会拒绝 Promise，403 不重试或触发登录', async () => {
  const h = harness();
  const failed = h.api.request({ url: '/member/current' }); h.requests[0].fail();
  await assert.rejects(failed, /网络连接失败/);
  const forbidden = h.api.request({ url: '/member/current' }); h.requests[1].success({ statusCode: 403, data: { code: 'DENIED', msg: '禁止访问' } });
  await assert.rejects(forbidden, /禁止访问/); assert.equal(h.requests.length, 2); assert.equal(h.navigation.length, 0);
});
test('并发 401 仅清理匹配的旧会话，不影响新登录 token', async () => {
  const h = harness(); await h.store.initialize(); h.api.setToken('old');
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
test('微信会话失效时用新 code 核对身份，不将业务 token 存在当作有效', async () => {
  const h = harness(); h.api.setToken('token'); h.uni.checkSession = (opts) => opts.fail();
  const restoring = h.store.initialize(); ok(h.requests[0], member()); await tick();
  assert.ok(h.requests[1].url.endsWith('/auth/wechat-session'));
  assert.equal(h.requests[1].data.login_code, 'wx-login-code'); assert.equal(h.store.isLogin, false);
  ok(h.requests[1], { verified: true }); await restoring; assert.equal(h.store.isLogin, true);
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
  const h = harness(); h.setPages([{ route: 'pagesMall/goodsDetail/index', options: { id: '42' } }]);
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
test('退出后迟到的校验响应不会触发微信会话更新或恢复用户', async () => {
  const h = harness(); h.api.setToken('token'); h.uni.checkSession = (opts) => opts.fail();
  const restoring = h.store.initialize(); const leaving = h.store.logout(); ok(h.requests[1], null); await leaving;
  ok(h.requests[0], member()); await restoring; assert.equal(h.requests.length, 2); assert.equal(h.store.isLogin, false);
});

function loginPage(h) { const page = h.api.LoginPage.setup({}, { expose() {} }); h.hooks.load(); return page; }
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
    const h = harness();
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
