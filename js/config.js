/**
 * @file config.js
 * @description 配置文件，包含应用程序的常量和默认设置
 */

// 导出配置对象
export const Config = {
  // 存储键名
  STORAGE_KEY: 'cryptoAppSetting',
  
  // API基础URL
  API_BASE_URL: 'https://api.coingecko.com/api/v3',
  
  // 币种到CoinGecko API ID的映射
  COIN_GECKO_IDS: {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana'
  },
  
  // 货币符号映射
  CURRENCY_SYMBOLS: {
    'USD': '$',
    'CNY': '¥',
    'EUR': '€'
  },
  
  // 默认设置
  DEFAULT_SETTINGS: {
    selectedCoins: ['BTC', 'ETH', 'BNB', 'SOL'],
    refreshInterval: 30,
    currency: 'USD',
    language: 'en'
  }
};