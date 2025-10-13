import request from '@/utils/request';

// 签证条件类型
export enum VisaConditionType {
  EDUCATION = 'education',
  DEPOSIT = 'deposit',
  PROPERTY = 'property'
}

// 材料项接口
export interface MaterialItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  required: boolean;
  order: number;
}

// 签证条件接口
export interface VisaCondition {
  type: VisaConditionType;
  label: string;
  description: string;
  requirements: string[];
  materials: MaterialItem[];
}

// 获取签证条件列表
export function getVisaConditions(): Promise<API.ResponseBody<VisaCondition[]>> {
  return request({
    url: '/visa/conditions',
    method: 'GET'
  });
}

// 根据类型获取签证条件详情
export function getVisaConditionByType(type: VisaConditionType): Promise<API.ResponseBody<VisaCondition>> {
  return request({
    url: `/visa/conditions/${type}`,
    method: 'GET'
  });
}

// 获取材料清单
export function getMaterialsByConditionType(type: VisaConditionType): Promise<API.ResponseBody<MaterialItem[]>> {
  return request({
    url: `/visa/materials/${type}`,
    method: 'GET'
  });
}

// 上传材料文件
export function uploadMaterial(file: File, materialId: string): Promise<API.ResponseBody<{ url: string }>> {
  return request({
    url: '/visa/materials/upload',
    method: 'POST',
    data: {
      file,
      materialId
    }
  });
}

// 提交申请材料
export function submitApplication(data: {
  conditionType: VisaConditionType;
  materials: Array<{
    materialId: string;
    fileUrl: string;
    notes?: string;
  }>;
}): Promise<API.ResponseBody<{ applicationId: string }>> {
  return request({
    url: '/visa/application/submit',
    method: 'POST',
    data
  });
}

// 根据签证类型ID获取申请材料
export function getVisaApplicationMaterialsByTypeId(visaTypeId: string | number): Promise<API.ResponseBody<any>> {
  return request({
    url: '/visa-application-materials/by-visa-type-id',
    method: 'GET',
    data: {
      visa_type_id: visaTypeId
    }
  });
}