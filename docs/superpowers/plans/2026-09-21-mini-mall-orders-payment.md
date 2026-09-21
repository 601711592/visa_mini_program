# 小程序商城订单与微信支付实施计划

日期：2026-09-21
对应设计：`docs/superpowers/specs/2026-09-21-mini-mall-orders-payment-design.md`

## 工作仓库与实施约束

- 小程序：`/Users/xulun/Documents/workspaces/visa/visa_mini_program`。
- API：`/Users/xulun/Documents/workspaces/services/docker/wwwroot/visa_service_2`，Laravel 5.8，`/api/min` 已有会员会话与地址接口。
- 管理后台：`/Users/xulun/Documents/workspaces/pc/qianzhenghoutaixitong2`，Umi 2 / React / Ant Design 3。
- 三个仓库开始每一阶段前重新检查 `git status`，保留用户及并行任务改动。宿主机当前没有 `php` 命令，后端测试使用项目现有 PHP 容器；先做代码和模拟网关验证，数据库迁移、商户配置、真实小额付款属于单独上线检查，不在本地开发时自动执行到生产环境。
- 本轮只开启商品详情“立即购买”的真实交易；隐藏购物车真实结算和退款入口。现有出行人填写、邮寄地址必填。付款后创建现有后台办理单，复用签证管理；小程序不展示签证节点和物流详情。

## 1. 固化接口和状态契约

**涉及**：API `routes/api.php`、新增 `docs/mini-commerce-api.md`；小程序新增 `src/services/orders.ts`、`src/services/benefits.ts` 的类型草稿。

1. 定义会员接口：`POST /member/orders/quote`、`POST /member/orders`、`GET /member/orders`、`GET /member/orders/{no}`、`POST /member/orders/{no}/pay`、`POST /member/orders/{no}/cancel`、`GET /member/orders/{no}/payment-status`。报价与创建仅接受一条商品明细；`mini_program_id` 从会话判定，其他请求字段参考 `src/services/address.ts` 的响应风格。
2. 定义资产读取接口：积分余额／流水、可用券与券详情。订单状态包含待付款、支付确认中、已付款待建单、办理中、已完成、已取消。所有金额以分传输，并返回用于展示的金额明细和规则版本。
3. 定义后台订单、商品映射、交易规则、优惠券模板与资产调整接口，以及独立权限。定义支付回调路由、错误码、报价变化响应、幂等键和分页格式。回调不使用会员鉴权。
4. 检查两个小程序的当前 AppID 与 `mini_program_id` 映射；将尚未配置的真实商户参数列入部署清单，不在仓库写入密钥。

**完成标准**：接口文档能明确区分客户端输入与服务端金额，页面和后端可据此独立实现；没有通过客户端传入的金额、会员或商户号决定交易。

## 2. 后端交易数据与商品可售配置

**涉及**：新增 `database/migrations/*mini_order*`、`*mini_inventory*`、`*mini_benefit*`；新增 `app/Models/MiniOrder*.php`、`app/Models/MiniInventory.php` 等；修改 `app/Models/Goods.php`、管理后台商品接口与 `src/pages/Mall/Goods/Form/index.js`。

1. 建交易主单、明细、加密出行人快照、支付尝试、办理单关联、库存余额／占用、积分账户／不可变流水、券模板／会员券、按小程序规则表。主单及关联表加唯一键：小程序加会员加幂等键、订单号、明细加旧办理单号；金额统一整数分。
2. 商品新增签证类型映射与出行人要求，后台商品表单提供签证类型选择。服务端校验商品、小程序和签证类型；无映射商品不可真实下单。
3. 价格日历的日期／人群名额标准化为可锁定库存记录。商品修改名额时禁止小于已售及已占用量；缺少有效日期价格或名额即不可报价。
4. 出行人护照号、生日及地址快照限定授权读取，完整值加密存储，列表与详情只回传所需脱敏值。补充迁移回滚与 SQLite 测试兼容性。

**验证**：针对库表约束、商品归属、缺失签证类型、名额不足与并发占用编写后端测试；运行新增专项 PHPUnit 用例。

## 3. 服务端报价、优惠及会员资产

**涉及**：新增 `app/Services/Mini/OrderQuoteService.php`、`OrderInventoryService.php`、`MemberBenefitService.php`，新增小程序会员控制器；后台规则及券模板接口；管理后台规则页面。

1. 服务端根据商品、套餐稳定 key、人群、日期和人数重新取价；检查上架、归属、限购、名额及邮寄地址归属。客户端金额仅用于展示对照，不用于落库。
2. 按小程序已启用的规则计算多人优惠、最多一张券与积分。500 积分抵 10 元固定；后台可配置优惠范围、门槛、叠加顺序、抵扣上限、赠分基数和支付时限。未配置项不启用，缺支付时限阻止创建订单。
3. 建立积分与券的原子占用、支付确认、取消释放流程；首次手机号绑定资格对应 10 元新人券模板，发放幂等。管理后台提供资产读取与有审计记录的调整入口。
4. 创建订单时重算报价；报价版本或金额变化返回最新报价供用户确认。订单创建幂等，重复请求返回同一订单；地址缺失、删除或跨会员时拒单。

**验证**：PHPUnit 覆盖价格篡改、日历价格、优惠门槛、积分上限、券与积分叠加、地址必填、重复提交、并发占用及取消返还；测试从空会员资产开始，避免依赖演示数据。

## 4. 微信支付 API v3 与订单状态

**涉及**：新增 `config/mini_pay.php`、`app/Services/Mini/WeChatPayGateway.php`、`MiniPaymentService.php`、支付通知控制器与补偿任务；修改 `routes/api.php`、调度注册。

1. 先核对实际 PHP 运行版本与现有 HTTP 客户端，选择兼容 Laravel 5.8 的 API v3 实现；用网关接口隔离签名、下单、查单、关单和通知验签解密。每个小程序独立选择 AppID、商户号及密钥，配置缺失时明确拒绝发起支付。
2. 创建预支付单并返回小程序 `wx.requestPayment` 参数；重复支付沿用原商户订单号，按微信预支付时效刷新凭据。支付成功通知校验签名、解密、AppID、商户号、订单号和分金额后，在事务内幂等地转为已付款待建单。
3. 客户端支付回调只调用查单；超时与漏通知由补偿任务查单。取消与到期先确认微信未付款并关单，再释放名额和权益；与支付成功竞态时付款成功优先。
4. 为支付通知、查单和取消保存必要审计事件与异常状态，不记录密钥或完整护照资料。

**验证**：模拟网关覆盖签名错误、金额不符、跨商户回调、重复与乱序回调、取消和付款竞态、查单补偿、网络超时及无密钥配置。真实资金调用留到部署联调。

## 5. 付款后生成旧体系办理单

**涉及**：新增 `app/Services/Mini/OrderFulfillmentService.php`、可重试任务与交易／旧订单关联模型；修改 `app/Models/Order.php`、`app/Services/VisaService.php` 和后台订单查询。

1. 每小程序配置独立后台店铺及“小程序”店铺类型；按会员建立稳定客户映射。履约服务不调用要求管理员会话的线下建单控制器，独立写入旧 `order`、联系人与需要的 `order_visa` 记录。
2. 商品明细到旧办理单保持一对一唯一关联；付款通知先提交本地已付款状态，再派发可重试任务。失败留在“已付款待建单”并在后台展示重试入口；重试不重复创建旧订单。
3. 小程序店铺复用现有签证添加与状态处理分支，但排除线下订单的人工确认付款和删除。商品免填出行人时，后台可补录签证记录。
4. 旧办理单全部签证记录达到现有完成终态后，交易主单变为已完成，并按配置的赠分基数幂等发放积分。小程序只显示汇总状态。

**验证**：专项测试覆盖一单一办理单、人数和出行人归属、缺地址拒单、重复任务、旧订单状态更新、小程序店铺权限隔离及完成赠分一次；人工检查现有后台签证操作页。

## 6. 管理后台业务页面

**涉及**：`config/router.config.js`、`src/services/api.js`；新增 `src/pages/Mall/Orders/`、`src/pages/Mall/TradeRules/`、`src/pages/Mall/Coupons/`；修改 `src/pages/Mall/Goods/Form/index.js`、`src/pages/Order/index.js`。

1. 添加按小程序筛选的交易订单列表、详情、支付／履约异常与受控重试；显示关联旧办理单及签证管理入口。
2. 添加按小程序的交易规则与券模板配置页；配置校验覆盖金额单位、门槛、有效期、叠加次序和支付时限。资产调整需要独立权限、原因和日志。
3. 旧订单列表标识小程序来源，可跳交易主单；小程序来源订单不出现线下“支付确认”和删除操作。

**验证**：后台接口权限测试、页面关键交互检查与 `npm run linux_test` 构建；不调用部署脚本。

## 7. 小程序替换演示交易

**涉及**：新增 `src/services/orders.ts`、`src/services/benefits.ts`；修改 `src/store/mall.ts`、`src/store/center.ts`、`src/pagesMall/goodsDetail/index.vue`、`checkout/index.vue`、`payment/index.vue`、`paySuccess/index.vue`、`chooseCoupon/index.vue`，`src/pagesOrder/orders/index.vue`、`orderDetail/index.vue`、`orderPay/index.vue`，`src/pagesCenter/points/index.vue`、`coupons/index.vue`、`couponDetail/index.vue`、`couponGoods/index.vue`，以及个人中心和首页购物车入口。

1. 保留商品选择和出行人草稿；隐藏加购及购物车入口，从立即购买进入单明细结算。现有 `packIndex` 只用于客户端选中状态，请求中改传商品配置里的稳定套餐 `key`。结算页读取服务端报价，展示商品、优惠、地址快照和计价；无地址引导新增，选择的地址被删除时提示重选，未选地址不可提交。
2. 提交前校验协议、出行人数和必填资料；服务端报价变化显示新金额并让用户再次确认。创建订单成功后进入付款页。`src/pagesMall/chooseCoupon/index.vue`、`src/pagesCenter/points/index.vue`、`coupons/index.vue` 及个人中心权益入口改读真实余额及可用性，不展示演示资产；保留 `src/store/center.ts` 现有真实地址管理动作。
3. 付款页使用服务端签名参数调用 `uni.requestPayment`／微信支付能力，返回后查服务端状态；取消或失败保留待付款订单，成功只在服务端已确认时显示。继续付款复用同一流程。
4. 订单列表、详情与个人中心入口改读当前会员的服务端订单；支持登录恢复、刷新、加载、空状态、失败重试。隐藏退款动作和办理节点／物流详情，不再出现模拟支付按钮。

**验证**：针对地址必填、登录恢复、报价变更、重复点击、支付结果确认和订单状态编写必要的交互测试；执行 `npm run test:auth`、`npm run type-check`、`npm run build:mp-weixin:app1` 和 `npm run build:mp-weixin:app2`，记录既有类型错误基线并检查无新增。构建可能改写 `src/manifest.json`，结束后核对并只恢复构建副作用。

## 8. 联调与交付

1. 对三仓库代码做一次接口契约和状态机交叉检查，运行后端专项与相关既有测试、后台构建、小程序两目标构建；只扩展测试以解决具体剩余风险。
2. 在隔离环境执行新增迁移并配置测试商品、签证类型、商户映射、交易规则与券模板；验证商户回调外网 HTTPS 可达。真实商户凭据由部署环境提供，不写入仓库或聊天记录。
3. 具备商户权限后，用受控小额订单在微信开发者工具及真机核对下单、支付、查单、取消、后台办理单生成和对账。若凭据或双 AppID 映射未就绪，交付代码及模拟网关结果，并明确标记真实资金联调未完成。
4. 更新 `docs/mall-iteration/README.md` 的订单模块状态、配置说明及遗留项。购物车、文档外填表打通、退款和小程序签证进度／物流展示保持延期范围。

## 执行顺序与验收门槛

顺序为 **接口契约 → 数据与报价 → 支付与补偿 → 办理单衔接 → 后台 → 小程序 → 联调**。每一步只在自身专项检查通过后进入依赖步骤。正式可用的门槛是：服务端金额与资产一致、支付状态仅由微信可验证结果确认、取消不覆盖已付款、后台可办理已付款订单、会员及小程序数据隔离、两端页面显示相同订单状态。真实支付与商户配置的验证结果单独报告。
