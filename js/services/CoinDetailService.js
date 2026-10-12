/**
 * 币种详情服务
 * 处理币种详细信息和历史价格数据获取
 */

import { Config } from '../config.js';
import coinGeckoClient from '../clients/CoinGeckoClient.js';

export class CoinDetailService {
  cache = new Map();
  cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

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
      const rawData = await coinGeckoClient.getCoin(coinId);
      
      if (rawData && rawData.error === 'API_LOCKED') {
        return rawData;
      }

      if (!rawData || !rawData.id) {
        throw new Error('Invalid coin data received from API');
      }
      
      const data = this.formatCoinDetails(rawData, currency);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[CoinDetailService] Error fetching coin details:', error);
      throw error;
    }
  }

  /**
   * 获取币种历史价格数据
   * @param {string} coinId - CoinGecko币种ID  
   * @param {string} currency - 货币类型
   * @param {number} days - 天数 (1, 7, 30, 90, 365)
   */
  async getCoinHistory(coinId, currency = 'usd', days = 1) {
    const cacheKey = `history-${coinId}-${currency}-${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const rawData = await coinGeckoClient.getMarketChart(coinId, currency, days);
      
      if (rawData && rawData.error === 'API_LOCKED') {
        return rawData;
      }

      if (!rawData || !rawData.prices || !Array.isArray(rawData.prices)) {
        throw new Error('Invalid price history data received from API');
      }
      
      const data = this.formatHistoryData(rawData);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[CoinDetailService] Error fetching price history:', error);
      throw error;
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
