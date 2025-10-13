import { getLaunchWxPayParams } from '@/services/pay';
import { ASSET_DOMAIN } from './constant';

/**
 * 获得资源URL
 * @param path
 * @returns
 */
export function getAssetUrl(path: string): string {
  return `${ASSET_DOMAIN}/${path}`;
}

/**
 * 查询节点信息
 * @param {string} select 节点选择器
 * @param {boolean} isAll 是否查询多节点
 */
export const queryNode = (select: string, isAll: boolean, time: number, that: any) => {
  return new Promise((reslove, _) => {
    setTimeout(
      () => {
        const sq = uni.createSelectorQuery();
        if (that) {
          sq.in(that);
        }
        (isAll ? sq.selectAll(select) : sq.select(select)).boundingClientRect().exec((ret) => {
          reslove(ret);
        });
      },
      time === undefined ? 350 : time,
    );
  });
};

// 缓存token
export const setToken = (token: string) => {
  uni.setStorageSync('token', token);
};

// 获取token
export const getToken = () => {
  return uni.getStorageSync('token');
};

// 删除token
export const removeToken = () => {
  return uni.removeStorageSync('token');
};

// 格式化金额分转元
export const formatMoney = (value?: number, decimal: number = 2) => {
  if (value === undefined) {
    return '0.00';
  }
  return (value / 100).toFixed(decimal);
};

// base64转文件
export const base64ToFile = (base64data) => {
  return new Promise(async (resolve) => {
    if (String(base64data).includes('base64')) {
      const fsm = uni.getFileSystemManager();
      const FILE_BASE_NAME = 'tmp_base64src'; //自定义文件名
      const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
      if (!format) {
        return new Error('ERROR_BASE64SRC_PARSE');
      }
      const filePath = `${uni.env.USER_DATA_PATH}/${FILE_BASE_NAME}.${format}`;
      const buffer = uni.base64ToArrayBuffer(bodyData);
      fsm.writeFile({
        filePath,
        data: buffer,
        encoding: 'binary',
        success() {
          console.log('文件地址', filePath);
          resolve(filePath);
        },
        fail() {
          resolve(new Error('ERROR_BASE64SRC_WRITE'));
        },
      });
    } else {
      resolve(base64data);
    }
  });
};

/**
 * 唤起支付
 */
export const requestPayment = async (orderNo: string, callback?: (e: boolean) => void) => {
  uni.showLoading();
  const res = await getLaunchWxPayParams(orderNo);
  uni.hideLoading();
  uni.requestPayment({
    provider: 'wxpay',
    orderInfo: {},
    ...res.data,
    success: (res) => {
      if (callback) {
        callback(true);
      } else {
        uni.navigateTo({ url: '/pagesPay/success/index' });
      }
    },
    fail: (err) => {
      if (callback) {
        callback(false);
      } else {
        uni.navigateTo({ url: '/pagesOrder/index/index' });
      }
      console.log('fail:' + JSON.stringify(err));
    },
  });
};

// 节流
export const throttle = (fn, delay) => {
  let last = 0;
  return function (...args) {
    const now = +new Date();
    if (now - last > delay) {
      last = now;
      fn.apply(this, args);
    }
  };
};

// 防抖
export const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};
