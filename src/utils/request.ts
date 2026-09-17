import { login } from '@/services/login';
import { API_PREFIX } from './constant';
import { getToken, setToken } from './index';
import { useGlobalStore } from '@/store/global';

export const Method = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

// 公共header
const CommonHeader = {};

// 公共data
const CommonData = {};

export const ApiPrefix = import.meta.env.VITE_API_PREFIX;

// 要排除tokenKey的接口列表
const excludeTokenKeyList = [];

interface IRequest {
  <T = any>(url: string): Promise<T>; // 不提供 opts 时，默认使用 'GET' method，并且默认返回 data
}

// 处理登录逻辑
export const requestLoginLogic = (() => {
  // 登录队列
  const queue = [];

  return {
    // 去登录
    gotoLogin: () => {
      return new Promise((resolve) => {
        queue.push(resolve);
        uni.login({
          success: (result) => {
            login(result.code).then(
              (res) => {
                setToken(res.data.token);
                requestLoginLogic.loginSuccess();
              },
              (e) => {
                // console.log('登录失败', e);
                // if (e.statusCode === 404) {
                //   uni.showToast({ title: '请先登录', icon: 'none', duration: 2000 });
                //   const global = useGlobalStore();
                //   global.showLoginDialog = true;
                // }
                requestLoginLogic.loginFail();
              },
            );
          },
        });
      });
    },
    // 登录成功
    loginSuccess: async () => {
      setTimeout(() => {
        queue.forEach((resolve) => {
          resolve(true);
        });
        queue.length = 0;
      }, 1000);
    },
    // 登录失败
    loginFail: () => {
      queue.forEach((resolve) => {
        resolve(false);
      });
      queue.length = 0;
    },
  };
})();

const request: IRequest = async ({ url, data = {}, method = Method.GET, contentType = 'application/json', header }) => {
  let _url = url.indexOf('http') === -1 ? API_PREFIX + url : url;

  // 实际请求参数
  const _data = { ...CommonData, ...data, mini_program_id: import.meta.env.VITE_ID };

  // 请求后端接口
  const dataRequest = (resolve) => {
    let _header = { ...CommonHeader, 'content-type': contentType, authorization: getToken() };
    // 如果是排除tokenKey的接口，不传tokenKey
    if (excludeTokenKeyList.some((val) => _url.indexOf(val) !== -1) || !_header.authorization) {
      delete _header.authorization;
    }
    if (header) _header = { ..._header, ...header };

    uni.request({
      url: _url,
      data: _data,
      method,
      success: (res) => {
        resolve(res);
      },
      header: _header,
      fail: () => {
        uni.hideLoading();
      },
    });
  };

  let res = await new Promise(dataRequest);

  if (res.statusCode === 403) {
    res = await requestLoginLogic.gotoLogin();
    if (res) {
      // 登录成功后，重新请求
      res = await new Promise(dataRequest);
    } else {
      // 报错
      throw '未登录';
    }
  } else if (res.statusCode === 401) {
    // uni.showToast({ title: '请先登录', icon: 'none', duration: 2000 });
    // const global = useGlobalStore();
    // global.showLoginDialog = true;
    throw '未登录';
  } else if (res.statusCode !== 200) {
    throw res;
  }

  return res.data;
};

export default request;

/**
 * 检查请求结果是否成功
 * @param data
 * @returns
 */
export const checkResponse = (data) => {
  if (data.resultCode === '0') {
    return true;
  }
  return false;
};
