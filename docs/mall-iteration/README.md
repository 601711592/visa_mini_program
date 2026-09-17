# 董大象签证商城：本期迭代接续入口

更新日期：2026-09-16。

## 登录开发进度（2026-09-17）

用户已确认登录模块改为真实接入。已实现小程序登录、账号入口、协议与微信隐私授权衔接、业务恢复，以及配套后端会员接口；其他商城模块仍沿用原有阶段安排。开发说明、配置及验证结果见 [LOGIN-IMPLEMENTATION.md](LOGIN-IMPLEMENTATION.md)。真实微信授权联调与业务数据库迁移尚未执行。

以下原型阶段说明保留为历史记录；登录模块以最新开发说明和用户确认规则为准。

## 当前阶段与下一步

用户已确认浅蓝主色 #8AD0F9、单色深蓝图标 #245B7A 与分层文字。当前已补充商城全流程 HTML 设计预览，评审入口为 `design/pages.html`，设计规范为 `design/DESIGN-LANGUAGE.md`。本轮未开展 uni-app 业务实现、真实接口接入、微信支付联调或发布。

新对话请先阅读本文件，再阅读 REQUIREMENTS.md、LOGIN.md，并查看 prototype/index.html。不要重新发散设计，也不要依据原始 PDF 扩大本期范围。

## 文件

| 路径 | 用途 |
| --- | --- |
| `REQUIREMENTS.md` | 已确认范围、页面交互、暂定规则及验收要求 |
| `LOGIN.md` | 最新登录方案、微信能力映射及上线前核对项 |
| `prototype/index.html` | 可用浏览器打开的独立原型，起始为未登录个人中心 |
| `prototype/visa-prototype.fragment.html` | 可编辑原型源，含样式和交互逻辑；不是 uni-app 业务代码 |
| `source/董大象签证商城_20260910171607.pdf` | 原始需求文档副本，保留原件内容 |

原型封面示例已内嵌，不依赖本次对话的图片目录。导出页内置展示样式与交互脚本；图标初始化可能使用其导出模板中的 CDN，离线时应以文字按钮为准。后续原型用图片占位符即可，用户明确无需生成图片。

## 决策优先级

1. 用户最新明确指示。
2. 本目录记录的最终确认方案。
3. 原型作为布局、页面关系和操作流程参考。
4. 原始 PDF（本期暂缓内容不得直接执行）。

原型中的价格、日期、折扣、用户和订单均为演示数据；不等同于已确认业务规则。原型中的按钮和流程不代表已接通微信平台。

## 工作项目

- 小程序：`/Users/xulun/Documents/workspaces/visa/visa_mini_program`，uni-app + Vue 3 + TypeScript + Pinia。
- 后端：`/Users/xulun/Documents/workspaces/services/docker/wwwroot/visa_service_2`。
- 管理后台：`/Users/xulun/Documents/workspaces/pc/qianzhenghoutaixitong2`。

当前阶段修改目标是小程序。后端、管理后台仅作为接口及业务背景，未经明确推进不要开始真实支付、数据迁移或部署。

## 既有代码定位

- 首页：`src/pages/mall/index.vue`、`index.scss`。
- 搜索：`src/pages/search/index.vue`。
- 商品详情：`src/pagesMall/goodsDetail/index.vue`、`index.scss`。
- 页面注册：`src/pages.json`。
- 商品接口：`src/services/shop.ts`。
- 登录与用户状态：`src/services/login.ts`、`src/store/global.ts`。
- 支付封装：`src/services/pay.ts`、`src/utils/index.ts` 的 requestPayment。
- 公共页面容器：`src/components/layout/layout.vue`。

以上为本次讨论的代码定位，不是后续对话免检依据；开发前重新阅读文件和适用的 AGENTS.md。已有登录弹窗引用与支付跳转曾存在不完整情况，后续需核实，不能认为调用封装即代表流程完整。

## 工作区保护

归档时项目已有多处未提交修改，包括首页、公共布局、请求层、构建配置、环境及 manifest 等。本次未修改这些业务文件。后续先检查 `git status`，保留既有修改，不重置或覆盖。未执行 git 提交、推送或发布。

## 下一对话可直接发送

> 继续董大象签证商城小程序迭代。先阅读 `/Users/xulun/Documents/workspaces/visa/visa_mini_program/docs/mall-iteration/README.md`、同目录 REQUIREMENTS.md 和 LOGIN.md，并查看 prototype/index.html。原型已确认，开始在现有 uni-app 小程序中进行前端静态开发，保留目前首页及商品详情的原有交互，按归档需求补充下单、支付展示、积分、优惠券、个人中心和手机号快捷登录。图片用占位符或现有素材。暂不接真实接口、授权、支付，不发散其他需求；先检查并保护工作区已有改动，使用简体中文沟通，完成与改动相称的构建及交互检查。
