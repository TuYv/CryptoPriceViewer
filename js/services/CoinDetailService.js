/**
 * 币种详情服务
 * 处理币种详细信息、历史价格数据和新闻获取
 */

import { http } from '../lib/http.js';
import { Config } from '../config.js';

export class CoinDetailService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取币种详细信息
   * @param {string} coinId - CoinGecko币种ID
   * @param {string} currency - 货币类型 (usd, cny, eur)
   */
  async getCoinDetails(coinId, currency = 'usd') {
    const cacheKey = `detail-${coinId}-${currency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${Config.API_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      const rawData = await http.getJson(url);
      
      if (!rawData || !rawData.id) {
        throw new Error('Invalid coin data received from API');
      }
      
      const data = this.formatCoinDetails(rawData, currency);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[CoinDetailService] Error fetching coin details:', error);
      throw new Error(`Failed to fetch coin details: ${error.message}`);
    }
  }

  /**
   * 获取币种历史价格数据
   * @param {string} coinId - CoinGecko币种ID  
   * @param {string} currency - 货币类型
   * @param {number} days - 天数 (1, 7, 30, 90, 365)
   */
  async getCoinHistory(coinId, currency = 'usd', days = 7) {
    const cacheKey = `history-${coinId}-${currency}-${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${Config.API_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${this.getInterval(days)}`;
      const rawData = await http.getJson(url);
      
      if (!rawData || !rawData.prices || !Array.isArray(rawData.prices)) {
        throw new Error('Invalid price history data received from API');
      }
      
      const data = this.formatHistoryData(rawData);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[CoinDetailService] Error fetching price history:', error);
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }
  }

  /**
   * 获取币种相关新闻
   * @param {string} coinSymbol - 币种符号
   * @param {number} limit - 新闻数量限制
   */
  async getCoinNews(coinSymbol, limit = 10) {
    const cacheKey = `news-${coinSymbol}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 注意：这里使用CoinGecko的新闻API，实际可能需要其他新闻API
      // 由于CoinGecko免费版本可能不包含新闻，这里提供模拟数据结构
      const mockNews = this.getMockNews(coinSymbol);
      this.cache.set(cacheKey, { data: mockNews, timestamp: Date.now() });
      return mockNews;
    } catch (error) {
      console.error('[CoinDetailService] Error fetching coin news:', error);
      return [];
    }
  }

  /**
   * 格式化币种详细信息
   */
  formatCoinDetails(rawData, currency) {
    const marketData = rawData.market_data;
    const currencyUpper = currency.toUpperCase();
    
    return {
      id: rawData.id,
      symbol: rawData.symbol?.toUpperCase(),
      name: rawData.name,
      image: rawData.image?.large || rawData.image?.small,
      description: rawData.description?.en || '',
      currentPrice: marketData?.current_price?.[currency] || 0,
      priceChange24h: marketData?.price_change_percentage_24h || 0,
      marketCap: marketData?.market_cap?.[currency] || 0,
      marketCapRank: marketData?.market_cap_rank || 0,
      totalVolume: marketData?.total_volume?.[currency] || 0,
      circulatingSupply: marketData?.circulating_supply || 0,
      totalSupply: marketData?.total_supply || 0,
      maxSupply: marketData?.max_supply || 0,
      allTimeHigh: marketData?.ath?.[currency] || 0,
      allTimeLow: marketData?.atl?.[currency] || 0,
      athDate: marketData?.ath_date?.[currency],
      atlDate: marketData?.atl_date?.[currency],
      lastUpdated: rawData.last_updated,
      currency: currencyUpper
    };
  }

  /**
   * 格式化历史价格数据
   */
  formatHistoryData(rawData) {
    if (!rawData.prices || !Array.isArray(rawData.prices)) {
      return [];
    }

    return rawData.prices.map(([timestamp, price]) => ({
      timestamp,
      price: parseFloat(price)
    }));
  }

  /**
   * 根据天数获取合适的数据间隔
   */
  getInterval(days) {
    if (days <= 1) return 'hourly';
    if (days <= 90) return 'daily';
    return 'daily';
  }

  /**
   * 获取模拟新闻数据
   * 实际项目中应该替换为真实的新闻API
   */
  getMockNews(coinSymbol) {
    const newsTemplates = [
      {
        title: `${coinSymbol} Price Analysis: Technical Indicators Show Bullish Momentum`,
        source: 'CryptoNews',
        publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        url: '#',
        description: `Latest technical analysis suggests ${coinSymbol} may continue its upward trend...`
      },
      {
        title: `Market Update: ${coinSymbol} Trading Volume Surges`,
        source: 'BlockchainDaily',
        publishedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        url: '#',
        description: `${coinSymbol} sees increased trading activity as institutional interest grows...`
      },
      {
        title: `${coinSymbol} Integration: New Partnership Announced`,
        source: 'CoinTelegraph',
        publishedAt: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
        url: '#',
        description: `Major platform announces ${coinSymbol} integration, expanding utility...`
      }
    ];

    // 随机选择2-4条新闻
    const selectedNews = newsTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);

    return selectedNews.map((news, index) => ({
      ...news,
      id: `${coinSymbol}-${index}`,
      title: news.title,
      source: news.source,
      publishedAt: news.publishedAt,
      url: news.url,
      description: news.description
    }));
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建全局实例
export const coinDetailService = new CoinDetailService();

// 定时清理过期缓存
setInterval(() => {
  coinDetailService.cleanupExpiredCache();
}, 10 * 60 * 1000); // 每10分钟清理一次