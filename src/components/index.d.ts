import FoldAnimation from './fold-animation/fold-animation.vue';
import Iconfont from './iconfont/iconfont.vue';
import InputSwitch from './input-switch/input-switch.vue';
import layout from './layout/layout.vue';
import popupBottom from './popup-bottom/popup-bottom.vue';
import addressFormPopup from './address-form-popup/address-form-popup.vue';
import cityPopup from './city-popup/city-popup.vue';
import addressPopup from './address-popup/address-popup.vue';
import { type UniPopupProps } from '@uni-helper/uni-ui-types/index';

declare module 'vue' {
  export interface GlobalComponents {
    layout: typeof layout;
    iconfont: typeof Iconfont;
    inputSwitch: typeof InputSwitch;
    foldAnimation: typeof FoldAnimation;
    popupBottom: typeof popupBottom;
    addressFormPopup: typeof addressFormPopup;
    cityPopup: typeof cityPopup;
    addressPopup: typeof addressPopup;
  }
}
