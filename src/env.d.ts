/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ID: string
  readonly VITE_API_PREFIX?: string
  readonly VITE_APP_ID: string
  readonly VITE_APP_TITLE: string
  readonly VITE_LOGO_URL: string
  /** Only the explicit string 'true' enables isolated frontend fixtures. */
  readonly VITE_MALL_PREVIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
