// 敏感草稿仅在内存保存。业务页面应以商品明细 ID 作为 key，禁止放在路由参数中。
const drafts = new Map<string, unknown>();
let owner: number | null = null;
let suspended = false;
export function saveSensitiveDraft(key: string, value: unknown) {
  if (suspended) return;
  drafts.set(key, value);
}
export function readSensitiveDraft<T>(key: string): T | undefined {
  return suspended ? undefined : drafts.get(key) as T | undefined;
}
export function suspendSensitiveDrafts() { suspended = true; }
export function clearSensitiveDrafts() { drafts.clear(); owner = null; suspended = false; }
export function resumeSensitiveDrafts(memberId: number) {
  if (owner !== null && owner !== memberId) drafts.clear();
  owner = memberId;
  suspended = false;
}
