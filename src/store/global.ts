import { defineStore } from 'pinia';
import { phoneLogin, revokeSession, verifyWechatSession, getCurrentUserInfo, type Member } from '@/services/mine';
import { getToken, setToken, removeToken, clearSensitiveStorage, onSessionInvalidated, RequestError } from '@/utils/request';
import { useMallStore } from './mall';
import { useCenterStore } from './center';

export const LOGIN_PAGE = '/pages/login/index';
export const ACCOUNT_PAGE = '/pages/account/index';
export const HOME_PAGE = '/pages/mall/index';
/** 保留查询参数，避免返回同路径但属于另一笔业务的页面。 */
function pageUrl(page?: { route?: string; options?: Record<string, string> }): string {
  if (!page?.route) return HOME_PAGE;
  const query = Object.entries(page.options || {}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return `/${page.route}${query ? '?' + query : ''}`;
}
/** 登录完成后仅返回站内业务页面，不返回登录页或协议页。 */
export function safeTarget(target?: string) {
  return target && /^\/(pages|pagesMall|pagesOrder|pagesCenter)\/[\w/-]+(?:\?[^#]*)?$/.test(target) && !target.startsWith('/pages/login/')
    && !target.startsWith('/pages/service-agreement/') ? target : HOME_PAGE;
}
/** tab 页直接切换，普通页面优先返回已有实例以保留页面状态。 */
export function returnFromLogin(target: string) {
  const url = safeTarget(target);
  if ([HOME_PAGE, ACCOUNT_PAGE, '/pages/catalog/index'].includes(url)) { uni.switchTab({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) }); return; }
  const pages = getCurrentPages();
  const index = pages.findIndex((page) => `/${page.route}` === url.split('?')[0]);
  if (index >= 0 && index < pages.length - 1) {
    const existing = pageUrl(pages[index]);
    if (existing === url) { uni.navigateBack({ delta: pages.length - 1 - index }); return; }
  }
  uni.redirectTo({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) });
}

/** 每次获取新登录 code，与手机号授权 code 分别提交，不缓存或重放。 */
const getWechatLoginCode = (): Promise<string> => new Promise((resolve, reject) => {
  // #ifdef MP-WEIXIN
  uni.login({ provider: 'weixin', timeout: 10000,
    success: (result) => result.code ? resolve(result.code) : reject(new RequestError('LOGIN_CODE_INVALID', '微信登录失败，请重试')),
    fail: () => reject(new RequestError('WECHAT_LOGIN_FAILED', '微信登录失败，请重试')),
  });
  // #endif
  // #ifndef MP-WEIXIN
  reject(new RequestError('PLATFORM_UNSUPPORTED', '请在微信小程序中登录'));
  // #endif
});
/** 微信会话失效需重新核对身份，不直接延长业务 token 的有效期。 */
const checkWechatSession = (): Promise<boolean> => new Promise((resolve) => {
  // #ifdef MP-WEIXIN
  uni.checkSession({ success: () => resolve(true), fail: () => resolve(false) });
  // #endif
  // #ifndef MP-WEIXIN
  resolve(false);
  // #endif
});

/** 清理已接入的私人数据，保留购物车中的商品选择。 */
function clearPrivateData() {
  clearSensitiveStorage();
  useMallStore().travellers = {};
  useMallStore().couponId = 0;
  useCenterStore().clearPrivate();
}

// 并发恢复共用一个请求；sequence 变化让取消、退出之前的迟到响应失效。
let bootstrap: Promise<void> | null = null;
let sequence = 0;
export const useGlobalStore = defineStore('global', {
  state: () => ({
    status: 'guest' as 'guest' | 'checking' | 'authenticating' | 'authenticated',
    userInfo: null as Member | null,
    sessionError: '',
    pendingLogin: null as string | null,
    loginOpen: false,
  }),
  getters: { isLogin: (state) => state.status === 'authenticated' && !!state.userInfo?.phone_bound },
  actions: {
    /** 启动时注册 401 通知，清理历史缓存后校验已有 token。 */
    initialize() {
      onSessionInvalidated(() => this.expireSession());
      clearPrivateData();
      return this.restoreSession();
    },
    /** 失效时立即清理身份和私人数据，并阻止旧请求恢复登录状态。 */
    expireSession() {
      sequence++;
      removeToken();
      this.userInfo = null;
      this.status = 'guest';
      this.sessionError = '登录已失效，请重新登录';
      clearPrivateData();
    },
    /** 先校验业务 token，再按需核对微信身份，全部通过才展示会员资料。 */
    async restoreSession() {
      if (bootstrap) return bootstrap;
      if (!getToken() || this.status === 'authenticating') return;
      const run = ++sequence;
      const token = getToken();
      this.status = 'checking';
      this.userInfo = null;
      this.sessionError = '';

      bootstrap = (async () => {
        try {
          const res = await getCurrentUserInfo(token);
          if (run !== sequence) return;
          const validWechatSession = await checkWechatSession();
          if (run !== sequence) return;
          if (!validWechatSession) {
            const code = await getWechatLoginCode();
            if (run !== sequence) return;
            await verifyWechatSession(code, token);
          }
          if (run !== sequence) return;
          if (!res.data.phone_bound) { this.expireSession(); return; }
          this.userInfo = res.data;
          this.status = 'authenticated';
        } catch (error) {
          if (run !== sequence) return;
          this.status = 'guest';
          this.userInfo = null;
          this.sessionError = error instanceof Error ? error.message : '登录状态校验失败，请重试';
        }
      })();
      try { await bootstrap; } finally { bootstrap = null; }
    },
    /** 已登录返回 true；否则打开登录页，业务调用方应停止本次后续操作。 */
    async ensureLogin(context: { target?: string } = {}): Promise<boolean> {
      if (bootstrap) await bootstrap;
      if (this.isLogin) return true;
      if (getToken()) {
        await this.restoreSession();
        if (this.isLogin) return true;
      }
      if (this.loginOpen) return false;
      const pages = getCurrentPages();
      this.pendingLogin = safeTarget(context.target || pageUrl(pages[pages.length - 1]));
      this.loginOpen = true;
      uni.navigateTo({ url: LOGIN_PAGE, fail: () => { this.loginOpen = false; this.pendingLogin = null; uni.showToast({ title: '登录页打开失败，请重试', icon: 'none' }); } });
      return false;
    },
    /** 防重复提交；离开页面后的迟到 token 只撤销，不再恢复登录。 */
    async completePhoneLogin(phoneCode: string, agreementVersion: string) {
      if (this.status === 'authenticating') return false;
      const run = ++sequence;
      this.status = 'authenticating';
      this.userInfo = null;
      clearPrivateData();

      try {
        const code = await getWechatLoginCode();
        if (run !== sequence) return false;
        const res = await phoneLogin({ phone_code: phoneCode, login_code: code, agreement_version: agreementVersion });
        if (run !== sequence) { void revokeSession(res.data.token).catch(() => {}); return false; }
        if (!res.data.member.phone_bound) throw new RequestError('PHONE_NOT_BOUND', '手机号绑定未完成');
        setToken(res.data.token);
        this.userInfo = res.data.member;
        this.status = 'authenticated';
        this.sessionError = '';
        return true;
      } catch (error) {
        if (run === sequence) this.status = 'guest';
        throw error;
      }
    },
    /** 登录成功只返回目标页面，不自动提交订单或触发支付。 */
    finishLogin() {
      const pending = this.pendingLogin;
      this.pendingLogin = null;
      this.loginOpen = false;
      returnFromLogin(pending || HOME_PAGE);
    },
    /** 静态阶段仅在内存更新头像昵称，接口接入后改为请求后端。 */
    updateProfileLocal(patch: { nickname?: string; avatar?: string }) {
      if (this.userInfo) Object.assign(this.userInfo, patch);
    },
    /** 页面卸载时取消未完成的登录，导航由页面返回操作负责。 */
    cancelLogin() {
      sequence++;
      if (!this.isLogin) this.status = 'guest';
      this.pendingLogin = null;
      this.loginOpen = false;
    },
    /** 先清理本机再通知服务端，网络失败不阻碍本地退出。 */
    async logout() {
      const token = getToken();
      sequence++;
      removeToken();
      clearPrivateData();

      this.userInfo = null;
      this.status = 'guest';
      this.sessionError = '';
      this.pendingLogin = null;
      this.loginOpen = false;
      if (token) {
        try { await revokeSession(token); }
        catch (error) {
          if (!(error instanceof RequestError && error.statusCode === 401))
            uni.showToast({ title: '已本地退出，服务端会话未能撤销', icon: 'none', duration: 3500 });
        }
      }
    },
  },
});
