import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    action: { default_title: '__MSG_extName__' },
    permissions: ['storage', 'alarms'],
    host_permissions: ['https://api.coingecko.com/*'],
    // 资讯来源：用户第一次打开资讯页时才请求，升级时不会弹出权限提示
    optional_host_permissions: ['https://www.panewslab.com/*', 'https://api.odaily.news/*', 'https://decrypt.co/*'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
