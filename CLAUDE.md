# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chrome Extension** for real-time cryptocurrency price viewing. The extension provides a modern UI for monitoring crypto prices, searching/adding coins, and includes multi-language support (English, Chinese, Japanese, Korean).

## Architecture

### Core Structure
- **manifest.json**: Chrome extension manifest (v3) with permissions for storage and CoinGecko/Notion APIs
- **popup.html**: Main UI entry point 
- **js/popup.js**: Main application logic containing the `CryptoApp` class and global search functions
- **js/config.js**: Configuration constants including default settings, API URLs, and currency mappings
- **js/i18n.js**: Internationalization system with translations for 4 languages
- **js/lib/**: Utility libraries for HTTP requests and storage abstraction
- **js/services/**: Service modules for external API integration

### Key Components

#### CryptoApp Class (js/popup.js)
- Main application controller managing state, UI updates, and data fetching
- Handles user interactions, settings management, and automatic refresh
- Manages coin search, addition/removal, and price display formatting
- Uses modular service approach with NotionService for feedback

#### Storage Abstraction (js/lib/storage.js)
- Unified interface supporting both Chrome storage API and localStorage
- Provides async/await pattern for consistent data access
- Falls back gracefully between storage mechanisms

#### HTTP Abstraction (js/lib/http.js)
- Lightweight wrapper around fetch API with structured error handling
- Provides `getJson()` and `postJson()` convenience methods
- Returns `HttpError` objects with status codes and response data

#### Internationalization (js/i18n.js)
- Custom i18n system supporting 4 languages (zh, en, ja, ko)
- Includes coin name translations and UI text localization
- Provides global `t()` function for easy translation access

#### Configuration (js/config.js)
- Centralized constants for API URLs, default settings, currency symbols
- Coin-to-CoinGecko ID mapping for API requests
- Default coin selection and refresh intervals

### Data Flow
1. **Initialization**: CryptoApp loads saved settings and initializes UI language
2. **Data Fetching**: Retrieves prices from CoinGecko API for selected coins
3. **Display**: Formats prices with proper currency symbols and change indicators  
4. **User Interaction**: Search functionality allows adding new coins dynamically
5. **Persistence**: Settings and coin selections saved via storage abstraction

### APIs Used
- **CoinGecko API v3**: For cryptocurrency market data and coin search
- **Notion API**: For user feedback collection (optional integration)

## Development Commands

Since this is a Chrome extension, there are no traditional build/test commands. Development workflow:

1. **Load Extension**: Use Chrome's developer mode to load the unpacked extension
2. **Debugging**: Use Chrome DevTools on the extension popup for debugging
3. **Testing**: Manual testing through the Chrome extension interface
4. **Packaging**: Create .zip file for Chrome Web Store submission

## File Structure Key Points

- **js/lib/**: Contains reusable utility modules (http, storage)  
- **js/services/**: External service integrations (NotionService)
- **css/**: Styling with modern glassmorphism design
- **images/**: Extension icons and assets
- **Documentation**: Multiple language README files (README-zh.md, README-ja.md, etc.)

## Important Considerations

- **Chrome Extension Context**: Code runs in popup context, not regular web page
- **API Rate Limiting**: CoinGecko API has rate limits; includes debouncing for search
- **Storage Permissions**: Uses Chrome storage.local for persistence
- **Cross-Origin**: Requires host permissions for API access (defined in manifest.json)
- **Multi-language**: UI dynamically updates based on user language preference
- **Error Handling**: Graceful fallbacks for API failures and missing data

## Code Patterns

- ES6 modules with import/export syntax
- Class-based architecture for main application logic
- Async/await for all asynchronous operations
- Event delegation for dynamic UI interactions
- Factory pattern for service instantiation (storage, http)