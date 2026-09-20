declare const wx: {
  openPrivacyContract: (options: { fail: () => void }) => void;
};

/** 仅供个人资料页查看微信官方隐私指引，不注册或接管隐私授权。 */
export function openPrivacyContract() {
  if (typeof wx === 'undefined' || typeof wx.openPrivacyContract !== 'function') {
    uni.showToast({ title: '请更新微信后查看隐私指引', icon: 'none' });
    return;
  }
  wx.openPrivacyContract({
    fail: () => uni.showToast({ title: '隐私指引打开失败，请重试', icon: 'none' }),
  });
}
