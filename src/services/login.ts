import { API_PREFIX } from '@/utils/constant';
import request, { Method } from '@/utils/request';

/**
 * 通过code登录
 */
export const login = (code: string) => {
  return request<API.ResponseBody<{ token: string }>>({ url: `/login`, method: Method.POST, data: { code } });
};

/**
 * 上传头像
 */
export const uploadAvatar = (filePath: string) => {
  return new Promise<API.ResponseBody<string>>((resolve, reject) => {
    uni.uploadFile({
      url: API_PREFIX + '/avatar', // 服务器地址
      filePath,
      name: 'file',
      success: (uploadFileRes) => {
        const data = JSON.parse(uploadFileRes.data);
        // console.log('Avatar uploaded:', data);
        resolve(data); // 处理上传后的服务器响应
      },
      fail: (err) => {
        reject(err); // 处理上传失败的情况
      },
    });
  });
};

/**
 * 注册
 */
export const register = (data: { code: string; nickname: string; avatarUrl: string; encryptedData: string; iv: string }) => {
  return request<API.ResponseBody<{ token: string }>>({ url: `/register`, method: Method.POST, data });
};
