# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-01-27

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

## [0.0.4] - 2024-12-30

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