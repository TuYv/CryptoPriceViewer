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
| `npm run icons` | 改了 `store-assets/logo/` 里的图标源文件以后运行，重新生成 `public/icon/` 下的 16、32、48、128 像素图标和商店图标 `store-assets/icon128-store.png` |

每次推送到 `master`，以及每个 Pull Request，GitHub Actions 都会跑一遍检查、单元测试和端到端测试，并把商店用的 zip 存为构建产物。

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
| `store-assets/` | 只给商店页面用的图片和提交资料（`LISTING.md`），不会打进扩展。`logo/` 是图标的源文件：`logo.svg` 用于 48 像素以上，`logo-small.svg` 是给 16、32 像素简化过的版本 |
| `e2e/` | 端到端测试。`mock-api.ts` 拦截所有网络请求并用 `data/coingecko.json` 里的固定数据回应 |
| `scripts/` | 生成商店截图和图标的脚本 |

## 数据怎么流动

- 所有对 CoinGecko 的请求都由后台发出，经过 `RequestGate` 排队：不用密钥时每分钟最多 8 次，有密钥时 25 次。被 429 限速后，在解锁时间之前不再请求。
- 后台把结果写进 `chrome.storage.local` 的缓存，弹窗读缓存并监听变化，所以打开弹窗时马上就有内容。
- 设置存在 `chrome.storage.sync`。后台监听设置变化：自选列表或货币变了就刷新行情，刷新间隔变了就重设定时器，其他变化更新工具栏图标。
- 搜索、图表、检查密钥由弹窗通过消息请求后台（`src/core/messages.ts` 的 `ask`）。

## 测试的约定

- 端到端测试启动浏览器时加了 `--host-resolver-rules`，没被 `mock-api.ts` 拦截的请求会直接失败，测试不会访问外网。
- 自动化测试点不了 Chrome 的权限确认框。需要“已同意访问”的资讯页测试，在弹窗页面里把 `permissions.contains` 换成总是返回 true，扩展本身的代码不变。
- Playwright 拦下来返回的响应不经过浏览器的跨域检查。所以 `mock-api.ts` 用“读取内容的请求（带 `origin` 请求头）失败、只确认网站连不连得上的请求（no-cors）照常”来模拟网站不再允许直接读取。
- 每个测试打开弹窗前，先等扩展装好时那次取行情结束再清空数据，免得机器忙时这次请求晚到、被算进测试自己的请求次数里。
- 升级测试用同一个浏览器资料目录启动两次：第一次写入 0.1.x 的旧数据，第二次检查后台启动后是否转换。

## 权限

必需权限只有 `storage`、`alarms` 和 `https://api.coingecko.com/*`，和 0.1.x 相比没有新增，老用户升级时 Chrome 不会弹出权限确认。用户第一次打开资讯页之前，后台不访问任何新闻网站。PANews 和 Odaily 的新闻允许任何网页读取（响应里带着允许所有来源读取的 CORS 头），不用权限就能读；Decrypt 不允许，要用户同意访问。三个网站都放在 `optional_host_permissions` 里：Decrypt 在用户要看它的新闻时申请；PANews 和 Odaily 只在网站不再允许直接读取时申请。判断方法是读取失败后用 no-cors 再请求一次，连得上就说明是网站拒绝，连不上就是网络问题。新增必需权限会让已安装的扩展在升级后被 Chrome 停用、等用户重新同意，改 `wxt.config.ts` 里的权限前要先想清楚。
