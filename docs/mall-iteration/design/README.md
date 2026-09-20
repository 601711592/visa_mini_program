# 独立多页面 HTML 预览

从 `pages.html` 开始，使用本地 HTTP 服务。无需构建，无 iframe，无集中式页面渲染器。

## 目录

- `mall/`：首页、分类、搜索、商品详情、购物车。
- `orders/`：订单、结算、出行人、选券、付款、退款与取消。
- `benefits/`：积分、券及适用商品。
- `account/`：个人中心、登录、授权、资料、地址、地图。
- `invite/`：邀请、记录、规则与分享。
- `shared/`：样式、演示数据、路由地址映射、临时存储、通用 UI 组件与金额计算。
- `assets/`：本地图标与图片。
- `tests/pages.cjs`：34 页加载及跨页交互回归。

## 修改页面

每个 HTML 包含自己的实际页面结构及默认示例内容，不再复制隐藏的个人中心外壳。
每页加载同名 JS：静态页面由 HTML 持有结构，JS 绑定事件；订单、列表、结算等动态页面在同名 JS 中更新内容。修改动态结构时需同步该页 HTML 默认示例及同名 JS，避免初始内容与交互状态不一致。
模块 actions.js 只放该模块的操作处理，不渲染其他页面。共享脚本不存在按 page 分支拼接全部页面的逻辑。

跳转通过真实 HTML URL 完成；sessionStorage 只存当前标签页的演示状态。不要在原型输入真实护照、手机号等资料。个人中心的游客切换用于检查未登录状态，工具栏可重置数据。旧根目录 personal-center.html 已删除；个人中心请使用 account/personal-center.html，统一入口为 pages.html。

## 验证

临时环境安装 jsdom 26.1.0 后执行：

```sh
NODE_PATH=/tmp/personal-center-dom-check/node_modules node tests/pages.cjs
```

检查 HTML 有实际内容、资源路径、无 iframe、分类与购物车、分商品出行人、选券、付款失败/成功、订单与积分同步、登录协议与业务恢复、地址新增删除。未执行截图或微信真机测试。
