import { version } from '../../package.json'

/** 如期手记的应用信息，页面统一从这里读取。 */
export const appInfo = {
  name: import.meta.env.VITE_APP_TITLE,
  description: '记录岁月，珍藏记忆。',
  logo: '/static/images/brand.png',
  version,
} as const
