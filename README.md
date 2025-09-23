# 🚀 Cryptocurrency Price Viewer

> A modern Chrome extension for real-time cryptocurrency price monitoring with multi-language support and beautiful UI design.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/crypto-price-viewer)

## 🌍 Multi-Language Documentation

- 🇺🇸 **English** (Current)
- 🇨🇳 **[中文](./README-zh.md)**
- 🇯🇵 **[日本語](./README-ja.md)**
- 🇰🇷 **[한국어](./README-ko.md)**

## 📖 Overview

Cryptocurrency Price Viewer is a comprehensive Chrome extension that provides real-time cryptocurrency price monitoring with a modern, user-friendly interface. Track your favorite cryptocurrencies, get instant price updates, and manage your watchlist with ease.

## ✨ Features

### 🔥 Core Features
- **Real-time Price Monitoring**: Live cryptocurrency prices with automatic updates
- **Smart Search**: Intelligent cryptocurrency search with autocomplete suggestions
- **Dynamic Coin Management**: Add/remove any cryptocurrency dynamically
- **Multi-currency Support**: Display prices in USD, EUR, JPY, and more
- **Price Trend Indicators**: Visual indicators for price movements
- **Market Data**: Comprehensive market cap, volume, and 24h change data

### 🆕 0.1.0 New Features
- **Coin Detail Pages**: Click any coin to view detailed information, price charts, and market data
- **Browser Badge Integration**: Extension icon displays real-time price of selected cryptocurrency
- **Interactive Price Charts**: Visual price trend analysis with historical data
- **Modular Architecture**: Complete code restructuring with lib layer and services separation

### 🌍 Internationalization
- **4 Languages Supported**: 
  - 🇨🇳 Chinese (简体中文)
  - 🇺🇸 English
  - 🇯🇵 Japanese (日本語)
  - 🇰🇷 Korean (한국어)
- **Instant Language Switching**: Change language without page reload
- **Persistent Preferences**: Language choice remembered across sessions

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Modern, translucent interface
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions and hover effects
- **Dark Theme Support**: Eye-friendly dark mode
- **Intuitive Navigation**: Tab-based interface with clear sections

### ⚙️ Advanced Settings
- **Customizable Refresh Intervals**: Set your preferred update frequency
- **Data Import/Export**: Backup and restore your watchlist
- **Local Storage**: All data stored locally for privacy
- **Reset Options**: Clear all data functionality

### 💬 User Feedback System
- **Integrated Feedback**: Built-in feedback collection
- **Donation Support**: QR codes for BNB and SOL donations
- **Multiple Contact Methods**: Various ways to reach support

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **APIs**: CoinGecko API for cryptocurrency data
- **Storage**: Chrome Extension Storage API & Local Storage
- **Architecture**: Layered modular design with lib/services/clients separation
- **Background Processing**: Service Worker for badge updates and data sync
- **Charts**: Custom chart implementation with Canvas API
- **Styling**: Modern CSS with Flexbox, Grid, and Glassmorphism design
- **Internationalization**: Custom i18n implementation with dynamic loading

## 📁 Project Structure

```
chromeTools/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI interface
├── privacy-policy.html   # Privacy policy for Chrome Web Store
├── css/
│   └── style.css         # Styling and themes
├── js/
│   ├── popup.js          # Main application logic
│   ├── background.js     # Service worker for badge updates
│   ├── badge-updater.js  # Badge price update functionality
│   ├── config.js         # Configuration and constants
│   ├── i18n.js           # Internationalization
│   ├── lib/              # 🆕 Core utility library
│   │   ├── chart.js      # Chart rendering and data visualization
│   │   ├── http.js       # HTTP client with error handling
│   │   ├── storage.js    # Storage abstraction layer
│   │   ├── dom-manager.js # DOM manipulation utilities
│   │   ├── error-handler.js # Centralized error handling
│   │   ├── data-formatter.js # Data formatting utilities
│   │   └── ...           # Other utility modules
│   ├── services/         # 🆕 Business logic services
│   │   ├── CoinDetailService.js # Coin detail data management
│   │   ├── NotionService.js     # Notion API integration
│   │   └── StorageService.js    # Data persistence service
│   └── clients/          # 🆕 External API clients
│       └── CoinGeckoClient.js   # CoinGecko API client
└── images/               # Icons and assets
    ├── icon16.svg
    ├── icon48.svg
    ├── icon128.svg
    └── ...
```

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore) (Coming Soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/crypto-price-viewer.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension will appear in your Chrome toolbar

## 📱 Usage

### Getting Started
1. **Click the extension icon** in your Chrome toolbar
2. **Search for cryptocurrencies** using the search bar
3. **Add coins** to your watchlist by clicking the "+" button
4. **Monitor prices** in real-time with automatic updates

### Key Features
- **Search**: Type cryptocurrency names or symbols
- **Add/Remove**: Manage your watchlist easily
- **Settings**: Customize language, currency, and refresh rate
- **Feedback**: Share your thoughts and suggestions

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus search bar
- `Escape`: Close search suggestions
- `Enter`: Add selected cryptocurrency

## 🔧 Configuration

### API Configuration
The extension uses the CoinGecko API for cryptocurrency data. No API key required for basic usage.

### Customization
- **Language**: Choose from 4 supported languages
- **Currency**: Select your preferred fiat currency
- **Refresh Rate**: Set update intervals (30s, 1m, 5m, 15m)
- **Theme**: Automatic dark/light mode support

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/crypto-price-viewer.git

# Navigate to project directory
cd crypto-price-viewer

# Start development server (optional)
python3 -m http.server 8080
```

### Code Style
- Use ES6+ features
- Follow modular architecture
- Add comments for complex logic
- Maintain consistent indentation
- Test across different browsers

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: Use the feedback feature in the extension or create an issue
- **Feature Requests**: Share your ideas through the feedback system
- **Security Issues**: Contact us directly through the extension

## 📄 Privacy Policy

We take your privacy seriously. Read our full [Privacy Policy](./privacy-policy.html) to understand how we handle your data.

**Key Points**:
- ✅ All data stored locally in your browser
- ✅ No personal information collected
- ✅ No tracking or analytics
- ✅ Optional feedback submission only

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko**: For providing excellent cryptocurrency API
- **Chrome Extension Team**: For the robust extension platform
- **Open Source Community**: For inspiration and best practices
- **Contributors**: Thank you to everyone who helps improve this project

## 📊 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Portfolio tracking with profit/loss calculations
- [ ] Price alerts and notifications
- [ ] Historical price charts
- [ ] Advanced filtering options

### Version 1.2 (Future)
- [ ] News integration
- [ ] DeFi protocol support
- [ ] NFT floor price tracking
- [ ] Social features and watchlist sharing

### Version 2.0 (Long-term)
- [ ] Mobile app companion
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Premium features

## 📞 Support

- **Extension Feedback**: Use the built-in feedback feature
- **GitHub Issues**: Create an issue for bugs or features
- **Email**: Contact through extension feedback system

## 🌟 Show Your Support

If you find this project helpful, please consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code
- 💰 Supporting development (donation QR codes in extension)

---

<div align="center">
  <p>Made with ❤️ for the crypto community</p>
  <p>© 2024 Cryptocurrency Price Viewer. All rights reserved.</p>
</div>