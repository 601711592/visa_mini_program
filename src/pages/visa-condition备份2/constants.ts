// API 数据类型定义
export interface ApiMaterialOption {
  key: number;
  name: string;
  image_url: string | null;
  video_url: string | null;
  sort_order: number;
  description: string;
}

export interface ApiMaterial {
  name: string;
  type: 1 | 2; // 1=固定材料, 2=单选材料
  options: ApiMaterialOption[] | null;
  image_url: string | null;
  video_url: string | null;
  sort_order: number;
  description: string | null;
}

export interface ApiDescription {
  content: string;
  image_url: string | null;
  video_url: string | null;
}

export interface ApiVisaCondition {
  id: string;
  name: string | null;
  conditions: string;
  materials: ApiMaterial[];
  descriptions: ApiDescription[];
}

export interface ApiResponse {
  status: number;
  data: ApiVisaCondition[];
  msg: string;
}

// 组件内部使用的类型定义
export interface MaterialItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  required: boolean;
}

export interface MaterialOption {
  id: string;
  label: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  detailRequirements: string[];
}

export interface OptionalMaterialGroup {
  id: string;
  title: string;
  subtitle: string;
  options: MaterialOption[];
}

export interface VisaCondition {
  type: string;
  label: string;
  description: string;
  requirements: string[];
  materials: MaterialItem[];
  optionalMaterials?: OptionalMaterialGroup[];
}

// 这些硬编码数据已被API数据替代，保留作为开发参考
// export const OPTIONAL_MATERIALS: OptionalMaterialGroup[] = [...];
// export const CONDITION_OPTIONS: VisaCondition[] = [...];
// export const COMPREHENSIVE_NOTES = {...};