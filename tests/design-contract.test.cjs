const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const source = JSON.parse(read('src/mall/design-icon-source.json'));
const compiled = ts.transpileModule(read('src/mall/design-icons.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context = { exports: {} }; vm.runInNewContext(compiled,context);
const icon = context.exports.designIcon;
test('18 个独立 PNG 源资产、19 个旧接口别名完整',()=>{
  assert.equal(Object.keys(source.paths).length,18);assert.equal(Object.keys(source.aliases).length,19);
  for(const [alias,canonical] of Object.entries(source.aliases)){
    assert.equal(icon(alias),icon(canonical));
    const png=Buffer.from(icon(alias).split(',')[1],'base64');
    assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),96);assert.equal(png.readUInt32BE(20),96);
  }
});
test('明确匹配原设计的入口形状，不用时钟/礼盒/普通券近似替代',()=>{
  assert.equal(source.aliases.points,'coins');assert.equal(source.aliases.coupon,'ticket-percent');assert.equal(source.aliases.invite,'user-round-plus');
  assert.match(read('src/components/mall/OrderShortcuts.vue'),/status: '待付款', icon: 'wallet'/);
  assert.notEqual(icon('wallet'),icon('clock'));assert.equal(icon('unknown'),'');
});
test('普通态和选中态使用不同的本地 81×81 PNG，所有路径存在',()=>{
  const pages=JSON.parse(read('src/pages.json'));
  for(const tab of pages.tabBar.list){
    assert.notEqual(tab.iconPath,tab.selectedIconPath);
    const a=fs.readFileSync(path.join(root,'src',tab.iconPath)),b=fs.readFileSync(path.join(root,'src',tab.selectedIconPath));
    assert.notDeepEqual(a,b);for(const p of [a,b]){assert.equal(p.readUInt32BE(16),81);assert.equal(p.readUInt32BE(20),81);}
  }
});
test('图标组件不再裁切、拉伸雪碧图，不引入 Lucide DOM 运行代码',()=>{
  const s=read('src/components/mall/MallIcon.vue');assert.match(s,/mode="aspectFit"/);assert.doesNotMatch(s,/sprite|marginTop|scaleToFill|lucide.min.js/);
});
test('个人中心关键尺寸来自设计，而非通用卡片默认值',()=>{
  assert.match(read('src/components/mall/ProfileHeader.vue'),/width: 150rpx; height: 150rpx/);
  assert.match(read('src/pages/account/index.vue'),/margin-top: -93rpx/);
  assert.match(read('src/components/mall/OrderShortcuts.vue'),/height: 258rpx/);
  assert.match(read('src/components/mall/BenefitRow.vue'),/min-height: 150rpx/);
  assert.match(read('src/components/mall/BenefitRow.vue'),/min-height: 66rpx/);
  assert.match(read('src/components/mall/ServiceList.vue'),/min-height: 124rpx/);
});
test('分类页和首页卡片采用独立比例，不套同一布局',()=>{
  assert.match(read('src/pages/category/index.vue'),/width: 152rpx/);
  assert.match(read('src/pages/category/index.vue'),/variant="category"/);
  assert.match(read('src/components/mall/CatalogCards.vue'),/padding-top: 100%/);
  assert.match(read('src/components/mall/CatalogCards.vue'),/padding-top: 76\.923077%/);
});
test('登录关键视觉、订单商品变体与优惠券票面尺寸有明确约束',()=>{
  const login=read('src/mall/login.scss');assert.match(login,/width: 480rpx/);assert.match(login,/height: 320rpx/);assert.match(login,/border-radius: 24rpx/);
  assert.match(read('src/components/mall/CouponCard.vue'),/width: 176rpx/);
  assert.match(read('src/pagesMall/orders/index.vue'),/variant="order"/);
  assert.match(read('src/pagesMall/order/index.vue'),/variant="order"/);
});
test('修改过的组件 TypeScript 脚本可语法转译（不是完整 Vue 类型检查）',()=>{
  const files=[...['ProfileHeader','OrderShortcuts','BenefitRow','ServiceList','CatalogCards','CouponCard','MallIcon','CatalogNav','ProductLine','PriceBreakdown'].map(n=>`src/components/mall/${n}.vue`),'src/pages/account/index.vue','src/pages/category/index.vue','src/pagesMall/orders/index.vue','src/pagesMall/order/index.vue'];
  for(const file of files){
    const text=read(file), script=text.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1]||'';
    const out=ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
    assert.deepEqual(out.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>d.messageText),[],file);
  }
});
