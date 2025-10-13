import request, { Method } from '@/utils/request';
import type { Goods } from './shop';

export interface Collection {
  id: number;
  goods: Goods;
}

/**
 * 查询收藏分页列表
 */
export const getCollectionListByPage = (data: API.RequestPage) => {
  return request<API.ResponseBody<API.ResponseBodyPageData<Collection[]>>>({ url: `/collection`, method: Method.GET, data });
};

/**
 * 查询商品是否已收藏
 */
export const getCollectionByGoods = (goodsId: string | number) => {
  return request<API.ResponseBody<boolean>>({ url: `/collection/goods/${goodsId}`, method: Method.GET });
};

/**
 * 添加收藏
 */
export const addCollection = (goodsId: string | number) => {
  return request<API.ResponseBody>({ url: `/collection`, method: Method.POST, data: { goodsId, type: 'add' } });
};

/**
 * 删除收藏
 */
export const deleteCollection = (goodsId: string | number) => {
  return request<API.ResponseBody>({ url: `/collection`, method: Method.POST, data: { goodsId, type: 'remove' } });
};
