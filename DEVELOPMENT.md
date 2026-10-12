# 开发说明

需要 Node.js 22 或更新的版本。

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm install` | 安装依赖。第一次拉代码、或者依赖有变化时运行 |
| `npm run dev` | 开发模式：自动打开一个装好扩展的 Chrome，改代码后扩展自动重新加载 |
| `npm run check` | 类型检查和代码规范检查 |
| `npm run format` | 自动修正代码格式 |
| `npm test` | 单元测试 |
| `npm run e2e` | 构建以后，在 Playwright 自带的 Chromium 里装上扩展做端到端测试。第一次运行前要先执行 `npx playwright install chromium` |
| `npm run build` | 构建到 `.output/chrome-mv3`，可以在 `chrome://extensions` 里用“加载已解压的扩展程序”装上 |
| `npm run zip` | 打出上传 Chrome 商店用的 zip，放在 `.output/` 下 |

每次推送到 `master` 或 `rewrite`，以及每个 Pull Request，GitHub Actions 都会跑一遍检查、单元测试和端到端测试，并把商店用的 zip 存为构建产物。

## 目录

| 位置 | 内容 |
|---|---|
| `src/entrypoints/popup/` | 点击工具栏图标弹出的窗口 |
| `src/entrypoints/background.ts` | 后台：请求 CoinGecko、缓存、定时刷新、工具栏图标上的价格 |
| `src/components/` | 界面组件 |
| `src/i18n/` | 四种语言的界面文字。`messages/en.ts` 是基准，其他语言少了或多了词条，类型检查会报错 |
| `public/_locales/` | 扩展名称和简介，Chrome 商店和扩展管理页显示的就是这里的文字 |
| `public/icon/` | 工具栏图标 |
| `public/donate/` | 打赏二维码 |
| `store-assets/` | 只给商店页面用的图片，不会打进扩展 |
| `e2e/` | 端到端测试 |

## 权限

必需权限只有 `storage`、`alarms` 和 `https://api.coingecko.com/*`，和 0.1.x 相比没有新增，老用户升级时 Chrome 不会弹出权限确认。新闻网站放在 `optional_host_permissions` 里，用户第一次打开资讯页时才请求。新增必需权限会让已安装的扩展在升级后被 Chrome 停用、等用户重新同意，改 `wxt.config.ts` 里的权限前要先想清楚。
