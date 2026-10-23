import type { CenterOrder } from '@/store/center';

/** 已完成订单显示申请退款；超过期限时仍显示按钮，点击后说明原因。审核中或退款中改为显示退款进度。 */
export function showRefundButton(order: CenterOrder) {
  return order.state === '已完成' && !(order.refund && ['reviewing', 'refunding'].includes(order.refund.status));
}

/** 能否申请以服务端判断为准；不能申请时弹窗说明，不进入申请页。 */
export function openRefund(order: CenterOrder) {
  if (!order.canRefund) {
    uni.showModal({
      title: '无法申请退款',
      content: order.refundBlockedReason || '当前订单不能申请退款',
      showCancel: false,
      confirmText: '知道了',
    });
    return;
  }
  uni.navigateTo({ url: `/pagesOrder/orderRefund/index?id=${order.id}` });
}
