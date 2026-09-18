# 设计稿还原修正 · 2026-09-18

## 状态与边界

本次针对上一版通用组件样式与设计稿不一致的问题返工。依据同目录 `design/personal-center.html`、`personal-center.css` 最新覆盖规则及 `flow.css` 的最新分类布局，不修改设计原件，不增加功能，不改后端、接口契约或真实授权/支付逻辑。

已修正代码与静态组件 CSS 几何检查不等于完整小程序视觉验收。PR 继续保持草稿，不合并、不部署。

## 修正内容

| 区域 | 修正 |
| --- | --- |
| 图标 | 从 Lucide 0.468.0 原矢量路径导出独立 PNG；取消长雪碧图裁切及未知图标回退首页。深蓝 #245B7A，正文图标 stroke-width 1.65。 |
| 入口映射 | 待付款 wallet、办理中 file-clock、完成 circle-check、退款 undo-2、积分 coins、券 ticket-percent、邀请 user-round-plus、地址 map-pin、公司地图 map。 |
| 原生 Tab | house / layout-grid / user-round；普通态与选中态为独立本地 PNG，不再复用同一个文件。原生导航及胶囊不从 HTML 复制。 |
| 个人中心 | 页面内品牌区 288rpx（原稿 398 减去导航示意 110）；头像 150rpx，订单卡片上移 93rpx；订单卡 258rpx，权益行 150rpx，服务行 124rpx，恢复文字层级和详情提示。 |
| 权益按钮 | 胶囊视觉高度 66rpx、宽 172rpx；独立外层按钮保留 88rpx 触控高度，不嵌套按钮。 |
| 分类与首页 | 分类栏 152rpx，右侧白底/左上 36rpx 圆角，分类封面宽高比 1.3；首页封面保持正方形，避免共用一种卡片比例。分类导航先购物车后搜索。 |
| 订单 | 列表与详情使用 112×128rpx 商品缩略图变体；结算仍为 152×152rpx，不把列表缩略图尺寸套给结算；修正标题、金额、分隔线和状态区。 |
| 优惠券 | 176rpx 白色票面、62rpx 金额、6rpx 暖色侧边及虚线，恢复标题/规则层级；已用/过期不再整卡降低透明度。 |
| 共用样式 | 修正卡片内外边距、筛选线、表单边框、订单行、字体和操作按钮尺寸。 |
| 登录 | 使用 480×320rpx 原插图尺寸、96rpx 主按钮及 24rpx 圆角，调整间距和短屏样式。只改布局，不改正式手机号授权、隐私回调或会话逻辑。 |

头像照片不是统一业务素材：存在用户头像时正常显示；缺少头像时保持空头像，不用设计图中的人物照片冒充真实用户。未为了一个头像将整张 1.27MB 设计截图加入小程序资源。

## 图标维护

- 路径来源和旧接口别名：`src/mall/design-icon-source.json`。
- 运行时 PNG 数据：`src/mall/design-icons.ts`。原形状不变，仅栅格化及透明度量化；主体颜色不变。
- 原生 Tab 文件：`src/static/mall/{home,grid,user}{,-active}.png`。
- 生成脚本：`python scripts/generate-mall-icons.py`，开发环境需要 Pillow 和 CairoSVG，运行时不增加依赖。
- 许可：`src/mall/LUCIDE-LICENSE.txt`，源版本为 0.468.0。
- 不把依赖 DOM 的 Lucide 脚本或本地 SVG 当作微信原生图标运行。

## 实际检查

1. `node --test tests/design-contract.test.cjs`：8 项通过、0 失败。覆盖源图标/别名、PNG 尺寸、Tab 资源区别与路径、明确样式约束，以及本轮 14 个 Vue 文件中 TypeScript 脚本的语法转译。这不是 Vue 模板编译或全量类型检查。
2. `python tests/visual-fixtures.py`：Chromium 运行静态组件 CSS 夹具，检查 320/375/390/430 宽；个人中心、分类、优惠券夹具均无横向溢出；个人中心 7 个区域 × 4 宽的几何差值最大 0.016 CSS px。
3. 该几何数值只衡量被指定区域的边界框，不是全页面像素还原率。夹具是人工组装的组件标记，读取本轮真实样式文件；没有启动 Vue/uni-app。原生导航占位归一化，头像照片不参与像素比较。

截图和测量文件由脚本写到项目 `qa/` 目录。记录见 `qa/2026-09-18-style-fix.json`（相对于本文档目录）。测试环境 Node 22.16.0、TypeScript 5.8.3、Python Playwright + Chromium；未成功安装完整项目依赖，不能据此声称 H5/微信构建通过。

### 复现静态检查

```sh
# 在已有项目依赖的环境执行；不运行真实 API
node --test tests/design-contract.test.cjs

# 以下仅为独立视觉夹具开发依赖，不写入项目运行时依赖
python -m pip install pillow cairosvg playwright
python -m playwright install chromium
python tests/visual-fixtures.py
# 也可指定 CHROMIUM_PATH 使用已安装的 Chromium
```

## 仍需完整运行环境验收

完整 H5/微信构建、Vue scoped 样式和原生组件的实际表现、所有业务页面逐屏截图、系统字体放大、原生 Tab/胶囊/安全区和微信真机效果尚未通过。本轮修正不构成“所有样式问题已消除”的结论。真实接口和支付继续不在本轮范围。
