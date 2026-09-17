export interface LoginContext {
  /** 只放非敏感路由参数；草稿使用内存中的 draftKey。 */
  target?: string;
  mode?: 'navigateTo' | 'switchTab';
  draftKey?: string;
}
export const LOGIN_PAGE = '/pages/login/index';
export const ACCOUNT_PAGE = '/pages/account/index';
export const HOME_PAGE = '/pages/mall/index';
export function currentUrl(): string {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { route?: string; options?: Record<string, string> } | undefined;
  if (!page?.route) return HOME_PAGE;
  const query = Object.entries(page.options || {}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return `/${page.route}${query ? '?' + query : ''}`;
}
export function safeTarget(target?: string) {
  return target && /^\/(pages|pagesMall)\/[\w/-]+(?:\?[^#]*)?$/.test(target) && !target.startsWith('/pages/login/')
    && !target.startsWith('/pages/service-agreement/') ? target : HOME_PAGE;
}
export function returnFromLogin(target: string, mode?: 'navigateTo' | 'switchTab') {
  const url = safeTarget(target);
  if (mode === 'switchTab') { uni.switchTab({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) }); return; }
  const pages = getCurrentPages();
  const index = pages.findIndex((page) => `/${page.route}` === url.split('?')[0]);
  if (index >= 0 && index < pages.length - 1) {
    const page = pages[index] as unknown as { options?: Record<string, string> };
    const query = Object.entries(page.options || {}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
    const existing = `/${pages[index].route}${query ? '?' + query : ''}`;
    if (existing === url) { uni.navigateBack({ delta: pages.length - 1 - index }); return; }
  }
  uni.redirectTo({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) });
}
