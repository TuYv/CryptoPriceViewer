# Crypto Price Viewer

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TuYv/CryptoPriceViewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[English](./README.md) · **中文** · [日本語](./README-ja.md) · [한국어](./README-ko.md)

一个 Chrome 扩展：点开工具栏图标就能看到自选币的行情，还可以把一个币的价格固定在工具栏图标上，不用打开也能看到。另外附带一条币圈新闻时间线。

![行情页](./store-assets/screenshots/zh/1-market.png)

## 功能

**行情**
- 每个币用自己的品牌色显示成一个色块，下面画着近 7 天的走势
- 固定到工具栏的币占一整行
- 标题旁边的按钮可以在色块和列表两种显示方式之间切换。列表里一个币一行，固定的币排在最前面
- 拖动色块调整顺序；色块右上角的“⋯”菜单可以固定、查看详情、移到最前、删除，删除后 5 秒内可以撤销
- 搜索框边输入边出结果，可以用上下键选择、回车添加
- 被 CoinGecko 限速或者断网时，继续显示上一次的价格，并写明是几点的价格

**币种详情**
- 1 天、7 天、30 天、90 天、1 年的价格图表，标出这段时间的最高和最低，鼠标移上去显示那个时间点的价格
- 市值、24 小时成交量、流通量、历史最高（以及现在比最高低多少）、市值排名
- 和这个币相关的新闻

**工具栏图标**
- 显示固定币的价格或者 24 小时涨跌幅
- 颜色跟着涨跌颜色设置走；鼠标停在图标上显示币名、价格和涨跌幅
- 后台按设置的间隔自动刷新

**资讯**
- 按天分组的新闻时间线，可以只看提到自选币的，或者只看某一个币的
- 几家网站报道同一件事时只显示最早的一条
- 打开资讯页之前，扩展不会访问任何新闻网站。PANews 和 Odaily 打开就能看；Decrypt 要你先同意访问

**设置**
- 显示货币：美元、人民币、欧元
- 语言：简体中文、English、日本語、한국어，默认跟随浏览器
- 涨跌颜色：红涨绿跌、绿涨红跌、红涨蓝跌，默认按语言的习惯（中文红涨绿跌，韩文红涨蓝跌，日文和英文绿涨红跌）
- 外观：跟随系统、浅色、深色
- 可以填自己的 CoinGecko 免费密钥，减少被限速的情况
- 自选列表在登录同一个 Chrome 账号的电脑之间同步

## 安装

- **Chrome 网上应用店**：搜索 “Crypto Price Viewer”。
- **自己构建**：需要 Node.js 22 或更新版本。

  ```bash
  git clone https://github.com/TuYv/CryptoPriceViewer.git
  cd CryptoPriceViewer
  npm install
  npm run build
  ```

  打开 `chrome://extensions`，开启“开发者模式”，点“加载已解压的扩展程序”，选择 `.output/chrome-mv3` 文件夹。

从 0.1.x 升级时，自选币、固定的币、货币、语言和刷新间隔都会自动保留。

## 数据从哪里来

- **行情**：[CoinGecko](https://www.coingecko.com/) 的公共接口。
- **新闻**：[PANews](https://www.panewslab.com/)、[Odaily 星球日报](https://www.odaily.news/)、[Decrypt](https://decrypt.co/)。扩展只显示标题和链接，点进去在原网站阅读，内容版权归各网站所有。每个来源都可以在“设置 › 资讯来源”里单独关掉。

## 隐私

- 不收集、不上传任何个人信息，没有统计和广告
- 设置保存在 Chrome 自带的同步存储里，只会在你自己的 Chrome 账号下同步
- CoinGecko 密钥只保存在这台电脑上
- 只访问 CoinGecko，以及你打开资讯页以后、开着的新闻网站

完整内容见[隐私政策](./privacy-policy.html)。

## 反馈

遇到问题或有建议，请到 [GitHub Issues](https://github.com/TuYv/CryptoPriceViewer/issues) 提交。

## 开发

见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 许可证

[MIT](./LICENSE)
