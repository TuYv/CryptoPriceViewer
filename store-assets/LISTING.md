# Chrome 网上应用店提交资料（1.0.0）

上传 `npm run zip` 打出的 `.output/crypto-price-viewer-1.0.0-chrome.zip` 时，下面的内容可以直接复制到开发者后台对应的栏目。

- 扩展名称和简短说明来自 `public/_locales/*/messages.json`，商店会自动读取，不用手填。
- 要上传的图片都在 `store-assets/` 里，`npm run store:images` 可以重新生成（需要联网加载币种图标）：

  | 开发者后台的栏目 | 文件 | 说明 |
  |---|---|---|
  | 商店图标 | `icon128-store.png` | 128×128，必须 |
  | 小宣传图 | `promo/small-440x280.png` | 440×280，必须 |
  | 大宣传图 | `promo/marquee-1400x560.png` | 1400×560，可选；不传就不会被放到商店首页的大横幅里 |
  | 截图 | `screenshots/<语言>/1-market.png` 到 `5-list-dark.png` | 每张 1280×800，每种语言 5 张。在后台的“商品详情”里切换到对应语言（中文、English、日本語、한국어），上传对应文件夹里的 5 张 |

  截图里的新闻标题是示例文字。宣传图上只有图标和扩展名，所有语言通用。
- 隐私政策网址填仓库里 `privacy-policy.html` 发布后的地址。

---

## 商店介绍（Description）

### English

Crypto Price Viewer shows the coins you follow as soon as you click its toolbar icon.

• Your coins at a glance: each coin is a tile in its own color with its 7-day trend. Drag tiles to reorder them, or switch to a compact list.
• A price on your toolbar: pin one coin and its price (or 24h change) stays on the extension icon.
• Price history: charts for 1 day to 1 year with the high and low marked; hover to see the price at any point.
• Market data: market cap, 24h volume, circulating supply, all-time high and rank.
• Crypto news: a timeline from PANews, Odaily and Decrypt, grouped by day and filterable by coin. The same story from several sites is shown once.
• Works the way you read prices: red up / green down, green up / red down, or red up / blue down.
• Light and dark themes; English, 简体中文, 日本語 and 한국어.
• Your list syncs across computers signed in to the same Chrome account.

When CoinGecko limits requests or you are offline, the last prices stay on screen with the time they are from. You can add your own free CoinGecko API key to make rate limits less likely.

Privacy: no account, no analytics, no ads. The extension only connects to CoinGecko and, once you open the News tab, the news sites you turn on.

### 简体中文

点一下工具栏图标，就能看到你关注的币的行情。

• 一眼看清自选币：每个币用自己的颜色显示，下面画着近 7 天的走势，可以拖动排序，也可以切换成列表。
• 价格挂在工具栏上：固定一个币，它的价格（或 24 小时涨跌幅）就一直显示在扩展图标上。
• 价格走势：1 天到 1 年的图表，标出最高和最低，鼠标移上去显示那个时间点的价格。
• 行情数据：市值、24 小时成交量、流通量、历史最高、市值排名。
• 币圈新闻：来自 PANews、Odaily 星球日报和 Decrypt 的新闻时间线，按天分组，可以按币筛选；几家报道同一件事时只显示一条。
• 涨跌颜色随你习惯：红涨绿跌、绿涨红跌、红涨蓝跌。
• 浅色和深色外观；支持简体中文、English、日本語、한국어。
• 自选列表在登录同一个 Chrome 账号的电脑之间同步。

被 CoinGecko 限速或者断网时，继续显示上一次的价格，并写明是几点的价格。可以填写自己的 CoinGecko 免费密钥，减少被限速的情况。

隐私：不需要注册，没有统计，没有广告。本扩展只访问 CoinGecko，以及你打开资讯页以后、开着的新闻网站。

### 日本語

ツールバーのアイコンをクリックするだけで、登録したコインの価格を確認できます。

• ひと目でわかる：コインごとに色分けしたタイルに、直近7日間の値動きを表示。ドラッグで並べ替えでき、リスト表示にも切り替えられます。
• ツールバーに価格を表示：1つのコインを固定すると、その価格（または24時間の騰落率）がアイコンに表示されます。
• 価格チャート：1日から1年まで。最高値・最安値を表示し、マウスを乗せるとその時点の価格がわかります。
• マーケットデータ：時価総額、24時間出来高、流通量、過去最高値、ランキング。
• ニュース：PANews、Odaily、Decrypt のニュースを日付ごとのタイムラインで表示し、コインで絞り込めます。同じ出来事は1件にまとめます。
• 値動きの色を選べます：緑が上昇・赤が下落、赤が上昇・緑が下落、赤が上昇・青が下落。
• ライト／ダーク表示、日本語・English・简体中文・한국어 に対応。
• 同じ Chrome アカウントのパソコン間でリストを同期します。

CoinGecko の制限やオフラインのときも、前回の価格をその時刻と一緒に表示します。無料の CoinGecko API キーを設定すると制限に当たりにくくなります。

プライバシー：アカウント不要、分析ツールなし、広告なし。接続先は CoinGecko と、ニュースタブを開いた後のオンにしているニュースサイトだけです。

### 한국어

툴바 아이콘을 누르면 관심 코인의 시세를 바로 보여 줍니다.

• 한눈에 보는 시세: 코인마다 고유 색상의 타일에 최근 7일 추이를 표시하며, 끌어서 순서를 바꾸거나 목록 보기로 바꿀 수 있습니다.
• 툴바에 가격 표시: 코인 하나를 고정하면 그 가격(또는 24시간 등락률)이 아이콘에 계속 표시됩니다.
• 가격 차트: 1일부터 1년까지. 최고가와 최저가를 표시하고, 마우스를 올리면 그 시점의 가격을 보여 줍니다.
• 시장 데이터: 시가총액, 24시간 거래량, 유통량, 역대 최고가, 순위.
• 뉴스: PANews, Odaily, Decrypt의 뉴스를 날짜별 타임라인으로 보여 주고 코인별로 걸러 볼 수 있습니다. 같은 소식은 한 건만 보여 줍니다.
• 등락 색상 선택: 빨강 상승·파랑 하락, 빨강 상승·초록 하락, 초록 상승·빨강 하락.
• 라이트/다크 모드, 한국어·English·简体中文·日本語 지원.
• 같은 Chrome 계정으로 로그인한 컴퓨터끼리 목록이 동기화됩니다.

CoinGecko가 요청을 제한하거나 오프라인일 때도 마지막 가격을 몇 시 기준인지와 함께 보여 줍니다. 무료 CoinGecko API 키를 등록하면 요청 제한에 덜 걸립니다.

개인정보: 계정이 필요 없고, 분석 도구와 광고가 없습니다. 접속하는 곳은 CoinGecko와, 뉴스 탭을 연 뒤 켜 둔 뉴스 사이트뿐입니다.

---

## 隐私权规范（Privacy practices）

开发者后台是英文界面，下面给出可以直接粘贴的英文答案。

**Single purpose**

> Show live prices for the cryptocurrencies the user follows, optionally on the toolbar icon, together with crypto news headlines.

**Permission justification**

| 权限 | 粘贴的内容 |
|---|---|
| storage | Saves the user's settings (followed coins, pinned coin, currency, language, colors, theme, market page layout, refresh interval, news sources), an optional CoinGecko API key, and caches of prices, charts and news headlines so the popup can show data immediately. |
| alarms | Refreshes prices for the toolbar badge and the news cache at the interval the user picks, while the popup is closed. |
| Host permission: https://api.coingecko.com/* | Requests market prices, price history and coin search results from the CoinGecko API, which is the extension's only price data source. |
| Optional host permissions: www.panewslab.com, api.odaily.news, decrypt.co | Not requested at install. The extension visits no news site until the user opens the News tab. PANews and Odaily allow any web page to read their public news feeds, so they are read without this permission; it is requested for them only if a site stops allowing that. Decrypt does not allow it, so its permission is requested when the user chooses to see Decrypt news. Used only to download these public news feeds (headlines and links). The user can turn off each source, and the extension then removes the permission. |

**Remote code**：选 “No, I am not using remote code”。

**Data usage**：所有数据类型都不勾选（本扩展不收集任何用户数据），然后勾选页面底部的三条声明：

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes
