import { defineStore } from 'pinia';
import { phoneLogin, revokeSession, verifyWechatSession, getCurrentUserInfo, type Member } from '@/services/mine';
import { getToken, setToken, removeToken, clearSensitiveStorage, onSessionInvalidated, RequestError } from '@/utils/request';
import { useMallStore } from './mall';
import { useCenterStore } from './center';

export const LOGIN_PAGE = '/pages/login/index';
export const ACCOUNT_PAGE = '/pages/account/index';
export const HOME_PAGE = '/pages/mall/index';

// 并发恢复共用一个请求；authOperationId 变化让取消、退出之前的迟到响应失效。
let sessionRestorePromise: Promise<void> | null = null;
let authOperationId = 0;

export const useGlobalStore = defineStore('global', {
  state: () => ({
    // 登录阶段：guest 未登录，checking 校验已有登录，authenticating 正在登录，authenticated 已登录。
    status: 'guest' as 'guest' | 'checking' | 'authenticating' | 'authenticated',
    // 校验通过后的会员资料；未登录或正在校验时为 null，避免展示旧账号信息。
    userInfo: null as Member | null,
    // 登录恢复失败或登录失效的提示，供页面展示；手机号登录失败由登录页单独提示。
    sessionError: '',
    // 登录成功后要返回的业务页面地址（含查询参数）；没有待处理跳转时为 null。
    pendingLogin: null as string | null,
    // 登录页是否已打开，用于避免重复跳转，以及回到前台时重复恢复登录状态。
    loginOpen: false,
  }),
  getters: {
    isLogin: (state) => state.status === 'authenticated' && !!state.userInfo?.phone_bound,
  },
  actions: {
    /** 启动时注册 401 通知，清理历史缓存后校验已有 token。 */
    initialize() {
      onSessionInvalidated(() => this.expireSession());
      clearPrivateData();
      return this.restoreSession();
    },
    /** 失效时立即清理身份和私人数据，并阻止旧请求恢复登录状态。 */
    expireSession() {
      authOperationId++;
      removeToken();
      this.userInfo = null;
      this.status = 'guest';
      this.sessionError = '登录已失效，请重新登录';
      clearPrivateData();
    },
    /** 先校验业务 token，再按需核对微信身份，全部通过才展示会员资料。 */
    async restoreSession() {
      if (sessionRestorePromise) {
        return sessionRestorePromise;
      }
      if (!getToken() || this.status === 'authenticating') {
        return;
      }
      const operationId = ++authOperationId;
      const token = getToken();
      this.status = 'checking';
      this.userInfo = null;
      this.sessionError = '';

      sessionRestorePromise = (async () => {
        try {
          const response = await getCurrentUserInfo(token);
          if (operationId !== authOperationId) {
            return;
          }
          const validWechatSession = await checkWechatSession();
          if (operationId !== authOperationId) {
            return;
          }
          if (!validWechatSession) {
            const code = await getWechatLoginCode();
            if (operationId !== authOperationId) {
              return;
            }
            await verifyWechatSession(code, token);
          }
          if (operationId !== authOperationId) {
            return;
          }
          if (!response.data.phone_bound) {
            this.expireSession();
            return;
          }
          this.userInfo = response.data;
          this.status = 'authenticated';
        } catch (error) {
          if (operationId !== authOperationId) {
            return;
          }
          this.status = 'guest';
          this.userInfo = null;
          this.sessionError = error instanceof Error ? error.message : '登录状态校验失败，请重试';
        }
      })();
      try {
        await sessionRestorePromise;
      } finally {
        sessionRestorePromise = null;
      }
    },
    /** 已登录返回 true；否则打开登录页，业务调用方应停止本次后续操作。 */
    async ensureLogin(context: { target?: string } = {}): Promise<boolean> {
      if (sessionRestorePromise) {
        await sessionRestorePromise;
      }
      if (this.isLogin) {
        return true;
      }
      if (getToken()) {
        await this.restoreSession();
        if (this.isLogin) {
          return true;
        }
      }
      if (this.loginOpen) {
        return false;
      }
      const pages = getCurrentPages();
      this.pendingLogin = safeTarget(context.target || pageUrl(pages[pages.length - 1]));
      this.loginOpen = true;
      uni.navigateTo({
        url: LOGIN_PAGE,
        fail: () => {
          this.loginOpen = false;
          this.pendingLogin = null;
          uni.showToast({ title: '登录页打开失败，请重试', icon: 'none' });
        },
      });
      return false;
    },
    /** 防重复提交；离开页面后的迟到 token 只撤销，不再恢复登录。 */
    async completePhoneLogin(phoneCode: string, agreementVersion: string) {
      if (this.status === 'authenticating') {
        return false;
      }
      const operationId = ++authOperationId;
      this.status = 'authenticating';
      this.userInfo = null;
      clearPrivateData();

      try {
        const code = await getWechatLoginCode();
        if (operationId !== authOperationId) {
          return false;
        }
        const response = await phoneLogin({
          phone_code: phoneCode,
          login_code: code,
          agreement_version: agreementVersion,
        });
        if (operationId !== authOperationId) {
          // 用户已经取消，服务端刚签发的 token 不再用于本机登录。
          void revokeSession(response.data.token).catch(() => {});
          return false;
        }
        if (!response.data.member.phone_bound) {
          throw new RequestError('PHONE_NOT_BOUND', '手机号绑定未完成');
        }
        setToken(response.data.token);
        this.userInfo = response.data.member;
        this.status = 'authenticated';
        this.sessionError = '';
        return true;
      } catch (error) {
        if (operationId === authOperationId) {
          this.status = 'guest';
        }
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
      if (this.userInfo) {
        Object.assign(this.userInfo, patch);
      }
    },
    /** 页面卸载时取消未完成的登录，导航由页面返回操作负责。 */
    cancelLogin() {
      authOperationId++;
      if (!this.isLogin) {
        this.status = 'guest';
      }
      this.pendingLogin = null;
      this.loginOpen = false;
    },
    /** 先清理本机再通知服务端，网络失败不阻碍本地退出。 */
    async logout() {
      const token = getToken();
      authOperationId++;
      removeToken();
      clearPrivateData();

      this.userInfo = null;
      this.status = 'guest';
      this.sessionError = '';
      this.pendingLogin = null;
      this.loginOpen = false;
      if (token) {
        try {
          await revokeSession(token);
        } catch (error) {
          const alreadyLoggedOut = error instanceof RequestError && error.statusCode === 401;
          if (!alreadyLoggedOut) {
            uni.showToast({ title: '已本地退出，服务端会话未能撤销', icon: 'none', duration: 3500 });
          }
        }
      }
    },
  },
});

/** 保留查询参数，避免返回同路径但属于另一笔业务的页面。 */
function pageUrl(page?: { route?: string; options?: Record<string, string> }): string {
  if (!page?.route) {
    return HOME_PAGE;
  }
  const query = Object.entries(page.options || {}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return `/${page.route}${query ? '?' + query : ''}`;
}
/** 登录完成后仅返回站内业务页面，不返回登录页或协议页。 */
export function safeTarget(target?: string) {
  const isBusinessPage = target && /^\/(pages|pagesMall|pagesOrder|pagesCenter)\/[\w/-]+(?:\?[^#]*)?$/.test(target);
  if (!isBusinessPage || target.startsWith('/pages/login/') || target.startsWith('/pages/service-agreement/')) {
    return HOME_PAGE;
  }
  return target;
}
/** tab 页直接切换，普通页面优先返回已有实例以保留页面状态。 */
export function returnFromLogin(target: string) {
  const url = safeTarget(target);
  const isTabPage = [HOME_PAGE, ACCOUNT_PAGE, '/pages/catalog/index'].includes(url);
  if (isTabPage) {
    uni.switchTab({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) });
    return;
  }
  const pages = getCurrentPages();
  const index = pages.findIndex((page) => `/${page.route}` === url.split('?')[0]);
  if (index >= 0 && index < pages.length - 1) {
    const existing = pageUrl(pages[index]);
    if (existing === url) {
      uni.navigateBack({ delta: pages.length - 1 - index });
      return;
    }
  }
  uni.redirectTo({ url, fail: () => uni.reLaunch({ url: HOME_PAGE }) });
}

/** 每次获取新登录 code，与手机号授权 code 分别提交，不缓存或重放。 */
const getWechatLoginCode = (): Promise<string> => new Promise((resolve, reject) => {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    timeout: 10000,
    success: (result) => {
      if (result.code) {
        resolve(result.code);
      } else {
        reject(new RequestError('LOGIN_CODE_INVALID', '微信登录失败，请重试'));
      }
    },
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
