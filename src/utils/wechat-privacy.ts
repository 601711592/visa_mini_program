export type PrivacyResolve = (result: { event: 'agree' | 'disagree'; buttonId?: string }) => void;
interface PrivacyApi {
  canIUse: (capability: string) => boolean;
  getPrivacySetting: (options: { success: (result: { needAuthorization: boolean }) => void; fail: () => void }) => void;
  onNeedPrivacyAuthorization: (handler: (resolve: PrivacyResolve) => void) => void;
  openPrivacyContract: (options: { fail: () => void }) => void;
}
declare const wx: PrivacyApi;
// 微信监听只安装一次，接收方随登录页面挂载与卸载切换。
let receiver: ((resolve: PrivacyResolve) => void) | null = null;
let installed = false;
/** 检查微信及授权按钮能力，不支持时由页面提示升级。 */
export function privacyApi(): PrivacyApi | null {
  if (typeof wx === 'undefined' || typeof wx.getPrivacySetting !== 'function' || typeof wx.onNeedPrivacyAuthorization !== 'function'
    || !wx.canIUse('button.open-type.getPhoneNumber') || !wx.canIUse('button.open-type.agreePrivacyAuthorization')) return null;
  return wx;
}
/** 注册当前页面处理器并返回卸载函数；无活跃页面时直接拒绝授权。 */
export function receivePrivacy(handler: (resolve: PrivacyResolve) => void) {
  receiver = handler;
  const api = privacyApi();
  if (api && !installed) {
    api.onNeedPrivacyAuthorization((resolve) => receiver ? receiver(resolve) : resolve({ event: 'disagree' }));
    installed = true;
  }
  return () => { if (receiver === handler) receiver = null; };
}
/** 打开微信官方隐私指引，供登录页和个人资料页共用。 */
export function openPrivacyContract() {
  const api = privacyApi();
  if (!api) { uni.showToast({ title: '请更新微信后查看隐私指引', icon: 'none' }); return; }
  api.openPrivacyContract({ fail: () => uni.showToast({ title: '隐私指引打开失败，请重试', icon: 'none' }) });
}
