/**
 * @file config.js
 * @description 配置文件，包含应用程序的常量和默认设置
 */

import { Env } from './lib/env.js';

// 导出配置对象
export const Config = {
  // 存储键名
  STORAGE_KEY: 'cryptoAppSetting',
  
  // API基础URL（通过 Env.get 支持 .env 覆盖）
  get API_BASE_URL() {
    return Env.get('API_BASE_URL', 'https://api.coingecko.com/api/v3');
  },
  
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