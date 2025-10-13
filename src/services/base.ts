import { getToken } from '@/utils';
import { API_PREFIX } from '@/utils/constant';
import request, { Method } from '@/utils/request';

export interface Area {
  areaCode: number;
  areaName: string;
  parentCode: number;
  children?: Area[];
}

/**
 * 查询地区列表
 */
export const getArearegions = (parentCode?: number) => {
  return request<API.ResponseBody<Area[]>>({ url: `/arearegions`, method: Method.GET, data: { parentCode } });
};

export interface Article {
  content: string;
  cover: string;
  createdAt: string;
  deletedAt: string;
  id: number;
  title: string;
  updatedAt: string;
}

/**
 * 查询文章详情
 */
export const getArticle = (id: number | string) => {
  return request<API.ResponseBody<Article>>({ url: `/articles/${id}`, method: Method.GET });
};

/**
 * 上传图片
 */
export const upload = (filePath: string) => {
  return new Promise<API.ResponseBody<string>>((resolve, reject) => {
    uni.uploadFile({
      url: API_PREFIX + '/upload', // 服务器地址
      filePath,
      name: 'file',
      header: {
        'Content-Type': 'multipart/form-data',
        authorization: getToken(),
      },
      success: (uploadFileRes) => {
        const data = JSON.parse(uploadFileRes.data);
        if (data.code !== 200) {
          reject(data);
          return;
        }
        resolve(data); // 处理上传后的服务器响应
      },
      fail: (err) => {
        reject(err); // 处理上传失败的情况
      },
    });
  });
};
