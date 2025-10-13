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

export const OPTIONAL_MATERIALS: OptionalMaterialGroup[] = [
  {
    id: 'optional_deposit',
    title: '材料6',
    subtitle: '存款5选1',
    options: [
      {
        id: 'deposit_option_1',
        label: '半年活期银行流水',
        description: '余额一直大于10万',
        detailRequirements: ['不能临时存入', '余额总少', 'xxxxxxxxx文字说明'],
        imageUrl: 'https://temp.im/400x300?text=银行流水',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      },
      {
        id: 'deposit_option_2',
        label: '定期存款证明',
        description: '文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明',
        detailRequirements: ['定期存款证明书', '存款金额不少于20万', '存期不少于6个月', '银行出具的正式证明'],
        imageUrl: 'https://temp.im/400x300?text=定期存款证明',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      },
    ],
  },
  {
    id: 'optional_property',
    title: '材料7',
    subtitle: '房产3选1',
    options: [
      {
        id: 'property_option_1',
        label: '房产证',
        description: '文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明',
        detailRequirements: ['房产证原件及复印件', '房产评估报告', '房产税缴费证明'],
        imageUrl: 'https://temp.im/400x300?text=房产证',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      },
      {
        id: 'property_option_2',
        label: '购房合同',
        description: '购房合同及相关付款凭证。',
        detailRequirements: ['购房合同原件及复印件', '首付款收据', '银行贷款合同（如适用）'],
        imageUrl: 'https://temp.im/400x300?text=购房合同',
      },
      {
        id: 'property_option_3',
        label: '土地使用证',
        description: '土地使用权证书及相关文件。',
        detailRequirements: ['土地使用权证书原件及复印件', '土地评估报告', '土地税缴费证明'],
        imageUrl: 'https://temp.im/400x300?text=土地使用证',
      },
    ],
  },
];

export const CONDITION_OPTIONS: VisaCondition[] = [
  {
    type: 'education',
    label: '学历条件',
    description: '适用于具有高等教育背景的申请人，通过学历和学术成就来满足签证要求。',
    requirements: ['具有本科及以上学历', '学历需经过官方认证', '提供完整的学术成绩单', '英语水平达到相应要求'],
    materials: [
      {
        id: 'edu_1',
        name: '学历证书12',
        description: '本科及以上学历证书原件及。',
        imageUrl: 'https://temp.im/400x300?text=学历证书示例',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        required: true,
      },
      {
        id: 'edu_2',
        name: '成绩单',
        description: '完整的大学成绩单，需显示所有。',
        imageUrl: 'https://temp.im/400x300?text=成绩单示例',
        required: true,
      },
      {
        id: 'edu_3',
        name: '语言成绩证明',
        description: '雅思、托福等英语水平测试成绩。',
        imageUrl: 'https://temp.im/400x300?text=语言成绩示例',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        required: false,
      },
    ],
    optionalMaterials: OPTIONAL_MATERIALS,
  },
  {
    type: 'deposit',
    label: '存款条件',
    description: '适用于通过资金证明来满足签证财务要求的申请人，需要提供充足的资金证明。',
    requirements: ['银行存款余额不少于规定金额', '资金来源合法合规', '存款历史记录清晰', '提供资产证明文件'],
    materials: [
      {
        id: 'dep_1',
        name: '银行存款证明',
        description: '由银行开具的存款证明书。',
        imageUrl: 'https://temp.im/400x300?text=存款证明示例',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        required: true,
      },
      {
        id: 'dep_2',
        name: '银行流水账单',
        description: '近6个月的银行流水账单。',
        imageUrl: 'https://temp.im/400x300?text=银行流水示例',
        required: true,
      },
    ],
    optionalMaterials: OPTIONAL_MATERIALS,
  },
  {
    type: 'property',
    label: '房产条件',
    description: '适用于拥有不动产的申请人，通过房产价值来满足签证的财务担保要求。',
    requirements: ['拥有合法房产所有权', '房产价值符合签证要求', '提供房产评估报告', '房产无重大法律纠纷'],
    materials: [
      {
        id: 'prop_1',
        name: '房产证',
        description: '房屋所有权证书原件及复印件。',
        imageUrl: 'https://temp.im/400x300?text=房产证示例',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        required: true,
      },
      {
        id: 'prop_2',
        name: '房产评估报告',
        description: '由具有资质的评估机构出具的。',
        imageUrl: 'https://temp.im/400x300?text=评估报告示例',
        required: true,
      },
      {
        id: 'prop_3',
        name: '房产税缴费证明',
        description: '近一年的房产税缴费记录。',
        imageUrl: 'https://temp.im/400x300?text=税费证明示例',
        required: false,
      },
    ],
  },
];

export const COMPREHENSIVE_NOTES = {
  description: '1321231321321',
  imageUrl: 'https://temp.im/400x300?text=定期存款证明',
  videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
};