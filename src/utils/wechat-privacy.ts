export type PrivacyResolve = (result: { event: 'agree' | 'disagree'; buttonId?: string }) => void;
interface PrivacyApi {
  canIUse: (capability: string) => boolean;
  getPrivacySetting: (options: { success: (result: { needAuthorization: boolean }) => void; fail: () => void }) => void;
  onNeedPrivacyAuthorization: (handler: (resolve: PrivacyResolve) => void) => void;
  openPrivacyContract: (options: { fail: () => void }) => void;
}
declare const wx: PrivacyApi;
let receiver: ((resolve: PrivacyResolve) => void) | null = null;
let installed = false;
export function privacyApi(): PrivacyApi | null {
  if (typeof wx === 'undefined' || typeof wx.getPrivacySetting !== 'function' || typeof wx.onNeedPrivacyAuthorization !== 'function'
    || !wx.canIUse('button.open-type.getPhoneNumber') || !wx.canIUse('button.open-type.agreePrivacyAuthorization')) return null;
  return wx;
}
export function receivePrivacy(handler: (resolve: PrivacyResolve) => void) {
  receiver = handler;
  const api = privacyApi();
  if (api && !installed) {
    api.onNeedPrivacyAuthorization((resolve) => receiver ? receiver(resolve) : resolve({ event: 'disagree' }));
    installed = true;
  }
  return () => { if (receiver === handler) receiver = null; };
}
export function openPrivacyContract() {
  const api = privacyApi();
  if (!api) { uni.showToast({ title: '请更新微信后查看隐私指引', icon: 'none' }); return; }
  api.openPrivacyContract({ fail: () => uni.showToast({ title: '隐私指引打开失败，请重试', icon: 'none' }) });
}
