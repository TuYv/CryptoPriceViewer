# 🚀 加密货币价格查看器

> 一个现代化的Chrome扩展程序，提供实时加密货币价格监控，支持多语言和精美的UI设计。

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/crypto-price-viewer)

## 🌍 多语言文档

- 🇺🇸 **[English](./README.md)**
- 🇨🇳 **中文** (当前)
- 🇯🇵 **[日本語](./README-ja.md)**
- 🇰🇷 **[한국어](./README-ko.md)**

## 📖 项目概述

加密货币价格查看器是一个功能全面的Chrome扩展程序，提供实时加密货币价格监控，拥有现代化、用户友好的界面。轻松跟踪您喜爱的加密货币，获取即时价格更新，并便捷管理您的观察列表。

## ✨ 功能特性

### 🔥 核心功能
- **实时价格监控**: 实时加密货币价格，自动更新
- **智能搜索**: 智能加密货币搜索，支持自动完成建议
- **动态币种管理**: 动态添加/删除任何加密货币
- **多货币支持**: 支持美元、欧元、日元等多种法币显示
- **价格趋势指标**: 价格变动的可视化指标
- **市场数据**: 全面的市值、交易量和24小时变化数据

### 🌍 国际化支持
- **支持4种语言**: 
  - 🇨🇳 中文（简体中文）
  - 🇺🇸 英语
  - 🇯🇵 日语（日本語）
  - 🇰🇷 韩语（한국어）
- **即时语言切换**: 无需重新加载页面即可切换语言
- **持久化偏好**: 语言选择在会话间保持

### 🎨 现代化UI/UX
- **玻璃拟态设计**: 现代化、半透明界面
- **响应式布局**: 适应不同屏幕尺寸
- **流畅动画**: CSS过渡和悬停效果
- **深色主题支持**: 护眼的深色模式
- **直观导航**: 基于标签的界面，清晰的分区

### ⚙️ 高级设置
- **可自定义刷新间隔**: 设置您偏好的更新频率
- **数据导入/导出**: 备份和恢复您的观察列表
- **本地存储**: 所有数据本地存储，保护隐私
- **重置选项**: 清除所有数据功能

### 💬 用户反馈系统
- **集成反馈**: 内置反馈收集
- **捐赠支持**: BNB和SOL捐赠二维码
- **多种联系方式**: 多种联系支持的方式

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, 原生JavaScript (ES6+)
- **API**: CoinGecko API 获取加密货币数据
- **存储**: Chrome扩展存储API
- **架构**: 模块化ES6类
- **样式**: 现代CSS，使用Flexbox和Grid
- **国际化**: 自定义i18n实现

## 📁 项目结构

```
chromeTools/
├── manifest.json          # 扩展配置
├── popup.html            # 主UI界面
├── privacy-policy.html   # Chrome Web Store隐私政策
├── css/
│   └── style.css         # 样式和主题
├── js/
│   ├── popup.js          # 主应用逻辑
│   ├── config.js         # 配置和常量
│   ├── i18n.js           # 国际化
│   ├── app/
│   │   └── CryptoApp.js  # 核心应用类
│   ├── services/         # API和数据服务
│   │   ├── ApiService.js
│   │   ├── NotionService.js
│   │   └── SettingsManager.js
│   └── ui/
│       └── UIManager.js  # UI管理
└── images/               # 图标和资源
    ├── icon16.svg
    ├── icon48.svg
    ├── icon128.svg
    └── ...
```

## 🚀 安装方法

### 从Chrome Web Store安装（推荐）
1. 访问[Chrome Web Store页面](https://chrome.google.com/webstore)（即将推出）
2. 点击"添加至Chrome"
3. 确认安装

### 手动安装（开发者模式）
1. 克隆此仓库：
   ```bash
   git clone https://github.com/yourusername/crypto-price-viewer.git
   ```
2. 打开Chrome并导航至`chrome://extensions/`
3. 在右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"并选择项目文件夹
5. 扩展程序将出现在您的Chrome工具栏中

## 📱 使用方法

### 快速开始
1. **点击扩展图标** 在Chrome工具栏中
2. **搜索加密货币** 使用搜索栏
3. **添加币种** 点击"+"按钮将币种添加到观察列表
4. **监控价格** 实时自动更新价格

### 主要功能
- **搜索**: 输入加密货币名称或符号
- **添加/删除**: 轻松管理您的观察列表
- **设置**: 自定义语言、货币和刷新频率
- **反馈**: 分享您的想法和建议

### 键盘快捷键
- `Ctrl/Cmd + K`: 聚焦搜索栏
- `Escape`: 关闭搜索建议
- `Enter`: 添加选中的加密货币

## 🔧 配置

### API配置
扩展使用CoinGecko API获取加密货币数据。基本使用无需API密钥。

### 自定义设置
- **语言**: 从4种支持的语言中选择
- **货币**: 选择您偏好的法定货币
- **刷新频率**: 设置更新间隔（30秒、1分钟、5分钟、15分钟）
- **主题**: 自动深色/浅色模式支持

## 🤝 贡献

我们欢迎贡献！请按照以下步骤：

1. **Fork仓库**
2. **创建功能分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add amazing feature'`
4. **推送到分支**: `git push origin feature/amazing-feature`
5. **打开Pull Request**

### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/yourusername/crypto-price-viewer.git

# 导航到项目目录
cd crypto-price-viewer

# 启动开发服务器（可选）
python3 -m http.server 8080
```

### 代码规范
- 使用ES6+特性
- 遵循模块化架构
- 为复杂逻辑添加注释
- 保持一致的缩进
- 在不同浏览器中测试

## 🐛 Bug报告和功能请求

- **Bug报告**: 使用扩展中的反馈功能或创建issue
- **功能请求**: 通过反馈系统分享您的想法
- **安全问题**: 通过扩展直接联系我们

## 📄 隐私政策

我们认真对待您的隐私。阅读我们完整的[隐私政策](./privacy-policy.html)了解我们如何处理您的数据。

**要点**:
- ✅ 所有数据本地存储在您的浏览器中
- ✅ 不收集个人信息
- ✅ 无跟踪或分析
- ✅ 仅可选的反馈提交

## 📜 许可证

本项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情。

## 🙏 致谢

- **CoinGecko**: 提供优秀的加密货币API
- **Chrome扩展团队**: 提供强大的扩展平台
- **开源社区**: 提供灵感和最佳实践
- **贡献者**: 感谢所有帮助改进此项目的人

## 📊 路线图

### 版本1.1（即将推出）
- [ ] 投资组合跟踪，包含盈亏计算
- [ ] 价格警报和通知
- [ ] 历史价格图表
- [ ] 高级筛选选项

### 版本1.2（未来）
- [ ] 新闻集成
- [ ] DeFi协议支持
- [ ] NFT底价跟踪
- [ ] 社交功能和观察列表分享

### 版本2.0（长期）
- [ ] 移动应用伴侣
- [ ] 高级分析仪表板
- [ ] 第三方集成API
- [ ] 高级功能

## 📞 支持

- **扩展反馈**: 使用内置反馈功能
- **GitHub Issues**: 为bug或功能创建issue
- **邮箱**: 通过扩展反馈系统联系

## 🌟 支持我们

如果您觉得这个项目有帮助，请考虑：
- ⭐ 为此仓库点星
- 🐛 报告bug
- 💡 建议新功能
- 🤝 贡献代码
- 💰 支持开发（扩展中的捐赠二维码）

---

<div align="center">
  <p>用❤️为加密货币社区制作</p>
  <p>© 2024 加密货币价格查看器。保留所有权利。</p>
</div>