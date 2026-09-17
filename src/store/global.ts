import { defineStore } from 'pinia';
import { phoneLogin, revokeSession, verifyWechatSession } from '@/services/login';
import { getCurrentUserInfo, type Member } from '@/services/mine';
import { getToken, setToken, removeToken, clearSensitiveStorage, onSessionInvalidated } from '@/utils/auth-session';
import { clearSensitiveDrafts, suspendSensitiveDrafts, resumeSensitiveDrafts } from '@/utils/auth-drafts';
import { getWechatLoginCode, checkWechatSession } from '@/utils/wechat-auth';
import { currentUrl, LOGIN_PAGE, HOME_PAGE, safeTarget, returnFromLogin, type LoginContext } from '@/utils/auth-routing';
import { RequestError } from '@/utils/request';

let bootstrap: Promise<void> | null = null;
let sequence = 0;
export const useGlobalStore = defineStore('global', {
  state: () => ({
    status: 'guest' as 'guest' | 'checking' | 'authenticating' | 'authenticated',
    userInfo: null as Member | null,
    sessionError: '',
    pendingLogin: null as (LoginContext & { origin: string }) | null,
    loginOpen: false,
  }),
  getters: { isLogin: (state) => state.status === 'authenticated' && !!state.userInfo?.phone_bound },
  actions: {
    initialize() {
      onSessionInvalidated(() => this.expireSession());
      clearSensitiveStorage();
      return this.restoreSession();
    },
    expireSession() {
      sequence++;
      removeToken();
      this.userInfo = null;
      this.status = 'guest';
      this.sessionError = '登录已失效，请重新登录';
      suspendSensitiveDrafts();
    },
    async restoreSession() {
      if (bootstrap) return bootstrap;
      if (!getToken() || this.status === 'authenticating') return;
      const run = ++sequence;
      const token = getToken();
      this.status = 'checking';
      this.userInfo = null;
      this.sessionError = '';
      suspendSensitiveDrafts();
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
          resumeSensitiveDrafts(res.data.id);
        } catch (error) {
          if (run !== sequence) return;
          this.status = 'guest';
          this.userInfo = null;
          this.sessionError = error instanceof Error ? error.message : '登录状态校验失败，请重试';
        }
      })();
      try { await bootstrap; } finally { bootstrap = null; }
    },
    async ensureLogin(context: LoginContext = {}): Promise<boolean> {
      if (bootstrap) await bootstrap;
      if (this.isLogin) return true;
      if (getToken()) {
        await this.restoreSession();
        if (this.isLogin) return true;
      }
      if (this.loginOpen) return false;
      this.pendingLogin = { ...context, target: safeTarget(context.target || currentUrl()), origin: safeTarget(currentUrl()) };
      this.loginOpen = true;
      uni.navigateTo({ url: LOGIN_PAGE, fail: () => { this.loginOpen = false; this.pendingLogin = null; uni.showToast({ title: '登录页打开失败，请重试', icon: 'none' }); } });
      return false;
    },
    async completePhoneLogin(phoneCode: string, agreementVersion: string) {
      if (this.status === 'authenticating') return false;
      const run = ++sequence;
      this.status = 'authenticating';
      this.userInfo = null;
      suspendSensitiveDrafts();
      try {
        const code = await getWechatLoginCode();
        if (run !== sequence) return false;
        const res = await phoneLogin({ phone_code: phoneCode, login_code: code, agreement_version: agreementVersion });
        if (run !== sequence) { void revokeSession(res.data.token).catch(() => {}); return false; }
        if (!res.data.member.phone_bound) throw new RequestError('PHONE_NOT_BOUND', '手机号绑定未完成');
        const previous = getToken();
        setToken(res.data.token);
        if (previous && previous !== res.data.token) void revokeSession(previous).catch(() => {});
        this.userInfo = res.data.member;
        this.status = 'authenticated';
        this.sessionError = '';
        resumeSensitiveDrafts(res.data.member.id);
        return true;
      } catch (error) {
        if (run === sequence) this.status = 'guest';
        throw error;
      }
    },
    finishLogin() {
      const pending = this.pendingLogin;
      this.pendingLogin = null;
      this.loginOpen = false;
      returnFromLogin(pending?.target || pending?.origin || HOME_PAGE, pending?.mode);
    },
    cancelLogin(navigate = true) {
      sequence++;
      if (!this.isLogin) this.status = 'guest';
      const origin = this.pendingLogin?.origin || HOME_PAGE;
      this.pendingLogin = null;
      this.loginOpen = false;
      if (navigate) returnFromLogin(origin);
    },
    async logout() {
      const token = getToken();
      sequence++;
      removeToken();
      clearSensitiveStorage();
      clearSensitiveDrafts();
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
