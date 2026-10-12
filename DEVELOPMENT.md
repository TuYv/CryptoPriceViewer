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
| `npm run store:screenshots` | 重新生成商店截图到 `store-assets/screenshots/`（需要联网加载币种图标） |

每次推送到 `master` 或 `rewrite`，以及每个 Pull Request，GitHub Actions 都会跑一遍检查、单元测试和端到端测试，并把商店用的 zip 存为构建产物。

## 目录

| 位置 | 内容 |
|---|---|
| `src/core/` | 不依赖界面的逻辑：设置格式和 0.1.x 数据转换、CoinGecko 请求、请求排队和限速、格式化、新闻解析和去重、存储项 |
| `src/background/` | 后台：刷新行情、工具栏图标、图表缓存、抓新闻、处理弹窗发来的请求 |
| `src/entrypoints/background.ts` | 后台入口：定时器、设置变化、权限变化、消息 |
| `src/entrypoints/popup/` | 弹窗的页面和样式。字号、颜色、圆角、阴影都是 `style.css` 开头的变量，每一档什么时候用写在 `DESIGN.md` |
| `src/popup/` | 弹窗的界面：各个页面在 `views/`，部件在 `components/` |
| `src/i18n/` | 四种语言的界面文字。`messages/en.ts` 是基准，其他语言少了或多了词条，类型检查会报错；占位符不一致时单元测试会失败 |
| `public/_locales/` | 扩展名称和简介，Chrome 商店和扩展管理页显示的就是这里的文字 |
| `public/icon/`、`public/donate/` | 工具栏图标、打赏二维码 |
| `store-assets/` | 只给商店页面用的图片和提交资料（`LISTING.md`），不会打进扩展 |
| `e2e/` | 端到端测试。`mock-api.ts` 拦截所有网络请求并用 `data/coingecko.json` 里的固定数据回应 |
| `scripts/` | 生成商店截图的脚本 |

## 数据怎么流动

- 所有对 CoinGecko 的请求都由后台发出，经过 `RequestGate` 排队：不用密钥时每分钟最多 8 次，有密钥时 25 次。被 429 限速后，在解锁时间之前不再请求。
- 后台把结果写进 `chrome.storage.local` 的缓存，弹窗读缓存并监听变化，所以打开弹窗时马上就有内容。
- 设置存在 `chrome.storage.sync`。后台监听设置变化：自选列表或货币变了就刷新行情，刷新间隔变了就重设定时器，其他变化更新工具栏图标。
- 搜索、图表、检查密钥由弹窗通过消息请求后台（`src/core/messages.ts` 的 `ask`）。

## 测试的约定

- 端到端测试启动浏览器时加了 `--host-resolver-rules`，没被 `mock-api.ts` 拦截的请求会直接失败，测试不会访问外网。
- 自动化测试点不了 Chrome 的权限确认框。资讯页的测试在弹窗页面里把 `permissions.contains` 换成总是返回 true，扩展本身的代码不变。
- 升级测试用同一个浏览器资料目录启动两次：第一次写入 0.1.x 的旧数据，第二次检查后台启动后是否转换。

## 权限

必需权限只有 `storage`、`alarms` 和 `https://api.coingecko.com/*`，和 0.1.x 相比没有新增，老用户升级时 Chrome 不会弹出权限确认。新闻网站放在 `optional_host_permissions` 里，用户第一次打开资讯页时才请求。新增必需权限会让已安装的扩展在升级后被 Chrome 停用、等用户重新同意，改 `wxt.config.ts` 里的权限前要先想清楚。
