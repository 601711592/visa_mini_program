/** 显式开启的纯前端预览；不会复用或写入真实身份、令牌和业务资产。 */
export const MALL_PREVIEW = import.meta.env?.VITE_MALL_PREVIEW === 'true';
