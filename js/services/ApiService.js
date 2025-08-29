/**
 * @file ApiService.js
 * @description 处理与外部API的通信
 */

import { Config } from '../config.js';

/**
 * API错误类型枚举
 */
const API_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT', 
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN: 'UNKNOWN'
};

/**
 * API服务类
 * 负责处理与CoinGecko API的所有通信
 */
class ApiService {
  /**
   * 获取加密货币数据
   * @param {Array<string>} coins - 要获取的币种代码数组
   * @param {string} currency - 货币单位
   * @returns {Promise<Array>} 加密货币数据数组
   * @throws {Error} 如果API请求失败
   */
  static async fetchCryptoData(coins, currency) {
    // 检查网络连接
    if (!navigator.onLine) {
      throw this.createApiError(API_ERROR_TYPES.NETWORK_ERROR, '网络连接不可用，请检查网络设置');
    }

    // 验证输入参数
    if (!coins || coins.length === 0) {
      throw this.createApiError(API_ERROR_TYPES.UNKNOWN, '币种列表不能为空');
    }

    if (!currency) {
      throw this.createApiError(API_ERROR_TYPES.UNKNOWN, '货币单位不能为空');
    }

    try {
      const currencyLower = currency.toLowerCase();
      const coinIds = this.getCoinsIds(coins);
      
      const apiUrl = `${Config.API_BASE_URL}/coins/markets?vs_currency=${currencyLower}&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
      
      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoViewer/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // 详细的HTTP状态码处理
      if (!response.ok) {
        throw this.handleHttpError(response);
      }
      
      const data = await response.json();
      
      // 验证返回数据格式
      if (!Array.isArray(data)) {
        throw this.createApiError(API_ERROR_TYPES.PARSE_ERROR, 'API返回数据格式错误');
      }
      
      return data;
    } catch (error) {
      // 处理不同类型的错误
      if (error.name === 'AbortError') {
        throw this.createApiError(API_ERROR_TYPES.TIMEOUT, '请求超时，请稍后重试');
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw this.createApiError(API_ERROR_TYPES.NETWORK_ERROR, '网络请求失败，请检查网络连接');
      }
      
      if (error.name === 'SyntaxError') {
        throw this.createApiError(API_ERROR_TYPES.PARSE_ERROR, 'API返回数据解析失败');
      }
      
      // 如果已经是我们的API错误，直接抛出
      if (error.type && Object.values(API_ERROR_TYPES).includes(error.type)) {
        throw error;
      }
      
      // 其他未知错误
      throw this.createApiError(API_ERROR_TYPES.UNKNOWN, `未知错误: ${error.message}`);
    }
  }

  /**
   * 处理HTTP错误状态码
   * @param {Response} response - HTTP响应对象
   * @returns {Error} 对应的错误对象
   * @private
   */
  static handleHttpError(response) {
    switch (response.status) {
      case 401:
        return this.createApiError(API_ERROR_TYPES.UNAUTHORIZED, 'API访问未授权');
      case 404:
        return this.createApiError(API_ERROR_TYPES.NOT_FOUND, '请求的资源不存在');
      case 429:
        return this.createApiError(API_ERROR_TYPES.RATE_LIMIT, 'API请求频率过高，请稍后重试');
      case 500:
      case 502:
      case 503:
      case 504:
        return this.createApiError(API_ERROR_TYPES.SERVER_ERROR, `服务器错误 (${response.status})，请稍后重试`);
      default:
        return this.createApiError(API_ERROR_TYPES.UNKNOWN, `HTTP错误 ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * 创建标准化的API错误对象
   * @param {string} type - 错误类型
   * @param {string} message - 错误消息
   * @returns {Error} 错误对象
   * @private
   */
  static createApiError(type, message) {
    const error = new Error(message);
    error.type = type;
    error.timestamp = new Date().toISOString();
    return error;
  }
  
  /**
   * 将币种代码转换为CoinGecko API的ID
   * @param {Array<string>} coins - 币种代码数组
   * @returns {string} 逗号分隔的币种ID字符串
   * @private
   */
  static getCoinsIds(coins) {
    return coins.map(coin => Config.COIN_GECKO_IDS[coin] || coin.toLowerCase()).join(',');
  }
}

// 导出API服务类
export default ApiService;