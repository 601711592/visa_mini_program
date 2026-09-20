import request from '@/utils/request';

// 商品类别接口
export interface GoodsCategory {
  id: number; // 类别 ID
  name: string; // 类别名称
}

export interface GoodsSpecification {
  information: string; // 规格参数名称
  key: string; // 规格参数键
  person: string[]; // 人群
  price: string; // 价格
  priceCalender: any; // 价格日历
  timeSlot: string[]; // 时间段
  title: string; // 规格参数标题
}

// 商品接口
export interface Goods {
  id: number; // 产品 ID
  name: string; // 产品名称
  cover: string; // 封面图片链接
  images: string[]; // 轮播图
  price: number; // 价格
  category_id: number; // 所属类别 ID
  stock: number; // 库存
  content: string; // 产品详情 HTML
  limitBuy: number; // 限购数量
  highlights: string; // 产品亮点
  trip_description: string; // 行程描述
  price_description: string; // 价格说明
  refund_description: string; // 退款说明
  booking_description: string; // 预订说明
  specification: GoodsSpecification[]; // 规格参数
}

/** 查询商品分类。 */
export function getShopCategories() {
  return request<API.ResponseBody<GoodsCategory[]>>({
    url: '/goods/category/list',
    method: 'GET',
  });
}

/** 按名称分页查询商品。 */
export function getGoodsList(data?: API.RequestPage<{ name?: string }>) {
  return request<API.ResponseBodyPage<Goods>>({
    url: '/goods/page',
    method: 'GET',
    data,
  });
}

/** 根据商品 ID 查询详情。 */
export function getGoodsDetail(id: string) {
  return request<API.ResponseBody<Goods>>({
    url: `/goods/${id}`,
    method: 'GET',
  });
}
