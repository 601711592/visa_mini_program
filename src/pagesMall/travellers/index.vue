<template>
  <MallPage>
    <view v-if="line && !submitted" class="mx-body">
      <view class="mx-card"><ProductLine :line="line" /><view class="mx-hint">当前仅填写这项商品的 {{ line.quantity }} 位出行人，不与其他套餐或日期共用。</view></view>
      <view v-for="(person, index) in values" :key="index" class="mx-card"><view class="mx-title">第 {{ index + 1 }} 位出行人</view><view class="mx-field"><text class="mx-field-title">姓名</text><input v-model="person.name" class="mx-input" placeholder="与护照姓名一致" :maxlength="80" /></view><view class="mx-field"><text class="mx-field-title">护照号码</text><input v-model="person.passport" class="mx-input" placeholder="请输入护照号码" :maxlength="20" /></view><view class="mx-field"><text class="mx-field-title">生日</text><picker mode="date" :value="person.birthday || '1990-01-01'" :end="today" @change="person.birthday = $event.detail.value"><view class="mx-input mx-row">{{ person.birthday || '请选择出生日期' }}<text>›</text></view></picker></view></view>
      <view v-if="error" class="mx-error" role="alert">{{ error }}</view><button class="mx-button mx-wide" @tap="save">保存并返回</button>
    </view>
    <view v-else class="mx-empty"><view class="mx-title">{{ submitted ? '订单已提交，请到订单详情查看' : '当前商品已变化' }}</view><button class="mx-button" @tap="back">返回确认订单</button></view>
  </MallPage>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useMallPreviewStore } from '@/store/mall-preview';
import { clone, day, newTraveller, saveTravellers, type Traveller } from '@/mall/model';
import { back } from '@/mall/navigation';
import MallPage from '@/components/mall/MallPage.vue';
import ProductLine from '@/components/mall/ProductLine.vue';
const mall = useMallPreviewStore(), id = ref(''), error = ref('');
const values = ref<Traveller[]>([]), today = day();
const line = computed(() => mall.data.draft?.lines.find(item => item.id === id.value));
const submitted = computed(() => !!(mall.data.draft && mall.data.submitted[mall.data.draft.id]));
watch(() => [id.value, line.value?.quantity, mall.data.member], () => {
  values.value = line.value && mall.data.member ? Array.from({ length: line.value.quantity }, (_, index) => clone(line.value!.travellers[index] || newTraveller())) : [];
}, { immediate: true });
onLoad(options => { id.value = String(options?.id || ''); });
onUnload(() => { values.value = []; });
function save() { try { saveTravellers(mall.data, id.value, values.value); back(); } catch (e) { error.value = e instanceof Error ? e.message : '保存失败'; } }
</script>
