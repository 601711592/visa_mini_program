const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');
let bundle;
before(async () => {
  const result = await esbuild.build({
    stdin: { contents: `export {createPinia,setActivePinia} from 'pinia'; export {setToken} from './src/utils/request'; export * from './src/utils/invite'; export {useGlobalStore} from './src/store/global'; export {default as InvitePage} from './src/pagesCenter/invite/index.vue'; export {default as SharePage} from './src/pagesCenter/inviteShare/index.vue'; export {default as RecordsPage} from './src/pagesCenter/inviteRecords/index.vue'; export {default as RulesPage} from './src/pagesCenter/inviteRules/index.vue';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    define: { 'import.meta.env.VITE_ID': '"1"', 'import.meta.env.VITE_API_PREFIX': '"https://test.invalid/api/min"' },
    plugins: [{ name: 'pages', setup(build) {
      build.onLoad({ filter: /\.vue$/ }, args => { const c = require('@vue/compiler-sfc'); return { contents: c.compileScript(c.parse(fs.readFileSync(args.path, 'utf8')).descriptor, { id: 'invite' }).content, loader: 'ts' }; });
      build.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'hooks', namespace: 'test' }));
      build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const onShow=fn=>globalThis.__hooks.show=fn; export const onUnload=fn=>globalThis.__hooks.unload=fn; export const onShareAppMessage=fn=>globalThis.__hooks.share=fn;' }));
    } }],
  }); bundle = result.outputFiles[0].text;
});
function harness() {
  const requests = [], storage = new Map(), hooks = {}, navigation = [], module = { exports: {} };
  const uni = { getStorageSync: k => storage.get(k), setStorageSync: (k, v) => storage.set(k, v), removeStorageSync: k => storage.delete(k),
    getStorageInfoSync: () => ({ keys: [...storage.keys()] }), request: opts => requests.push(opts), showToast() {}, navigateTo: opts => navigation.push(opts) };
  vm.runInNewContext(bundle, { module, exports: module.exports, require, console, process, setTimeout, clearTimeout, uni, __hooks: hooks });
  const api = module.exports; api.setActivePinia(api.createPinia()); api.setToken('test');
  const global = api.useGlobalStore(); global.status = 'authenticated'; global.userInfo = { id: 1, mini_program_id: 1, phone_bound: true };
  return { api, hooks, requests, navigation, storage, global };
}
const ok = (req, data) => req.success({ statusCode: 200, data: { status: 11, data } });
const tick = () => new Promise(resolve => setImmediate(resolve));
const summary = changes => ({ invite_code: 'ABCD2345', invited_count: 2, completed_count: 1, reward_points: 260, rules: { reward_bps: 10000, reward_basis: 'paid' }, ...changes });
const record = (id, changes) => ({ id, phone_masked: '138****000' + id, status: 'pending', reward_points: null, joined_at: '2026-10-10 10:00:00', rewarded_at: null, ...changes });
async function open(h, name) {
  const page = h.api[name].setup({}, { expose() {} }); const showing = h.hooks.show(); await tick();
  return { page, showing };
}

test('邀请概览读取服务端统计，刷新失败保留已显示的数据并可重试', async () => {
  const h = harness(), { page, showing } = await open(h, 'InvitePage');
  assert.match(h.requests[0].url, /member\/invite$/); assert.equal(page.summary.value, null);
  ok(h.requests[0], summary()); await showing;
  assert.equal(page.summary.value.invited_count, 2); assert.equal(page.summary.value.reward_points, 260);
  const failing = page.load(); h.requests[1].fail(); await failing;
  assert.match(page.error.value, /网络/); assert.equal(page.summary.value.completed_count, 1);
  const retry = page.load(); assert.equal(page.error.value, ''); ok(h.requests[2], summary({ invited_count: 3 })); await retry;
  assert.equal(page.summary.value.invited_count, 3);
  page.go('/pagesCenter/inviteShare/index'); assert.match(h.navigation[0].url, /inviteShare/);
});

test('分享卡片路径带上自己的邀请码，邀请码未就绪时只分享普通首页', async () => {
  const h = harness(), { page, showing } = await open(h, 'SharePage');
  assert.equal(h.hooks.share().path, '/pages/mall/index'); assert.equal(page.code.value, '');
  ok(h.requests[0], summary()); await showing;
  const card = h.hooks.share();
  assert.equal(card.path, '/pages/mall/index?inviter=ABCD2345'); assert.ok(card.title.length > 0);
});

test('邀请记录分页追加并去重，失败重试同一页，重复点击只请求一次', async () => {
  const h = harness(), { page, showing } = await open(h, 'RecordsPage');
  assert.equal(h.requests[0].data.page, 1);
  ok(h.requests[0], { data: [record(1), record(2, { status: 'completed', reward_points: 100 })], current_page: 1, last_page: 2 }); await showing;
  assert.equal(page.rows.value.length, 2); assert.equal(page.hasMore.value, true);
  const more = page.loadMore(), again = page.loadMore(); assert.equal(h.requests.length, 2); assert.equal(h.requests[1].data.page, 2);
  h.requests[1].fail(); await more; await again;
  assert.match(page.error.value, /网络/); assert.equal(page.rows.value.length, 2);
  const retry = page.retry(); assert.equal(h.requests[2].data.page, 2);
  ok(h.requests[2], { data: [record(2, { status: 'completed', reward_points: 100 }), record(3)], current_page: 2, last_page: 2 }); await retry;
  // 页面运行在独立的 vm 环境，数组原型不同，按内容比较。
  assert.equal(page.rows.value.map(row => row.id).join(','), '1,2,3'); assert.equal(page.hasMore.value, false);
  await page.loadMore(); assert.equal(h.requests.length, 3);
});

test('退出登录或离开页面后迟到的邀请记录不再显示', async () => {
  const h = harness(), { page, showing } = await open(h, 'RecordsPage');
  h.global.status = 'guest'; ok(h.requests[0], { data: [record(1)], current_page: 1, last_page: 1 }); await showing;
  assert.equal(page.rows.value.length, 0);
  const other = harness(), opened = await open(other, 'RecordsPage');
  other.hooks.unload(); ok(other.requests[0], { data: [record(1)], current_page: 1, last_page: 1 }); await opened.showing;
  assert.equal(opened.page.rows.value.length, 0);
});

test('奖励规则按后台实际赠分配置展示，未开启时明确说明', async () => {
  const h = harness(), { page, showing } = await open(h, 'RulesPage');
  assert.equal(page.loaded.value, false);
  ok(h.requests[0], summary({ rules: { reward_bps: 5000, reward_basis: 'base' } })); await showing;
  assert.match(page.rewardText.value, /每 1 元商品原价对应 0\.5 积分/);
  const again = page.load(); ok(h.requests[1], summary({ rules: null })); await again;
  assert.match(page.rewardText.value, /未开启消费赠分/);
});

test('只记录格式正确的邀请码并统一为大写', () => {
  const h = harness();
  for (const bad of [undefined, 12345678, '', 'short', 'toolongcode1', 'abc def1', '邀请码邀请码邀请']) h.api.rememberInviteCode(bad);
  assert.equal(h.api.getInviteCode(), '');
  h.api.rememberInviteCode('abcd2345'); assert.equal(h.api.getInviteCode(), 'ABCD2345');
  h.api.clearInviteCode(); assert.equal(h.api.getInviteCode(), '');
});
