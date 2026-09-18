import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';
/** 路由只传非敏感订单 ID，详情从当前演示会话读取。 */
export function useOrderPage() {
  const mall = useMallPreviewStore(), id = ref('');
  onLoad(options => { id.value = String(options?.id || ''); });
  const order = computed(() => mall.data.member ? mall.data.orders.find(item => item.id === id.value) : undefined);
  return { mall, id, order };
}
