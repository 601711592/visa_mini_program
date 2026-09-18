# 董大象签证商城：本期迭代接续入口

更新日期：2026-09-18。

## 当前开发状态

本期设计范围内的商城 uni-app 前端页面、导航注册和内存模拟交互代码已补齐，正式登录页布局已调整。工作分支为 `feat/mall-static-pages-20260918`，提交在 PR #1 中，尚未合并到 main。

**代码实现与验收状态分开：核心模型、选价及登录路由的 29 项离线检查通过；本分支微信/H5 构建、完整登录回归、Vue 框架检查及逐屏视觉/真机验收未完成。** GitHub Actions 首次执行返回失败且没有执行步骤和可读日志，不能把检查配置已提交写成构建通过。

开发范围、预览命令、实际验证记录及剩余验收项见 [FRONTEND-IMPLEMENTATION.md](FRONTEND-IMPLEMENTATION.md)。旧 `FRONTEND-WIP.md` 只保留阶段记录，不再代表页面尚未接线。

## 本轮边界

用户最新要求：根据已确认设计完成剩余前端页面和登录页调整，**不开发后端、不做接口联调**。本轮未修改后端、数据库、接口契约或管理后台；未执行真实注册、手机号授权联调、支付、迁移、部署或合并。

原有真实登录逻辑保留。2026-09-17 的历史登录交付说明见 [LOGIN-IMPLEMENTATION.md](LOGIN-IMPLEMENTATION.md)，其中历史测试记录不等于本分支修改后的回归结果。

## 如何预览本轮页面

使用独立前端模式：

```sh
npm run dev:h5 -- --mode preview
# 或在微信开发者工具检查前端页面
npm run dev:mp-weixin -- --mode preview
```

`.env.preview` 将演示商品、账号、订单、券、积分和地址放在独立内存状态，不初始化真实会话、不读取正式协议、不发起真实授权或支付。顶部有明确演示提示，长按可切换游客/已登录/重置状态。只使用测试个人资料。

普通 app1/app2 构建默认不启用演示，保留原有登录及商品读取；未接接口的新业务显示待接入状态。验收完整前端流程必须使用 `--mode preview`，不能用普通模式的“待接入”界面判断页面未实现。

## 设计和需求依据

先阅读本文件、`FRONTEND-IMPLEMENTATION.md`、`REQUIREMENTS.md`、`LOGIN.md`，然后对照 `design/pages.html`、`design/DESIGN-LANGUAGE.md` 和归档原型。不要重新发散，也不要依据原始 PDF 扩大本期范围。

确认配色为主色 `#8AD0F9`、图标 `#245B7A`、分层文字。商品浏览保留既有信息结构；独立分类使用左侧分类与右侧双列商品。三个原生 Tab 为首页、产品分类、我的。订单、地址等子页不重复底栏，HTML 胶囊/工具条不复制到小程序。

| 文件 | 用途 |
| --- | --- |
| `FRONTEND-IMPLEMENTATION.md` | 本轮代码范围、模式开关、预览与验证、验收缺口 |
| `qa/2026-09-18-core-checks.json` | 实际核心检查结果、源码哈希与 CI 失败记录 |
| `REQUIREMENTS.md` | 已确认需求、暂定规则及功能验收要求 |
| `LOGIN.md` | 登录方案与微信能力边界 |
| `LOGIN-IMPLEMENTATION.md` | 2026-09-17 历史真实登录开发说明 |
| `design/pages.html` | 已确认 HTML 设计目录 |
| `design/DESIGN-LANGUAGE.md` | 布局、配色、导航和交互设计要求 |
| `prototype/index.html` | 归档交互原型，不是 uni-app 业务代码 |
| `source/董大象签证商城_20260910171607.pdf` | 原始需求副本；暂缓项不能直接纳入 |

## 决策优先级

1. 用户最新明确指示。
2. 本目录最终确认方案；带日期的最新状态优先于历史阶段记录。
3. 设计稿与原型作为布局、页面关系和交互参考。
4. 原始 PDF；本期暂缓内容不得直接执行。

演示价格、日期、折扣、券门槛和资产不代表正式业务规则。地图坐标、邀请奖励仍为待配置；不能虚构地点、推荐码或奖励。退款审核中不等于退款完成，支付演示不等于微信支付成功。

## 代码定位

- 主要页面：`src/pages/mall/`、`category/`、`search/`、`account/`、`login/`。
- 商城子页面：`src/pagesMall/`。
- 公共商城组件：`src/components/mall/`。
- 前端模型与统一样式：`src/mall/`。
- 独立模拟状态：`src/store/mall-preview.ts`；商品适配：`src/store/catalog.ts`。
- 原有真实登录：`src/store/global.ts`、`src/services/login.ts`。
- 登录返回适配：`src/utils/auth-routing.ts`。
- 页面注册与原生 Tab：`src/pages.json`。

## 工作区与后续执行

小程序工作目录：`/Users/xulun/Documents/workspaces/visa/visa_mini_program`。
后端参考目录：`/Users/xulun/Documents/workspaces/services/docker/wwwroot/visa_service_2`。
管理后台参考目录：`/Users/xulun/Documents/workspaces/pc/qianzhenghoutaixitong2`。

当前只修改小程序前端。接续前必须检查 `git status` 和适用的 `AGENTS.md` / `CLAUDE.md`，保护既有未提交修改，不 reset 或覆盖。本轮远程提交不包含用户电脑上的未提交文件。

下一阶段在完整依赖环境验证本分支构建和页面视觉，修复发现的问题，不重新实现已经提交的页面。未经过确认，不启动后端开发、真实支付、数据库迁移、合并或部署。
