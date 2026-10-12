# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-10-12

A complete rewrite of the extension: new design, new code, new features. Your coins, pinned coin, currency, language and refresh interval are kept when you upgrade from 0.1.x.

### New
- A new design: each coin is a tile in its own brand color with a 7-day trend line, in light and dark themes
- Drag tiles to reorder them; each tile's “⋯” menu can pin it, open details, move it to the top or remove it, with 5 seconds to undo
- Search with keyboard support (↑ ↓ to choose, Enter to add) that shows each coin's market cap rank
- Coin details: charts for 1 day to 1 year with the high and low marked, a price tooltip, and market cap, volume, supply, all-time high and rank
- A crypto news timeline from PANews, Odaily and Decrypt, grouped by day and filterable by coin. Stories reported by several sites are shown once. The extension only visits these sites after you allow it
- The toolbar icon can show the pinned coin's price or its 24h change, and shows the coin, price and change when you hover it
- Price colors: red up / green down, green up / red down, or red up / blue down, defaulting to what's usual for your language
- Optional free CoinGecko API key, checked before it's saved
- Your settings sync across computers signed in to the same Chrome account

### Improvements
- All requests go through the background script, are queued under CoinGecko's rate limit, and are cached. Opening the popup shows cached prices at once
- When CoinGecko limits requests or you're offline, the last prices stay on screen with the time they're from
- Coin icons fall back to the coin's initial when they can't be loaded
- No new required permissions: storage, alarms and api.coingecko.com, as before

## [0.1.3] - 2026-10-12

### Fixes
- The price on the extension icon now keeps updating after you pin a coin or change the refresh interval. Before, it only resumed after the browser was restarted.
- The coin detail page no longer shows the currency symbol twice (for example "$$84,086").
- New installs now refresh every 30 seconds by default, as intended. Before, auto refresh started out turned off.
- The Japanese interface no longer shows Korean text, and the missing Japanese texts on the coin detail page were added.
- The settings panel title no longer shows the raw text "settingsTitle".
- Error messages now follow the language you chose.
- The chart period buttons now highlight the period that is actually shown.
- Removing the pinned coin now also clears the price on the extension icon.
- Removing a coin now takes effect immediately, even while CoinGecko is limiting requests.
- When CoinGecko limits requests, the extension now says so, instead of showing a general loading error.

### Changes
- The Feedback button now opens the project's GitHub Issues page. The extension no longer sends feedback itself and no longer needs access to api.notion.com.
- Removed an unfinished debug shortcut (Ctrl+Shift+D) and unused code.

## [0.1.2] - 2025-09-25

### Improvements
- Added more translations for all supported languages and improved the Korean interface text.

## [0.1.1] - 2025-09-23

### Fixes
- Made background price refresh scheduling more reliable.

### Documentation
- Updated the README files for the 0.1.0 features and the new project structure.

## [0.1.0] - 2025-09-21

### 🎉 New Features
- **Coin Detail Page**: Added comprehensive coin detail view with price charts, market data, and historical information
- **Extension Badge**: Implemented dynamic badge showing real-time price updates on extension icon
- **Price Charts**: Integrated interactive price charts using custom Canvas-based chart library
- **Enhanced Navigation**: Added seamless navigation between coin list and detail views

### 🔧 Major Refactoring
- **Modular Architecture**: Restructured codebase with dedicated lib modules:
  - `js/lib/http.js`: Lightweight HTTP wrapper with unified error handling and JSON parsing
  - `js/lib/storage.js`: Storage abstraction layer supporting both localStorage and chrome.storage
  - `js/lib/chart.js`: Custom price chart library with Canvas rendering
- **Service Layer**: Introduced dedicated service classes:
  - `CoinDetailService`: Handles coin detail data fetching and formatting
  - `BadgeUpdater`: Manages extension badge updates and price formatting
- **Client Separation**: Improved API client architecture with better error handling and rate limiting
- **Code Organization**: Enhanced file structure following SOLID principles with single responsibility modules

### 🚀 Improvements
- **Performance**: Optimized data fetching with intelligent caching and request scheduling
- **User Experience**: Smoother transitions and loading states across all views
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Code Quality**: Reduced complexity with better separation of concerns and modular design

### 🐛 Bug Fixes
- **API Rate Limiting**: Improved handling of CoinGecko API rate limits with proper retry mechanisms
- **Memory Management**: Fixed potential memory leaks in chart rendering and data updates
- **Cross-browser Compatibility**: Enhanced compatibility across different browser environments

### 📚 Documentation
- **Code Documentation**: Added comprehensive inline documentation for all new modules
- **Architecture Notes**: Updated development documentation with new architectural patterns

## [0.0.4] - 2025-09-05

### New
- One-tap coin details: Open a coin’s page on CoinGecko in a new tab, automatically matched to your language.

### Improvements
- Faster adding: After you tap Add, it immediately shows Added and your list updates without a refresh.
- Better language experience: Language changes take effect instantly, and your preference is remembered.
- Smoother everyday use: Saving and loading are snappier to reduce stutter.

### Fixes
- Fixed the issue where the Add button didn’t update until you refreshed.
- Fixed occasional settings desync that caused inconsistent display.

### Compatibility
- Your saved coins and settings remain intact. No action needed.

## Version 0.0.3 (2025-08-31)

### Bug Fixes
- Fixed errors when handling null values returned by API, enhancing application stability
- Optimized price change display logic to prevent "Cannot read properties of null" errors

### Improvements
- Unified feedback page button styles and sizes to match the home page
- Enhanced visual consistency of UI components

## Version 0.00.2 (2025-08-29)

### Features
- Added support for multiple cryptocurrency price queries
- Added user feedback functionality

### Improvements
- Optimized UI interface
- Increased data loading speed

## Version 0.00.1 (2025-08-27)

### Initial Release
- Basic cryptocurrency price query functionality
- Support for mainstream cryptocurrencies including BTC, ETH, etc.
- Clean and simple user interface