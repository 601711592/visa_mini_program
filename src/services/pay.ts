import { getPaymentStatus, requestOrderPayment } from '@/services/orders';

/** 客户端支付回调只用于提示；成功状态必须再由服务端查询微信确认。 */
export async function payTradeOrder(no: string, priceVersion: number): Promise<'paid' | 'pending'> {
  const { data } = await requestOrderPayment(no, priceVersion);
  try {
    await new Promise<void>((resolve, reject) => {
      // #ifdef MP-WEIXIN
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: {},
        timeStamp: data.timeStamp,
        nonceStr: data.nonceStr,
        package: data.package,
        signType: data.signType,
        paySign: data.paySign,
        success: () => resolve(),
        fail: reject,
      });
      // #endif
      // #ifndef MP-WEIXIN
      reject(new Error('请在微信小程序内完成支付'));
      // #endif
    });
  } catch {
    // 用户取消、网络中断与微信侧扣款竞态都要继续查单。
  }
  const checked = await getPaymentStatus(no);
  return ['processing', 'completed'].includes(checked.data.status) ? 'paid' : 'pending';
}
