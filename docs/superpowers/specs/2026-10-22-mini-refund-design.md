# 小程序订单退款设计

日期：2026-10-22

## 目标与范围

在现有小程序交易订单上补齐退款：会员对已完成订单申请整单退款，商家审核后退款；商家也可以对办理中或已完成的订单主动退款，不需要审批。退款走微信支付 API v3，以微信最终退款结果为准；退款成功后退还积分和优惠券，扣回已发放的完成赠分和邀请奖励，关闭旧体系办理单。

依据原始需求 PDF 第 5、6、7、12 页，以及 `docs/mall-iteration/REQUIREMENTS.md` 第 1 节记录的退款口径（2026-10-22 用户确认，其余四条见文末“补充口径”）：

| 口径 | 决定 |
| --- | --- |
| 用户申请 | 只能对已完成订单申请；办理中的订单联系客服，由商家主动退款 |
| 申请期限 | 下单时间起半年内，超期弹窗提示无法在线申请；商家主动退款不受此限 |
| 审批 | 用户申请需要商家审核；商家主动退款不需要审批 |
| 退款范围 | 只退整单，退全部实付金额，积分和券全部退回 |
| 过期券 | 退回用户名下，已过期的保持失效 |
| 扣回奖励 | 扣回完成赠分和邀请奖励；可用积分不足时扣到 0 为止，不再追讨 |

不在本次范围：部分退款、按明细退款、异常退款的银行卡信息补录（在微信商户平台处理）、退款消息推送。

## 状态设计

交易主单 `mini_trade_orders.status` 在现有 `pending / processing / completed / cancelled` 之外新增：

- `refunding`：已向微信发起退款、等待结果。处于该状态时不再触发办理完成和赠分。
- `refunded`：微信确认退款成功，终态。

审核过程不改变主单状态：用户提交申请后订单仍为 `completed`，审核通过时才转为 `refunding`；驳回或用户撤销后订单保持原状态。

新增退款单表，每次退款一行，状态如下：

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `reviewing` | 用户已申请，待商家审核 | 通过 → `refunding`；驳回 → `rejected`；用户撤销 → `cancelled` |
| `refunding` | 已向微信提交，结果未定（含请求超时） | 按通知或查单结果转为 `succeeded`、`closed`、`abnormal` |
| `succeeded` | 微信退款成功，资产已处理 | 终态 |
| `closed` | 微信关闭退款，资金没有退出 | 主单恢复到退款前的状态，可重新发起 |
| `abnormal` | 微信退款异常（如用户银行卡已注销） | 商家在微信商户平台处理后，后台“重新查询”同步结果 |
| `rejected`、`cancelled` | 驳回、撤销 | 终态；仍在期限内的可以再次申请 |

同一订单同时只能有一笔进行中的退款单（`reviewing`、`refunding`、`abnormal`），在锁定主单行的事务内检查。

## 数据库

新建 `mini_trade_refunds`，字段均加注释：

- `refund_no`：唯一，作为微信 `out_refund_no`，格式 `MR` 加随机串；同一笔退款重试时始终使用同一个号，不能换号重提。
- `order_no`、`mini_program_id`、`member_id`
- `source`：`member` 用户申请，`admin` 商家主动退款
- `status`：取值见上节
- `amount_cents`：退款金额，等于主单 `due_cents`（含改价后的金额）
- `reason`：退款原因，最多 100 字；`note`：补充说明，最多 300 字；`reject_reason`：驳回原因
- `order_status_before`：发起退款前的主单状态，微信关闭退款时据此恢复
- `operator_id`：审核人或发起人；`idempotency_key`：前端提交幂等键，按会员或管理员唯一
- `wechat_refund_id`、`last_error`：微信退款单号，以及最近一次失败的简述（不存敏感资料）
- `requested_at`、`reviewed_at`、`submitted_at`、`refunded_at`、`created_at`、`updated_at`

`mini_trade_orders` 增加 `refunded_at`，并更新 `status` 字段注释。

积分流水 `type` 新增三种：`refund` 退还抵扣积分、`reward_revoke` 扣回完成赠分、`referral_revoke` 扣回邀请奖励。`mini_trade_payment_events` 增加 `kind = refund` 的事件，键为 `wechat-refund:{refund_id}`，防止重复处理。

## 微信退款对接

在 `WeChatPayGateway` 中新增两个方法：

- `refund($order, $refund)`：`POST /v3/refund/domestic/refunds`，传 `out_trade_no`（即主单 `payment_no`）、`out_refund_no`、`reason`、`notify_url`、`amount.refund / total / currency`。`notify_url` 沿用支付回调的同一个地址（`notify_url/{miniProgramId}`），不新增商户配置项。
- `queryRefund($order, $refundNo)`：`GET /v3/refund/domestic/refunds/{out_refund_no}`。

结果处理规则沿用现有支付的思路：

- 返回 `SUCCESS`、`PROCESSING` 时，按返回状态处理。
- 返回明确的拒绝（如参数错误、商户余额不足、超过可退款期限），退款单回到可重新提交的状态，记录 `last_error`，后台显示原因。
- 网络超时或含义不明的错误，一律视为“结果未知”：保持 `refunding`，由查单确定结果，不换号重提。

`PayNotifyController` 按通知的 `event_type` 分流：`TRANSACTION.SUCCESS` 走现有收款逻辑；`REFUND.SUCCESS`、`REFUND.ABNORMAL`、`REFUND.CLOSED` 走退款处理。验签、时间窗口和解密逻辑共用，`verifyNotification` 改为返回事件类型和解密后的资源，收款和退款各自校验内容。退款通知需要核对 `out_refund_no`、`out_trade_no` 和退款金额都与本地记录一致。

补偿任务：`mini-trade:reconcile` 增加一段，查询 `refunding` 状态超过 5 分钟的退款单，每次限量，与现有过期订单处理方式相同。

实现前需对照微信支付官方文档，核对申请退款、查询退款、退款通知的字段和错误码；上面的接口路径和状态值按 API v3 写成，未在本次核实。

## 退款成功后的处理

收到退款成功（通知或查单）后，在同一事务内锁定主单并按顺序处理。退款事件和每条积分流水都带幂等键，重复通知不会重复处理。

1. 退款单置为 `succeeded`，写入 `refunded_at`、`wechat_refund_id`；主单置为 `refunded`。
2. **退还抵扣积分**：`points_used > 0` 时加回会员余额，流水类型 `refund`，键 `refund-return:{order_no}`。
3. **退回优惠券**：本单使用的券改回 `available`，并清空 `order_no`。券的展示状态按 `ends_at` 计算，已过期的自然显示为已失效，与取消订单时的处理一致。
4. **扣回完成赠分**：存在流水 `reward:{order_no}` 时，扣回金额取“赠分”和“会员当前可用积分（余额减去待付款占用）”中较小的一个，流水类型 `reward_revoke`，原因写明应扣多少、实扣多少。第 2 步先退还积分，所以退还的积分可以用来抵扣。
5. **扣回邀请奖励**：邀请关系的 `reward_order_no` 等于本单且 `reward_points > 0` 时，按第 4 步的规则扣回邀请人积分，流水类型 `referral_revoke`。
6. **释放名额**：有出发日期的明细，库存的 `sold` 减去购买人数。
7. **关闭办理单**：旧 `order` 表的主订单状态改为 `TRADE_CLOSED`（沿用淘宝“付款后退款关闭”的含义）。`order_visa` 签证记录不自动删除，保留给办签人员查看和停办；`Order::isUnpaidMini` 已经会阻止关闭后的订单再添加出行人。

微信关闭退款（`closed`）时，主单恢复为 `order_status_before`。如果恢复为 `processing`，再调用一次 `syncCompletion`，避免退款期间签证已全部完成、订单却停在办理中。

## 接口

小程序（会员鉴权，只能访问自己的订单）：

- `GET /member/orders/{no}` 和订单列表增加 `refund` 字段（最近一笔退款单的状态、原因、驳回原因、申请和退款时间），以及 `refund_eligibility`（`can_apply`、不能申请的原因、截止时间）。能否申请以服务端判断为准，前端只负责展示。
- `GET /member/orders?status=refund`：对应“售后退款”标签，返回有退款单的订单。
- `POST /member/orders/{no}/refunds`：提交申请，参数为 `reason`、`note`、`idempotency_key`。服务端校验订单已完成、在下单半年内、没有进行中的退款。
- `POST /member/orders/{no}/refunds/cancel`：撤销审核中的申请。

管理后台（新增权限 `miniTrade.refund`，迁移中加入菜单和权限）：

- `POST /mini-trade/orders/{no}/refunds`：商家主动退款，参数为 `reason`、`idempotency_key`，以及订单当前金额版本，防止金额变化后误退。仅限 `processing`、`completed` 状态的订单。
- `POST /mini-trade/refunds/{refundNo}/approve`、`/reject`：审核用户申请；驳回必须填写原因。
- `POST /mini-trade/refunds/{refundNo}/sync`：重新查询微信退款结果。
- 订单列表增加按退款状态筛选；订单详情返回该订单的全部退款单。

## 页面改造

小程序：

- **订单列表**：已完成且没有进行中退款的订单显示【申请退款】。超过半年时点击弹窗“订单已超过半年，无法在线申请退款，如需帮助请联系客服”。卡片按退款单显示“退款审核中”“退款处理中”“已退款”“退款未通过”。增加“售后退款”标签。办理中的订单不显示退款按钮。
- **申请退款页** `pagesOrder/orderRefund`：替换现有的“暂未开放”占位。展示订单商品、退款金额、将退回的积分和券；有完成赠分的，提示“将扣回本单赠送的 N 积分”。退款原因用下拉选择（出行计划变更、重复下单、其他原因），补充说明选填，最多 300 字。提交后进入订单详情。
- **订单详情**：增加退款信息卡片，展示状态、申请时间、原因、驳回原因和退款时间；审核中的申请可以撤销。
- **积分规则页**、**邀请规则页**：把“退款功能暂未开放”“随退款功能另行公布”改为正式规则说明。
- `services/orders.ts`、`store/center.ts`：增加新的订单状态、退款字段和三个接口。

管理后台（`Mall/Orders`）：

- 订单详情增加“退款记录”区块；审核中的申请显示【通过】【驳回】。
- 办理中、已完成的订单显示【主动退款】，弹窗确认金额并填写原因。
- `refunding`、`abnormal` 状态的退款单显示【重新查询】；`abnormal` 状态提示到微信商户平台处理。
- 列表增加退款状态筛选和状态标签。

## 验证

后端用现有的网关模拟器补充测试：

- 申请校验：非已完成订单、超过半年、重复申请、跨会员访问均被拒绝；同一幂等键重复提交返回同一笔退款单。
- 审核和主动退款：权限校验；金额版本不一致时拒绝。
- 微信结果：成功、处理中、关闭、异常、请求超时后查单，各自转到正确状态；超时后不换号重提。
- 退款成功处理：重复通知与查单只处理一次；积分退还、券退回（含已过期的券）、赠分和邀请奖励扣回（含可用积分不足、有待付款占用的情况）、名额释放、办理单关闭。
- 并发：退款期间签证全部完成时不发放赠分；微信关闭退款恢复为办理中后补做完成判定。

小程序和管理后台补充对应的页面测试，并执行类型检查和构建。上线前需要用真实商户号完成一笔小额付款加退款的联调，核对资金到账、通知回调和对账单，才能认定退款链路验收通过。

## 补充口径

以下四条于 2026-10-22 经用户确认：

| 问题 | 决定 |
| --- | --- |
| 好友首单退款后，下一笔完成订单是否重新给邀请人奖励 | 不重新奖励：退款扣回积分，邀请关系仍记为已成交 |
| 办理单在退款后的处理 | 主订单改为 `TRADE_CLOSED`，签证记录保留，由办签人员停办 |
| 用户能否撤销审核中的申请 | 可以撤销，撤销后在期限内可再次申请 |
| 驳回后能否再次申请 | 可以，仍需在下单半年内 |
