import request from '@/utils/request';

/** 签证条件类型。 */
export enum VisaConditionType {
  EDUCATION = 'education',
  DEPOSIT = 'deposit',
  PROPERTY = 'property',
}

/** 材料项接口。 */
export interface MaterialItem {
  id: string; // 材料 ID
  name: string; // 材料名称
  description: string; // 说明
  imageUrl?: string; // 示例图片地址
  videoUrl?: string; // 示例视频地址
  required: boolean; // 是否必填
  order: number; // 展示顺序
}

/** 签证条件接口。 */
export interface VisaCondition {
  type: VisaConditionType; // 条件类型
  label: string; // 展示名称
  description: string; // 说明
  requirements: string[]; // 申请要求
  materials: MaterialItem[]; // 所需材料
}

/** 提交申请时的条件与材料。 */
export type VisaApplicationParams = {
  conditionType: VisaConditionType; // 申请条件类型
  materials: Array<{
    materialId: string; // 对应材料 ID
    fileUrl: string; // 已上传文件地址
    notes?: string; // 补充说明
  }>;
};

/** 获取签证条件列表。 */
export function getVisaConditions() {
  return request<API.ResponseBody<VisaCondition[]>>({
    url: '/visa/conditions',
    method: 'GET',
  });
}

/** 根据类型获取签证条件详情。 */
export function getVisaConditionByType(type: VisaConditionType) {
  return request<API.ResponseBody<VisaCondition>>({
    url: `/visa/conditions/${type}`,
    method: 'GET',
  });
}

/** 获取材料清单。 */
export function getMaterialsByConditionType(type: VisaConditionType) {
  return request<API.ResponseBody<MaterialItem[]>>({
    url: `/visa/materials/${type}`,
    method: 'GET',
  });
}

/** 上传材料文件。 */
export function uploadMaterial(file: File, materialId: string) {
  return request<API.ResponseBody<{ url: string }>>({
    url: '/visa/materials/upload',
    method: 'POST',
    data: {
      file,
      materialId,
    },
  });
}

/** 提交申请材料。 */
export function submitApplication(data: VisaApplicationParams) {
  return request<API.ResponseBody<{ applicationId: string }>>({
    url: '/visa/application/submit',
    method: 'POST',
    data,
  });
}

/** 根据签证类型 ID获取申请材料。 */
export function getVisaApplicationMaterialsByTypeId(visaTypeId: string | number) {
  return request<API.ResponseBody<any>>({
    url: '/visa-application-materials/by-visa-type-id',
    method: 'GET',
    data: {
      visa_type_id: visaTypeId,
    },
  });
}
