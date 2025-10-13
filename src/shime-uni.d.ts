import type { getAssetUrl } from './utils';

export {};

declare module 'vue' {
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks {}

  export interface ComponentCustomProperties {
    getAssetUrl: typeof getAssetUrl;
  }
}
