import request, { Method } from '@/utils/request';
import type { Goods } from './shop';

export interface Member {
  id: number;
  nickname: string;
  avatar: string;
}

/**
 * 查询当前用户信息
 */
export const getCurrentUserInfo = () => {
  return request<API.ResponseBody<Member>>({ url: `/member/current`, method: Method.GET });
};
