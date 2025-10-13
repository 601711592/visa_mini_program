import request, { Method } from '@/utils/request';
import type { Goods } from './shop';

/**
 * 获得唤起微信支付参数
 */
export const getLaunchWxPayParams = (orderNo: string) => {
  return request<API.ResponseBody<API.ResponseBody<any>>>({ url: `/pay/wxpay`, method: Method.POST, data: { orderNo } });
};
