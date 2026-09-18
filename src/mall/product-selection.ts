import type { Goods, GoodsSpecification } from '@/services/shop';
import type { Selection } from './model';
/** 仅视图扩展字段；不改动现有接口契约。未配置时保留现有详情区块。 */
export type MallGoods = Goods & { travellersRequired?: boolean; shippingRequired?: boolean; visibleSections?: Partial<Record<'trip' | 'price' | 'refund' | 'booking', boolean>> };
export interface CalendarSlot { date: string; price: number; quota: number }
export function calendarSlots(spec: GoodsSpecification | undefined, group: string): CalendarSlot[] {
  if (!spec || !Array.isArray(spec.priceCalender)) return [];
  return spec.priceCalender.flatMap((entry: { date?: string; list?: Array<{ person: string; price: number | string; quota: number | string }> }) => {
    const item = entry.list?.find(value => value.person === group);
    const price = Number(item?.price), quota = Number(item?.quota);
    return entry.date && Number.isSafeInteger(price) && price >= 0 && Number.isInteger(quota) && quota > 0 ? [{ date: entry.date, price, quota }] : [];
  });
}
export function selectionFor(goods: MallGoods, spec: GoodsSpecification | undefined, group: string, date: string, quantity: number): Selection {
  if (!spec || !spec.person.includes(group)) throw new Error('请先选择套餐及出游人群');
  const slot = calendarSlots(spec, group).find(value => value.date === date);
  if (!slot) throw new Error('请选择价格日历中有可用名额的日期');
  const stock = Math.min(slot.quota, goods.limitBuy > 0 ? goods.limitBuy : 99, goods.stock >= 0 ? goods.stock : 99);
  return { productId: String(goods.id), name: goods.name, cover: goods.cover, categoryId: goods.category_id, specKey: spec.key, specName: spec.title, group, date, quantity, unitCents: slot.price, stock, travellersRequired: goods.travellersRequired !== false, shippingRequired: goods.shippingRequired === true };
}
