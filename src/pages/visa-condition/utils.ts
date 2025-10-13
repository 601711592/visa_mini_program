import type {
  ApiVisaCondition,
  ApiMaterial,
  ApiMaterialOption,
  VisaCondition,
  MaterialItem,
  MaterialOption,
  OptionalMaterialGroup,
} from './constants.js';

/**
 * 将API材料选项转换为组件材料选项
 */
function transformMaterialOption(apiOption: ApiMaterialOption): MaterialOption {
  return {
    id: String(apiOption.key),
    label: apiOption.name,
    description: apiOption.description,
    imageUrl: apiOption.image_url || undefined,
    videoUrl: apiOption.video_url || undefined,
    detailRequirements: [], // API中没有这个字段，留空
  };
}

/**
 * 将API固定材料转换为组件材料项
 */
function transformFixedMaterial(apiMaterial: ApiMaterial, index: number): MaterialItem {
  return {
    id: `material_${index}`,
    name: apiMaterial.name,
    description: apiMaterial.description || '',
    imageUrl: apiMaterial.image_url || undefined,
    videoUrl: apiMaterial.video_url || undefined,
    required: true,
  };
}

/**
 * 将API可选材料转换为组件可选材料组
 */
function transformOptionalMaterial(apiMaterial: ApiMaterial, index: number): OptionalMaterialGroup {
  const options = apiMaterial.options?.map((option) =>
    transformMaterialOption(option)
  ) || [];

  return {
    id: `optional_${index}`,
    title: apiMaterial.name,
    subtitle: `${options.length}选1`,
    options,
  };
}

/**
 * 将API签证条件数据转换为组件数据格式
 */
export function transformApiDataToVisaConditions(apiData: ApiVisaCondition[]): {
  conditions: VisaCondition[];
} {
  const conditions: VisaCondition[] = [];

  // 处理每个签证条件
  apiData.forEach((apiCondition, conditionIndex) => {
    if (!apiCondition.materials || apiCondition.materials.length === 0) {
      return; // 跳过没有材料的条件
    }

    // 分离固定材料和可选材料
    const fixedMaterials: MaterialItem[] = [];
    const optionalMaterials: OptionalMaterialGroup[] = [];

    apiCondition.materials
      .sort((a, b) => a.sort_order - b.sort_order) // 按排序字段排序
      .forEach((material, materialIndex) => {
        if (material.type === 1) {
          // 固定材料
          fixedMaterials.push(transformFixedMaterial(material, materialIndex));
        } else if (material.type === 2) {
          // 可选材料
          optionalMaterials.push(transformOptionalMaterial(material, materialIndex));
        }
      });

    // 创建签证条件对象
    const visaCondition: VisaCondition = {
      type: apiCondition.id,
      label: apiCondition.name || apiCondition.conditions || `条件${conditionIndex + 1}`,
      description: apiCondition.conditions || '签证申请条件',
      requirements: [], // API中没有这个字段，留空
      materials: fixedMaterials,
      optionalMaterials: optionalMaterials.length > 0 ? optionalMaterials : undefined,
      descriptions: apiCondition.descriptions[0]
    };

    conditions.push(visaCondition);
  });

  return {
    conditions,
  };
}

/**
 * 检查API响应是否成功
 */
export function isApiResponseSuccess(response: any): boolean {
  return response && response.status === 11 && Array.isArray(response.data);
}