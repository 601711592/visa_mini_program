# 微信小程序登录原型说明

## 本轮交付边界

仅修改交互原型，未开始小程序前端静态开发或接口接入。原型中的微信授权面板明确标为示意，不触发真实授权、手机号获取或支付。当前展示既有演示账户资产，正式新账户积分应从实际余额读取。

## 交互决策

- 首页、分类、搜索、详情与本地购物车允许游客访问，不启动强制登录弹窗。
- “我的”展示游客态，不泄露既有演示账户信息。订单、积分、优惠券、地址、结算按需提示登录。
- 协议勾选默认关闭，链接可阅读并返回。商户协议勾选与微信平台隐私授权是两个不同状态。
- 仅保留手机号快捷登录入口及“暂不登录，继续浏览”。手机号拒绝不反复强弹，允许继续浏览或主动重试。
- 手机号授权前展示隐私用途，用户主动同意后继续微信原生手机号授权。已有有效隐私同意时不重复展示。
- 头像、昵称在登录后的个人资料中自愿完善，不作为登录前提。
- 当前原型需完成手机号快捷登录后进入结算；游客仍可浏览、搜索和选择商品。wx.login 是身份识别的底层能力，不再作为单独登录入口。
- 手机号完成验证绑定后，才满足需求中的 10 元新人券发放条件；同一账号重复登录、退出、重新绑定不重复发放。
- 登录成功返回发起登录的业务页面，保留所选商品、套餐、人群、日期及分商品填写的出行人。恢复结算后仍由用户主动提交订单，不自动支付。
- 失败、拒绝、取消、会话失效都有可退出或重试路径。退出登录清理本地出行人、地址、联系电话等敏感草稿；保留非敏感商品选择。

## 正式实现映射（原型确认后执行）

1. 使用 wx.login 获取临时登录 code，交服务端换取微信身份并建立业务会话；session_key、AppSecret 不进入客户端。微信会话和业务 token 分别校验，不能只凭本地 token 存在判定有效。
2. 使用 button open-type="getPhoneNumber"，由用户点击并同意后获取手机号授权 code，后端兑换及绑定账号。手机号授权 code 与 wx.login code 不能混用。现有 register 的 encryptedData/iv 签名不能直接作为新版手机号接口契约。
3. 隐私能力按 wx.getPrivacySetting / wx.onNeedPrivacyAuthorization / agreePrivacyAuthorization 机制接入。平台判定需要时展示，拒绝应 resolve disagree 并结束等待；同意按平台规定 resolve agree。辅助接口 requirePrivacyAuthorize 不属于强制调用项。
4. 隐私指引正式展示使用 wx.openPrivacyContract；商业服务协议另行提供可读全文。不要用普通勾选状态冒充平台授权状态。
5. 头像和昵称正式采用平台自愿填写能力；涉及隐私能力前检查授权。真实原生控件、审核及基础库行为必须在开发者工具和微信真机验证。
6. 新人券由服务端依据首次验证绑定事件幂等发放，不能仅靠原型布尔值。绑定、旧账号识别、跨账号手机号冲突必须服务端处理，不能自动合并资产。

## 上线前仍需核对

- 主体认证、手机号能力权限和当期收费/额度、使用基础库版本。
- 微信后台的用户隐私保护指引声明与实际收集信息一致；运营主体、联系方式、目的、保存期限、第三方处理、撤回授权、删除及注销途径完整。
- 护照等出行人信息另按实际履约场景告知和必要授权处理，不能将登录页同意作为所有后续用途的无限授权。
- 最终平台规范、隐私配置和真机行为审核；本轮不能据原型宣称“已通过微信合规审核”。

## 查证记录（2026-09-15）

微信开发者文档站直读失败；以微信官方维护的 API 定义中的说明核对登录与隐私授权机制。手机号能力权限、收费、最新运营规则尚未完成直读核验。

- 官方 API 定义（含 wx.login、onNeedPrivacyAuthorization、requirePrivacyAuthorize、openPrivacyContract）：https://github.com/wechat-miniprogram/api-typings/blob/master/types/wx/lib.wx.api.d.ts
- 官方小程序登录文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- 官方手机号文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
- 官方隐私授权指南：https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html
- 官方头像昵称文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html

## 本轮检查

通过脚本检查游客访问、业务拦截、协议未勾选、阅读返回、隐私拒绝、手机号拒绝、网络失败、登录恢复结算、后续绑定、首次绑定券资格、会话失效及退出登录。原生微信面板和实际平台授权尚未接入，不计为真机测试通过。

## 最新调整

用户确认移除“暂不授权手机号”登录入口及独立分支；保留游客浏览、拒绝返回、失败重试与登录后恢复结算。
