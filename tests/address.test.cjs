const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require('esbuild');

let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: {
      contents: `export { createPinia, setActivePinia } from 'pinia'; export { useGlobalStore } from './src/store/global'; export { useCenterStore } from './src/store/center'; export { useMallStore } from './src/store/mall'; export { setToken } from './src/utils/request'; export { default as AddressEdit } from './src/pagesCenter/addressEdit/index.vue'; export { default as AddressList } from './src/pagesCenter/address/index.vue';`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_MALL_PREVIEW': '"false"', 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'vue-page-harness', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, (args) => {
        const compiler = require('@vue/compiler-sfc');
        const { descriptor } = compiler.parse(fs.readFileSync(args.path, 'utf8'));
        return { contents: compiler.compileScript(descriptor, { id: 'address-test' }).content, loader: 'ts' };
      });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'uni-hooks', namespace: 'test-hooks' }));
      build.onLoad({ filter: /.*/, namespace: 'test-hooks' }, () => ({
        contents: 'export const onLoad = fn => globalThis.__hooks.load = fn; export const onShow = fn => globalThis.__hooks.show = fn;',
      }));
    } }, { name: 'weixin-conditionals', setup(build) {
      build.onLoad({ filter: /global\.ts$/ }, (args) => ({
        contents: fs.readFileSync(args.path, 'utf8').replace(/\/\/ #ifndef MP-WEIXIN[\s\S]*?\/\/ #endif/g, '').replace(/\/\/ #(?:ifdef MP-WEIXIN|endif)/g, ''), loader: 'ts',
      }));
    } }],
  });
  bundle = result.outputFiles[0].text;
});

const tick = () => new Promise((resolve) => setImmediate(resolve));
const address = (id = 1, is_default = true) => ({
  id, name: '张女士', phone: '13800138000', province: '广东省', city: '广州市',
  district: '白云区', street: '测试路 1 号', is_default,
});
const ok = (req, data) => req.success({ statusCode: 200, data: { status: 11, data, msg: '' } });

function harness() {
  const requests = [];
  const navigation = [];
  const notices = [];
  const storage = new Map();
  const hooks = {};
  const uni = {
    getStorageSync: (key) => storage.get(key), setStorageSync: (key, val) => storage.set(key, val), removeStorageSync: (key) => storage.delete(key),
    getStorageInfoSync: () => ({ keys: [...storage.keys()] }),
    request: (opts) => requests.push(opts),
    navigateBack: (opts) => navigation.push(['back', opts]), navigateTo: (opts) => navigation.push(['to', opts]),
    showToast: (opts) => notices.push(opts), showModal: () => {},
  };
  const module = { exports: {} };
  vm.runInNewContext(bundle, { module, exports: module.exports, require, console, process, setTimeout, clearTimeout, uni,
    __hooks: hooks, getCurrentPages: () => [{ route: 'pagesCenter/address/index', options: {} }],
  });
  const api = module.exports;
  api.setActivePinia(api.createPinia());
  api.setToken('token');
  const global = api.useGlobalStore();
  global.status = 'authenticated';
  global.userInfo = { id: 1, mini_program_id: 1, phone_bound: true };
  return { api, global, center: api.useCenterStore(), mall: api.useMallStore(), requests, navigation, notices, hooks };
}

test('新增地址必须选择省市区，重复点击只提交一次，保存后刷新并返回', async () => {
  const h = harness();
  const page = h.api.AddressEdit.setup({}, { expose() {} });
  h.hooks.load({});
  const showing = h.hooks.show(); await tick(); ok(h.requests[0], []); await showing;
  page.name.value = '张女士'; page.phone.value = '13800138000'; page.street.value = '测试路 1 号';
  await page.save(); assert.equal(h.requests.length, 1);
  page.onRegionChange({ detail: { value: ['广东省', '广州市', '白云区'] } });
  const first = page.save(); const second = page.save();
  await second;
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].data.district, '白云区');
  ok(h.requests[1], address()); await tick();
  assert.equal(h.requests.length, 3); ok(h.requests[2], [address()]);
  await first;
  assert.equal(h.navigation.at(-1)[0], 'back');
  assert.equal(h.center.addresses[0].province, '广东省');
});

test('编辑回显地区，取消或无效选择不覆盖原值，保存失败保留表单', async () => {
  const h = harness();
  const page = h.api.AddressEdit.setup({}, { expose() {} });
  h.hooks.load({ id: '5' });
  const showing = h.hooks.show(); await tick(); ok(h.requests[0], [address(5)]); await showing;
  assert.equal(page.district.value, '白云区');
  page.onRegionChange({ detail: { value: [] } });
  assert.equal(page.district.value, '白云区');
  page.street.value = '新门牌号';
  const saving = page.save();
  h.requests[1].success({ statusCode: 200, data: { status: '00', msg: '保存失败' } });
  await saving;
  assert.equal(page.street.value, '新门牌号');
  assert.equal(h.navigation.length, 0);
  assert.match(h.notices.at(-1).title, /保存失败/);
});

test('列表加载失败可重试，登录失效后迟到响应不能恢复私人地址', async () => {
  const h = harness();
  const page = h.api.AddressList.setup({}, { expose() {} });
  h.hooks.load({ select: '1' });
  const showing = h.hooks.show(); await tick(); h.requests[0].fail(); await showing;
  assert.match(h.center.addressesError, /网络/);
  const retry = page.refresh(); ok(h.requests[1], [address()]); await retry;
  assert.equal(h.center.addresses.length, 1);
  const late = h.center.loadAddresses();
  h.global.expireSession(); ok(h.requests[2], [address(2)]); await late;
  assert.equal(h.center.addresses.length, 0);
});

test('本单选择不改变默认地址，模拟订单保存独立地址快照', () => {
  const h = harness();
  h.center.addresses = [address(1), { ...address(2, false), name: '李先生' }];
  h.mall.buyNow({ goodsId: 1, goodsName: '签证', cover: '', category: '签证', packIndex: 0,
    packTitle: '标准', personIndex: 0, personName: '成人', date: '2026-10-01', qty: 1,
    unitPrice: 10000, needsTravellers: false });
  h.mall.checkoutAddressId = 2;
  const order = h.mall.submitOrder();
  assert.equal(order.address.name, '李先生');
  assert.equal(h.center.addresses[0].is_default, true);
  h.center.addresses[1].name = '后来改名';
  assert.equal(order.address.name, '李先生');
  assert.equal(h.mall.checkoutAddressId, null);
  h.global.expireSession();
  assert.equal(h.center.orders.some((item) => item.id === order.id), false);
});

test('地址列表可为本单选非默认地址或明确不使用地址', async () => {
  const h = harness();
  const page = h.api.AddressList.setup({}, { expose() {} });
  h.hooks.load({ select: '1' });
  const showing = h.hooks.show(); await tick(); ok(h.requests[0], [address(1), address(2, false)]); await showing;
  page.chooseAddress(2);
  assert.equal(h.mall.checkoutAddressId, 2);
  assert.equal(h.center.addresses[0].is_default, true);
  page.chooseAddress(0);
  assert.equal(h.mall.checkoutAddressId, 0);
  assert.equal(h.navigation.length, 2);
});
