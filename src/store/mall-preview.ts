import { defineStore } from 'pinia';
import { reactive, computed, ref } from 'vue';
import { MALL_PREVIEW } from '@/mall/config';
import * as model from '@/mall/model';
import { seedOrders } from '@/mall/fixtures';
export const useMallPreviewStore = defineStore('mall-preview', () => {
  const data = reactive(model.createState());
  const enabled = MALL_PREVIEW;
  const pendingTarget = ref(''); const pendingOrigin = ref('');
  const price = computed(() => model.draftPrice(data));
  function check() { if (!enabled) throw new Error('商城业务尚未接入，当前不能创建真实订单'); }
  function login() { check(); if (!data.member) { data.member = true; if (!data.orders.length) seedOrders(data); } }
  function logout() { check(); model.signOut(data); pendingTarget.value=''; pendingOrigin.value=''; }
  function reset() { check(); const sequence=data.sequence; Object.assign(data, model.createState(), {sequence}); pendingTarget.value=''; pendingOrigin.value=''; }
  function add(selection: model.Selection) { check(); return model.addToCart(data, selection); }
  function checkout(lines: model.Line[], source: 'cart'|'buy') { check(); return model.beginCheckout(data, lines, source); }
  function submit() { check(); return model.submitOrder(data); }
  function pay(id:string,result:'succeeded'|'failed'|'cancelled') { check(); model.payment(data,id,result); }
  function cancel(id:string) { check(); model.cancelOrder(data,id); }
  function refund(id:string,reason:string,note:string) { check(); model.requestRefund(data,id,reason,note); }
  return { data, enabled, pendingTarget, pendingOrigin, price, login, logout, reset, add, checkout, submit, pay, cancel, refund };
});
